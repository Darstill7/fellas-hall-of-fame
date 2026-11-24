import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildRivalryIntelligence,opponentScoringContext,championshipShowdowns} from '../assets/manager-rivalry-intelligence-v44.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const core=read('career_core_generated.json'),ledger=read('unified_record_book_2016_2026.json'),archives=[read('verified_espn_playoff_brackets_2016_2019.json'),read('verified_sleeper_playoff_brackets_2020_2025.json')];
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
let checks=0;const results=[],failures=[],models=new Map();
for(const name of names){
 try{
 const d=buildRivalryIntelligence(core,ledger,name);models.set(name,d);
 let seriesChecks=0;
 for(const r of d.series){
 const s=r.regular;
 assert.equal(s.games,s.w+s.l+s.t);checks++;
 assert.equal(s.net,s.pf-s.pa);checks++;
 assert.equal(s.annual.reduce((n,y)=>n+y.w+y.l+y.t,0),s.games);checks++;
 assert.equal(s.annual.reduce((n,y)=>n+y.pf-y.pa,0),s.net);checks++;
 assert(s.longestWin<=s.w&&s.longestLoss<=s.l);checks++;
 assert(s.heartbreak[1]<=s.heartbreak[3]&&s.heartbreak[3]<=s.heartbreak[5]&&s.heartbreak[5]<=s.heartbreak[10]&&s.heartbreak[10]<=s.l);checks++;
 const ctx=opponentScoringContext(ledger,name,r.opponent);if(ctx){assert(ctx.games<=s.games&&Number.isFinite(ctx.delta));checks++}
 const finals=championshipShowdowns(archives,name,r.opponent);
 for(const f of finals){assert.equal(f.result,f.champion===name?'W':'L');checks++}
 seriesChecks++;
 }
 results.push({name,series:seriesChecks,regularGames:core.managers[name].games});
 }catch(e){failures.push({name,error:e.message})}
}
for(const [name,d] of models)for(const r of d.series){
 const reverse=models.get(r.opponent)?.series.find(x=>x.opponent===name);
 if(!reverse)continue;
 assert.equal(r.regular.w,reverse.regular.l);checks++;
 assert.equal(r.regular.net,-reverse.regular.net||0);checks++;
}
assert.deepEqual(championshipShowdowns(archives,'Stilly','Thommy').map(f=>[f.year,f.result]),[[2024,'L']]);checks++;
const duplicate=structuredClone(ledger);duplicate.games.push(duplicate.games.find(g=>g.stage==='regular'&&(g.home==='Stilly'||g.away==='Stilly')));assert.throws(()=>buildRivalryIntelligence(core,duplicate,'Stilly'));checks++;
assert.throws(()=>championshipShowdowns([archives[0],archives[0]],'Stilly','Thommy'));checks++;
console.log('RIVALRY ACTUAL ARCHIVE '+JSON.stringify({checks,results,failures}));assert.equal(failures.length,0,JSON.stringify(failures));
