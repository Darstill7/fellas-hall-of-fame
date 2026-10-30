# Manager Report Card: Success-First Policy

Success, especially championships and making playoffs, must carry the greatest weight.

Proposed 100-point weighting: Championships 20; verified runner-up appearances 8; playoff qualifications 12; regular-season record 10; all-play 10; drafting 15; trading 15; waiver pickups 5; start/sit 5.

Total: 60 points competitive success, 40 points roster management.

Evidence guardrail: data/manager_verified_season_endings_v1.json confirms championships and runner-up finishes, but most nonfinalist playoff appearances remain uncertified. Do not count missing postseason outcomes as misses. ESPN playoff seeds and unclassified Sleeper consolation matchups are insufficient to assign definitive playoff berth rates.

Added assets/manager-postseason-success.mjs to measure verified titles, verified runner-up finishes, and minimum known playoff appearances. It is not yet integrated into the old provisional report-card UI. Updating that existing module was blocked in this pass, so do not claim success weighting has gone live.

Next steps: certify season-by-season playoff berths against playoff brackets; wire success scoring into report cards; test and reconcile with existing grades. League-sharing hold and physical iPhone signoff remain outstanding.