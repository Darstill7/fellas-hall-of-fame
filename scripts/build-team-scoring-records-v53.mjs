// Canonical paired team scores; full-field ranks exclude incomplete weeks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const ledger=read('unified_record_book_2016_2026.json');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const games=ledger.games.filter(g=>g.stage==='regular');
const rows=[],weeks=new Map(),seasons=new Map(),careers=new Map(),seen=new Set();
for(const g of games){
 for(const [manager,opponent,points,against] of [[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]]){
  assert.ok(Number.isFinite(points)&&Number.isFinite(against));
  const r={manager:norm(manager),opponent:norm(opponent),year:g.year,week:g.week,points:cents(points),against:cents(against),result:points>against?'W':points<against?'L':'T'};
  const key=[r.year,r.week,r.manager].join(':');assert.ok(!seen.has(key),key);seen.add(key);rows.push(r);
  for(const [map,k] of [[weeks,r.year+':'+r.week],[seasons,r.year+':'+r.manager],[careers,r.manager]]){if(!map.has(k))map.set(k,[]);map.get(k).push(r);}
 }
}
const scope='Recovered regular-season paired team scores, 2016–2026 Week '+Math.max(...rows.filter(r=>r.year===2026).map(r=>r.week));
const fullWeeks=[...weeks.values()].filter(a=>a.length===(a[0].year===2016?8:10));
const ranked=fullWeeks.flatMap(a=>a.map(r=>({...r,highRank:1+a.filter(t=>t.points>r.points).length,lowRank:1+a.filter(t=>t.points<r.points).length})));
const records=[];
const add=(id,label,a,metric,dir,unit,qualification)=>{
 assert.ok(a.length,id);assert.ok(a.every(r=>Number.isFinite(metric(r))),id);
 const value=Math[dir](...a.map(metric)),evidence=a.filter(r=>metric(r)===value);
 records.push({id,label,value:unit==='pts'?value/100:value,unit,scope,qualification,holders:[...new Set(evidence.map(r=>r.manager))].sort().map(manager=>({manager,evidence:evidence.filter(r=>r.manager===manager)}))});
};
const rankCareer=[...careers].map(([manager,a])=>{
 const q=ranked.filter(r=>r.manager===manager);
 return {manager,weeks:q.length,titles:q.filter(r=>r.highRank===1).length,last:q.filter(r=>r.lowRank===1).length,topThreeLoss:q.filter(r=>r.highRank<=3&&r.result==='L').length,bottomThreeWin:q.filter(r=>r.lowRank<=3&&r.result==='W').length};
});
for(const [id,label,k] of [['weekly-scoring-titles','Most weekly scoring titles','titles'],['weekly-last-scorer','Most weekly lowest-scoring finishes','last'],['top-three-losses','Most losses while among weekly top three scorers','topThreeLoss'],['bottom-three-wins','Most wins while among weekly bottom three scorers','bottomThreeWin']])add(id,label,rankCareer,r=>r[k],'max','weeks','Full-field paired weeks only; competition ranks and all ties retained');
const seasonRanks=[...seasons].map(([key,a])=>{
 const q=ranked.filter(r=>r.manager===a[0].manager&&r.year===a[0].year);
 return {manager:a[0].manager,year:a[0].year,weeks:q.length,titles:q.filter(r=>r.highRank===1).length,last:q.filter(r=>r.lowRank===1).length,complete:q.length===a.length};
}).filter(r=>r.year<2026&&r.complete);
for(const [id,label,k] of [['season-weekly-scoring-titles','Most weekly scoring titles in a completed season','titles'],['season-weekly-last-scorer','Most weekly lowest-scoring finishes in a completed season','last']])add(id,label,seasonRanks,r=>r[k],'max','weeks','Completed seasons with every recorded manager-week in a full field; co-leaders count');
const runRows=(source,predicate)=>{
 const out=[];
 for(const [,a] of seasons){
  const sorted=[...a].sort((x,y)=>x.week-y.week);let run=[];
  for(const r of sorted){if(!predicate(r,source)){run=[];continue;}if(run.length&&r.week!==run.at(-1).week+1)run=[];run.push(r);out.push({manager:r.manager,year:r.year,start:run[0].week,end:r.week,length:run.length});}
 }
 return out;
};
const rankMap=new Map(ranked.map(r=>[[r.year,r.week,r.manager].join(':'),r]));
for(const [id,label,predicate] of [['season-win-streak','Longest within-season winning streak',r=>r.result==='W'],['season-loss-streak','Longest within-season losing streak',r=>r.result==='L'],['weekly-title-streak','Longest consecutive weeks as highest scorer',r=>rankMap.get([r.year,r.week,r.manager].join(':'))?.highRank===1],['weekly-bottom-streak','Longest consecutive weeks as lowest scorer',r=>rankMap.get([r.year,r.week,r.manager].join(':'))?.lowRank===1]]){
 add(id,label,runRows(null,predicate),r=>r.length,'max','weeks','Within season only; missing weeks break streak; weekly ranks require full field');
}
for(const length of [3,5]){
 const windows=[];
 for(const [,a] of seasons){const sorted=[...a].sort((x,y)=>x.week-y.week);for(let i=0;i+length<=sorted.length;i++){const w=sorted.slice(i,i+length);if(w.at(-1).week-w[0].week!==length-1)continue;windows.push({manager:w[0].manager,year:w[0].year,start:w[0].week,end:w.at(-1).week,total:w.reduce((s,r)=>s+r.points,0)});}}
 for(const dir of ['max','min'])add('scoring-window-'+length+'-'+dir,(dir==='max'?'Highest':'Lowest')+' '+length+'-week scoring stretch',windows,r=>r.total,dir,'pts','Consecutive paired regular-season weeks within one season');
}
assert.equal(new Set(records.map(r=>r.id)).size,records.length);
fs.writeFileSync('data-integrity/team-scoring-records-v53.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',scope,fullWeeks:fullWeeks.length,excludedPartialWeeks:weeks.size-fullWeeks.length,categoryCount:records.length,records},null,2)+'\n');
console.log('Team scoring records: '+records.length+' candidates across '+fullWeeks.length+' full-field weeks; '+(weeks.size-fullWeeks.length)+' partial weeks excluded from rank comparisons.');
