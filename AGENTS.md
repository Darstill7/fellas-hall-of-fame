# Working on The Fellas

## Product and audience

The Fellas is a mobile-first fantasy football archive and league publication.
Aim for ESPN's accessibility, Sports Reference's statistical depth, and The
Athletic's storytelling, with the league's own voice. Around 90% of league use
is mobile. Prioritize fast answers, plain navigation labels, readable numbers,
and direct links from a statistic to its evidence. The site complements
Sleeper. The Weekly Shitter is a roast with fact-checked statistics.

## Start and finish each task

- Read [PROJECT_STATUS.md](PROJECT_STATUS.md) and [ROADMAP.md](ROADMAP.md).
  Confirm the actual checkout, remote PR head, and relevant GitHub Actions
  conclusions. GitHub is the shared record for ChatGPT and Codex.
- Continue Version 5.7 from `development/v5-2-record-unification` and
  [PR #318](https://github.com/Darstill7/fellas-hall-of-fame/pull/318).
  Preserve existing work and use focused commits. Do not merge to `main` or
  deploy to production without the owner's explicit approval.
- Keep [PROJECT_STATUS.md](PROJECT_STATUS.md) and [ROADMAP.md](ROADMAP.md)
  current in the same PR whenever significant work is completed, validation
  changes, or release readiness changes. Record the tested revision, actual
  results, source cutoff, and any remaining blocker. Distinguish local runs,
  PR CI, merged source, and independently verified public Pages.
- Use the existing repository scripts and GitHub Actions. The site is static
  HTML, CSS, and JavaScript. CI uses Node 22 and Playwright Chromium/WebKit.
  Serve from the parent of the checkout to exercise the
  `/fellas-hall-of-fame/` path. Run the relevant source and runtime tests and
  check mobile widths. Run the complete release gates before seeking merge
  approval. Diagnose failures without disabling checks or assertions.

## League and identity

- The current format is ten teams, half-PPR, two FLEX positions, two keepers,
  $100 FAAB, and six playoff teams. The 2016 league had eight teams. Use
  verified season-specific rules and playoff formats for historical claims.
- Current managers are Stilly, Stew, Thommy, Stover, Birch, Tony, Mitch, Kuhl,
  JMid, and Scott. Tom is Thommy. Gurt is Stover. Evans managed the relevant
  team in 2023. JMid joined in 2024. Provider handles and roster slots cannot
  override verified historical ownership.
- ESPN covers 2016–2019. Sleeper covers 2020 onward. The 2026 Sleeper league ID
  is `1340027406009761792`. Shitter of the Year refers to the modern losers'
  bracket result. Use historical format-specific labels for older seasons.

## Data accuracy and publication

- Recompute from source receipts and preserve recorded coverage. Use
  `data/unified_record_book_2016_2026.json` for paired regular-season games
  and verified final-placement and bracket records for postseason claims.
  Keep regular-season games, single-week postseason, and multiweek aggregate
  scores separate. Disclose raw scoring-era differences and historical gaps.
- Preserve eligibility, scoring thresholds, window, and denominator. Count a
  shared record once league-wide and credit each tied owner once. Maintain
  explicit semantic crosswalks for overlapping definitions. Manager records,
  player records, personal bests, and scoped research have different counts.
- Preserve missing and unresolved evidence. Do not infer player IDs, trade
  receiving sides, or missing results. Keeper rights follow the acquired
  player. Keep draft, FAAB and multi-team trade claims tied to their receipts.
  Raw starter points and hindsight lineup optimization are descriptive.
- Stage incoming weeks, verify identities and final scores, and require the
  commissioner-approved candidate SHA before canon promotion. Show approved
  and staged cutoffs independently. Keep weekly editorial research and
  automated release preparation within their existing approval boundaries.
  Verify Pages SHA and served assets before describing a change as live.
