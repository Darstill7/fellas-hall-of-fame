# The Fellas — Page Orientation and Chapter Hierarchy Review
**Research/design checkpoint:** November 16, 2026  
**Branch:** `research/trade-benefit-ledger-2026-11-16` · **Draft PR #234**, not deployed

## User-observed problem

The website's editorial and interactive sections run together on long pages. Readers cannot immediately tell whether they are reading manager biography, rivalries, records, current-season transactions or detailed historical source material. The problem is the **visual and navigational hierarchy**, not a lack of text.

## Changes implemented

### All ten current manager franchise profiles
- Introduced **five large numbered chapter dividers** on each page: **01 The Franchise Story; 02 Rivalries & Head-to-Head; 03 Seasons, Records & Legacy; 04 Franchise Legends & Game Logs; 05 Drafts, Trades & Deep Research**.
- Introduced shared CSS at `assets/franchise-chapter-system.css`: Georgia display typography, gold chapter numbers, alternating surfaces and stronger margins; compact horizontally scrollable chapter links.
- Added `assets/franchise-chapter-system.js` to all ten profiles to mark the actively viewed section in chapter navigation with an orientation label. It only reads element bounds and updates `aria-current` / visible text; no scoring data.
- **Preserved exactly two original hero actions**, franchise anchor IDs, data widgets, links, script order and original section content.

### Trading Portfolios
- Reorganized source page into **five waypoints**: 01 choose manager, 02 the trading story, 03 current year, 04 historical transaction log, 05 manager comparison.
- Moved the comparison tool **after** the manager content so users encounter the manager chooser first. Added a jump-strip to go directly to each area.
- No change to underlying 48 historical events, 2026 overlay, manager names or story calculations.

### Trade Explorer
- Added a **three-step reading guide**: 01 find a trade, 02 inspect the verified receipt, 03 understand the aftermath.
- Introduced chapter numbering, separated inspector/aftermath layout, explicit descriptive microcopy, and mobile responsive visual landmarks.
- Preserved trade receiving-side evidence, player path, FAAB caveats, keeper rights, playoff outcome panels and transaction-ID deep links.

### League Record Book
- Added four distinct visual chapters: 01 featured records, 02 find your records, 03 explore league history, 04 reference archive.
- Added a horizontal chapter-jump strip and editorial divider styling at `assets/records-reading-chapters.css`.
- **No statistical records, rankings or source calculations changed.**

## QA and release guardrails

- **11/11 readback assertions passed** for ten manager profiles with five sections each, valid CSS+JS, preserved two hero actions, balanced section tags, correct portfolio and explorer chapter organization, four Record Book chapters, three JavaScript syntax checks and browser test references.
- Browser regression assertions updated to enforce the new chapter hierarchy on all manager profiles, Trade Explorer, Trading Portfolios and Record Book.
- A missing shared script was discovered during readback and restored; its existence and JavaScript parse were verified.
- A green source readback **does not mean screenshots visually passed**. Latest browser/canonical CI and independent mobile/desktop image inspection remain release gates. Keep draft PR #234 unmerged until these are verified.

## Next release/experience improvements

1. Inspect 390px mobile and 1280px desktop screenshots for chapter dividers, compact navigation overflow, visual rhythm, and data cards.
2. In a separate change, consider moving particularly dense archival modules behind purposeful detail panels **only after preserving accessibility and existing tests**. Do not hide or delete source research without verifying navigation alternatives.
3. Audit legacy detail pages (not only the premium current franchise pages) for the same orientation problems.
4. Keep each chapter's presentation distinct: narratives, scoreboards, records and deep research should not all use the same visual treatment.
