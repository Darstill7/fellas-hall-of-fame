# Homepage 4.0 — Product and release specification

Status: design baseline; not production-ready. Parent checkpoint 2d299552 (Record Book 3.0; eight combined PR workflows passed) and manager portfolio d75ec097 (twenty workflows passed). Historical candidate promotion remains separate from design.

## Product promise
The Fellas homepage should be a mobile-first fantasy league app, not a research directory. The first screen answers: how is my franchise doing, what just happened, and what matters next? One tap leads to a dedicated destination; deeper history stays accessible without dominating the overview.

## Existing architecture audit
- index.html and home-app-v3.mjs already provide source-reconciled standings, latest scores, optional playoff model, local manager preference, median simulation, roster and editorial archive links. Reuse these rather than duplicate calculation logic.
- The production shell already defines Home, My Team, League, Records, More. Keep these five destinations consistent on opt-in secondary pages. Do not replace My Team with a redundant Managers or News tab.
- Current Home hides detailed personal sections, but still renders the long league dashboard below editorial. The hash-based League and More views do not fully separate the top personal and news areas; design explicit destination surfaces without breaking bookmarks or back/forward.
- Existing My Team entry repeats identity and has a single dashboard CTA. Add purpose-specific entry points inside a clear personal card while preserving accessible manager selection.
- The published editorial boundary is the archive index, not filesystem presence. Never promote drafts or unverified issues.
- Certified record watch must remain hidden when no valid items exist. Surface only relevant certified items when present.
- Avoid claiming the Week 9 expanded records archive is current through Week 11; distinguish historical evidence scope from current-season cutoff.
- Current playoff model must match validated standings; unavailable or stale data should not imply eliminated, clinched, or zero odds.

## Information hierarchy
Home:
1. Compact brand and archive search; verified cutoff, not a fake live badge.
2. Franchise card: selected manager, rank, W-L-T, streak, most recent final score, direct My Team / My Records / Playoff scenarios.
3. One next-action card (upcoming fixture and/or playoff command center); fixture and model only when synchronized and qualified.
4. Editorial: the two published series, with archive fallback; mobile two columns only if long titles remain legible.
5. Around the league: compact leaders and latest results preview; full League view one tap away. Certified high-priority record events may surface before general research.
6. No long research directory on Home.

My Team: next fixture, verified season numbers, form trend, probability context, recent activity, historical profile and record links, roster as optional disclosure. Do not duplicate Sleeper roster management.
League: standings, playoff command center, latest results, remaining schedule/SOS (only source-supported), league intelligence, hypothetical median standings distinctly labeled.
Records: direct entry into Record Book 3.0 with selected manager passed safely; archives and shared ownership remain qualified.
More: categorized editorial, manager directory, trade/keeper tools, Hall of Fame and research. Search accessible from every homepage view.

## Visual language
Deep navy canvas, cool raised surfaces, restrained warm gold, green/red only with explicit W/L labels, neutral text contrast. Use tabular numerals, one large numeric focal point per card, score comparisons with accessible text alternatives, clear hierarchy of 11–13px metadata, 14–16px body, 20–32px focal values. Use native controls with custom styling and visible focus. Large tap targets (44px minimum), safe-area padding, no horizontal scrolling, no decorative chart without underlying evidence. Minimize gradients, badge proliferation, repeated icons and visual noise. Use one consistent bottom nav on phone, desktop rail/shell as existing, preserving active section and history navigation.

## Implementation sequence
1. Add scoped Homepage 4.0 styles and view state without modifying archive data or other production routes.
2. Refactor personal card using buildHomeDashboard/buildPersonalDashboard and verified latest game, preserve old consumers and fail-closed behavior.
3. Build explicit league/more views, direct route navigation, back/forward and fragment compatibility; ensure news bookmarks remain functional.
4. Add meaningful compact form visualization only from validated weekly scores, with accessible text and no projections represented as results.
5. Add verified upcoming matchup and playoff CTA, show archived vs current scope clearly, keep record watch conditional.
6. Streamline editorial and secondary research; defer costly roster or advanced content until requested where safe.
7. Verify all ten manager selections, no preference, stored preference, unavailable data, stale fixture/model, tied result, final regular week, editorial failure, certified watch empty/nonempty, browser navigation and deep links.
8. Independent visual inspection of screenshots at 320/390/430/768/1280, Chromium and WebKit. Check no clipping, no overlays, no hidden focusable content, meaningful first viewport at 390px, keyboard behavior, reduced motion, contrast and safe areas.
9. Run existing canonical, homepage preview/performance, app shell/navigation, certified watch, manager and Record Book regressions plus new homepage suite. Compare exact-head CI, not previous commits. Require approval before merge/deployment; do not promote unresolved historical candidates.

## Acceptance criteria
- A selected manager sees identity, current verified record, last result and useful actions without searching.
- Three primary personal actions can be reached in one tap; League and More have distinct purposeful layouts.
- Every existing research destination remains reachable; no duplicate competing primary navigation.
- All ten managers render accurately; no missing information presented as zero.
- No uncertified alert, editorial draft, stale model or falsely labeled current archive appears.
- Existing green checkpoints are preserved. Subjective visual review is separate from automated tests. No claim of 11/10 quality until rendered screens and functional journeys are inspected.
