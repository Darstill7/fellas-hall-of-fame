// Deterministic statistics derived only from frozen, provider-reconciled regular-season fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const path='data-integrity/frozen-regular-matchups-2020-2025-v1.json';
const bytes=fs.readFileSync(path);
const blob=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(blob,'9d390c084c07874b9a282d21e7965e79f13f6b2d','Frozen history changed; use explicit versioned migration');
const ledger=JSON.parse(bytes);
const identity=JSON.parse(fs.readFileSync('data-integrity/historical-manager-confirmation-20261123.json','utf8'));
const norm=m=>m==='Tom'?'Thommy':m==='EvansBrandon'?'Evans':m;
const blank=()=>({games:0,w:0,l:0,t:0,pf_cents:0,pa_cents:0,all_play_w:0,all_play_l:0,all_play_t:0,weekly_highs:0,losses_at_or_above:{110:0,125:0,140:0,150:0}});
const career={},rivalries={},seasons=[];
function record(r,pf,pa){r.games++;r[pf>pa?'w':pf<pa?'l':'t']++;r.pf_cents+=pf;r.pa_cents+=pa;if(pf<pa)for(const k of [110,125,140,150])if(pf>=k*100)r.losses_at_or_above[k]++;}
function add(a,b){for(const k of Object.keys(a))if(k!=='losses_at_or_above')a[k]+=b[k];for(const k of Object.keys(a.losses_at_or_above))a.losses_at_or_above[k]+=b.losses_at_or_above[k];}
function check(r){assert.equal(r.games,r.w+r.l+r.t);assert.equal(r.games*9,r.all_play_w+r.all_play_l+r.all_play_t);}
assert.deepEqual(ledger.seasons.map(s=>s.year),[2020,2021,2022,2023,2024,2025]);
for(const s of ledger.seasons){
 const names=Object.values(identity.rows.find(r=>r.year===s.year).rosters).map(norm).sort();
 const rows=Object.fromEntries(names.map(n=>[n,blank()]));const weekly=[];
 assert.equal(s.regular_weeks,s.year<=2021?13:14);assert.equal(s.games.length,s.regular_weeks*5);
 for(let week=1;week<=s.regular_weeks;week++){
  const games=s.games.filter(g=>g.week===week),scores={};assert.equal(games.length,5);
  for(const g of games){
   for(const [m,o,pf,pa] of [[g.home,g.away,g.home_cents,g.away_cents],[g.away,g.home,g.away_cents,g.home_cents]]){
    assert(Object.hasOwn(rows,m)&&Object.hasOwn(rows,o)&&m!==o&&!Object.hasOwn(scores,m));assert(Number.isSafeInteger(pf)&&Number.isSafeInteger(pa));
    scores[m]=pf;record(rows[m],pf,pa);
    const r=(rivalries[m]??={})[o]??=((rivalries[m])[o]={games:0,w:0,l:0,t:0,pf_cents:0,pa_cents:0,losses_at_or_above:{110:0,125:0,140:0,150:0}});record(r,pf,pa);
   }
  }
  assert.deepEqual(Object.keys(scores).sort(),names);
  const high=Math.max(...Object.values(scores));
  for(const m of names){const r=rows[m];for(const o of names)if(m!==o)r[scores[m]>scores[o]?'all_play_w':scores[m]<scores[o]?'all_play_l':'all_play_t']++;if(scores[m]===high)r.weekly_highs++;}
  weekly.push({week,scores,high_cents:high,leaders:names.filter(m=>scores[m]===high)});
 }
 for(const [m,r] of Object.entries(rows)){check(r);add(career[m]??(career[m]=blank()),r);}
 assert.equal(Object.values(rows).reduce((n,r)=>n+r.pf_cents-r.pa_cents,0),0);
 seasons.push({year:s.year,regular_weeks:s.regular_weeks,managers:rows,weekly});
}
for(const r of Object.values(career))check(r);
for(const [a,os] of Object.entries(rivalries))for(const [b,r] of Object.entries(os)){const q=rivalries[b][a];assert.equal(r.games,q.games);assert.equal(r.w,q.l);assert.equal(r.t,q.t);assert.equal(r.pf_cents,q.pa_cents);}
assert.equal(Object.values(career).reduce((n,r)=>n+r.games,0),820);
// Schedule luck and season-bounded streaks, derived from the same verified scores.
const luck=Object.fromEntries(Object.entries(career).map(([m,r])=>[m,{actual_wins:r.w,expected_wins:(r.all_play_w+r.all_play_t/2)/9,win_equivalent_delta:r.w+r.t/2-(r.all_play_w+r.all_play_t/2)/9}]));
const streaks=[],extremes=[];
for(const s of seasons)for(const m of Object.keys(s.managers)){
 const weeks=s.weekly.map(w=>({week:w.week,pf:w.scores[m],high:w.leaders.includes(m)}));
 for(const [kind,test] of [['weekly_high',w=>w.high],...([100,105,110,125,140,150].map(n=>['score_at_least_'+n,w=>w.pf>=100*n]))]){
 let first=null,last=null;for(const w of [...weeks,{week:null,pf:-Infinity,high:false}]){if(test(w)){first??=w.week;last=w.week;}else if(first!==null){streaks.push({manager:m,year:s.year,kind,first_week:first,last_week:last,length:last-first+1});first=last=null;}}
 }
 for(const w of weeks)extremes.push({manager:m,year:s.year,week:w.week,pf_cents:w.pf});
}
streaks.sort((a,b)=>b.length-a.length||a.year-b.year||a.first_week-b.first_week||a.manager.localeCompare(b.manager));
extremes.sort((a,b)=>b.pf_cents-a.pf_cents||a.year-b.year||a.week-b.week||a.manager.localeCompare(b.manager));
assert.equal(extremes.length,820);
assert(Math.abs(Object.values(luck).reduce((n,r)=>n+r.win_equivalent_delta,0))<1e-9);
const records={streaks,highest_scores:extremes.slice(0,25),lowest_scores:extremes.slice().reverse().slice(0,25),schedule_luck:luck};
const out={schema:'fellas-frozen-regular-statistics-v1',status:'RESEARCH_ONLY_NOT_PUBLIC_INTEGRATION',source_blob:blob,scope:'2020–2025 Sleeper regular seasons only',definitions:{weekly_highs:'All tied weekly leaders receive credit',all_play:'Each actual team score compared with nine other teams in same week',threshold_losses:'Actual head-to-head losses with own score at or above threshold',units:'integer hundredths of fantasy points'},seasons,career,rivalries,records};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});fs.writeFileSync('data-integrity/historical-trade-draft-audits/frozen-regular-statistics-v1.json',JSON.stringify(out,null,2)+'\n');
console.log('FROZEN REGULAR STATISTICS '+JSON.stringify({seasons:seasons.length,team_games:820,managers:Object.keys(career).length,career}));
