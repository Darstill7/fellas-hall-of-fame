// Rehearse repeatable weekly refreshes without changing historical inputs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const root='data-integrity/historical-trade-draft-audits/';
const frozenPath='data-integrity/frozen-regular-matchups-2020-2025-v1.json';
const original=fs.readFileSync(frozenPath);
const live=JSON.parse(fs.readFileSync(root+'live-completed-regular-2026.json','utf8'));
assert.equal(live.regular_weeks,10);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-career-'));
let checks=0;
const eq=(a,b,m)=>{checks++;assert.deepEqual(a,b,m)};
function run(label,input,expected=true){
 const env={...process.env,FELLAS_STATS_OUTPUT:path.join(dir,label+'.json')};
 delete env.FELLAS_LIVE_INPUT;
 if(input){env.FELLAS_LIVE_INPUT=path.join(dir,label+'-input.json');fs.writeFileSync(env.FELLAS_LIVE_INPUT,JSON.stringify(input));}
 const r=spawnSync(process.execPath,['scripts/build-frozen-regular-statistics.mjs'],{env,encoding:'utf8'});
 if(expected){assert.equal(r.status,0,r.stderr);return JSON.parse(fs.readFileSync(env.FELLAS_STATS_OUTPUT,'utf8'));}
 assert.notEqual(r.status,0,label+' must fail');assert(!fs.existsSync(env.FELLAS_STATS_OUTPUT),label+' must not produce output');checks++;
}
try{
 const base=run('base',null),full=run('full',live),replay=run('replay',live);
 eq(full,replay,'identical inputs must produce identical outputs');
 eq(full.seasons.slice(0,6),base.seasons,'historical season statistics must remain invariant');
 eq(full.source_blob,base.source_blob,'historical fingerprint unchanged');
 const priorInput={...live,regular_weeks:9,games:live.games.filter(g=>g.week<=9)};
 const prior=run('prior',priorInput);
 const week=live.games.filter(g=>g.week===10);eq(week.length,5,'advancing adds five fixtures');
 const active=new Map();
 for(const g of week)for(const [m,pf,pa] of [[g.home,g.home_cents,g.away_cents],[g.away,g.away_cents,g.home_cents]])active.set(m,{pf,pa});
 for(const [m,r] of Object.entries(full.career)){
  const p=prior.career[m],h=base.career[m],a=active.get(m);
  eq(r.games,p.games+(a?1:0),m+' week advancement games');
  eq(r.pf_cents,p.pf_cents+(a?.pf??0),m+' week advancement PF');
  eq(r.pa_cents,p.pa_cents+(a?.pa??0),m+' week advancement PA');
  eq(r.w,p.w+(a&&a.pf>a.pa?1:0),m+' week advancement wins');
  eq(r.l,p.l+(a&&a.pf<a.pa?1:0),m+' week advancement losses');
  eq(r.t,p.t+(a&&a.pf===a.pa?1:0),m+' week advancement ties');
  if(!a)eq(r,h,m+' retired manager invariant');
 }
 eq(Object.values(full.career).reduce((n,r)=>n+r.games,0),920,'combined coverage');
 const duplicate=structuredClone(live);duplicate.games.push({...duplicate.games[0]});run('duplicate',duplicate,false);
 const partial=structuredClone(live);partial.games.pop();run('partial',partial,false);
 const wrongYear={...live,year:2025};run('overlap',wrongYear,false);
 const wrongManager=structuredClone(live);wrongManager.games[0].home='Unknown';run('unknown-manager',wrongManager,false);
 const repeatedFixture=structuredClone(live);repeatedFixture.games[1]={...repeatedFixture.games[0]};run('repeated-fixture',repeatedFixture,false);
 const futureWeek=structuredClone(live);futureWeek.games[0].week=11;run('future-week',futureWeek,false);
 eq(fs.readFileSync(frozenPath),original,'frozen source bytes invariant');
 console.log('COMBINED CAREER REFRESH PASS '+JSON.stringify({checks,prior_week:9,completed_week:10,added_fixtures:5,rejected_invalid_inputs:6}));
}finally{fs.rmSync(dir,{recursive:true,force:true});}
