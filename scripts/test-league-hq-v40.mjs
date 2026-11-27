import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildHomeDashboard,buildPersonalDashboard} from '../assets/home-app-v3.mjs';
import {buildHQBriefing,hqCalendar,buildFranchiseLegacy,buildRecentForm} from '../assets/league-hq-v40.mjs';
import {buildCompetitiveIntelligence} from '../assets/league-hq-competitive-v40.mjs';
import {buildHistoricalDiscovery,historicalMatchups} from '../assets/league-hq-history-v40.mjs';
import {fellasLeague,normalizeManager} from '../assets/league-config.mjs';
import {primarySectionFor} from '../assets/app-shell-v34.mjs';
const read=f=>JSON.parse(fs.readFileSync('data/'+f,'utf8'));
const guide=read('season_guide.json'),ledger=read('unified_record_book_2016_2026.json'),race=read('playoff_race_v1.json'),placements=read('fellas_final_placements_2016_2025_verified.json'),records=read('expanded_records_verified_v1.json');
const d=buildHomeDashboard(guide,ledger),c=buildCompetitiveIntelligence(d,race);assert(c);assert.equal(c.rows.length,10);assert.equal(c.week,d.week);
const games=ledger.games.filter(g=>g.year===fellasLeague.season&&g.stage==='regular');
const score=(g,n)=>normalizeManager(g.home)===n?g.homeScore:g.awayScore;
let comparisons=0;
for(const n of fellasLeague.managers){
 const row=c.rows.find(r=>r.name===n),p=buildPersonalDashboard(d,race,n);
 let w=0,l=0,t=0;
 for(let week=1;week<=d.week;week++){
  const weekly=games.filter(g=>g.week===week),mine=weekly.find(g=>[g.home,g.away].map(x=>normalizeManager(x)).includes(n)),my=Math.round(score(mine,n)*100);
  for(const g of weekly)for(const [manager,points] of [[g.home,g.homeScore],[g.away,g.awayScore]])if(normalizeManager(manager)!==n){const diff=my-Math.round(points*100);if(diff>0)w++;else if(diff<0)l++;else t++;comparisons++}
 }
 assert.deepEqual([row.wins,row.losses,row.ties],[w,l,t]);assert.equal(w+l+t,9*d.week);assert.equal(row.expected,(w+t/2)/9);
 const ref=race.teams[n]??race.teams[n==='Thommy'?'Tom':n];if(c.fixturesAvailable){
  assert.equal(row.opponents.length,14-d.week);
  const expected=row.opponents.reduce((sum,o)=>sum+d.standings.find(s=>s.name===o.name).pf/d.week,0)/row.opponents.length;
  assert(Math.abs(row.sos-expected)<1e-9);
 }
 const legacy=buildFranchiseLegacy(n,placements,records);
 assert.deepEqual(legacy.titles,placements.seasons.filter(s=>normalizeManager(s.champion)===n).map(s=>s.year).sort((a,b)=>a-b));
 assert.equal(legacy.completed,placements.seasons.filter(s=>s.finishes.some(f=>normalizeManager(f.manager)===n)).length);
 assert.equal(legacy.owned.count,records.categories.filter(k=>k.leaders.some(x=>x.rank===1&&normalizeManager(x.manager)===n)).length);
 assert.equal(buildRecentForm(d,n).length,Math.min(d.week,5));
 for(let weekday=1;weekday<=7;weekday++){const date=new Date(Date.UTC(2026,10,weekday+22,18));const stories=buildHQBriefing(d,p,date);assert(stories.length<=3);assert.equal(new Set(stories.map(s=>s.id)).size,stories.length)}
 for(let week=1;week<=14;week++){const stories=buildHistoricalDiscovery(ledger,week,n);assert(stories.length<=3);assert.equal(new Set(stories.map(s=>s.id)).size,stories.length);for(const s of stories){assert.equal(s.week,week);assert(s.year<2026);assert(!(week===14&&[2020,2021].includes(s.year)));assert.equal(s.margin,Math.abs(Math.round(s.homeScore*100)-Math.round(s.awayScore*100))/100)}}
}
assert.equal(comparisons,90*d.week);assert(Math.abs(c.rows.reduce((sum,r)=>sum+r.luck,0))<1e-8);
assert.equal(buildCompetitiveIntelligence(d,{...race,verified_through_week:0}).fixturesAvailable,false);
const broken=structuredClone(race);delete broken.fixtures[d.week+1];assert.equal(buildCompetitiveIntelligence(d,broken).fixturesAvailable,false);
assert.equal(buildFranchiseLegacy('Stilly',null,null).titles,null);assert.equal(buildFranchiseLegacy('Stilly',null,null).owned,null);
assert.deepEqual(buildRecentForm({...d,history:{}},'Stilly'),[]);
const g={year:2025,week:1,stage:'regular',home:'Stilly',away:'Stew',homeScore:100,awayScore:100,source:'test'};
assert.equal(historicalMatchups({games:[g,{...g,home:'Stew',away:'Stilly'}]},1).length,1);
assert.equal(historicalMatchups({games:[g,{...g,homeScore:101}]},1).length,0);
assert.equal(hqCalendar(new Date('2026-11-27T02:00:00Z')).day,'Thu');
assert.equal(hqCalendar(new Date('2026-11-27T18:00:00Z')).day,'Fri');
for(const [path,hash,section] of [['index.html','#main','home'],['index.html','#my-team-section','team'],['index.html','#league','league'],['analytics/records.html','','records'],['hall/index.html','','records'],['index.html','#more','more']])assert.equal(primarySectionFor(path,hash),section);
console.log(JSON.stringify({week:d.week,managers:10,independentScoreComparisons:comparisons,legacyChecks:30,calendarScenarios:70,historicalScenarios:140,fixturesAvailable:c.fixturesAvailable},null,2));
