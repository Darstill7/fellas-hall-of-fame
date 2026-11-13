// Rebuild complete event/season/rivalry ranking tables for the 21 truncated
// published expanded record categories. Research only; no production writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=read('data/expanded_records_verified_v1.json');
const ledger=read('data/unified_record_book_2016_2026.json');
const placements=read('data/fellas_final_placements_2016_2025_verified.json');
const N=s=>s==='Tom'?'Thommy':s;
const cents=x=>Math.round(Number(x)*100);
const dec=x=>Math.round((x+Number.EPSILON)*100)/100;
const mk=(id,value,manager,evidence,year=null,week=null)=>({id,value:dec(value),manager:N(manager),evidence,year,week});
const append=(map,key,item)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(item)};
const candidates=new Map();
const add=item=>append(candidates,item.id,item);
const games=ledger.games.filter(x=>x.stage==='regular');
assert.equal(games.length,705);
const teamWeeks=[],seasons=new Map(),rivals=new Map();
for(const g of games){
 const a=N(g.home),b=N(g.away),ap=cents(g.homeScore),bp=cents(g.awayScore);
 assert.notEqual(a,b);assert(Number.isSafeInteger(ap)&&Number.isSafeInteger(bp));
 for(const [manager,opponent,score,other] of [[a,b,ap,bp],[b,a,bp,ap]]){
  const row={manager,opponent,score,other,year:g.year,week:g.week,era:g.era};
  teamWeeks.push(row);
  append(seasons,g.year+'|'+manager,row);
  append(rivals,manager+'|'+opponent,row);
  const value=score/100,oppValue=other/100,diff=(score-other)/100;
  const e={year:g.year,week:g.week,opponent,points:value,opponentPoints:oppValue,
   outcome:score>other?'W':score<other?'L':'T',era:g.era};
  add(mk('highest-score',value,manager,e,g.year,g.week));
  add(mk('lowest-score',value,manager,e,g.year,g.week));
  if(score>other){
   add(mk('lowest-score-win',value,manager,e,g.year,g.week));
   add(mk('biggest-win',diff,manager,e,g.year,g.week));
   add(mk('narrowest-win',diff,manager,e,g.year,g.week));
   add(mk('giant-slayer-win',oppValue,manager,e,g.year,g.week));
  }else if(score<other){
   add(mk('highest-score-loss',value,manager,e,g.year,g.week));
   add(mk('biggest-defeat',-diff,manager,e,g.year,g.week));
   add(mk('narrowest-defeat',-diff,manager,e,g.year,g.week));
  }
 }
}
for(const [key,rows] of seasons){
 const [yearText,manager]=key.split('|'),year=Number(yearText);
 if(year>=2026||rows.length<12)continue;
 const games=rows.length,wins=rows.filter(x=>x.score>x.other).length,
  losses=rows.filter(x=>x.score<x.other).length,ties=games-wins-losses;
 const pf=cents(rows.reduce((a,r)=>a+r.score,0)/100)/100;
 const pa=cents(rows.reduce((a,r)=>a+r.other,0)/100)/100;
 const evidence={year,games,wins,losses,ties,points:pf,against:pa};
 for(const [id,v] of [
  ['season-points',pf],['season-average',pf/games],
  ['season-wins',wins],['season-win-rate',100*(wins+0.5*ties)/games],
  ['season-point-diff',pf-pa],
  ['season-140-club',rows.filter(x=>x.score>=14000).length]]){
  add(mk(id,v,manager,evidence,year));
 }
}
for(const [key,rows] of rivals){
 const [manager,opponent]=key.split('|');
 const meetings=rows.length,wins=rows.filter(x=>x.score>x.other).length,
  losses=rows.filter(x=>x.score<x.other).length,ties=meetings-wins-losses;
 const pf=rows.reduce((a,x)=>a+x.score,0)/100,pa=rows.reduce((a,x)=>a+x.other,0)/100;
 const ev={opponent,meetings,wins,losses,ties};
 if(meetings>=5){
  for(const [id,v] of [
   ['rival-wins',wins],['rival-games',meetings],
   ['rival-margin',pf-pa],['rival-scoring',pf/meetings]]){
   add(mk(id,v,manager,ev));
  }
 }
 if(meetings>=6)add(mk('rival-percentage',100*(wins+ties*.5)/meetings,manager,ev));
}
for(const p of placements.managers){
 const h=[...p.history].sort((a,b)=>a.year-b.year);
 for(let i=1;i<h.length;i++){
  const prev=h[i-1],curr=h[i];
  if(curr.year!==prev.year+1)continue;
  const priorScore=100*(prev.teams-prev.rank)/(prev.teams-1);
  const currScore=100*(curr.teams-curr.rank)/(curr.teams-1);
  add(mk('bounceback',currScore-priorScore,N(p.manager),
   {fromYear:prev.year,toYear:curr.year,fromRank:prev.rank,toRank:curr.rank,
    fromTeams:prev.teams,toTeams:curr.teams},curr.year));
 }
}
const truncated=old.categories.filter(c=>c.entries>c.leaders.length);
assert.equal(truncated.length,21);
const output=[];
for(const c of truncated){
 let rows=candidates.get(c.key)||[];
 const ascending=c.direction==='low';
 rows.sort((a,b)=>(ascending?a.value-b.value:b.value-a.value)||
   a.manager.localeCompare(b.manager)||(a.year??0)-(b.year??0)||(a.week??0)-(b.week??0)||
   String(a.evidence.opponent||'').localeCompare(String(b.evidence.opponent||'')));
 let rank=0,prior=null;
 rows=rows.map((r,i)=>{if(prior!==r.value){prior=r.value;rank=i+1}return {...r,rank}});
 const byManager=new Map();
 for(const r of rows)if(!byManager.has(r.manager))byManager.set(r.manager,r);
 const managerBest=[...byManager.values()].sort((a,b)=>a.rank-b.rank||a.manager.localeCompare(b.manager));
 const publishedTop=c.leaders[0];
 const top=rows[0];
 const valueMatches=top.value===publishedTop.value;
 const leadMatches=top.manager===N(publishedTop.manager);
 const coverageMatches=c.entries===rows.length;
 const allManagers=[...new Set(rows.map(x=>x.manager))].sort();
 output.push({id:c.key,group:c.group,direction:c.direction,unit:c.unit,
  generatedRows:rows.length,sourceDeclaredEntries:c.entries,
  sourceStoredRows:c.leaders.length,sourceTop:{manager:N(publishedTop.manager),value:publishedTop.value},
  recalculatedTop:{manager:top.manager,value:top.value},sourceTopValueMatches:valueMatches,
  sourceTopManagerMatches:leadMatches,sourceCoverageMatches:coverageMatches,
  completeManagerRanking:coverageMatches,managerCount:managerBest.length,
  rankedRows:rows,managerBest,holders:rows.filter(x=>x.rank===1),
  ownerList:allManagers});
}
const mismatches=output.filter(c=>!c.sourceCoverageMatches||!c.sourceTopValueMatches||
 !c.sourceTopManagerMatches).map(c=>({id:c.id,coverage:c.sourceCoverageMatches,
  value:c.sourceTopValueMatches,manager:c.sourceTopManagerMatches,
  expected:c.sourceDeclaredEntries,got:c.generatedRows,
  sourceTop:c.sourceTop,recalcTop:c.recalculatedTop}));
// Each of the original top-20 entries must remain identifiable with the same competition
// rank after the complete reconstruction, not just the #1 leader.
const storedRowDiscrepancies=[];
for(const c of truncated){
 const rebuilt=output.find(x=>x.id===c.key);
 for(const original of c.leaders){
  const y=original.year??original.evidence?.year??null;
  const w=original.week??original.evidence?.week??null;
  const opponent=original.evidence?.opponent??null;
  const fromYear=original.evidence?.fromYear??null;
  const candidates=rebuilt.rankedRows.filter(x=>x.manager===N(original.manager)&&
   x.value===original.value&&(y===null||x.year===y)&&
   (w===null||x.week===w)&&
   (opponent===null||x.evidence?.opponent===N(opponent))&&
   (fromYear===null||x.evidence?.fromYear===fromYear));
  if(!candidates.some(x=>x.rank===original.rank))
   storedRowDiscrepancies.push({id:c.key,manager:N(original.manager),
    value:original.value,rank:original.rank,year:y,week:w,opponent,fromYear,
    matchedRanks:candidates.map(x=>x.rank)});
 }
}
const result={schema:'fellas-reconstructed-expanded-records-v1',status:'research-only',
 generatedFrom:'data/unified_record_book_2016_2026.json',
 completionScope:'21 truncated expanded record categories',
 coverage:{regularGames:games.length,teamGameRows:teamWeeks.length,
  categories:output.length,fullyReconstructed:output.filter(x=>x.completeManagerRanking).length,
  mismatches:mismatches.length,storedTop20Discrepancies:storedRowDiscrepancies.length},
 discrepancies:mismatches,storedRowDiscrepancies,categories:output};
console.log(JSON.stringify(result,null,2));
