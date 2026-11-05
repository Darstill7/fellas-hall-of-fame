# Fellas — Drafting & Trading visual/functional audit
Date: 2026-11-05
Release approval: **NOT GRANTED**

## Scope
- Ten primary manager routes, 390px touch/mobile and 1280px desktop in Chromium; 390px WebKit through the existing browser test suite
- New career drafting and trading research panel, the six focused topic shortcuts, historical ESPN draft links, keyboard focus, touch targets and horizontal overflow
- Canonical data/evidence gates unchanged; no drafting grade introduced

## Repository review findings and fixes
1. **Unnecessary disclosure depth**: users previously had to open a manager feature, then another research receipt, then scan through six long research sections. Added a six-choice topic navigator, opening the correct disclosure and focusing its heading with one topic click once inside the résumé. Each section now has a keyboard-accessible return-to-topics action.
2. **Dense research typography**: introduced stronger h4 hierarchy, 13px/1.72 evidence copy, spacing between example rows, explicit borders and compact, high-contrast topic buttons.
3. **Mobile targets**: >=52px topic-button height; 2 columns under 700px and 1 column under 365px; focus-visible outlines and scroll margin.
4. **Functional regression**: extended the existing Chromium/WebKit route suite to exercise all six topic options with exclusive reveal-and-focus, return-to-topics keyboard focus, >=44px target height, visibility within viewport and absence of page-level horizontal overflow.
5. **Visual evidence capture**: when FELLAS_VISUAL_AUDIT=1, capture `drafting-trading-<manager>-topics.png` and `drafting-trading-<manager>-focused.png` at the tested browser width in the visual-audit artifact directory. Screenshots must be actually inspected before sign-off.
6. **Source integrity**: extended `scripts/verify-draft-production.mjs` to enforce topic links, keyboard focus semantics, minimum target styling and browser-test presence.

## Second-pass fixes and stronger release gates
7. **Single-topic focus**: selecting one of six draft topics now hides the other five sections. Closing the topic returns to the concise menu. This prevents a dense wall of analysis without deleting evidence.
8. **Complete screenshot matrix**: Chromium 390px + 1280px, WebKit 390px, 10 managers, two drafting views each = 60 expected screenshot files.
9. **Blocking capture audit**: `scripts/verify-draft-visual-captures.mjs` checks all expected PNG signatures, image dimensions, file size, and creates a machine-readable capture manifest. Successful capture is *not* equivalent to successful human visual inspection.
10. **Module syntax coverage**: canonical CI now syntax-checks every shipped `.mjs` and `.js` asset, including the drafting experience.
11. **Behavior assertions**: browser tests now exercise all six drafting topics, verify only one topic is visible, check ARIA expanded state, keyboard focus/return, and detect clipping and overlapping controls.
12. **Narrow-phone check**: both mobile engines also test 320px menu layout, minimum 44px touch controls and horizontal overflow before restoring 390px.
13. **Actions access limitation**: latest main commit exposes no status entries through the available status endpoint, and the available workflow lookup covers only PR-triggered runs. Neither result proves pass or failure; inspect the actual Actions run and artifacts to determine sign-off.

## Status evidence
- GitHub connector confirmed updated source files and SHA-backed commits on main.
- This environment could **not** clone the repository or reach the public GitHub Pages URL for a live-page visual inspection; attempts failed with unreachable host/tool page access.
- GitHub Actions green result, completed Chromium/WebKit screenshots, actual rendered font/spacing, and public Pages deployment for the new HEAD **are not verified**.
- Audit report records **code-level repairs**, **not certified visual pass**.

## Required sign-off
- [ ] Canonical workflow passes the new static and browser navigation checks
- [ ] Chromium 390px / 1280px and WebKit 390px finish successfully on new HEAD
- [ ] Inspect focused research screenshots: headings visible, buttons readable, no overlapping cards/labels, scroll and back-navigation predictable
- [ ] Confirm eight legacy ESPN deep links from manager profiles and Tom/Thommy alias
- [ ] Confirm all ten managers navigate into career résumé and back without getting trapped in a closed disclosure
- [ ] Confirm Pages deployment matches main; test on physical iOS Safari when available
- [ ] Make focused visual and keyboard corrections from real screenshots, then rerun browser suite

Do not assign a 10/10 visual rating or share the site publicly on the basis of source inspection alone.
