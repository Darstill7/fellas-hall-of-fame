# The Fellas — 13 Repeated-Trade Player Chains: Provider Gap and Holding-Window Audit

**Checkpoint:** November 16, 2026. **Status:** research-only, not a proven causal trade-performance rating or public award.

## Summary

The represented 44-event 2020–2025 Sleeper trade ledger contains **13 distinct player/season combinations** with two successive trade-receiving records. The newly completed transaction-gap audit scanned **40 unique public matchup weeks** (2021 six; 2022 eight; 2023 nine; 2024 seven; 2025 ten). Every scan returned fewer than 100 rows on the 100-row request and was successful.

All **13** candidate chains have:
- Both exact completed Sleeper trade transaction IDs verified in the returned weekly records;
- The **same provider player ID** at the beginning and end trade receipt;
- Every intervening public week from the original trade week to the next trade week scanned; and
- **No intervening completed non-trade add/drop or waiver event for that player in the returned transaction records**.

This upgrades the cases from *name-only repeat trade candidates* to *provider-ID-matched sequential trade receipts with clean scanned transaction gaps*. It does **not** prove continuous ownership independently: provider omissions, other acquisition metadata, same-day lock timing, and counterfactual alternative transactions remain unknown. Do not present this as an exhaustive guarantee.

## Historical league-ID correction

The first exploratory 2022 scan mistakenly used an incorrect league ID; its eight failed 2022 records in `trade-targeted-add-drop-audit-2022-2023-v1.json` are invalid and **must not** be used to infer no 2022 transactions. The correct 2022 league is **857125408712310784**, verified via the connected Sleeper historical league chain, and all eight 2022 weekly scans were successfully rerun in `trade-targeted-add-drop-audit-2022-2024-corrected-v1.json`. The 2023 rows in the original 2022–2023 file remain usable.

## Strictly-between-trades started production

This second, independent audit joins each verified provider player ID to the original receiving roster ID and the league's archived weekly starter ledger. It counts credited starts ONLY in weeks *strictly between* the original trade week and next trade week. The transaction week on each end is intentionally excluded. The metric is **realized intermediate-manager lineup production**, not an estimate of trade profit.

| Year | Player | Intermediate recipient | Starts | Points |
|---|---|---|---:|---:|
| 2021 | Josh Jacobs | Thommy | 0 | 0.00 |
| 2021 | Antonio Gibson | Thommy | 4 | 60.90 |
| 2021 | Leonard Fournette | Kuhl | 0 | 0.00 |
| 2022 | James Robinson | Evans | 2 | 6.80 |
| 2022 | Cordarrelle Patterson | Stew | 1 | 9.80 |
| 2022 | Alvin Kamara | Tony | 1 | 21.40 |
| 2023 | CeeDee Lamb | Stew | 2 | 19.70 |
| 2023 | Travis Etienne Jr. | Stew | 6 | 116.90 |
| 2024 | Tank Dell | Thommy | 1 | 1.80 |
| 2024 | Rico Dowdle | Thommy | 0 | 0.00 |
| 2025 | Derrick Henry | Stew | 7 | 81.40 |
| 2025 | Ja'Marr Chase | Stilly | 6 | 111.20 |
| 2025 | Jordan Addison | Thommy | 4 | 39.80 |

### Key interpretations

- **Jacobs (2021):** one-day flip before the football season starts; zero intermediate starts correctly reflects no starting output, **not** a zero-value player. A separate multi-player trade into Birch followed.
- **2023 Lamb / Etienne:** both came to Stew in the same Week 3 exchange, but Lamb moved again in Week 6 and Etienne in Week 11. Their middle-window outputs are non-overlapping per-player-week observations; they cannot be treated as independent profits of the original trade without valuing the rest of both packages.
- **2025 Chase:** his six starts and 111.20 credited points between Stilly's Week 3 acquisition and Week 11 trade distinguish actual use from his subsequent asset-conversion proceeds. Subsequent first-round keeper use in 2026 belongs to JMid, not Stilly, until their separate October 2026 trade.
- **2024 Tank Dell:** acquired by Thommy in Week 1, traded to Stilly in Week 3; strict interior Week 2 credited points 1.80. Excluding both boundary weeks is intentional.
- **2025 Addison:** started for Thommy before being transferred to Stilly in the three-manager deal; do not attribute his 2025 Week 3–11 production to Stilly.

## Consequence for 0–100 Trade Ratings

The verified *chain linkage* supports editorial presentations for historical transactions, but not a fair marginal value attribution of the next trade package to any single constituent asset. Correct scoring must show realized intermediate starting contribution, original consideration, downstream trade conversion, keeper draft round, playoff results, cost and uncertainty in **separate components**.

Avoid double counting: a manager cannot receive full credit for Chase's pre-retrade production, and also full credit for all Amon-Ra/Goff/Addison return players as if those were acquired for Chase alone, because A.J. Brown was also sent in that three-way exchange. Similarly, Josh Jacobs is only one part of the subsequent Jacobs/Lamar/Andrews package.

## Source files

- [13 chain provider gap audit](../data-integrity/trade-repeat-chain-provider-gaps-v1.json)
- [13 chain strictly-interior started points](../data-integrity/trade-repeat-chain-interior-starter-points-v1.json)
- [2021 and 2025 targeted complete transaction windows](../data-integrity/trade-targeted-add-drop-audit-2021-2025-v1.json)
- [2023 targeted transaction windows](../data-integrity/trade-targeted-add-drop-audit-2022-2023-v1.json)
- [Corrected 2022 and 2024 targeted transaction windows](../data-integrity/trade-targeted-add-drop-audit-2022-2024-corrected-v1.json)

## Research release gates

1. Corroborate future contiguous ownership with sampled weekly roster snapshots and trade timestamps, especially where same-week endpoints could overlap.
2. Build complete transaction ID lineage through adds and drops for each asset across entire season, not merely target ranges.
3. Reconcile original trade return packages, include FAAB/keeper cost, and model next-trade value as a package with multiple contributors.
4. Use defensible replacement-lineup and same-position alternatives and document incomplete coverage.
5. Publish 0–100 scores only after uncertainty calibration and independent canonical/frontend QA pass.

**No manager ratings are assigned here.**
