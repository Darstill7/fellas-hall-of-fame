// Research-only cross-check of historical owner handles, draft roster IDs and commissioner overrides.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const identity=read('data/manager_identity_map_v1.json');
const normalize=m=>m==='Evans'?'EvansBrandon':m;
const handles=new Map();
for(const x of identity.originalContinuingManagers)for(const h of x.sleeperHandles||[])handles.set(h.toLowerCase(),normalize(x.canonical));
for(const x of identity.additionalVerifiedManagers)if(x.sleeper)handles.set(x.sleeper.toLowerCase(),normalize(x.canonical));
for(const x of identity.verifiedSleeperHistoricalHandleAliases)handles.set(x.handle.toLowerCase(),normalize(x.manager));
const reports=[];
for(const year of [2020,2021,2022,2023,2024,2025]){
 const week=year===2025?2:1;
 const source='data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
 const snap=read(source),draft=read(dir+'/'+year+'-sleeper-draft-id-review.json');
 assert.equal(snap.year,year);assert.equal(snap.leagueId,draft.league_id);assert.equal(snap.rosters.length,10);
 const rows=snap.rosters.map(r=>{
 const raw=handles.get(String(r.owner).toLowerCase())??null;
 const override=identity.verifiedSleeperSeasonOwnershipOverrides.find(x=>x.year===year&&x.roster===r.teamId&&x.providerHandle.toLowerCase()===String(r.owner).toLowerCase());
 const resolved=override?normalize(override.owner):raw;
 const expected=[...new Set(draft.verified_picks.filter(p=>p.original_roster===r.teamId).map(p=>p.manager))];
 assert.equal(expected.length,1);
 return {roster:r.teamId,handle:r.owner,raw_manager:raw,resolved_manager:resolved,research_manager:expected[0],override:override||null,status:r.success&&resolved===expected[0]?'MATCH':'UNRESOLVED'};
 });
 assert.equal(new Set(rows.map(r=>r.roster)).size,10);
 reports.push({year,week,source,rows});
}
const rows=reports.flatMap(r=>r.rows),coverage={seasons:reports.length,assignments:rows.length,matches:rows.filter(r=>r.status==='MATCH').length,overrides:rows.filter(r=>r.override).length};
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',coverage,reports,limitations:['One archived roster snapshot per season; not independent evidence of every weekly owner or account transfer','2023 commissioner override preserved explicitly','No championship or canonical record changes']};
fs.writeFileSync(dir+'/manager-identity-crosscheck-research.json',JSON.stringify(output,null,2)+'\n');
console.log('MANAGER IDENTITY CROSSCHECK '+JSON.stringify(coverage));
assert.equal(coverage.matches,60);
