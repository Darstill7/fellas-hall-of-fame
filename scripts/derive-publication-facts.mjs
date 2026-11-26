import fs from 'node:fs';
import assert from 'node:assert/strict';
export function deriveFacts(ledger,year,week){
 const season=ledger.games.filter(g=>g.year===year&&g.stage==='regular'&&g.week<=week);
 assert.equal(season.length,week*5,'Expected five completed games per week');
 const names=[...new Set(season.flatMap(g=>[g.home,g.away]))].sort();assert.equal(names.length,10);
 const managers={};const cents=x=>Math.round(Number(x)*100);
 for(const n of names){
  const rows=season.filter(g=>g.home===n||g.away===n).sort((a,b)=>a.week-b.week);
  assert.deepEqual(rows.map(g=>g.week),Array.from({length:week},(_,i)=>i+1),n+' complete season coverage');
  const results=rows.map(g=>{assert.ok(['HOME','AWAY'].includes(g.winner));return (g.home===n?g.winner==='HOME':g.winner==='AWAY')?'W':'L'});
  let streak=0;for(let i=results.length-1;i>=0&&results[i]===results.at(-1);i--)streak++;
  const pf=rows.reduce((s,g)=>s+cents(g.home===n?g.homeScore:g.awayScore),0);
  const pa=rows.reduce((s,g)=>s+cents(g.home===n?g.awayScore:g.homeScore),0);
  managers[n]={wins:results.filter(x=>x==='W').length,losses:results.filter(x=>x==='L').length,pf:pf/100,pa:pa/100,streak:results.at(-1)+streak,results:results.join(''),weeklyPoints:rows.map(g=>g.home===n?g.homeScore:g.awayScore)};
 }
 const matchups=season.filter(g=>g.week===week).map(g=>{const w=g.winner==='HOME';return {winner:w?g.home:g.away,loser:w?g.away:g.home,winScore:w?g.homeScore:g.awayScore,lossScore:w?g.awayScore:g.homeScore,margin:Math.abs(cents(g.homeScore)-cents(g.awayScore))/100}});
 const scoring=Object.entries(managers).map(([manager,m])=>({manager,points:m.weeklyPoints.at(-1)})).sort((a,b)=>b.points-a.points||a.manager.localeCompare(b.manager));
 return {year,week,managers,matchups,scoring,largestMargin:Math.max(...matchups.map(g=>g.margin)),scoringLeaders:scoring.filter(x=>x.points===scoring[0].points).map(x=>x.manager),scoringLeadMargin:(cents(scoring[0].points)-cents(scoring[1].points))/100};
}
if(process.argv[2]){
 const year=Number(process.argv[2]),week=Number(process.argv[3]);assert.ok(Number.isInteger(year)&&Number.isInteger(week)&&week>=1&&week<=14);
 const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
 console.log(JSON.stringify(deriveFacts(ledger,year,week),null,2));
}
