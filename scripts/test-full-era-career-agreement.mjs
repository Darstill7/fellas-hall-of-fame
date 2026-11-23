import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const full=read(root+'full-era-career-statistics.json');
const sleeper=read(root+'combined-career-statistics.json');
const espn=read('data/espn_history_2016_2019.json');
const live=read(root+'live-completed-regular-2026.json');
let checks=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
eq(full.seasons.map(s=>s.year),Array.from({length:11},(_,i)=>2016+i),'all years');
eq(full.seasons.slice(4),sleeper.seasons,'Sleeper seasons unchanged by ESPN integration');
eq(full.source_blob,sleeper.source_blob,'Sleeper fingerprint invariant');
eq(full.espn_source_blob,'52dbf83af8e1b8966ad71fb510f61377d2445835','ESPN fingerprint');
eq(full.live_watermark,sleeper.live_watermark,'live watermark');
const career={};
const expected={};
for(const s of full.seasons){
 const n=Object.keys(s.managers).length;
 eq(n,s.year===2016?8:10,'season size');
 for(const [m,r] of Object.entries(s.managers)){
  const c=career[m]??={games:0,w:0,l:0,t:0,pf_cents:0,pa_cents:0,all_play_w:0,all_play_l:0,all_play_t:0,weekly_highs:0};
  for(const k of Object.keys(c))c[k]+=r[k];
  eq(r.all_play_w+r.all_play_l+r.all_play_t,r.games*(n-1),m+' comparisons');
  expected[m]=(expected[m]||0)+(r.all_play_w+r.all_play_t/2)/(n-1);
 }
}
for(const s of espn.seasons){
 const result=full.seasons.find(x=>x.year===s.year);
 const teams=new Map(s.teams.map(t=>[t.id,t.manager]));
 for(const t of s.teams){
  const r=result.managers[t.manager];
  eq([r.w,r.l,r.t],t.record,t.manager+' archived record '+s.year);
  eq(r.pf_cents,Math.round(t.pf*100),t.manager+' archived PF');
  eq(r.pa_cents,Math.round(t.pa*100),t.manager+' archived PA');
 }
 for(const g of s.games.filter(g=>g.stage==='NONE')){
  const w=result.weekly.find(w=>w.week===g.period);
  eq(w.scores[teams.get(g.home)],Math.round(g.hs*100),'ESPN home score');
  eq(w.scores[teams.get(g.away)],Math.round(g.as*100),'ESPN away score');
 }
}
for(const [m,c] of Object.entries(career)){
 for(const k of Object.keys(c))eq(full.career[m][k],c[k],m+' career '+k);
 assert(Math.abs(full.records.schedule_luck[m].expected_wins-expected[m])<1e-9,m+' expected wins');checks++;
}
eq(Object.keys(full.career).sort(),Object.keys(career).sort(),'manager coverage');
eq(Object.values(full.career).reduce((n,r)=>n+r.games,0),1304+live.regular_weeks*10,'full career games');
eq(Object.values(full.career).reduce((n,r)=>n+r.pf_cents-r.pa_cents,0),0,'league PF/PA');
console.log('FULL ERA CAREER AGREEMENT PASS '+JSON.stringify({checks,managers:Object.keys(career).length,team_games:1304+live.regular_weeks*10,career:full.career}));
