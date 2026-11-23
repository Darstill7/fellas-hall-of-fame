// Shared freshness metadata for the coordinated candidate; never claim a research release is published.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root='data-integrity/historical-trade-draft-audits/';
const raw=fs.readFileSync(root+'unified-weekly-release-manifest.json');
const m=JSON.parse(raw);
assert.equal(m.status,'RESEARCH_ONLY_NOT_DEPLOYABLE');
assert.equal(m.files.length,17);
const {year,week}=m.completedThrough;
const metadata={schema:'fellas-release-freshness-v1',status:'REHEARSAL_ONLY',completedThrough:{year,week},releaseFingerprint:createHash('sha256').update(raw).digest('hex'),schedule:{timezone:'America/Indiana/Indianapolis',weekday:'Tuesday',localTime:'07:00',enabledInProduction:false},departments:m.files.map(f=>({path:f.target,completedThrough:{year,week},sha256:f.sha256})),coverage:m.coverage,productionPublishedAt:null,blockers:m.blockers};
fs.writeFileSync(root+'weekly-release-freshness-preview.json',JSON.stringify(metadata,null,2)+'\n');
console.log('WEEKLY RELEASE FRESHNESS PASS '+JSON.stringify({completedThrough:metadata.completedThrough,datasets:metadata.departments.length,production:false}));
