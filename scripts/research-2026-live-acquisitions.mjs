// Active-season acquisition receipts; same strict ownership semantics as historical research.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const year=2026,id='1340027406009761792',cutoff=Number(process.env.FELLAS_COMPLETED_WEEK);
assert(Number.isInteger(cutoff)&&cutoff>=1&&cutoff<=17);
const league=await get('league/'+id),state=await get('state/nfl');assert.equal(String(league.season),String(year));assert.equal(String(state.season),String(year));assert(Number(state.week)>cutoff);
const regularEnd=Number(league.settings.playoff_week_start)-1,deadline=Number(league.settings.trade_deadline);
assert.equal(regularEnd,14);assert.equal(deadline,11);
const managers=new Map([[1,'Stilly'],[2,'JMid'],[3,'Thommy'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const drafts=await get('league/'+id+'/drafts');
const completed=drafts.filter(d=>d.status==='complete'&&String(d.season)===String(year));
assert.equal(completed.length,1,'Ambiguous completed draft');
const draft=completed[0],picks=await get('draft/'+draft.draft_id+'/picks');
assert.equal(picks.length,Number(draft.settings.rounds)*10);
assert.equal(new Set(picks.map(p=>p.pick_no)).size,picks.length);
const tx=[];
for(let w=0;w<=cutoff+1;w++){const rows=await get('league/'+id+'/transactions/'+w);assert(Array.isArray(rows));for(const t of rows)if(t.status==='complete')tx.push({...t,week:w});}
assert.equal(new Set(tx.map(t=>t.transaction_id)).size,tx.length);
assert(!tx.some(t=>t.type==='trade'&&t.week>deadline),'Unexpected post-deadline trade');
const archived=read('data/player_starts_2026.json'),names=new Map(),positions=new Map();
for(const w of archived.weeks)for(const t of w.teams)for(const [pid,name,pos] of t.players){names.set(String(pid),name);positions.set(String(pid),pos);}
const index=new Map(),acqs=[],claimed=new Set();
for(let w=1;w<=cutoff;w++){
 const rows=await get('league/'+id+'/matchups/'+w);assert.equal(rows.length,10);assert.equal(new Set(rows.map(r=>r.roster_id)).size,10);
 for(const r of rows){assert(managers.has(Number(r.roster_id)));assert.equal(r.starters.length,r.starters_points.length);
 for(const [i,p] of r.starters.entries()){if(!p||String(p)==='0')continue;const key=[w,r.roster_id,p].join(':');assert(!index.has(key));const points=r.starters_points[i];assert(Number.isFinite(points));index.set(key,{week:w,roster:Number(r.roster_id),player_id:String(p),points,position:positions.get(String(p))??null,phase:w<=regularEnd?'regular':'postseason_calendar'});}
 }
}
for(const p of picks){
 const roster=Number(p.roster_id),pid=String(p.player_id);assert(managers.has(roster)&&pid!=='undefined'&&pid!=='0');
 const keeper=p.is_keeper===true?true:p.is_keeper===false?false:null;
 const md=p.metadata||{};const name=[md.first_name,md.last_name].filter(Boolean).join(' ')||names.get(pid)||null;
 names.set(pid,name);if(md.position)positions.set(pid,md.position);
 acqs.push({category:keeper===true?'ARCHIVED_KEEPER':'DRAFT',id:'draft:'+draft.draft_id+':'+p.pick_no,roster,player_id:pid,week:0,time:0,cost:{round:p.round,pick:p.pick_no,keeper_flag:keeper}});
}
for(const t of tx.filter(t=>t.week<=cutoff&&['trade','waiver','free_agent'].includes(t.type)))for(const [pid,r] of Object.entries(t.adds||{})){
 const roster=Number(r);assert(managers.has(roster));const category={trade:'TRADE',waiver:'WAIVER',free_agent:'FREE_AGENT'}[t.type];
 acqs.push({category,id:String(t.transaction_id),roster,player_id:pid,week:t.week,time:Number(t.status_updated),cost:category==='WAIVER'?{faab:Number.isFinite(t.settings?.waiver_bid)?t.settings.waiver_bid:null}:category==='FREE_AGENT'?{faab:0}:null});
}
const cents=x=>Math.round(x*100);
const ledger=acqs.map(a=>{
 const exit=tx.filter(t=>Number(t.status_updated)>a.time&&Number(t.drops?.[a.player_id])===a.roster).sort((a,b)=>Number(a.status_updated)-Number(b.status_updated))[0];
 const receipts=[],boundary=[];
 for(let w=Math.max(1,a.week);w<=cutoff;w++){
  if(exit&&w>exit.week)break;
  const k=[w,a.roster,a.player_id].join(':'),r=index.get(k);if(!r)continue;
  if((a.week!==0&&w===a.week)||w===exit?.week){boundary.push({...r,reason:w===a.week?'ACQUISITION_WEEK':'EXIT_WEEK'});continue;}
  assert(!claimed.has(k),'Duplicate ownership receipt '+k);claimed.add(k);receipts.push(r);
 }
 const sum=rs=>rs.reduce((n,r)=>n+cents(r.points),0)/100;
 return {...a,year,manager:managers.get(a.roster),name:names.get(a.player_id)??null,position:positions.get(a.player_id)??null,exit_transaction:exit?.transaction_id??null,exit_week:exit?.week??null,strict_pf:sum(receipts),regular_pf:sum(receipts.filter(r=>r.phase==='regular')),postseason_calendar_pf:sum(receipts.filter(r=>r.phase==='postseason_calendar')),starts:receipts.length,receipts,boundary};
});
const live=read(root+'2026-live-trade-player-returns-research.json');assert.equal(live.completed_week,cutoff);
for(const t of live.trades)for(const s of t.sides)for(const p of s.players){
 const a=ledger.find(a=>a.category==='TRADE'&&a.id===t.id&&a.roster===s.roster&&a.player_id===p.player_id);assert(a,'Missing trade acquisition');
 assert.equal(cents(a.strict_pf),cents(p.pf));assert.equal(a.starts,p.starts);
}
const unresolved=[...index.entries()].filter(([k])=>!claimed.has(k)).map(([,r])=>r);
const report={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:{year,week:cutoff},trade_deadline_week:deadline,coverage:{draft_picks:picks.length,acquisitions:ledger.length,observed_starts:index.size,strict_starts:claimed.size,unattributed_starts:unresolved.length,keeper_flags:{confirmed:picks.filter(p=>p.is_keeper===true).length,explicit_false:picks.filter(p=>p.is_keeper===false).length,unknown:picks.filter(p=>typeof p.is_keeper!=='boolean').length}},ledger,unresolved,limitations:['Unknown keeper flags are not proof of non-keeper status. Draft category is provisional where flags unknown.','Acquisition and exit weeks separately reported; no inferred timing credit.','Postseason calendar includes consolation, not championship-only.']};
fs.writeFileSync(root+'2026-live-acquisition-preview.json',JSON.stringify(report,null,2)+'\n');
console.log('LIVE ACQUISITION PROJECTION PASS '+JSON.stringify({completedThrough:report.completedThrough,coverage:report.coverage}));
