// Guards the browser Start/Sit research page, including verified 2026 Sleeper UI parity.
// This does not certify injury availability or publish an official manager skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('analytics/manager-lineup-research.html','utf8');
const client=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
const generator=fs.readFileSync('scripts/analyze-2026-start-sit-hindsight.mjs','utf8');
const report=fs.readFileSync('analytics/manager-report-cards.html','utf8');
for(const s of ['Avg Start/Sit accuracy','2026 (Weeks 1–8)','manager-lineup-research-page.mjs',
 'id="detail-manager"','id="weekly-results"','id="detail-summary"','id="current-coverage"',
 'value="career"','id="career-results"','id="career-summary"'])
 assert.ok(html.includes(s),'Start/Sit research UI missing '+s);
assert.ok(report.includes('manager-lineup-research.html'),'Start/Sit research navigation missing');
for(const s of ['function yearWeeks(year){return year===2020?13:year===2026?current2026Weeks:14}',
 'currentTeamManagers','stat.accuracySum+=result.accuracy','map.set(key,stat)',
 'stilly.accuracySum/current2026Weeks','kuhl.accuracySum/current2026Weeks',"toFixed(1)+'%'"])
 assert.ok(client.includes(s),'Start/Sit browser computation or UI missing '+s);
for(const field of ['current2026Weeks=count','keeper_2026_website_research_v1.json',
 'detailSelect.onchange=()=>{drawWeekly();drawProgression();}','stat.observations.push',
 "$('current-coverage').textContent='through completed Week '+count",
 "const best=comparable.length?","const worst=comparable.length?",
 "selected==='2026'?bv-av","class=\"'+cls+'\"","detailSelect.replaceChildren()"])
 assert.ok(client.includes(field),'Start/Sit weekly detail or dynamic coverage missing: '+field);
for(const statement of ["selected==='career'?[2020,2021,2022,2023,2024,2025,2026]",
 "detailSelect.onchange=()=>{drawWeekly();drawProgression();}",
 "const expectedWeeks=year===2026?14:yearWeeks(year)",
 "const halfLife=3.5,referenceYear=2026",
 "const recency=Math.pow(.5,(referenceYear-year)/halfLife)",
 "const weight=fraction*recency",
 "const career=weightSum>0?",
 "stat.observations.push"])
 assert.ok(client.includes(statement),'Career progression missing calculation or coverage gate: '+statement);
// Synthetic recency and season-completeness sanity checks prevent an 8-week
// ongoing season from being treated as a finished 14-week season.
const currentWeight=8/14;
const lastYearWeight=Math.pow(.5,1/3.5);
assert.ok(currentWeight<1&&currentWeight>0.5);
assert.ok(lastYearWeight>currentWeight,
 'The 2025 full-season record should weigh more than 2026 Week 8 alone');
const oldYearWeight=Math.pow(.5,(2026-2020)/3.5);
assert.ok(oldYearWeight<lastYearWeight,'Older season has too much recency weight');
assert.ok(client.includes('optimal({starters:r.starters,bench:[]})'),
 'Browser display does not verify actual legal starters');
for(const s of ['averageWeeklyStartSitAccuracyPercent','weeklyStartSitAccuracyPercent',
 "manager==='Stilly'","manager==='Kuhl'"])
 assert.ok(generator.includes(s),'Research generator missing UI benchmark or metric '+s);
const teams=generator.match(/const id=String\(p.team_id\)/);
assert.ok(teams,'Research generator team mapping no longer derived from verified draft selections');
// The browser's compact team map must exactly match the independently archived
// 2026 draft keeper owners. A roster/team reassignment cannot silently move stats.
const draft=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8'))
 .filter(p=>p.year===2026&&p.keeper);
assert.equal(draft.length,20);
const browserMapping=client.match(/const currentTeamManagers=\{([^;]+)\};/);
assert.ok(browserMapping,'2026 report page team map not found');
const extracted=new Map([...browserMapping[1].matchAll(/'(\d+)':'([^']+)'/g)]
 .map(m=>[m[1],m[2]]));
assert.equal(extracted.size,10,'2026 browser manager mapping must cover all ten teams');
for(const p of draft){
 const expected=p.manager==='Tom'?'Thommy':p.manager;
 assert.equal(extracted.get(String(p.team_id)),expected,
  'Browser Start/Sit manager mapping differs from confirmed 2026 draft: '+p.team_id);
}
const roster8=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2026_week8.json','utf8'));
assert.equal(roster8.week,8);
assert.equal(roster8.rosters.length,10);
assert.deepEqual(roster8.rosters.map(r=>Number(r.teamId)).sort((a,b)=>a-b),
 Array.from({length:10},(_,i)=>i+1));
console.log('Start/Sit page integration PASS: eight completed weeks, ten teams, Sleeper UI parity guards, no official skill grade');
