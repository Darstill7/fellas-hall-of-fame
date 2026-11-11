// Reconcile 2020–2024 *legacy* draft returns to the archived manager/year
// summaries. Do not mix this benchmark with the 2025/2026 peer-median model.
// node scripts/build-draft-dna-2020-2024-legacy-audit.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const picks=read('data/v9_draft_engine.json').filter(p=>p.year>=2020&&p.year<=2024);
const archive=read('data/draft_intelligence_research_2025_2026w8_v1.json').archive2020to2024.byYear;
const n=m=>m==='Tom'?'Thommy':m==='EvansBrandon'?'Evans':m;
const round=x=>Number(x.toFixed(2));
const years=[];
for(let year=2020;year<=2024;year++){
 const raw=picks.filter(x=>x.year===year),prior=archive.find(x=>x.year===year);
 assert.equal(raw.length,150);
 assert(prior);
 const managers=[...new Set(raw.map(x=>n(x.manager)))].sort();
 assert.equal(managers.length,10);
 const rows=managers.map(manager=>{
  const mine=raw.filter(x=>n(x.manager)===manager);
  const expected=prior.managerRows.find(x=>n(x.manager)===manager);
  assert(expected,'Missing prior manager '+year+'/'+manager);
  const points=round(mine.reduce((a,x)=>a+x.reg_starter_points,0));
  const starts=mine.reduce((a,x)=>a+x.reg_starts,0);
  const legacySurplus=round(mine.reduce((a,x)=>a+x.surplus,0));
  assert.equal(points,round(expected.observedRegularStarterPoints),'Legacy points mismatch '+year+'/'+manager);
  assert.equal(starts,expected.regularStarts,'Legacy starts mismatch '+year+'/'+manager);
  assert.equal(legacySurplus,round(expected.archivedDraftSurplus),'Legacy surplus mismatch '+year+'/'+manager);
  return {manager,originalPicks:mine.length,regularStarterPoints:points,
   startedWeeks:starts,legacySurplus,
   keeperSlots:mine.filter(x=>x.keeper).length,
   byRound:[...new Set(mine.map(x=>x.round))].sort((a,b)=>a-b).map(roundNumber=>{
    const r=mine.filter(x=>x.round===roundNumber);
    return {round:roundNumber,originalSelections:r.length,
     startedPoints:round(r.reduce((a,x)=>a+x.reg_starter_points,0)),
     starts:r.reduce((a,x)=>a+x.reg_starts,0),
     legacySurplus:round(r.reduce((a,x)=>a+x.surplus,0))};
   })};
 });
 years.push({year,picks:raw.length,managers:rows,
  totalOriginalStarterPoints:round(rows.reduce((a,r)=>a+r.regularStarterPoints,0)),
  totalOriginalStarts:rows.reduce((a,r)=>a+r.startedWeeks,0)});
}
const late=picks.filter(p=>!p.keeper&&p.round>=10&&p.reg_starts>=5)
 .sort((a,b)=>b.reg_starter_points-a.reg_starter_points||a.year-b.year)
 .slice(0,25).map(x=>({year:x.year,manager:n(x.manager),round:x.round,
  player:x.player,position:x.position,originalOverall:x.overall,
  startedPoints:round(x.reg_starter_points),startedWeeks:x.reg_starts,
  legacySurplus:round(x.surplus),kind:'legacy-same-model-observed-original-manager-production'}));
const result={schema:'fellas-draft-dna-2020-2024-legacy-reconciliation-v1',
 status:'research-only-legacy-model-not-cross-era-ranked',
 sources:['data/v9_draft_engine.json','data/draft_intelligence_research_2025_2026w8_v1.json'],
 coverage:{years:5,picks:750,managerSeasons:50,legacyArchiveManagerParity:50},
 rules:['Every year uses the same archived v9 draft engine for observed original-drafter starter contribution',
 'The 2020–2024 legacy surplus is a different baseline from 2025 and 2026 round/position peer medians',
 'Starter points demonstrate realized output, not decision-time quality, and exclude post-trade non-original ownership',
 '2023 Evans is not JMid; Tom is Thommy and historic Schermerhorn remains distinct',
 'Late-round highlights rank actual original-manager starter points among nonkeepers rounds 10+ with at least five starts',
 'No claims about ESPN 2016–2019 weekly starter contribution are made'],years,lateRoundHighlights:late};
assert.equal(years.reduce((a,y)=>a+y.picks,0),750);
console.log(JSON.stringify(result,null,2));
