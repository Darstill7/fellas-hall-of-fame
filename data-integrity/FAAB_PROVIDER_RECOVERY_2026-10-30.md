# The Fellas — FAAB provider-receipt recovery

**Status:** historical bid-source recovery completed for the specified Sleeper weekly windows; NOT a certified waiver/FAAB *skill* score. Conducted October 30, 2026.

## What changed

The previously archived `data/acquisitions_2020.json` through `data/acquisitions_2026.json` listed waiver transactions without the dollar amount paid. Historical Sleeper transactions were recovered via the connected read-only fantasy provider, including original transaction IDs, player IDs, roster IDs, bid amounts, and **complete vs failed** statuses. Documentation for the upstream endpoint: https://docs.sleeper.com/ (Get transactions).

The original winning bid is `settings.waiver_bid` in a Sleeper waiver transaction. **Do not confuse it with `waiver_budget`, which represents FAAB transferred in trades.**

## Verified results

| Season | Weeks queried | Completed winning claims | Failed bids | Winning spend | Archived winning claims fully reconciled |
|---|---:|---:|---:|---:|---:|
| 2020 | 1–18 | 104 | 72 | $707 | 101 / 101 |
| 2021 | 1–18 | 115 | 68 | $863 | 108 / 108 |
| 2022 | 1–18 | 127 | 66 | $798 | 122 / 122 |
| 2023 | 1–18 | 116 | 63 | $718 | 108 / 108 |
| 2024 | 1–18 | 131 | 113 | $672 | 124 / 124 |
| 2025 | 1–18 | 119 | 110 | $639 | 109 / 109 |
| 2026 | 1–7 (in progress) | 65 | 60 | $235 | 59 / 59 |
| **Total** | | **777** | **552** | **$4,632** | **731 / 731** |

These amounts are the sum of returned **status=complete** numeric waiver bids in the queried windows. Failed claims also report bids, but **the failed bids are NOT money spent**. The combined attempted bids on failed claims total $2,938 and must never be added to winning expenditure.

The 731 archived waiver transactions were each matched to a completed provider receipt by original transaction ID, roster ID and acquired player ID. Forty-six additional successful provider claims occurred outside the original archived acquisition rows, including late-season claims and newer 2026 activity; they are separately preserved in the provider research files. Do **not** silently add them to canonical season records or infer that their absence was a mistake: verify archival cutoffs and owner continuity first.

## Historical FAAB Casino review

All **16** quoted player/manager/year bid prices on `labs/faab.html` were matched to completed Sleeper provider receipts. The Nyheim Hines historical reference resolves to player ID 5347, archived as **Nyheim Miller-Hines**. The original costs check out.

However, qualitative labels such as “best ROI,” “legendary,” “burn,” “overpay,” or “worst choice” are **editorial**: a transaction receipt does not establish ex-ante acquisition decision quality. The FAAB Casino page has been updated to distinguish verified *prices* from subjective *outcomes*. The old “biggest successful bet $94” wording was also removed because a higher completed bid of $95 (Birch, Las Vegas Raiders defense, 2023 Week 15) appears in the recovered provider data.

## Data sources and validation

- Original receipts by year: `data-integrity/faab-provider-receipts-2020.json` through `faab-provider-receipts-2026.json`. These are normalized provider records including status, bid, IDs, archive and ownership reconciliation flags.
- Research summary: `data-integrity/faab-manager-spend-research-v1.json` (schema v2). Has per-manager-year winning spend and failed attempts; **not a ranking of manager skill**.
- Sixteen sourced editorial price claims: `data-integrity/faab-legacy-claim-verification-v1.json`.
- Regression verifier: `node scripts/verify-faab-provider-receipts.mjs`. Independently checks all seven source files, archive receipt joins, outcome totals, manager aggregate, and 16 claim amounts.
- Repeat research-only provider fetch: `node scripts/recover-sleeper-faab-receipts.mjs --output data-integrity/private-faab-receipts.json` when a network-enabled environment is available; review output before any publication.

## What is still missing

1. **Historic starting FAAB budgets and adjustments.** A $70 expenditure is not necessarily 70% of the budget in every season; FAAB trading or replenishments can change balances. Verify annual league settings and trade budget transfers.
2. **Failed-claim causes.** A failed claim does not automatically mean someone was outbid. It may have failed for another reason; do not grade competitive bids from failure counts.
3. **True waiver ROI and decision quality.** Requires post-acquisition starting usage with verified continuous possession, contemporaneous alternatives, roster context and keeper implications. Price and later fantasy points alone are not proof of managerial skill.
4. **Coverage outside queried windows.** Sleeper weeks 1–18 were queried for completed seasons; other transaction periods or source completeness are not certified. The 2026 season is ongoing and this snapshot covers only weeks 1–7. The ESPN era 2016–2019 is outside the Sleeper receipt recovery.
5. **Canonical consolidation.** This recovery is audit-only and should not mutate `data/acquisitions_*.json`, historical OVR, or public manager grades without a separately reviewed integration.

## Release policy

Keep current decision-skill waiver/FAAB grades as N/A. Historical spending and notable bidding behavior may be shown as **observed** measures after source review, but never as an unsupported ability grade. Complete canonical/browser CI and real iPhone acceptance remain separate release gates.
