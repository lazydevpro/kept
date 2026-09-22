import { applyD1Migrations, env, SELF } from "cloudflare:test";
import { runWeeklyReminder } from "../src/jobs";
import { ed25519 } from "@noble/curves/ed25519.js";
import bs58 from "bs58";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(async () => {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
});

describe("Neon Reserve API", () => {
  it("reports health without authentication", async () => {
    const response = await SELF.fetch("https://local.test/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true });
  });

  it("protects private profile data", async () => {
    const response = await SELF.fetch("https://local.test/v1/me");
    expect(response.status).toBe(401);
  });

  it("creates an anonymous mobile session and profile", async () => {
    const signIn = await SELF.fetch(
      "https://local.test/api/auth/sign-in/anonymous",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "neonreserve://",
        },
        body: "{}",
      },
    );
    expect(signIn.status).toBe(200);
    const cookie = signIn.headers.get("set-cookie");
    expect(cookie).toContain("better-auth.session_token");
    const profile = await SELF.fetch("https://local.test/v1/me", {
      headers: { cookie: cookie ?? "" },
    });
    expect(profile.status).toBe(200);
    expect(await profile.json()).toMatchObject({
      profile: { privacyMode: "progress_only" },
      wallets: [],
    });
  });

  it("returns the verified Tessera catalog without depending on the xStocks provider", async () => {
    const signIn = await SELF.fetch(
      "https://local.test/api/auth/sign-in/anonymous",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "neonreserve://",
        },
        body: "{}",
      },
    );
    const response = await SELF.fetch(
      "https://local.test/v1/trades/assets?symbols=tOpenAI,tKalshi",
      { headers: { cookie: signIn.headers.get("set-cookie") ?? "" } },
    );
    expect(response.status).toBe(200);
    const payload = (await response.json()) as { assets: unknown[] };
    expect(payload.assets).toMatchObject([
      {
        symbol: "tOpenAI",
        provider: "tessera",
        instrument: "loan_participation",
        mint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ",
        transferFeeBps: 20,
      },
      {
        symbol: "tKalshi",
        provider: "tessera",
        instrument: "loan_participation",
        mint: "TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ",
        transferFeeBps: 20,
      },
    ]);
  });

  /**
   * The invariant the whole product rests on: a circle is private to its
   * members. Membership is the only gate on who can read a circle, its roster
   * or its feed, so it is worth a test rather than a careful reading.
   */
  it("keeps a circle and its feed private to its members", async () => {
    const signIn = async () => {
      const response = await SELF.fetch(
        "https://local.test/api/auth/sign-in/anonymous",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "neonreserve://",
          },
          body: "{}",
        },
      );
      return response.headers.get("set-cookie") ?? "";
    };

    const owner = await signIn();
    const stranger = await signIn();
    expect(owner).not.toBe(stranger);

    const created = await SELF.fetch("https://local.test/v1/circles", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: owner },
      body: JSON.stringify({
        name: "Quiet Money",
        description: "Members only.",
      }),
    });
    expect(created.status).toBe(201);
    const { id: circleId } = (await created.json()) as { id: string };

    const asOwner = await SELF.fetch(
      `https://local.test/v1/circles/${circleId}`,
      {
        headers: { cookie: owner },
      },
    );
    expect(asOwner.status).toBe(200);

    for (const path of [
      `/v1/circles/${circleId}`,
      `/v1/circles/${circleId}/feed`,
    ]) {
      const denied = await SELF.fetch(`https://local.test${path}`, {
        headers: { cookie: stranger },
      });
      expect(denied.status).toBe(403);
    }

    // A non-member must not be able to mint a live-room ticket either, or the
    // socket would hand them everything the HTTP routes just refused.
    const ticket = await SELF.fetch(
      `https://local.test/v1/circles/${circleId}/live-ticket`,
      {
        method: "POST",
        headers: { "content-type": "application/json", cookie: stranger },
        body: "{}",
      },
    );
    expect(ticket.status).toBe(403);

    // And the circle must not even appear in a stranger's own list.
    const list = await SELF.fetch("https://local.test/v1/circles", {
      headers: { cookie: stranger },
    });
    const { circles } = (await list.json()) as {
      circles: Array<{ id: string }>;
    };
    expect(circles.some((circle) => circle.id === circleId)).toBe(false);
  });

  /**
   * A cheer used to be permanent — `INSERT OR IGNORE` with no way back — so a
   * second tap silently did nothing. Removing one must take back only your own.
   */
  it("lets a member take back their own reaction and nobody else's", async () => {
    const signIn = async () => {
      const response = await SELF.fetch(
        "https://local.test/api/auth/sign-in/anonymous",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "neonreserve://",
          },
          body: "{}",
        },
      );
      return response.headers.get("set-cookie") ?? "";
    };
    const owner = await signIn();

    const created = await SELF.fetch("https://local.test/v1/circles", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: owner },
      body: JSON.stringify({ name: "Cheer Squad" }),
    });
    const { id: circleId } = (await created.json()) as { id: string };

    // Creating a circle posts a "joined" entry, which is something to react to.
    const feed = await SELF.fetch(
      `https://local.test/v1/circles/${circleId}/feed`,
      {
        headers: { cookie: owner },
      },
    );
    const { posts } = (await feed.json()) as Array<unknown> & {
      posts: Array<{ id: string }>;
    };
    const postId = posts[0].id;

    const reactions = async () => {
      const response = await SELF.fetch(
        `https://local.test/v1/circles/${circleId}/feed`,
        {
          headers: { cookie: owner },
        },
      );
      const body = (await response.json()) as {
        posts: Array<{ reactions: string | null }>;
      };
      return body.posts[0].reactions ?? "";
    };

    const react = (method: string, query = "") =>
      SELF.fetch(
        `https://local.test/v1/circles/${circleId}/posts/${postId}/reactions${query}`,
        {
          method,
          headers: { "content-type": "application/json", cookie: owner },
          body: method === "POST" ? JSON.stringify({ emoji: "🔥" }) : undefined,
        },
      );

    expect((await react("POST")).status).toBe(201);
    expect(await reactions()).toContain("🔥");

    // Re-adding stays idempotent rather than doubling up.
    expect((await react("POST")).status).toBe(201);
    expect((await reactions()).match(/🔥/g)?.length).toBe(1);

    expect(
      (await react("DELETE", `?emoji=${encodeURIComponent("🔥")}`)).status,
    ).toBe(200);
    expect(await reactions()).not.toContain("🔥");

    // An emoji outside the set is refused on the way out as well as in.
    const rejected = await react("DELETE", "?emoji=%F0%9F%92%A9");
    expect(rejected.status).toBe(422);
  });

  /**
   * A nudge points at a person rather than a post, so its fences are the whole
   * feature: one per person per week, only into an open promise, only inside
   * the circle, never at yourself.
   */
  it("fences a nudge to one open promise per friend per week", async () => {
    const signIn = async () => {
      const response = await SELF.fetch(
        "https://local.test/api/auth/sign-in/anonymous",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "neonreserve://",
          },
          body: "{}",
        },
      );
      return response.headers.get("set-cookie") ?? "";
    };
    const post = (path: string, cookie: string, body: unknown = {}) =>
      SELF.fetch(`https://local.test${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify(body),
      });

    const owner = await signIn();
    const friend = await signIn();

    const created = await post("/v1/circles", owner, { name: "Nudge Club" });
    const { id: circleId } = (await created.json()) as { id: string };

    // The friend joins through a real invite rather than a direct insert.
    const invited = await post(`/v1/circles/${circleId}/invites`, owner, {});
    const { invite } = (await invited.json()) as {
      invite: { deepLink: string };
    };
    const token = invite.deepLink.split("/").pop() as string;
    expect((await post(`/v1/invites/${token}/accept`, friend)).status).toBe(
      200,
    );

    const friendId = await (async () => {
      const me = await SELF.fetch("https://local.test/v1/me", {
        headers: { cookie: friend },
      });
      return ((await me.json()) as { profile: { id: string } }).profile.id;
    })();

    // With no open promise there is nothing to nudge about.
    const tooEarly = await post(
      `/v1/circles/${circleId}/members/${friendId}/nudge`,
      owner,
    );
    expect(tooEarly.status).toBe(409);
    expect(
      ((await tooEarly.json()) as { error: { code: string } }).error.code,
    ).toBe("nothing_to_nudge");

    // Give the friend a promise that is still open: due a week from now.
    const goal = await post("/v1/goals", friend, {
      title: "Show up",
      targetType: "weekly_consistency",
      targetValue: 12,
      visibility: "progress_only",
    });
    const { id: goalId } = (await goal.json()) as { id: string };
    const dueAt = new Date(Date.now() + 5 * 86_400_000).toISOString();
    expect(
      (
        await post(`/v1/goals/${goalId}/promises`, friend, {
          weekStart: new Date().toISOString().slice(0, 10),
          dueAt,
        })
      ).status,
    ).toBe(201);

    const first = await post(
      `/v1/circles/${circleId}/members/${friendId}/nudge`,
      owner,
    );
    expect(first.status).toBe(201);

    // The UNIQUE key is the rate limit: one per person per week.
    const again = await post(
      `/v1/circles/${circleId}/members/${friendId}/nudge`,
      owner,
    );
    expect(again.status).toBe(409);
    expect(
      ((await again.json()) as { error: { code: string } }).error.code,
    ).toBe("already_nudged");

    const self = await post(
      `/v1/circles/${circleId}/members/${friendId}/nudge`,
      friend,
    );
    expect(self.status).toBe(422);
    expect(
      ((await self.json()) as { error: { code: string } }).error.code,
    ).toBe("self_nudge");

    // And it shows up in the award counters the screen reads.
    const awards = await SELF.fetch("https://local.test/v1/awards", {
      headers: { cookie: owner },
    });
    const { counters } = (await awards.json()) as {
      counters: { nudgesSent: number; friends: number };
    };
    expect(counters.nudgesSent).toBe(1);
    expect(counters.friends).toBeGreaterThanOrEqual(1);
  });

  it("does not expose an invalid invitation", async () => {
    const response = await SELF.fetch(
      "https://local.test/v1/invites/not-a-real-token",
    );
    expect(response.status).toBe(404);
  });

  it("rejects forged live-room tickets", async () => {
    const response = await SELF.fetch(
      "https://local.test/v1/live/circle_fake?ticket=forged.ticket",
      {
        headers: { upgrade: "websocket" },
      },
    );
    expect(response.status).toBe(401);
  });

  it("requires a wallet-linked user to acknowledge Tessera's private-market risks", async () => {
    const signIn = await SELF.fetch(
      "https://local.test/api/auth/sign-in/anonymous",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "neonreserve://",
        },
        body: "{}",
      },
    );
    const cookie = signIn.headers.get("set-cookie") ?? "";
    const privateKey = ed25519.utils.randomSecretKey();
    const walletAddress = bs58.encode(ed25519.getPublicKey(privateKey));
    const challenge = await SELF.fetch(
      "https://local.test/v1/wallets/challenge",
      {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ address: walletAddress }),
      },
    );
    const challengePayload = (await challenge.json()) as {
      challengeId: string;
      message: string;
    };
    const signature = bs58.encode(
      ed25519.sign(
        new TextEncoder().encode(challengePayload.message),
        privateKey,
      ),
    );
    const verify = await SELF.fetch("https://local.test/v1/wallets/verify", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        challengeId: challengePayload.challengeId,
        signature,
      }),
    });
    expect(verify.status).toBe(201);

    const order = await SELF.fetch("https://local.test/v1/trades/order", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({
        outputMint: "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ",
        outputSymbol: "tOpenAI",
        amountUsdc: 25,
        taker: walletAddress,
      }),
    });
    expect(order.status).toBe(422);
    expect(await order.json()).toMatchObject({
      error: { code: "tessera_acknowledgement_required" },
    });
  });

  it("reminds an open promise once, not on every nightly run", async () => {
    // The cron is daily and the reminder window is two days wide, so before
    // `reminded_at` existed the same promise matched on two consecutive nights
    // and the user was nudged twice for one week.
    const userId = "reminder-user";
    const goalId = "reminder-goal";
    const dueAt = new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString();
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
         VALUES (?, 'Reminder', 'reminder@local.test', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      ).bind(userId),
      env.DB.prepare(
        `INSERT INTO goals (id, user_id, title, target_type, target_value, status)
         VALUES (?, ?, 'Reminder goal', 'weekly_consistency', 12, 'active')`,
      ).bind(goalId, userId),
      env.DB.prepare(
        `INSERT INTO weekly_promises (id, goal_id, user_id, week_start, due_at, target_cents)
         VALUES ('reminder-promise', ?, ?, '2000-01-03', ?, 2500)`,
      ).bind(goalId, userId, dueAt),
    ]);

    const first = await runWeeklyReminder(env);
    expect(first).toBeGreaterThan(0);

    const stamped = await env.DB.prepare(
      "SELECT reminded_at FROM weekly_promises WHERE id = 'reminder-promise'",
    ).first<{ reminded_at: string | null }>();
    expect(stamped?.reminded_at).not.toBeNull();

    // Second nightly run on the same open promise must stay silent.
    const second = await runWeeklyReminder(env);
    expect(second).toBeUndefined();
  });

  /**
   * Selling.
   *
   * The failure modes here are quiet ones — a sell filed against the wrong mint,
   * or average cost applied to the wrong denominator — so these check the numbers
   * rather than the status codes.
   */
  describe("selling", () => {
    const signIn = async () => {
      const response = await SELF.fetch(
        "https://local.test/api/auth/sign-in/anonymous",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "neonreserve://",
          },
          body: "{}",
        },
      );
      const cookie = response.headers.get("set-cookie") ?? "";
      const me = await SELF.fetch("https://local.test/v1/me", {
        headers: { cookie },
      });
      const { profile } = (await me.json()) as { profile: { id: string } };
      return { cookie, userId: profile.id };
    };

    const MINT = "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB";

    /** Writes a settled row straight to the table, which is what verification leaves behind. */
    const settle = (
      userId: string,
      direction: "buy" | "sell",
      units: string,
      usdcBaseUnits: string,
      signature: string,
    ) =>
      env.DB.prepare(
        `INSERT INTO contributions
           (id, user_id, wallet_address, signature, asset_symbol, asset_mint, asset_decimals,
            amount_base_units, verified_amount_base_units, input_amount_usdc_base_units,
            status, direction, execution_mode, verified_at, occurred_at)
         VALUES (?, ?, 'wallet', ?, 'SPYx', ?, 9, ?, ?, ?, 'verified', ?, 'live',
                 CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      )
        .bind(
          `contribution_${signature}`,
          userId,
          signature,
          MINT,
          units,
          units,
          usdcBaseUnits,
          direction,
        )
        .run();

    it("refuses a sell without a verified wallet", async () => {
      const { cookie } = await signIn();
      const response = await SELF.fetch(
        "https://local.test/v1/trades/sell-order",
        {
          method: "POST",
          headers: { "content-type": "application/json", cookie },
          body: JSON.stringify({
            inputMint: MINT,
            quantity: 1,
            taker: "7cVfgArCheMR6Cs4t6vz5rfnqd56vZq4ndaBrY5xkxXy",
          }),
        },
      );
      expect(response.status).toBe(403);
    });

    /**
     * The invariant the whole feature rests on: two buys at different prices, then
     * a partial sale, and every figure has to move to the right place.
     *
     * 10 units for $100 and 10 for $300 is an average of $20/unit. Selling 5 for
     * $150 realises 150 − (5 × 20) = $50 and leaves 15 units at a $300 basis.
     * Cost must fall to the basis of what remains — NOT stay at total spend, which
     * is the bug that makes unrealised P&L lie the moment anything is sold.
     */
    it("keeps average cost and realised P&L straight across a partial sale", async () => {
      const { cookie, userId } = await signIn();
      await settle(
        userId,
        "buy",
        "10000000000",
        "100000000",
        `buy_a_${userId}`,
      );
      await settle(
        userId,
        "buy",
        "10000000000",
        "300000000",
        `buy_b_${userId}`,
      );
      await settle(
        userId,
        "sell",
        "5000000000",
        "150000000",
        `sell_a_${userId}`,
      );

      const response = await SELF.fetch("https://local.test/v1/portfolio", {
        headers: { cookie },
      });
      expect(response.status).toBe(200);
      const { portfolio } = (await response.json()) as {
        portfolio: {
          totals: { realisedUsd: number; costUsd: number; positions: number };
          positions: Array<{
            quantity: number;
            costUsd: number;
            avgCostUsd: number | null;
            realisedUsd: number;
            proceedsUsd: number;
            lots: number;
            sells: number;
            open: boolean;
          }>;
        };
      };

      const position = portfolio.positions[0]!;
      expect(position.quantity).toBeCloseTo(15, 6);
      expect(position.costUsd).toBeCloseTo(300, 6);
      expect(position.avgCostUsd).toBeCloseTo(20, 6);
      expect(position.realisedUsd).toBeCloseTo(50, 6);
      expect(position.proceedsUsd).toBeCloseTo(150, 6);
      expect(position.lots).toBe(2);
      expect(position.sells).toBe(1);
      expect(position.open).toBe(true);
      expect(portfolio.totals.realisedUsd).toBeCloseTo(50, 6);
      expect(portfolio.totals.costUsd).toBeCloseTo(300, 6);
    });

    /**
     * A position sold down to nothing keeps its row and its realised P&L, but stops
     * counting as a holding. Dropping it would quietly erase the trade from history.
     */
    it("keeps a fully sold position out of holdings but keeps its realised P&L", async () => {
      const { cookie, userId } = await signIn();
      await settle(userId, "buy", "4000000000", "80000000", `buy_c_${userId}`);
      await settle(
        userId,
        "sell",
        "4000000000",
        "95000000",
        `sell_c_${userId}`,
      );

      const response = await SELF.fetch("https://local.test/v1/portfolio", {
        headers: { cookie },
      });
      const { portfolio } = (await response.json()) as {
        portfolio: {
          totals: { positions: number; costUsd: number; realisedUsd: number };
          positions: Array<{
            open: boolean;
            quantity: number;
            realisedUsd: number;
          }>;
        };
      };

      expect(portfolio.positions).toHaveLength(1);
      expect(portfolio.positions[0]!.open).toBe(false);
      expect(portfolio.positions[0]!.quantity).toBeCloseTo(0, 6);
      expect(portfolio.positions[0]!.realisedUsd).toBeCloseTo(15, 6);
      // No open holdings, so nothing to have a cost basis.
      expect(portfolio.totals.positions).toBe(0);
      expect(portfolio.totals.costUsd).toBeCloseTo(0, 6);
      expect(portfolio.totals.realisedUsd).toBeCloseTo(15, 6);
    });

    /**
     * Sells share the contributions table and store their PROCEEDS in the same
     * column a buy uses for SPEND. Every reader that means "money in" therefore has
     * to say so, and the widget is the one that shows it to the reader every day.
     * Without the filter, selling reads as depositing.
     */
    it("does not count a sell as money put in", async () => {
      const { cookie, userId } = await signIn();
      await settle(userId, "buy", "1000000000", "20000000", `w_buy_${userId}`);
      await settle(userId, "sell", "500000000", "90000000", `w_sell_${userId}`);

      const response = await SELF.fetch("https://local.test/v1/widget/snapshot", {
        headers: { cookie },
      });
      expect(response.status).toBe(200);
      const { snapshot } = (await response.json()) as {
        snapshot: { summary: { contributions: { monthUsd: number; recentUsd: number[] } } };
      };

      // The $20 buy, and nothing from the $90 sale.
      expect(snapshot.summary.contributions.monthUsd).toBeCloseTo(20, 6);
      expect(snapshot.summary.contributions.recentUsd).toEqual([20]);
    });

    /** A sell is not an achievement: it must never close a week or reach a feed. */
    it("does not let a sell close a weekly promise", async () => {
      const { cookie, userId } = await signIn();
      const goal = await SELF.fetch("https://local.test/v1/goals", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({
          title: "Reserve",
          targetValue: 12,
          weeklyTargetCents: 2000,
        }),
      });
      expect(goal.status).toBe(201);
      const { id: goalId } = (await goal.json()) as { id: string };

      await env.DB.prepare(
        `INSERT INTO weekly_promises (id, goal_id, user_id, week_start, due_at, target_cents)
         VALUES (?, ?, ?, date('now'), datetime('now', '+2 days'), 2000)`,
      )
        .bind(`promise_sell_${userId}`, goalId, userId)
        .run();

      await settle(
        userId,
        "sell",
        "1000000000",
        "25000000",
        `sell_promise_${userId}`,
      );

      const promise = await env.DB.prepare(
        "SELECT completed_at FROM weekly_promises WHERE id = ?",
      )
        .bind(`promise_sell_${userId}`)
        .first<{ completed_at: string | null }>();
      expect(promise?.completed_at).toBeNull();
    });
  });
});
