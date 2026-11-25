#!/usr/bin/env bash
set -euo pipefail
OWNERSHIP_BASELINE="$RUNNER_TEMP/fellas-record-ownership-before.json"
node scripts/build-weekly-record-ownership.mjs --snapshot "$OWNERSHIP_BASELINE"
node scripts/apply-reviewed-sleeper-week.mjs "$CANDIDATE"
node scripts/sync-franchise-timeline-current.mjs
node scripts/sync-weekly-manager-portfolios.mjs
node scripts/build-weekly-record-ownership.mjs --previous "$OWNERSHIP_BASELINE"
node scripts/build-weekly-record-ownership.mjs --check
node scripts/refresh-reviewed-weekly-specialties-v58.mjs
mkdir -p "$RUNNER_TEMP/fellas-freshness"
node scripts/audit-site-freshness-v58.mjs --write --inventory="$RUNNER_TEMP/fellas-freshness/inventory.json"
cp data/site-freshness-v58.json "$RUNNER_TEMP/fellas-freshness/report.json"
if [[ "${PUBLICATION_SCOPE:-matchups}" == "all_collections" ]]; then
  node scripts/audit-site-freshness-v58.mjs --check --full
fi
node scripts/build-weekly-editorial-packet.mjs
node scripts/sync-records-career-fallbacks.mjs
node scripts/verify-weekly-ledger-parity.mjs
node scripts/verify-current-week-website.mjs
node scripts/sync-weekly-manager-fallbacks.mjs
node scripts/verify-core-consumers.mjs
node scripts/verify-franchise-timeline-freshness.mjs
node scripts/verify-canonical-history.mjs
node scripts/audit-weekly-publication.mjs "--expected-week=$REVIEWED_WEEK"
echo "Reviewed Week $REVIEWED_WEEK regenerated from staged commit $STAGING_COMMIT" >> "$GITHUB_STEP_SUMMARY"
rm -f "$CANDIDATE" # don't mix staging evidence into the publication PR
