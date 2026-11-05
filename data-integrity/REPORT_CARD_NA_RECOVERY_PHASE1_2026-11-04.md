# Manager Report Card N/A recovery — Phase 1 source-level audit

**Date:** November 4, 2026. **Scope:** 10 active managers, verified results through completed 2025 seasons and archived 2026 Week 8; 2026 is ongoing.

## What shipped in this first batch

- Three factual, mobile-friendly metrics on **every** report card: verified 2016–2025 career top-three finishes; recorded distinct Sleeper acquisitions later started (2020–2026, 2026 partial); and Sleeper-displayed 2026 Week 8 start/sit accuracy (screenshot-derived).
- Expandable source coverage and caveats: field-adjusted career finish score / years, pickup start-rate denominator, 2025 keeper original-manager started points, and documented draft seasons.
- **No skill grades were invented.** The WAIVERS, START/SIT, and KEEPER ratings remain unrated; the source snapshots cannot feed their official category scores.
- `assets/manager-evidence-snapshots.mjs` supplies the values. `data-integrity/REPORT_CARD_NA_RECOVERY_AUDIT_2026-11-04.json` captures the ten-manager evidence matrix. `scripts/test-manager-evidence-snapshots.mjs` checks source parity, nonzero denominators, absence of false skill ratings and website wiring.
- Canonical CI, responsive visual QA, and Chromium/WebKit browser release assertions were updated to require the 10 evidence panels.

## Sources and level of evidence

| Displayed feature | Primary source | Status | Important qualification |
|---|---|---|---|
| Career finish, top-three count, last-place count | `fellas_final_placements_2016_2025_verified.json` | **Verified** | 2016 had eight teams; the rest had ten. Field-adjusted score is a descriptive outcome, not manager skill |
| Distinct pickups and later starts | `manager_acquisition_distinct_v1.json` | **Observed** | Recorded 2020–2026 Sleeper transactions; 2026 partial; no assumption that a non-start is a bad move |
| Sleeper displayed start/sit average | `data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json` | **Verified screenshot** | A 2026 Weeks 1–8 snapshot, not a legal alternative decision grade or an all-career percentage |
| Keeper starter points | `keeper_2025_website_research_v1.json` | **Observed** | 2025 only, under original manager; excludes unused players; grade is intentionally null |
| Years with a draft record | `manager_draft_trade_profile_evidence_v1.json` | **Recorded** | Years represented, not proof of complete pick-by-pick source coverage or scored draft skill |

## Source-backed comparative examples

| Manager | Completed seasons | Top-three finishes | Pickups later started | Sleeper start/sit 2026 W8 | 2025 keeper regular started points |
|---|---:|---:|---:|---:|---:|
| Stilly | 10 | 3 | 68 | 92.4% | 204.26 |
| Stew | 10 | 2 | 83 | 92.0% | 65.80 |
| Thommy | 10 | 5 | 81 | 88.2% | 238.20 |
| Stover | 10 | 2 | 45 | 87.8% | 245.20 |
| Birch | 9 | 4 | 35 | 85.8% | 25.00 |
| Tony | 9 | 2 | 51 | 88.9% | 216.50 |
| Mitch | 8 | 4 | 67 | 87.2% | 336.70 |
| Kuhl | 8 | 1 | 54 | 83.1% | 129.74 |
| JMid | 3 | 0 | 43 | 88.1% | 154.92 |
| Scott | 2 | 1 | 23 | 85.3% | 295.70 |

These measurements cover differing samples and must **not** be used as a single manager ranking. In particular, recent start/sit accuracy does not overwrite a missing historical start/sit rating.

## Remaining N/A classification and next work

| Field | Why it stays N/A | What would fill it accurately | Priority |
|---|---|---|---|
| FAAB / waiver *skill* | Known successful pickups and later-start outcomes do not capture every eligible opportunity, failed offer, zero-dollar waiver, free-agent add, and decision-time roster constraints | Reconcile provider bids and eligible add/free-agent decisions by manager-season; use only a simple source-qualified impact rubric, no speculative replacement comparisons | High |
| Start/sit *decision skill* | Hindsight/bench efficiency misses injuries, questionable players, start deadlines, legal slot options and hindsight selection bias | Align each week’s starting lineup, eligible roster, lineup rules and kickoff availability; preserve season-specific denominator | High |
| Keeper decision grade | Started production alone doesn't capture predeadline cost, realistic keeper alternatives, abandonment/transfer context | Reconcile complete keeper declarations, prior-season draft cost, player-owner changes and the de-duplicated drop penalty | Medium |
| Drafting grade when low sample | Some managers have too few eligible verified, scored nonkeeper picks | Verify round, original owner, keeper exemptions, player identifiers and comparable scoring; keep N/A below the minimum sample | Medium |
| Trading grade when low sample | Verified source trade sides may be below four and not all bilateral assets reconciled | Complete qualifying direct trade-side receipts and preserve incomplete sides as research, never zero | Medium |
| Pickup transaction price | A receipt lookup may legitimately be missing, not automatically a $0 add | Match the source transaction ID and player to provider receipt, classify $0 winning waiver distinctly from free agent | Medium |
| All-era lineup/FAAB skill pre-Sleeper | ESPN historical match results do not include equivalent decision opportunity snapshots | Original ESPN transaction and pre-lock roster data if available; otherwise label “not recorded” | Low |

## Release gate

1. Verify that the 10 facts panels render without page errors in Chromium/WebKit at phone widths.
2. Confirm 10 manager rows equal their original JSON receipts and account for differences in participation years.
3. Confirm official report-card skill grades for waiver, start/sit and keeper remain `null`.
4. Reject contradictions between screenshot source / canonical provider histories and older Google Sheets notes.
5. Do not treat incomplete 2026 observations as a finished-season score.

**Publishing status:** Code committed; green CI and browser status should be checked independently before claiming the release fully validated.
