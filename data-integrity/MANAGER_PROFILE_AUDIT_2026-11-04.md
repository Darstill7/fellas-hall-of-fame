# Manager-by-manager profile editorial and data audit — 2026-11-04

## Scope and source of truth
Inspected the primary `managers/<slug>/index.html` file for all ten current managers, the current `data/career_core_generated.json` through 2026 Week 8, `data/manager_legacy_resumes.json`, `data/manager_biographies_awards.json`, and the shared `assets/legacy-resume.js` biography renderer. This is a **repository-source first pass**, not a completed rendered-site, mobile-device, or comprehensive historical transaction verification. The audit remains open until browser QA and final evidence parity are run.

**Priority:** championships, verified regular-season WLT, championship years, peak seasons, major rivals and defining historical moments lead the profile. Start/sit, waiver ROI and transaction scoring should be secondary drilldowns. Preserve separate provenance for historical championships, trades, roster and award assertions. Do not infer championship or playoff finishes from regular-season WLT.

## Individual verified career headlines (through Week 8 of 2026)

| Profile route | Display name | Regular season W–L–T | Games | Documented titles | Audit focus |
| --- | --- | ---: | ---: | ---: | --- |
| `managers/tom/` | Thommy (route alias Tom) | 67–75–1 | 143 | 4 (2016, 2017, 2018, 2024) | Four titles and 2016–18 three-peat must lead; reconcile Tom/Thommy everywhere; story includes stale 142 games |
| `managers/mitch/` | Mitch | 71–46 | 117 | 0 | Best long-run current-manager win rate; 2025 13–1, 2026 8–0; no claim of a title |
| `managers/stover/` | Stover | 75–68 | 143 | 1 (2022) | Preserve original YogurtSlingers and later Gurt identity; page has distinct intro/navigation structure, needs cross-profile parity |
| `managers/birch/` | Birch | 72–56 | 128 | 1 (2019) | 2018 runner-up, 2019 and 2021 11–2 years; story contains stale 127 games |
| `managers/tony/` | Tony | 72–57 | 129 | 1 (2021) | 2021 10–3 championship, 2023 10–4 follow-up; verify claims about trade assets against direct trade ledger |
| `managers/stew/` | Stew | 67–76 | 143 | 0 | 2022 11–3 peak; 2021 and 2023 3–11 lows; story includes stale 142 games |
| `managers/stilly/` | Stilly | 66–77 | 143 | 1 (2023) | 2023 8–6 title, 2024 runner-up; story includes stale 142 games |
| `managers/kuhl/` | Kuhl | 51–67 | 118 | 0 | 2020 9–5, 2022 8–6; 2026 0–8; avoid claiming unverified acquisition methods |
| `managers/jmid/` | JMid | 25–25 | 50 | 0 | 2023 9–5 debut, 2024 8–6 with league-high 1,730.22 PF; keep transaction claims qualified |
| `managers/scott/` | Scott | 17–19 | 36 | 1 (2025) | 2024 5–9, 2025 8–6 championship; shortest recorded current tenure, do not invent earlier seasons |

## Shared findings and corrective plan

1. **Confirmed static-text drift:** Some top-of-page story paragraphs have game totals copied from Week 7 (142 for Stilly, Stew, Tom; 127 for Birch). The live canonical record bindings show current WLT/games, but the adjacent static numbers can disagree. Remove hard-coded game counts from prose, or bind them to the same canonical loader with a test.
2. **Profile lead hierarchy:** Championships, regular-season WLT, career win percentage, best year, and postseason history should precede ratings, start/sit, trade or waiver specialties. Provide a compact clear navigation row to deeper material.
3. **Redundant prose surfaces:** `#franchise-story` and the legacy résumé's “biography” panel can retell the same story. Convert top intro into a genuinely short career summary and keep long-form biography in one authoritative section.
4. **Biography quality:** Replaced all ten `data/manager_biographies_awards.json` manager biographies with individual career narratives grounded in ledger seasons and separately documented title years; changed shared renderer heading from “AI-Written Biography” to “Career Biography.” The new copy is committed, but browser rendering and final copyediting still require confirmation.
5. **Identity:** Primary route `managers/tom/` represents **Thommy**, not the other historical Tom; current header may say “Tom” while other page elements say “Thommy.” Choose visible nickname Thommy consistently while maintaining old URLs.
6. **Stover exception:** Stover's top section, CTA structure and page length differ from the shared nine-profile template. Review content parity and harmonize design without discarding uniquely verified historical material.
7. **Unverified interpretation:** Editorial labels such as “The Math Problem,” “The Converter,” and “The Quiet Poker Player” are interpretations, not documented self-descriptions. Do not imply they are league-awarded names or intentions.
8. **Data coverage:** Do not use partial Sleeper player/trade stats as if comprehensive across ESPN 2016–19. Keep 2026 labeled through Week 8, not a finished season.
9. **Navigation/visibility:** Source review confirms many scripts and deep-dive links on each page. Run actual touch/mobile and desktop browser tests to verify headings, spacing, tabs, overflow, anchors, rendering and links before approval.
10. **Validation:** Add a regression that verifies each displayed profile's year, canonical record, games, titles, identity, and the two canonical prose surfaces. Re-run canonical CI, Chromium, WebKit, and Pages deployment on latest head before release approval.

## Editorial focus for each manager
- **Thommy:** A four-title dynasty, interrupted, then reborn six years after title three.
- **Mitch:** Quantifiable regular-season dominance contrasted with the missing title.
- **Stover:** Founding franchise continuity under changing names, most current-manager wins and a championship.
- **Birch:** Early title-game arrival and extraordinary 2019–21 peak.
- **Tony:** A durable winning record and the 2021 championship response to 2020.
- **Stew:** High-volatility franchise; the brilliant 2022 roster remains untitled.
- **Stilly:** A founding manager's long path to 2023 breakthrough and 2024 return.
- **Kuhl:** Productive seasons and useful assets without sustained conversions or title.
- **JMid:** A fast early rise followed by volatility; 2024 scoring lead vs 8–6 standings.
- **Scott:** Newcomer-to-champion jump from 2024 to 2025 and short total career sample.

## Next unresolved release gates
- Replace static Week 7 prose with Week 8 canonical source in primary page intros.
- Harmonize Stover layout and Tom/Thommy name.
- Remove duplication between the short story and full biography.
- Prove image/typography/navigation quality in actual Chromium + WebKit at mobile and desktop widths.
- Verify current GitHub Actions and GitHub Pages outcomes; no green status is claimed in this audit.
