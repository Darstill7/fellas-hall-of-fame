// Historical provider candidate policy gate. Data availability, provenance,
// real-time availability and redistributable rights are independent questions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('data/trade_projection_source_candidates_2020_2025_v1.json','utf8'));
assert.equal(d.schema,'fellas-historical-projection-source-candidates-v1');
assert.equal(d.status,'research_only_no_historical_trade_model_promotions');
assert.ok(Array.isArray(d.candidates)&&d.candidates.length>=2);
assert.equal(new Set(d.candidates.map(x=>x.id)).size,d.candidates.length);
assert.equal(d.decisions.prelockReplacementCertified,false);
assert.equal(d.decisions.autoImportApproved,false);
assert.equal(d.decisions.publishProviderRowsApproved,false);
const ids=new Set(d.candidates.map(c=>c.id));
assert.ok(ids.has('hvpkod-nfl-data')&&ids.has('ffa-historical-weekly'));
const hv=d.candidates.find(c=>c.id==='hvpkod-nfl-data');
assert.ok(hv.coverageClaim.includes('2020 directory only has season files'),'Do not claim source has 2020 weekly prelock projections');
assert.equal(hv.sampleEvidence.sourceChangeCommitTimeUTC,'2024-11-13T00:35:25Z');
assert.ok(hv.sampleEvidence.columnNames.includes('TotalPoints')&&hv.sampleEvidence.columnNames.includes('ProjectionDiff'),'Sample forecast file carries postgame outcome fields; leakage guard required');
assert.equal(hv.promotionAllowed,false);

for(const row of d.candidates){
 assert.ok(/^https:\/\//.test(row.url));
 assert.equal(row.promotionAllowed,false,'No projection candidate cleared pregame/model/legal approval');
 assert.ok(/not_certified|not_primary_evidence/.test(row.provenanceStatus));
 for(const prop of ['coverageClaim','criticalBlocker','licenseStatus','potential'])assert.ok(typeof row[prop]==='string'&&row[prop].length>25,'Source candidate needs explicit uncertainty '+row.id+' '+prop);
}
assert.ok(d.minimumQualification.some(x=>x.includes('timestamp')));
assert.ok(d.minimumQualification.some(x=>x.includes('rights')));
assert.ok(d.minimumQualification.some(x=>x.includes('Sleeper')));
assert.ok(d.rejectedForHistoricalPrelock.some(x=>x.id==='fellas-week10-editorial'));
assert.ok(d.rejectedForHistoricalPrelock.some(x=>x.id==='fellas-war-2025-starter'));
const output=[
 '# Historical prelock projection candidates: readiness NOT certification',
 '',
 '| Candidate | Historical week coverage claim | Source status | Release position |',
 '|---|---|---|---|',
 ...d.candidates.map(x=>'| ['+x.name+']('+x.url+') | '+x.coverageClaim+' | '+x.provenanceStatus+' | research only; no import, grade or public provider rows |'),
 '',
 '- Historical weekly projections do not establish pre-kickoff availability without issuance/collection timestamps and immutable source versions.',
 '- Licensing and derived/published output permissions require independent approval.',
 '- The 2026 Weekly Shitter projection receipt is not retrospective 2020–2025 decision-time trade evidence.',
 '- Existing 13/19 experimental PAR, 18/24 raw starter points and 246/238 retrospective bench feasibility remain unchanged.',
 '- No automatic import is authorized and no source-based PAR/WAR grade may be calculated from candidate records alone.'
].join('\n');
console.log(output);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,output+'\n');
