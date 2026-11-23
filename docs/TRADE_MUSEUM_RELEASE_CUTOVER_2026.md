# 2026 Trade Museum release cutover — commissioner review required

**November 23, 2026. STATUS: DRAFT; DO NOT PUBLISH OR MERGE.**

This document tracks the single coherent Trade Museum release: seven existing 2026 receipts with actual post-trade receiving-roster starter production through verified Week 10, plus six recovered 2026 transaction receipts that remain **ungraded**. Do **not** conflate archived transaction freshness with scorer freshness.

## Authoritative source / dependency chain

1. **Verified raw Sleeper receipts** — staging [PR #286](https://github.com/Darstill7/fellas-hall-of-fame/pull/286), `review/2026-trade-evidence-week11`, immutable approved-for-testing source SHA `b33f303e4a3443551915413583bf0799e1a0d664`. Raw 13 completed trades Weeks 0–11; 6 missing from archive; six unapproved certificates. Status **REVIEW_REQUIRED**. Evidence is not permission to publish.
2. **Importer/FAAB safety** — [PR #284](https://github.com/Darstill7/fellas-hall-of-fame/pull/284), strict received player ID/roster binding, exact FAAB direction/amount, fail-closed import, temporary 57-trade rehearsals. Stacked on `automation/tuesday-publication-readiness-20261120`, not directly on main.
3. **Scorer freshness** — [PR #287](https://github.com/Darstill7/fellas-hall-of-fame/pull/287), 7 previously listed 2026 trades recalculated from original player IDs, receiving-team `starters` and `starters_points` through **final Week 10**; audit evidence `data-integrity/trade-point-recalculations/2026-through-week10.json`. 44 older-year receipts unchanged. Stacked on #284.
4. **Recoveries/research** — [PR #285](https://github.com/Darstill7/fellas-hall-of-fame/pull/285), normalized source reconciliation and artifact collection. Generates **read-only review artifacts**, not automatic PRs or changed immutable source SHA.
5. **Weekly publication gate** — [PR #271](https://github.com/Darstill7/fellas-hall-of-fame/pull/271) to orchestrate human-approved Tuesday publication only after source and browser gates; do not assume stacking branches can be merged in arbitrary order.

## Required release gates

- [x] Six raw transaction IDs match original Sleeper adds/drops; Week 9 Mitch → Stew 2 FAAB was verified.
- [x] All seven existing 2026 trade side starter-point calculations reconciled through completed Week 10 with per-player receipt audit; no bench points or provisional Week 11.
- [x] Synthetic combined importer produced **57 unique receipts** in a temporary workspace: existing 44 older-year receipts preserved, seven audited current-year receipts unchanged, six recovered **ungraded** with null credited starts/points.
- [x] Exact source SHA pinned in the rehearsal. Old certificate remains `REVIEW_REQUIRED`; no public data writes.
- [x] Dedicated importer approval/FAAB tests and combined synthetic rehearsal passed.
- [ ] Focused Chromium + WebKit 390px/1280px browser check for PR #287 **on its final exact commit**.
- [ ] Broad canonical and visual gate on the **final combined release commit**; passing a prior commit is not sufficient.
- [ ] Resolve [PR #286](https://github.com/Darstill7/fellas-hall-of-fame/pull/286) bot-triggered `action_required` canonical run or revalidate from a trustworthy authorized PR context. This permission gate is not a data failure.
- [ ] Obtain explicit commissioner approval to certify/display the six recovered trade receipts, including verified player names, full FAAB components and any keeper-right implications. Prior confirmation that the exchanges match memory is valuable but **does not convert** source `REVIEW_REQUIRED` into publication authorization.
- [ ] Integrate reviewed importer code, all source receipts and revised 2026 scores in **one independently reviewable release PR based on current main**, with documented dependency resolution and no score/standings contamination.
- [ ] Recompute or verify current approved week cutoff immediately before release. If Sleeper has finalized Week 11 in the meantime, do not label Week 10 figures as current; regenerate and re-audit the scorer first.
- [ ] Confirm latest archive content: **57 unique transaction IDs**, 44 older receipts unchanged, all seven original 2026 trades retained with audited scoring, six new ungraded receipts, no speculative trade winners.
- [ ] Human review/approval of final PR, all exact-head CI green, merge into main, then verify GitHub Pages deployment and post-deploy counts/cutoff. Never claim deployed based solely on local/synthetic tests.

## What cannot be combined automatically

The synthetic rehearsal simulates commissioner approval **only inside a disposable test directory**; it never alters the real certificates or authorizes release. Source staging is **not the public `main` branch**. Since PRs #284–#287 have different bases, do not merge their respective branches into main naively: assemble only reviewed changes and commit a clean release branch, then rerun all validation against that exact branch head. Keep weekly matchup/standings updates and trade display changes independent unless both are explicitly approved.

## Future Tuesday freshness contract

Every finalized weekly scoreboard increment should refresh both (a) the verified canonical matchup cutoff and (b) 2026 Trade Museum starter-point cutoff using original receiving-player IDs and actual post-trade starts. Treat **new transaction discovery** as a third separate readiness dimension; never mistake a recent starter-point refresh for the transaction archive being current. If any required input is missing, show stale or unverified metadata and leave the previous approved public artifact unchanged.
