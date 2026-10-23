# Keeping The Fellas OS Live

## Weekly refresh cadence
The best cadence is Tuesday morning after the fantasy week is final.

Update these items each week:
1. Standings / PF / PA / FAAB
2. All-play record and expected wins
3. Weekly matchup archive
4. Active winning/losing streaks
5. Rivalry matrix
6. New trades and FAAB claims
7. Record chases / new all-time records
8. Manager roster snapshots
9. Awards and Hall-of-Pain entries
10. Manager-page current-season blocks

## Source priority
1. Sleeper structured data
2. Explicit manager corrections
3. Fellas Master Record Book
4. External fantasy/stat references for player production
5. Estimates only when clearly labeled

## Recommended deployment
Host the folder as a static site on GitHub Pages, Cloudflare Pages, Netlify, or Vercel. No server is required for the current build.

The root file to publish is `index.html`.

## Long-term automation architecture
- `data/league.json` is the canonical site snapshot.
- A refresh job should fetch current Sleeper standings, matchups, rosters, transactions and draft data.
- Recalculate all-play and schedule fortune.
- Regenerate the HTML pages.
- Publish the new static build.

The site intentionally keeps historical exhibits static and provenance-labeled so live refreshes cannot silently rewrite league history.
