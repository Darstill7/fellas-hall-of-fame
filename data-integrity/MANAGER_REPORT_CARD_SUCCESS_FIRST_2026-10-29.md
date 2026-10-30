# Manager Report Card: Success-First Policy

Success, especially championships and making playoffs, must carry the greatest weight.

Proposed 100-point weighting: Championships 20; verified runner-up appearances 8; playoff qualifications 12; regular-season record 10; all-play 10; drafting 15; trading 15; waiver pickups 5; start/sit 5.

Total: 60 points competitive success, 40 points roster management.

Evidence guardrail: data/manager_verified_season_endings_v1.json confirms championships and runner-up finishes, but most nonfinalist playoff appearances remain uncertified. Do not count missing postseason outcomes as misses. ESPN playoff seeds and unclassified Sleeper consolation matchups are insufficient to assign definitive playoff berth rates.

Added assets/manager-postseason-success.mjs to measure verified titles, verified runner-up finishes, and minimum known playoff appearances. It is not yet integrated into the old provisional report-card UI. Updating that existing module was blocked in this pass, so do not claim success weighting has gone live.

Next steps: certify season-by-season playoff berths against playoff brackets; wire success scoring into report cards; test and reconcile with existing grades. League-sharing hold and physical iPhone signoff remain outstanding.

## Verified Sleeper brackets added from screenshots
The user supplied full championship bracket screenshots for 2020, 2021, 2022, 2023, 2024 and 2025, with seeded six-team fields and first-round byes. Canonical input: `data/verified_sleeper_playoff_brackets_2020_2025.json`. This evidence certifies all six entrants in each season, not only title-game finalists. Former manager aliases are reconciled to canonical manager nicknames, avoiding false identities. ESPN 2016–2019 pending.

The model `assets/manager-playoff-history.mjs` calculates verified qualification over *eligible Sleeper seasons* using within-season qualifications and 3.5-season half-life (2025 newest completed). One neutral pseudo-season prevents a tiny sample from becoming 0/100 or 100/100 automatically. First-round bye, semifinal, finals and titles are tracked separately. The 12-point report-card playoff component is now measurable for the 2020–2025 certified portion. The 2026 Week 7 regular-season record and all-play components dynamically respond to newly ingested canonical games; neither the 2026 playoff status nor aging reference advances until season completion. A dedicated weekly-change regression test is added.

Run #559 (https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40995879730) passed the manager report-card evidence step, full browser test in progress at last check. Follow-up run #561 (https://github.com/Darstill7/fellas-hall-of-fame/actions/runs/40996046624) includes weekly-change regression. Do not claim full success for either until final GitHub conclusion. All manager grades remain provisional because ESPN 2016–2019, full waiver pool and start/sit benches are incomplete; release hold remains.
