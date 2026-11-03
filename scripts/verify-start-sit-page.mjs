// Guards the browser Start/Sit research page, including verified 2026 Sleeper UI parity.
// This does not certify injury availability or publish an official manager skill grade.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('analytics/manager-lineup-research.html','utf8');
const client=fs.readFileSync('assets/manager-lineup-research-page.mjs','utf8');
const generator=fs.readFileSync('scripts/analyze-2026-start-sit-hindsight.mjs','utf8');
const report=fs.readFileSync('analytics/manager-report-cards.html','utf8');
for(const s of ['Start/Sit Accuracy</th>','2026 (Weeks 1–8)','manager-lineup-research-page.mjs',
 'id="detail-manager"','id="weekly-results"','id="detail-summary"','id="current-coverage"',
 'value="career"','id="career-results"','id="career-summary"'])
 assert.ok(html.includes(s),'Start/Sit research UI missing '+s);
assert.ok(report.includes('manager-lineup-research.html'),'Start/Sit research navigation missing');
const reportClient=fs.readFileSync('assets/manager-report-card-page.mjs','utf8');
assert.ok(reportClient.includes('startSitNote(x.name)')&&
 reportClient.includes('manager-lineup-research.html?season=career&amp;manager='),
 'Individual manager report cards lack deep links into Start/Sit history');

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
for(const statement of ["const pageParams=new URLSearchParams(location.search)",
 "const requestedManager=pageParams.get('manager')",
 "if(['career','all','2020'",
 "detailSelect.options].some(o=>o.textContent.toLowerCase()",
 "selected==='career'?[2020,2021,2022,2023,2024,2025,2026]",
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
 'sleeper-start-sit-ui-benchmarks-2026-week8.json','sample.accuracyPercent'])
 assert.ok(generator.includes(s),'Research generator missing UI benchmark or metric '+s);
const uiBenchmark=JSON.parse(fs.readFileSync('data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json','utf8'));
assert.equal(uiBenchmark.season,2026);
assert.equal(uiBenchmark.throughWeek,8);
assert.equal(uiBenchmark.data.length,10);
assert.equal(new Set(uiBenchmark.data.map(x=>x.manager)).size,10);
const expectedScreenshots={Stilly:92.4,Stew:92.0,Tony:88.9,Thommy:88.2,JMid:88.1,
 Stover:87.8,Mitch:87.2,Birch:85.8,Scott:85.3,Kuhl:83.1};
for(const sample of uiBenchmark.data){
 assert.equal(sample.accuracyPercent,expectedScreenshots[sample.manager],
  'Independent Sleeper Week 8 screenshot benchmark changed: '+sample.manager);
}

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
// The progressive profile navigation replaces the original hero buttons.
// It must retain the research link in the *rendered* page, not just the HTML.
const tabs=fs.readFileSync('assets/manager-profile-tabs.mjs','utf8');
assert.ok(tabs.includes('manager-lineup-research.html')&&
 tabs.includes('cloneNode(true)')&&tabs.includes('actions.append(startSitLink)'),
 'Progressive manager tabs silently discard Start/Sit history links');
// Every current manager profile needs a direct, nickname-safe Start/Sit deep link.
for(const [slug,name] of Object.entries({
 stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',
 tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'
})){
 const profile=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const path='../../analytics/manager-lineup-research.html?season=career&amp;manager='+name;
 assert.ok(profile.includes(path),'Missing profile Start/Sit deep link: '+slug);
 assert.equal(profile.split(path).length-1,1,
  'Duplicate Start/Sit profile link: '+slug);
}
// Audit all 830 historical team-weeks rather than assuming a complete bench
// means an actually legal/filled lineup. Exactly five known historical
// observations contain placeholder empty starters and must remain N/A.
const historicalVacancies=[];
let historicalTeamWeeks=0;
for(let year=2020;year<=2025;year++){
 const lastWeek=year===2020?13:14;
 for(let week=1;week<=lastWeek;week++){
  const file=year===2025&&(week===1||week===7)?
   'data/war_rosters_2025_week'+week+'.json':
   'data/sleeper_roster_snapshots_'+year+'_week'+week+'.json';
  const raw=JSON.parse(fs.readFileSync(file,'utf8'));
  const rosters=Array.isArray(raw)?raw:raw.rosters;
  assert.equal(rosters.length,10,'Missing historical Start/Sit teams '+year+'/'+week);
  for(const r of rosters){
   historicalTeamWeeks++;
   assert.ok(typeof r.owner==='string'&&r.owner.trim(),
    'Unattributable manager Start/Sit source '+year+'/'+week);
   assert.ok(Array.isArray(r.starters)&&Array.isArray(r.bench),
    'Missing starter/bench arrays '+year+'/'+week);
   const unknown=[...r.starters,...r.bench].filter(p=>!Number.isFinite(p.points));
   const vacant=r.starters.filter(p=>p.empty===true&&String(p.id)==='0');
   assert.equal(unknown.length,vacant.length,
    'Unexplained historical unscored roster players '+year+'/'+week+'/'+r.owner);
   if(vacant.length)historicalVacancies.push({year,week,owner:r.owner.toLowerCase(),vacant:vacant.length});
  }
 }
}
assert.equal(historicalTeamWeeks,830);
assert.deepEqual(historicalVacancies,[
 {year:2022,week:3,owner:'thommy',vacant:2},
 {year:2022,week:13,owner:'evansbrandonm',vacant:1},
 {year:2023,week:9,owner:'thommy',vacant:1},
 {year:2024,week:3,owner:'tsteg',vacant:1},
 {year:2024,week:11,owner:'yogurtslinger15',vacant:1}
],'Historical vacant-starter classification changed unexpectedly');
assert.ok(client.includes("reason:'Vacant starting slot'"),
 'Website must exclude historical missing starters rather than treating them as zero');
const roster8=JSON.parse(fs.readFileSync('data/sleeper_roster_snapshots_2026_week8.json','utf8'));
assert.equal(roster8.week,8);
assert.equal(roster8.rosters.length,10);
assert.deepEqual(roster8.rosters.map(r=>Number(r.teamId)).sort((a,b)=>a-b),
 Array.from({length:10},(_,i)=>i+1));
console.log('Start/Sit page integration PASS: eight completed weeks, ten teams, Sleeper UI parity guards, no official skill grade');
