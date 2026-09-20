# Idea context — Social Wealth

## Status

- Decision: conditional go; validate before expanding.
- Hackathon: Stocklana, September 2026.
- Product category: consumer social investing / tokenized stocks.
- Working positioning: **Build wealth together, without pooling money.**
- Familiar metaphor: Strava or Apple Health activity rings for long-term investing habits.

## Problem

Long-term investing is solitary, abstract, and easy to postpone. Existing portfolio products emphasize balances and returns, while social trading products often reward performance, copying, and public financial flexing. Friends who want to build wealth together lack a private, low-pressure accountability loop.

## Target user

Young investors who already save or invest small amounts, especially friend pairs, couples, siblings, and small trusted groups. The initial user is not an active trader; they want consistency and encouragement.

## Refined product

Users create a personal financial goal, choose a weekly investment commitment, invite a private circle, and buy a curated tokenized stock or ETF. Wallet activity verifies completion. Friends see only the progress level the user chooses. Each user retains a separate, self-custodial portfolio.

The product rewards:

- completing a planned contribution;
- staying near a chosen allocation;
- remaining invested instead of impulsively churning;
- helping everyone in the circle reach their goal.

It does not reward:

- highest return;
- largest balance;
- most trades;
- copying another user;
- winner-takes-all competition.

## Core loop

1. Create a goal such as “invest my first $1,000.”
2. Set a weekly promise such as “invest $25 every Friday.”
3. Invite friends into a private circle.
4. Select a privacy level: progress only, verified activity, or full portfolio.
5. Execute a purchase from a small curated stock/ETF list.
6. Verify the contribution from Solana wallet activity.
7. Fill the relevant progress rings, extend the consistency map, and notify the circle.
8. Friends react, encourage, and return to complete their own promise.

## Differentiation

The broad idea is not novel. MicroMint, Tally, Sharevest, Franc, and other Web2 products already combine goals, groups, challenges, or portfolio sharing. The defensible wedge is narrower:

**Private friend accountability for verified tokenized-stock habits, with separate self-custodial portfolios.**

Solana contributes:

- verifiable contributions without sharing brokerage credentials;
- fractional, self-custodial tokenized stocks;
- portable portfolio activity;
- execution through existing liquidity and swap infrastructure;
- 24/7 access where assets, counterparties, and jurisdiction allow.

Crypto is not required for the social graph, goal copy, reactions, privacy controls, or reminders. Keep those offchain.

## MVP

Build:

- goal creation;
- weekly contribution commitment;
- invite link and private friend circle;
- three privacy modes;
- wallet connection;
- curated asset list, initially 3–5 liquid stock/ETF tokens;
- Jupiter-assisted purchase;
- transaction-based contribution verification;
- three signature rings: Promise (this week's commitment), Goal (overall percentage), and Circle (members on track);
- a twelve-week consistency heatmap and milestone path;
- a circle orbit visualization showing group momentum without ranking members;
- an optional allocation mosaic when the user chooses to reveal where investments are happening;
- streaks, reactions, and a weekly recap;
- a shareable progress card with no balance exposed by default.

Defer:

- pooled wallets or group custody;
- P&L leaderboards;
- copy trading;
- personalized investment advice;
- public feeds;
- custom onchain program unless an invariant later requires one;
- broad asset discovery;
- complex rebalancing automation.

## Demo story

The user creates “My first $1,000 invested,” invites three friends, and selects progress-only privacy. They buy $25 of a tokenized ETF. The transaction fills the contribution ring and starts a streak. Friends see verified progress but not the dollar balance, send a cheer, and the group card changes from 2/4 to 3/4 members on track.

## Visualization principles

- Consistency is the default metric; amount and holdings are optional disclosures.
- The home screen is anchored by three concentric rings, not portfolio value or P&L.
- Every visualization answers a distinct question:
  - Promise ring: did I do what I planned this week?
  - Goal ring: how close am I to my chosen destination?
  - Circle ring: how many of us are on track?
  - consistency map: have I kept showing up over time?
  - milestone path: what meaningful checkpoint comes next?
  - circle orbit: who is participating without ranking people?
  - allocation mosaic: where is the portfolio invested, only when shared?
- Missing a promise uses a neutral incomplete state, not punitive red.
- Do not chart P&L by default. It would pull the product back toward short-term performance.
- Share cards show streak, percentage, and circle momentum. Exact values remain opt-in.

## Brand direction

- Palette locked: **Neon Reserve**.
- Core ring colors: vivid yellow `#FFEA00`, Solana purple `#C13CFF`, and signal red `#FF174D`.
- Dark surfaces: `#09080F` base and `#151120` elevated.
- Light surfaces: `#F8F5FC` base and `#FFFFFF` elevated.
- Ring strokes use a bright head and a substantially darker tail; preserve the verified CodePen geometry and directional gradient behavior.
- Typography locked for the MVP: Inter for product UI and JetBrains Mono for financial, progress, and wallet data.

## Validation assessment

- Founder fit: 3/3
- MVP speed: 3/3
- Distribution: 3/3 — each goal naturally invites friends
- Market pull: 2/3 — direct competitors and tokenized-stock adoption are positive evidence, but the exact accountability behavior is unproven
- Revenue clarity: 1/3 — possible premium circles, subscriptions, or execution revenue, but none is validated
- Total: 12/15

Verdict: **go validate**, not yet an unconditional go-build decision.

The fastest behavioral test is five real friend pairs using the loop for seven days. The success signal is not enthusiasm; it is a second contribution and a friend interaction. Interview users who stop and determine whether the cause is privacy, motivation, funding friction, or unclear value.

## Principal risks

- Empty-network problem before a friend joins.
- Users may regard any portfolio sharing as unsafe or embarrassing.
- Gamification may create financial pressure if it celebrates dollars or returns.
- Tokenized-stock eligibility and availability vary by jurisdiction.
- xStocks corporate-action multipliers must be handled correctly in displayed balances.
- The product could drift into regulated advice, copy trading, or custody if scope expands carelessly.

## Existing-product reuse

Reuse Market Royale's visual system, avatars, social presence, animated cards, progress states, and celebratory interactions. Do not carry over its tournament contracts, short-term P&L ranking, shared prize pool, or prediction-market mechanics.

## Research sources

- https://hackathons.solana.com/hackathons/stocklana
- https://www.joinmicromint.com/
- https://www.tallyup.live/
- https://sharevest.app/
- https://www.franc.app/howto/shared-goal
- https://solana.com/news/solana-ecosystem-roundup-august-2026
- https://solana.com/uk/news/ondo-global-markets-tokenized-stocks-etfs-solana
- https://developers.jup.ag/docs/recurring
- https://docs.xstocks.fi/docs
- https://docs.xstocks.fi/docs/how-xstocks-work
- https://docs.xstocks.fi/developers/multipliers
