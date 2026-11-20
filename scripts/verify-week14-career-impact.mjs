// Read-only impact guard for retiring misclassified 2020–2021 Week 14 playoff games.
// The official manager career and H2H files remain unchanged until a coordinated migration.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const impact=json('data/week14_2020_2021_career_record_impact_v1.json');
const original=json('data/manager_record_books_2016_2026.json').managers;
const weekly=json('data/season_weekly_matchups_2016_2026_v1.json').bySeason;
const round=n=>Number(n.toFixed(2));
// The stage-correction preview was certified while 2026 was through Week 9.
// Week 10 changes career W/L and rivalry counts, but must never silently
// rewrite the frozen 2020–21 reclassification research underneath this guard.
const preview2026Cutoff=9;
const newer2026=(weekly[2026]?.games||[]).filter(g=>g.stage==='regular'&&g.week>preview2026Cutoff);
const ownNewer=manager=>newer2026.flatMap(g=>g.home===manager?[[g.away,g.homeScore,g.awayScore]]:g.away===manager?[[g.home,g.awayScore,g.homeScore]]:[]);
const count=x=>({games:x.length,w:x.filter(t=>t[1]>t[2]).length,l:x.filter(t=>t[1]<t[2]).length,t:x.filter(t=>t[1]===t[2]).length});
const add=(a,b)=>({games:a.games+b.games,w:a.w+b.w,l:a.l+b.l,t:a.t+b.t});

assert.equal(impact.schema,'fellas-2020-2021-stage-correction-career-impact-v1');
assert.equal(impact.status,'deterministic_downstream_impact_preview_not_applied');
const source=[2020,2021].flatMap(year=>weekly[year].games.filter(g=>g.week===14&&g.stage==='regular').map(g=>({...g,year})));
assert.equal(source.length,8);
assert.equal(impact.managerCareers.length,original.length);
assert.deepEqual(impact.summary,{gamesToReclassify:8,allManagerCases:14,impactedManagers:9,totalRemovedManagerGameCredits:16,totalRemovedWinCredits:8,totalRemovedLossCredits:8,regularSeasonWinsRemovedFromArchive:8,uniqueAffectedHeadToHeadPairs:6});
for(const manager of original){
 const projected=impact.managerCareers.find(x=>x.manager===manager.manager);
 assert(projected,'Missing historical manager projection '+manager.manager);
 // The archived impact baseline must reconcile to the current official
 // career record only after accounting for post-preview finalized games.
 const newer=ownNewer(manager.manager);
 assert.deepEqual(manager.regular,add(projected.archivedRegular,count(newer)),manager.manager+' frozen preview plus new regular-season results');

 const removed=source.flatMap(g=>g.home===manager.manager?[[g.away,g.homeScore,g.awayScore,g.year]]:g.away===manager.manager?[[g.home,g.awayScore,g.homeScore,g.year]]:[]);
 const delta={games:removed.length,w:removed.filter(x=>x[1]>x[2]).length,l:removed.filter(x=>x[1]<x[2]).length,t:removed.filter(x=>x[1]===x[2]).length,pf:round(removed.reduce((n,x)=>n+x[1],0)),pa:round(removed.reduce((n,x)=>n+x[2],0))};
 assert.deepEqual(projected.removedStats,delta,manager.manager+' removed fantasy game receipts');
 assert.deepEqual(projected.projectedRegular,{games:projected.archivedRegular.games-delta.games,w:projected.archivedRegular.w-delta.w,l:projected.archivedRegular.l-delta.l,t:projected.archivedRegular.t-delta.t},manager.manager+' archived Week 9 stage-correction preview totals');
 for(const projectedH2H of projected.headToHeadAffected){
  const existing=manager.headToHead.find(x=>x.opponent===projectedH2H.opponent);
  assert(existing,'Missing original H2H '+manager.manager+' vs '+projectedH2H.opponent);
  const more=count(newer.filter(x=>x[0]===projectedH2H.opponent));
  assert.deepEqual({games:existing.games,w:existing.w,l:existing.l,t:existing.t},
   add(projectedH2H.archived,more),manager.manager+' vs '+projectedH2H.opponent+' frozen preview plus new results');
  const pair=removed.filter(x=>x[0]===projectedH2H.opponent);
  assert.equal(projectedH2H.projected.games,projectedH2H.archived.games-pair.length);
  assert.equal(projectedH2H.projected.w,projectedH2H.archived.w-pair.filter(x=>x[1]>x[2]).length);
  assert.equal(projectedH2H.projected.l,projectedH2H.archived.l-pair.filter(x=>x[1]<x[2]).length);
 }
}
assert(impact.migrationDependencies.some(x=>x.includes('career_core_generated.json')));
assert(impact.migrationDependencies.some(x=>x.includes('league.json')));
console.log('PASS 2020–2021 career migration preview: 8 game reclassifications, 9 affected historical managers, 16 manager-game credits, all career/H2H proposals derived exactly from source.');
