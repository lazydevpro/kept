# Private markets: Tessera vs PreStocks

Both are Stocklana hackathon sponsors, both tokenise pre-IPO exposure on Solana, both
publish a keyless public API, and every mint from both is quotable and swappable through
the Jupiter path KEPT already uses. They are not, however, the same product — the
differences that matter are in the token, not the API.

Checked 20 September 2026. Prices move; the structural facts below were read from the
mints themselves via `getAccountInfo` on mainnet, not from marketing copy.

## At a glance

| | **Tessera** | **PreStocks** |
|---|---|---|
| Catalog API | `rest-api.tessera.pe/v1/public/token-details` | `prestocks.com/api/prestocks` |
| Auth | none | none |
| Assets | 3 | 8 |
| Names | OpenAI, Kalshi, SpaceX | Anduril, Anthropic, Figure AI, Kalshi, Neuralink, OpenAI, Polymarket, SpaceX |
| Logo in API | no — resolved from Jupiter or the CDN pattern | yes (`image`) |
| Description in API | no | yes, a paragraph per asset |
| Extra fields | `sector`, `holders`, `markValuation` | `markPrice` vs `tokenPrice`, `markValuation` vs `impliedValuation`, `supply`, `external_url` |
| Docs | `docs.tessera.pe` (+ `llms.txt`, `.md` per page) | none found |
| Bounty | $6,000 | $10,000 |

## The token itself

Both are Token-2022, 9 decimals, mainnet. That is where the similarity stops.

| Extension | **Tessera** | **PreStocks** |
|---|---|---|
| Transfer fee | **0.20%**, unchanged across epochs | **1.00%**, raised from 0.50% (epoch 1032 → 1039) |
| `permanentDelegate` | — | **issuer** — can move tokens out of any wallet |
| `freezeAuthority` | a separate key from the mint authority | **the same key as everything else** |
| `pausableConfig` | — | **issuer** can halt all transfers (currently unpaused) |
| `transferHook` | — | declared; `programId` is null today, authority can set one |
| `scaledUiAmountConfig` | — | **active** |
| `confidentialTransfer*` | — | present |
| Other | `metadataPointer`, `tokenMetadata` | `defaultAccountState`, `metadataPointer`, `tokenMetadata` |

On PreStocks, a single key (`WV9PJN7XTmTLVwbutCLFxp8TyePee6Xq5mRq6Fti5Wc`) holds the mint,
freeze, permanent-delegate, fee, pause, transfer-hook and scaled-amount authorities.

### `scaledUiAmountConfig` is live, and it breaks naive balance math

PreStocks mints carry a UI multiplier that is **already in effect** — it flipped from `1`
to `1.4861347` on 17 July 2026:

```
OPENAI on-chain raw supply   1901.8832
         × 1.4861347          2826.4547
their API reports supply      2826.4604   ✓
```

So `quantity = baseUnits / 10^decimals` — what `routes/portfolio.ts` does today, and what
is correct for xStocks and Tessera — would understate a PreStocks holding by about a third,
and would drift again every time the issuer updates the multiplier. Integrating PreStocks
means reading the multiplier from the mint and applying it to quantity, cost basis and P&L.

## What each is, legally

**Tessera T-Tokens** are loan participation rights. The holder lends to a dedicated issuer
entity per token and is repaid a share of proceeds when a qualifying liquidity event
happens — an IPO or a change of control of more than 50% voting control. There is no fixed
maturity: redemption only opens once the event has occurred, any lock-up has expired,
Tessera has received the proceeds, and a Redemption Start Date is announced. Structured
under a non-security opinion, no KYC. No ownership, voting, dividend or information rights.

**PreStocks** tokens are described as "backed 1:1 by SPV exposure that tracks the price of
the underlying private company", and the site is explicit that they "confer no ownership,
voting, dividend, information, or other legal rights". Not available to U.S. persons.
Redemption mechanics are not documented anywhere public that this check could find.

## Liquidity (Jupiter, at time of writing)

| Tessera | | PreStocks | |
|---|---|---|---|
| tOpenAI | $387k | ANTHROPIC | $686k |
| tKalshi | $193k | OPENAI | $780k |
| tSpaceX | $108k | ANDURIL | $378k |
| | | NEURALINK | $281k |
| | | POLYMARKET | $155k |
| | | FIGUREAI | $128k |
| | | SPACEX | $113k |
| | | KALSHI | $99k |

Both catalogs overlap on OpenAI, Kalshi and SpaceX, at different prices — they are
different instruments on the same underlying, not the same asset listed twice. xStocks
separately lists `SPCXx`, so SpaceX is available three ways.

## Where KEPT stands

Tessera is wired to its live API (`backend/src/routes/trades.ts`), which is what added
tSpaceX; the two original mints remain as an offline fallback so the lane degrades rather
than empties. All three are in `FEATURED` so they lead the browse list, each carrying a
"Private" chip.

PreStocks is **not** integrated. It is the larger bounty and roughly triples the private
shelf, but it needs three things Tessera did not:

1. the scaled UI multiplier applied everywhere a quantity is computed;
2. the transfer fee read from the mint rather than hardcoded, since the issuer has already
   doubled it once;
3. disclosure copy for clawback, freeze and pause — KEPT's wallet card says
   "self-custodial", and with a permanent delegate on the mint that claim needs qualifying.
