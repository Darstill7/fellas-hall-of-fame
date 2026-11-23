// Research-only player encyclopedia: acquisition-attributed and all observed starts are separate.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const acquisitions=read('acquisition-hall-of-fame-research');
assert.equal(acquisitions.status,'RESEARCH_ONLY_NOT_FOR_PUBLICATION');
const round=n=>Math.round(n*100)/100||0;
const index=new Map(),credited=new Map(),allStarts=new Map();
const profile=id=>{if(!index.has(id))index.set(id,{player_id:id,names:new Set(),positions:new Set(),acquisitions:[],starts:[]});return index.get(id);};
const key=(...x)=>x.join(':');
for(const a of acquisitions.ledger){
 const p=profile(String(a.player_id));
 if(a.name)p.names.add(a.name);if(a.position)p.positions.add(a.position);
 p.acquisitions.push({year:a.year,id:a.id,category:a.category,manager:a.manager,roster:a.roster,week:a.week,cost:a.cost,strict_pf:a.strict_pf,starts:a.starts,exit_transaction:a.exit_transaction,boundary:a.boundary});
 for(const r of a.receipts){
 const k=key(a.year,r.week,a.roster,a.player_id);
 assert(!credited.has(k),'Duplicate acquisition attribution '+k);
 credited.set(k,{id:a.id,category:a.category,points:r.points,manager:a.manager});
 }
}
for(const year of [2020,2021,2022,2023,2024,2025]){
 const draft=read(year+'-sleeper-draft-id-review');
 const managers=new Map(draft.verified_picks.map(p=>[Number(p.original_roster),p.manager]));
 const data=JSON.parse(fs.readFileSync('data/player_starts_'+year+'.json','utf8'));
 for(const week of data.weeks.filter(w=>w.week<=draft.regular_season_completed_weeks))for(const team of week.teams)for(const [pid,name,position,points] of team.players){
 const id=String(pid);if(id==='0')continue;
 const k=key(year,week.week,team.roster,id);assert(!allStarts.has(k));
 const manager=managers.get(Number(team.roster));assert(manager&&Number.isFinite(Number(points)));
 const a=credited.get(k);if(a){assert.equal(a.manager,manager);assert(Math.abs(a.points-Number(points))<.011);}
 const r={year,week:week.week,manager,roster:Number(team.roster),position,points:Number(points),acquisition_id:a?.id??null,category:a?.category??null};
 allStarts.set(k,r);const p=profile(id);if(name)p.names.add(name);if(position)p.positions.add(position);p.starts.push(r);
 }
}
for(const k of credited.keys())assert(allStarts.has(k),'Missing starter '+k);
const summarize=rows=>({starts:rows.length,pf:round(rows.reduce((n,r)=>n+r.points,0)),attributed_starts:rows.filter(r=>r.acquisition_id!==null).length,attributed_pf:round(rows.filter(r=>r.acquisition_id!==null).reduce((n,r)=>n+r.points,0))});
const players=[...index.values()].map(p=>{
 const managers=[...new Set([...p.starts.map(r=>r.manager),...p.acquisitions.map(a=>a.manager)])].sort().map(manager=>({manager,...summarize(p.starts.filter(r=>r.manager===manager)),acquisitions:p.acquisitions.filter(a=>a.manager===manager).length}));
 const seasons=[...new Set([...p.starts.map(r=>r.year),...p.acquisitions.map(a=>a.year)])].sort().map(year=>({year,...summarize(p.starts.filter(r=>r.year===year))}));
 return {player_id:p.player_id,display_name:[...p.names].at(-1)??null,aliases:[...p.names],positions:[...p.positions],career:summarize(p.starts),managers,seasons,acquisitions:p.acquisitions.sort((a,b)=>a.year-b.year||a.week-b.week||a.id.localeCompare(b.id)),weekly_starts:p.starts,best_start:[...p.starts].sort((a,b)=>b.points-a.points)[0]??null};
}).sort((a,b)=>b.career.pf-a.career.pf||a.player_id.localeCompare(b.player_id));
assert.equal(players.reduce((n,p)=>n+p.career.starts,0),allStarts.size);
assert.equal(players.reduce((n,p)=>n+p.career.attributed_starts,0),credited.size);
assert.equal(players.reduce((n,p)=>n+p.acquisitions.length,0),acquisitions.ledger.length);
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:acquisitions.scope,coverage:{players:players.length,acquisitions:acquisitions.ledger.length,observed_starts:allStarts.size,attributed_starts:credited.size,unattributed_starts:allStarts.size-credited.size},players,limitations:['Completed Sleeper regular seasons only','All observed lineup starts include unattributed boundary weeks; strict acquisition returns do not','Same provider ID joins seasons; aliases retained, no name matching','Historical manager identity and archived keeper classification remain provisional','No career totals from ESPN or incomplete 2026 season']};
fs.writeFileSync(dir+'/player-career-encyclopedia-research.json',JSON.stringify(output,null,2)+'\n');
console.log('PLAYER ENCYCLOPEDIA COVERAGE '+JSON.stringify(output.coverage));
console.log('PLAYER ENCYCLOPEDIA LEADERS '+JSON.stringify(players.slice(0,5).map(({player_id,display_name,career})=>({player_id,display_name,career}))));
console.log('PLAYER ENCYCLOPEDIA CHASE '+JSON.stringify(players.filter(p=>p.player_id==='7564').map(({display_name,career,managers,seasons,acquisitions})=>({display_name,career,managers,seasons,acquisitions:acquisitions.map(({year,manager,category,strict_pf,starts})=>({year,manager,category,strict_pf,starts}))}))));
