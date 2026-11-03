// Enforce parity between tracked public keeper research and generated canonical evidence.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const site=read('data/keeper_2025_website_research_v1.json');
const research=read('data-integrity/keeper-2025-decision-research-index-v1.json');
const composite=read('data-integrity/keeper-2025-composite-evidence-v1.json');
const bracket=read('data-integrity/keeper-2025-championship-bracket-contribution-v1.json');
const draft=read('data/v9_draft_engine.json').filter(x=>x.year===2025&&x.keeper);
const close=(a,b,scope,tol=.011)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol,scope+': '+a+' vs '+b);
assert.equal(site.schema,'fellas-2025-keeper-website-research-v1');
assert.equal(site.status,'research_only_no_public_ovr_changes');
assert.equal(site.rows.length,10);
assert.deepEqual([...new Set(site.rows.map(x=>x.manager))].sort(),[...new Set(research.rows.map(x=>x.manager))].sort());
for(const m of site.rows){
 const r=research.rows.find(x=>x.manager===m.manager);
 const c=composite.managers.find(x=>x.manager===m.manager);
 const b=bracket.rows.find(x=>x.manager===m.manager);
 assert.ok(r&&c&&b,'Missing canonical manager '+m.manager);
 assert.equal(m.officialKeeperDecisionGrade,null);
 assert.equal(r.certifiedKeeperDecisionScore,null);
 assert.equal(r.publicReportCardKeeperGrade,null);
 assert.equal(m.keepers.length,2);
 assert.equal(m.verifiedDrops.length,r.verifiedDropCount);
 close(m.researchScore,r.observedResearchIndex,m.manager+' research score');
 close(m.components.observedProduction,r.observedProductionComponent,m.manager+' production component');
 close(m.components.nominalDraftCapital,r.nominalKeeperCapitalComponent,m.manager+' draft component');
 close(m.components.championshipContribution,r.observedPostseasonContributionComponent,m.manager+' championship component');
 close(m.regularVsStarterMedian,c.descriptiveDifferenceFromLeagueStarterMedians,m.manager+' weekly median');
 close(m.regularStartedPoints,c.verifiedRegularStarterPoints,m.manager+' regular');
 close(m.championshipStarterPoints,b.verifiedChampionshipBracketKeeperStartedPoints,m.manager+' championship points');
 close(m.otherWeek15to17StartedPoints,b.otherWeek15To17KeeperStartedPoints,m.manager+' placement points');
 assert.equal(m.playoffQualified,b.qualifiedFor2025ChampionshipBracket);
 for(const k of m.keepers){
  const p=draft.filter(x=>(x.manager==='Tom'?'Thommy':x.manager)===m.manager&&x.player===k.name);
  assert.equal(p.length,1,'Draft identity missing '+m.manager+'/'+k.name);
  assert.equal(k.round,p[0].round);
  assert.equal(k.position,p[0].position);
 }
}
const html=fs.readFileSync('analytics/keeper-decision-research.html','utf8');
const js=fs.readFileSync('assets/keeper-decision-research-page.mjs','utf8');
assert.ok(html.includes('../assets/keeper-decision-research-page.mjs'));
assert.ok(js.includes('keeper_2025_website_research_v1.json'));
assert.ok(html.includes('not an official grade'));
assert.ok(fs.readFileSync('analytics/manager-report-cards.html','utf8').includes('keeper-decision-research.html'));
assert.ok(fs.readFileSync('managers/index.html','utf8').includes('keeper-decision-research.html'));
console.log('Keeper research website PASS: 10 canonical scores, 20 retained player identities, bracket-only playoff contributions, no official grade');
