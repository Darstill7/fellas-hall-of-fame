// Verify isolated playoff race output against the certified current-season ledger.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const book=read(root+'unified-record-book-preview.json'),stats=read(root+'full-era-career-statistics.json');
const cutoff=book.completedThrough,season=stats.seasons.find(s=>s.year===cutoff.year);
const output=root+'playoff-race-preview.json';
const canonical=fs.readFileSync('data/playoff_race_v1.json');
const env={...process.env,FELLAS_RACE_LEDGER:root+'unified-record-book-preview.json',FELLAS_RACE_OUTPUT:output,FELLAS_RACE_AS_OF:'2026-11-23'};
let checks=0;const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
function run(){const r=spawnSync(process.execPath,['scripts/rebuild-playoff-race.mjs'],{env,stdio:'inherit'});eq(r.status,0);return fs.readFileSync(output,'utf8');}
const first=run();eq(run(),first,'deterministic replay');
const race=JSON.parse(first);eq(race.completedThrough,cutoff);eq(race.verified_through_week,cutoff.week);
eq(Object.keys(race.teams).length,10);
for(const [name,t] of Object.entries(race.teams)){
 const s=season.managers[name==='Tom'?'Thommy':name];assert(s);
 for(const k of ['w','l','t'])eq(t[k],s[k],name+' '+k);
 eq(Math.round(t.pf*100),s.pf_cents);eq(Math.round(t.pa*100),s.pa_cents);
 eq(t.apw,s.all_play_w);eq(t.apl,s.all_play_l);eq(t.apt,s.all_play_t);
 const p=race.scenarios['6'][name];assert(p.playoff_pct>=0&&p.playoff_pct<=100);assert(p.top2_pct>=0&&p.top2_pct<=p.playoff_pct);checks+=2;
}
const probs=Object.values(race.scenarios['6']);
for(const [k,total] of [['playoff_pct',600],['top2_pct',200]]){assert(Math.abs(probs.reduce((n,p)=>n+p[k],0)-total)<=0.51,k+' allocation');checks++;}
eq(race.latest_results.length,5);
eq(fs.readFileSync('data/playoff_race_v1.json'),canonical,'production race unchanged');
console.log('CERTIFIED PLAYOFF RACE PASS '+JSON.stringify({checks,completedThrough:cutoff,simulations:25000,provider_schedule_verified:false}));
