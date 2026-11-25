# The Fellas — Fantasy Football League Archive

Historical league records, manager franchise pages, rivalry history, record books, editorial features and trade research. The project is **mobile-first**, with data accuracy and cited historical provenance prioritized over automatic publishing.

- Repository: https://github.com/Darstill7/fellas-hall-of-fame
- GitHub Pages URL: https://darstill7.github.io/fellas-hall-of-fame/
- Historical workflow handoff: [October 27 reference](data-integrity/WORKFLOW_HANDOFF_2026-10-27.md) (historical reference, **not** the current release-status source)
- Release-cutover coordination: [Issue #275](https://github.com/Darstill7/fellas-hall-of-fame/issues/275)

## Project handoff

- [Project status](PROJECT_STATUS.md) records the active branch, source
  cutoffs, completed work and verified checks.
- [Roadmap](ROADMAP.md) tracks implementation and release work.
- [Development standards](AGENTS.md) cover identity rules, data verification
  and owner approval for production changes.

For ChatGPT and Codex handoffs, open the
[live project status on the active GitHub branch](https://github.com/Darstill7/fellas-hall-of-fame/blob/development/v5-2-record-unification/PROJECT_STATUS.md)
at the start of each significant task. The status identifies the current PR,
tested revisions, and next work. The November 23 snapshot is available in
Git history.

## Editorial and scoring rules

- Sleeper is authoritative for its available league data; ESPN-era archives require separate source review.
- Keeper rights follow the acquired player, while draft/FAAB and three-team trade evidence require explicit receipts.
- Never infer a trade winner solely from raw received starter points, incomplete PAR, or missing receipt sides.
- Two-week ESPN playoff aggregate results must not be mixed with one-week regular-season matchups.
- Historical manager identities and franchise histories must follow reconciled ownership, not seat artifacts.
- The original archive remains a valuable research source, but old README/preview data cutoffs are not automatically current.

**Merge/deployment rule:** do not describe a feature as published solely because a pull request is merged or a PR-head CI check is green. Verify the publicly served version independently.
