# The Fellas Championship Anthology — Deep Editorial Fact Audit

**Coverage:** The ten completed title seasons, 2016–2025.  
**Audit scope:** Canonical team scores, official playoff champions, seed/participation context, close-game turning points, season-long starters where preserved, playoff starter box scores where preserved, and transaction evidence.  
**Status:** Source-reconciled editorial draft. The canonical CI, browser, visual and deployment gates are independent of this audit and must pass before publication.

## Reader promise

A title story should answer five different questions without confusing them: *How did the eventual champion qualify? Which decisions or acquisitions actually changed the roster? Where could the run have ended? Which credited players moved the scoreboard in the semifinal and championship? Why is this particular title remembered?* A season-long leading scorer is not automatically the championship-game MVP. A transaction that appears in a title-season archive is not automatically a winning trade. A familiar NFL star must not be inserted into an ESPN-era lineup if no archived starter points support it.

The stories use a four-part magazine-style narrative, rather than an identical chronology with one paragraph devoted to every game. Their exact results are checked against `data/season_weekly_matchups_2016_2026_v1.json` and verified ESPN/Sleeper playoff brackets. The 2020–2025 starter receipts are preserved in `data/championship_player_boxscores_2020_2025_v1.json`; in each of twelve games, the nine credited starter scores sum to the recorded team score. Regular-season starter totals come from `data/franchise_player_legends.json` and **exclude playoff weeks**. Trade examples come from `data/v9_trade_engine.json`; the player-only receipts may omit picks or FAAB.

## Audit by championship

### 2016 — Thommy: the inaugural upset
- **Verified arc:** A 1–3 opening gave way to 7–5–1 and the third seed; four consecutive wins in Weeks 5–8 preserved the season.
- **Closest evidence:** The 103–99 Week 12 victory over Stew and 121–121 regular-season tie with Halderman. The latter opponent returned in the title game.
- **Bracket:** The two-week 227–153 semifinal reversed two regular-season losses to Evans; 223–175 over top-seeded Halderman secured the first ring.
- **Editorial caveat:** No verified individual 2016 title-game starter scores or complete trade evidence; *no player MVP award is claimed*.
- **Why it matters:** The first champion defeated the regular-season leader rather than merely adding another win to the best record.

### 2017 — Thommy: repeat as a top seed
- **Verified arc:** Four straight opening wins, 8–4 regular season, first seed; the Week 9 148–63 Birch rout demonstrated scoring ceiling.
- **Closest evidence:** The 99–93 victory over Koble and 233–217 two-week semifinal against Evans.
- **Bracket:** A 241–212 two-week championship over Schermerhorn reversed a 124–90 regular-season defeat to the same manager.
- **Editorial caveat:** No source-supported 2017 individual title-game MVP or consequential player trade.
- **Why it matters:** The same champion proved he could win both as a lower seed (2016) and as the favorite (2017).

### 2018 — Thommy: the third ring by inches
- **Verified arc:** The 7–6 defending champion had to survive all three playoff rounds as the fourth seed.
- **Closest evidence:** The 142.92–142.76 Week 7 regular-season win over Stew, 96.54–92.64 opening playoff escape versus Kuhl and 111.58–106.62 title win over Birch. Two elimination games were decided by fewer than five.
- **Bracket:** Tony fell 94.80–82.30 in the semifinal before Birch, who had beaten Thommy badly in Week 2, lost the title game by 4.96.
- **Editorial caveat:** No fabricated 2018 starter MVP or transaction. The league's scoring format differs from 2019 onward.
- **Why it matters:** Three consecutive titles were achieved with a total three-game postseason winning margin of just 21.36.

### 2019 — Birch: vindication of the runaway favorite
- **Verified arc:** After the 2018 final loss, Hogan’s Heroes began 6–0, recovered from Weeks 7–8 defeats and finished 11–2 as the top seed.
- **Closest evidence:** The 114.10–113.28 Week 13 win over Mitch (0.82) and the 114.14–109.42 final over Stew (4.72).
- **Bracket:** Tony lost the semifinal 153.10–131.52; Stew had lost an earlier regular-season matchup by 8.40, yet pushed the final even closer.
- **Editorial caveat:** Full individual starter and complete transaction archives for 2019 are not available here.
- **Why it matters:** Birch changed from a 4.96-point championship loser to a 4.72-point championship winner in successive seasons.

### 2020 — Koble: sixth-seed champion
- **Verified arc:** A 7–7 sixth seed qualified despite wild swings in scoring; first-round result coverage is incomplete and is not described with an invented final.
- **Semifinal heroes:** Ryan Tannehill 37.02, Derrick Henry 24.20, David Johnson 17.80 in the 130.42–82.82 win over Birch.
- **Title heroes:** David Johnson 28.40, Jalen Hurts 17.58 and Miles Sanders 15.40 in the 117.48–99.42 victory over first-seeded Mitch.
- **Trade caveat:** No defensible champion-specific transaction in the evaluated trade archive for 2020; no trade outcome is invented.
- **Why it matters:** The last seed beat both bye teams. The actual starters show *who* turned a .500 campaign into a title, not just that the team got hot.

### 2021 — Tony: a transaction-built roster wins by 4.30
- **Regular-season engine:** Jonathan Taylor 292.40 starter points in 13 starts; Matthew Stafford 251.84 and Davante Adams 211.40 were core contributors to 10–3 and the No. 2 seed.
- **Verified moves:** August 30 preseason trade brought Taylor, A.J. Brown and Corey Davis; October exchanges added Joe Mixon, CeeDee Lamb and Kyle Pitts. Each linked trade receipt is evaluated only as a move, not declared a universal trade win.
- **Semifinal:** Taylor 24.00 in a 94.96–73.44 win over Stover.
- **Final:** Tony 138.28, Evans 133.98. Mixon 29.50 and Adams 28.40 led the winner, with 19.00 from Tampa Bay’s defense; Pitts and Lamb also started.
- **Why it matters:** The player who got Tony to December (Taylor) is distinguished from the highest-scoring player on championship day (Mixon).

### 2022 — Stover: the high-ceiling core and a decisive rematch
- **Regular-season core:** Mahomes 316.40, Tyreek Hill 246.00, Derrick Henry 234.06 and Travis Kelce 217.90 credited starter points, supporting the 9–5 record and bye.
- **Closest evidence:** A 132.68–129.50 regular-season win over Tony; Stew won their Week 2 meeting, but Stover won the Week 11 rematch.
- **Semifinal:** Mahomes 23.76, Devin Singletary 19.50, Henry 18.60, Kelce 15.30 during the 112.56–87.68 victory over Kuhl.
- **Final:** Stover 99.22, top-seeded Stew 48.16; Mahomes 25.02, DJ Moore 21.70 and Giants defense 16.00 led the championship week.
- **Why it matters:** The season-long MVP candidate (Mahomes) was also the top title-game scorer. The 51.06-point margin ended Stew's 11-win season.

### 2023 — Stilly: transaction consequences you can actually measure
- **Regular-season engine:** Josh Allen’s 306.28 starter points in 13 starts helped turn an 0–4 opening into 8–6.
- **Close escape:** The 120.36–117.58 Week 8 win over Thommy (2.78) mattered to the eventual playoff qualification.
- **Verified trade:** October 26, Stilly sent Cooper Kupp to Tony and acquired Mike Evans and Derrick Henry. The incoming pair scored **44.98 combined points** in the 141.66–108.58 semifinal against Tony: Evans 24.10 and Henry 20.88. This demonstrates title-run impact without claiming exact counterfactual trade value.
- **Final:** Stilly 104.96, Mitch 90.18. Allen 19.16, Buffalo defense 18.00 and Njoku 15.40 led the title-winning lineup; the trade arrivals also started but were not the leading scorers on that day.
- **Identity caveat:** Evans occupied the 2023 franchise slot later held by JMid, who joined in 2024; this distinction is maintained throughout all narrative references.

### 2024 — Thommy: the fourth ring changes hands on a real trade
- **Regular-season core:** Derrick Henry 248.70 and Bijan Robinson 220.30 credited starter points gave Thommy the foundation for 9–5 and a bye.
- **Verified transaction:** September 24 trade from Stilly sent Christian McCaffrey, Diontae Johnson and **Tee Higgins** to Thommy; Higgins scored **34.60** in the championship lineup. A later Jordan Love acquisition is also supported; Love scored 14.00 in the final. Trade value beyond the observed starters is not inferred.
- **Semifinal cliff edge:** Thommy 123.38, JMid 121.08; Jameson Williams 24.50, Bijan 23.30 and Henry 20.90. A 2.30-point shift would have ended the fourth-ring attempt.
- **Final:** Thommy 205.30, defending champion Stilly 114.88; Higgins 34.60, DeVonta Smith 28.00, Adam Thielen 26.50 and multiple 20-plus scorers produced a 90.42-point separation.
- **Why it matters:** The contrast between a semifinal won by 2.30 and a final won by 90.42 is the distinctive dramatic architecture.

### 2025 — Scott: a second-year champion takes out the dynasty
- **Regular-season core:** Bijan Robinson 239.30, James Cook III 221.00, George Pickens 206.90 and Trey McBride 188.20 in credited starter points; 8–6 and a first-round bye after a 5–9 debut season.
- **Close escape:** Week 3 vs Stover, 113.52–112.54, was a 0.98-point win.
- **Semifinal:** Scott 141.88, Birch 70.40, with Robinson 27.30, Cook 26.90 and Pickens 22.50.
- **Final:** Scott 156.32, four-time champion Thommy 86.00. Robinson 38.40 and Brock Purdy 36.92 supplied 75.32 combined points; Giants defense added 20.00 and Christian Watson 19.80.
- **Why it matters:** Scott's leading regular-season starter was also the leading semifinal and title-game scorer, while Purdy's final-week burst helped complete the 70.32-point victory.

## Remaining historical evidence gaps

The audit cannot infer individual championship-winning players in the **2016–2019 ESPN seasons** from team scores alone. A complete Week 14–17 individual-starter archive for those seasons would permit named player MVPs and meaningful player-level explanations; without it, no such claims will be published. The recovered 2020 first-round game lacks a completely supported score. Historical draft and trade datasets are not equally complete across seasons, and a manager’s transaction does not prove causality unless actual subsequent lineup contributions can be tied to it.

## Editorial quality gates

1. Each champion, final opponent, championship score and aggregate-era format agrees with the canonical league ledger.
2. Every story contains a full four-act sports feature, **360–650 words**, instead of generic summary fragments.
3. For all 2020–2025 champions, top title-game player scores are present in the prose and the visible evidence cards, and the nine starter scores reconcile to the archived team total.
4. Trade claims link to valid exact-season completed transaction receipts for the actual champion.
5. 2016–2019 articles do not invent playoff starter MVPs or misapply the current league’s scoring system.
6. The user can reach the complete story from the relevant manager's Hall of Fame trophy case.
7. Original brackets, historical franchise attribution and 2026 Week 8 cutoff remain unchanged.

These checks provide a reproducible baseline for future revisions. They do **not** certify incomplete historical data as complete.
