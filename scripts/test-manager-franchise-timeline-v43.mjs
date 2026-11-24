import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildFranchiseTimeline,compareFranchiseSeasons} from '../assets/manager-franchise-timeline-v43.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const core=read('career_core_generated.json'),guide=read('season_guide.json'),endings=read('manager_verified_season_endings_v1.json');
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];
let checks=0;const results=[],failures=[];
for(const name of names){
 try{
 const rows=buildFranchiseTimeline(core,guide,endings,name);
 assert.equal(rows.length,Object.keys(core.managers[name].annual).length);checks++;
 assert.equal(rows.reduce((n,r)=>n+r.games,0),core.managers[name].games);checks++;
 assert.equal(rows.reduce((n,r)=>n+r.w,0),core.managers[name].w);checks++;
 assert.equal(rows.reduce((n,r)=>n+r.l,0),core.managers[name].l);checks++;
 assert(rows.every(r=>r.scoringRank>=1&&r.scoringRank<=r.leagueSize));checks++;
 assert(rows.filter(r=>r.active).every(r=>r.finish===null&&!r.award));checks++;
 assert(rows.every(r=>r.finish!==1||guide[r.year].champion===name||(name==='Thommy'&&guide[r.year].champion==='Tom')));checks++;
 assert(rows.every((r,i)=>!i||rows[i-1].year>r.year));checks++;
 if(rows.length>1){const c=compareFranchiseSeasons(rows,rows[1].year,rows[0].year);assert.equal(c.winPctDelta,rows[0].winPct-rows[1].winPct);checks++;assert.throws(()=>compareFranchiseSeasons(rows,rows[0].year,rows[0].year));checks++}
 results.push({name,seasons:rows.length,titles:rows.filter(r=>r.finish===1).length});
 }catch(e){failures.push({name,error:e.message})}
}
const bad=structuredClone(guide);bad['2023'].standings.find(r=>r.name==='Stilly').w++;
assert.throws(()=>buildFranchiseTimeline(core,bad,endings,'Stilly'));checks++;
const duplicate=structuredClone(endings);duplicate.managers.Stilly.push(duplicate.managers.Stilly[0]);assert.throws(()=>buildFranchiseTimeline(core,guide,duplicate,'Stilly'));checks++;
const wrongChampion=structuredClone(guide);wrongChampion['2023'].champion='Mitch';assert.throws(()=>buildFranchiseTimeline(core,wrongChampion,endings,'Stilly'));checks++;
console.log('TIMELINE ACTUAL ARCHIVE '+JSON.stringify({checks,results,failures}));assert.equal(failures.length,0,JSON.stringify(failures));
