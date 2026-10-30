# Fellas Manager Report Card — verified design & expert audit (2026-10-29)

## User mandate
A weekly-updating 0.0–100.0 report card for each active manager. Winning must dominate: championships and making playoffs matter. Show drafting, trading, waivers, and start/sit separately. Account for recent results more heavily. Keep ESPN 2016–2019 and Sleeper 2020–present connected to canonical manager identities. Do not publish unverified skills as fabricated scores. Do not tell the owner the broader site is ready to share before release testing is complete.

## Existing shipped implementation
- `analytics/manager-report-cards.html` is the current preview UI.
- `assets/manager-report-card-page.mjs` reads nine historical specialty/canonical datasets live.
- `assets/manager-report-card.mjs` computes 10 active-manager cards and a provisional grade, with explicit category coverage.
- `assets/manager-playoff-history.mjs` uses verified ESPN winner brackets for 2016–2019 and verified Sleeper playoff brackets for 2020–2025; exclusion of consolation games is critical.
- `assets/manager-postseason-success.mjs` calculates certified championships and runner-up results. Since 2026-10-29, title and runner-up *scoring* uses a 3.5-season half-life with permanent 25% historical floor; raw title counts remain unchanged.
- `data/career_core_generated.json` is generated from `data/unified_record_book_2016_2026.json`. Never create a second manually-maintained WLT table.

## Formula currently deployed (100 weight points)
- Titles 20; runner-up finishes 8; playoff qualification 12; regular-season record 10; all-play 10; drafting 15; trading 15; waivers 5; legal start/sit 5.
- Current graded subset: generally the first seven categories when draft/trade thresholds are met. Otherwise missing skills remain N/A.
- Provisional = sum(weight × category score) / sum(available weights). This is *not* the final overall score; coverage is displayed.
- Draft scores use documented nonkeeper pick surplus (minimum 12 eligible picks), trading verified direct edge (minimum four eligible sides). Both are cross-manager percentiles, not proof of decision quality.
- Historic title weighting: `0.25 + 0.75 * 0.5 ** ((2025 - titleYear) / 3.5)`. The same factor now applies to runners-up. Rebaseline reference season after 2026 season finishes.
- The current user-requested one-decimal result and week-by-week movement are computational outputs, not manual editorial grades.

## Mandatory guardrails / problems to resolve
1. **No full final rating yet** until waiver/FAAB acquisition-denominator completeness and legal weekly roster/bench completeness are certified. Missing data is never 0.
2. Verify draft pick surplus against the source engine before calling it “draft skill.” Keeper picks, traded picks, rookie draft changes, and season-specific replacement values can bias the measure.
3. Trade side `direct_edge` is direct realized contribution, not necessarily causal value. Evaluate team context, post-trade starts, opportunity cost and keeper prices before publishing an expert verdict.
4. The category result index uses a separate `analytics/power-ratings.html` model; do not conflate those separate scales.
5. Once full playoff *wins* are cleanly labeled in championship brackets, investigate adding advancement strength; presently playoff qualification, titles and finals are separately rewarded, but intermediate postseason wins do not receive explicit standalone points.
6. A 2026 partial season must not be scored as a completed-season postseason failure.
7. Missing draft/trade sample counts are N/A, not worst place. Percentile sample sizes must be visible.
8. Test the actual web page in browser and emulated mobile Chromium; assess Safari independently. Report CI/Pages results only after they complete.

## Expert interpretation rubric
A championship is hard proof of a successful outcome, not proof that every underlying choice was skillful. Four rings make Thommy's all-time title résumé exceptional. Mitch's 70–46 canonical career WLT through Week 7 (60.3%) demonstrates regular-season consistency independent of his zero titles. Scott's 2025 title is a high-impact recent achievement but his three-season sample must be acknowledged. No manager should receive an unsupported 90+ drafting, waiver or lineup score based on perceived reputation. The most defensible editorial distinction is **results**, **process**, **current form**, not a single unqualified “best fantasy manager.”

## Recommended next integration passes
- Build evidence-coverage dashboards per manager and season; show precise source references.
- Compute certified season-by-season acquisition/FAAB denominators, then waiver value and cost-adjusted efficiency.
- Reconstruct legal weekly bench snapshots and timestamped player eligibility, then lineup capture percentages.
- Add year-by-year drilldowns and historical chart snapshots per manager; preserve an immutable weekly archive and change explanations.
- Add an automated report-card model unit test and browser interaction checks to CI.
- Tie each manager's main profile to report card deep links and add individual personalized scouting summaries generated from verified quantitative evidence.
- Obtain actual successful post-change CI, GitHub Pages and browser evidence before suggesting the site is ready to be shared.
