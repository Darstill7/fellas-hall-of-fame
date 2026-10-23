# Fellas OS v9.2 — Integrated Trade Museum

Base: Fellas OS v9.1 Stage 13 desktop review (original source ZIP included in delivery). Stage 66 trade museum embedded as `analytics/trade-museum.html` with 51 trade events / 101 historical manager-side records, seasons 2020–2026. Linked from the homepage, main nav, and existing Trade Engine. All other pages retained.

## Open locally
Open `index.html` from the unzipped folder. Click **Trade Museum**. The museum uses an embedded immutable JSON snapshot, so it works offline without a web server or API. For site deployment, upload the complete folder to any static host, keeping its directory structure intact.

## Controls & limitations
Search by manager, player, event ID; filter season; sort dates, raw starter points, or gap; select trades to view per-side acquired assets and starting points. The prior analytics/trades.html page is kept unchanged apart from a contextual link. The new snapshot is not a certified position-adjusted ranking and the 2026 season is incomplete. Other parts of the pre-existing v9.1 site retain their audit limitations and may show different scoping/aggregation.

## New artifacts
- `analytics/trade-museum.html` — self-contained exhibition page
- `data/trade_museum_stage66.json` and `.csv` — reusable museum model
- `data/trade_source_manifest_101.csv` — original verified-side manifest

No provider data or 2026 live refresh is claimed beyond archived snapshot. Hosting is not automatically updated by this ZIP.
