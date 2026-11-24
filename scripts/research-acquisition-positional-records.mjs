// Observed acquisition production by position and acquisition method.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const source=JSON.parse(fs.readFileSync(dir+'/acquisition-hall-of-fame-research.json','utf8'));
assert.equal(source.status,'RESEARCH_ONLY_NOT_FOR_PUBLICATION');
const categories=['DRAFT','TRADE','WAIVER','FREE_AGENT','ARCHIVED_KEEPER'];
const positions=['QB','RB','WR','TE','DEF','K'];
const rows=source.ledger.filter(r=>r.starts>0);
const round=n=>Math.round(n*100)/100;
const records=[],unresolved=[];
for(const r of rows){
 const observed=[...new Set(r.receipts.map(x=>x.position).filter(Boolean))];
 const position=observed.length===1?observed[0]:observed.length===0?r.position:null;
 if(!positions.includes(position)){unresolved.push({year:r.year,id:r.id,player_id:r.player_id,manager:r.manager,observed,archive_position:r.position??null});continue;}
 records.push({year:r.year,id:r.id,player_id:r.player_id,name:r.name,manager:r.manager,category:r.category,position,week:r.week,pf:r.strict_pf,starts:r.starts,points_per_start:r.points_per_start,cost:r.cost});
}
const rank=(a,key)=>[...a].sort((x,y)=>y[key]-x[key]||y.starts-x.starts||x.year-y.year||x.id.localeCompare(y.id)||x.player_id.localeCompare(y.player_id));
const boards=Object.fromEntries(positions.map(p=>[p,Object.fromEntries(categories.map(c=>{
 const a=records.filter(r=>r.position===p&&r.category===c);
 return [c,{qualifying:a.length,total:rank(a,'pf'),per_start_min_three:rank(a.filter(r=>r.starts>=3),'points_per_start')}];
}))]));
const positional_leaders=positions.map(position=>({position,leaders:Object.fromEntries(categories.map(c=>[c,boards[position][c].total[0]??null]))}));
const managers=[...new Set(source.ledger.map(r=>r.manager))].sort().map(manager=>({manager,positions:Object.fromEntries(positions.map(p=>[p,Object.fromEntries(categories.map(c=>[c,rank(records.filter(r=>r.manager===manager&&r.position===p&&r.category===c),'pf')[0]??null]))]))}));
assert.equal(records.length+unresolved.length,rows.length);
assert.equal(Object.values(boards).flatMap(b=>Object.values(b)).reduce((n,b)=>n+b.qualifying,0),records.length);
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:source.scope,coverage:{productive_acquisitions:rows.length,classified:records.length,unresolved:unresolved.length,positions,categories},boards,positional_leaders,managers,unresolved,limitations:['Strict ownership windows, regular season only','Position from actual credited starter receipts; ambiguous position excluded','Empty category is unavailable, not zero','Archived keeper status remains provisional','Raw production is not cost-adjusted value']};
fs.writeFileSync(dir+'/acquisition-positional-records-research.json',JSON.stringify(output,null,2)+'\n');
console.log('POSITIONAL ACQUISITION COVERAGE '+JSON.stringify(output.coverage));
console.log('POSITIONAL ACQUISITION LEADERS '+JSON.stringify(positional_leaders));
