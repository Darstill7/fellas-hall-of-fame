// Research-only acquisition ledger. One credited starter per season/roster/player/week.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='data-integrity/historical-trade-draft-audits';
const read=n=>JSON.parse(fs.readFileSync(dir+'/'+n+'.json','utf8'));
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const round=n=>Math.round(n*100)/100||0;
const years=[2020,2021,2022,2023,2024,2025],ledger=[],claimed=new Set(),coverage=[];
const historicalTrades=read('trade-player-receipts-research');
for(const year of years){
 const draft=read(year+'-sleeper-draft-id-review'),own=read(year+'-ownership-review');
 const league=draft.league_id,end=draft.regular_season_completed_weeks;
 const managers=new Map(draft.verified_picks.map(p=>[Number(p.original_roster),p.manager]));
 const tx=[];
 for(let w=0;w<=end+1;w++){const rows=await get('league/'+league+'/transactions/'+w);assert(Array.isArray(rows));for(const t of rows)if(t.status==='complete')tx.push({...t,week:w});}
 assert.equal(new Set(tx.map(t=>t.transaction_id)).size,tx.length);
 const starts=JSON.parse(fs.readFileSync('data/player_starts_'+year+'.json','utf8'));
 const index=new Map(),playerNames=new Map();
 for(const w of starts.weeks.filter(w=>w.week<=end))for(const t of w.teams)for(const [pid,name,pos,pf] of t.players){
 if(String(pid)==='0')continue;
 const k=[w.week,t.roster,pid].join(':');assert(!index.has(k));index.set(k,{week:w.week,points:Number(pf),position:pos});playerNames.set(String(pid),name);
 }
 const acquisitions=[];
 for(const p of draft.verified_picks)acquisitions.push({category:p.is_keeper_archived?'ARCHIVED_KEEPER':'DRAFT',id:'draft:'+draft.draft_id+':'+p.pick,roster:Number(p.original_roster),player_id:String(p.player_id),name:p.provider_name||p.archive_player_name,position:p.position,week:0,time:0,cost:{round:p.round,pick:p.pick,keeper_flag_source:'archive'}});
 for(const t of tx.filter(t=>t.week<=end&&['trade','waiver','free_agent'].includes(t.type)))for(const [pid,r] of Object.entries(t.adds||{})){
 const roster=Number(r);assert(managers.has(roster));
 const category={trade:'TRADE',waiver:'WAIVER',free_agent:'FREE_AGENT'}[t.type];
 const bid=t.settings?.waiver_bid;
 acquisitions.push({category,id:String(t.transaction_id),roster,player_id:String(pid),name:playerNames.get(String(pid))??null,week:t.week,time:Number(t.status_updated),cost:category==='WAIVER'?{faab:Number.isFinite(bid)?bid:null}:category==='FREE_AGENT'?{faab:0}:null});
 }
 const seasonRows=[];
 for(const a of acquisitions){
 const exit=tx.filter(t=>Number(t.status_updated)>a.time&&Number(t.drops?.[a.player_id])===a.roster).sort((x,y)=>Number(x.status_updated)-Number(y.status_updated))[0];
 const receipts=[],boundary=[];
 for(let w=Math.max(1,a.week);w<=end;w++){
 if(exit&&w>exit.week)break;
 const r=index.get([w,a.roster,a.player_id].join(':'));if(!r)continue;
 if((a.week!==0&&w===a.week)||w===exit?.week){boundary.push({...r,reason:w===a.week?'ACQUISITION_WEEK':'EXIT_WEEK'});continue;}
 const unique=[year,w,a.roster,a.player_id].join(':');assert(!claimed.has(unique),'Duplicate strict receipt '+unique);claimed.add(unique);receipts.push(r);
 }
 const pf=round(receipts.reduce((n,r)=>n+r.points,0));
 const row={...a,year,manager:managers.get(a.roster),exit_transaction:exit?.transaction_id??null,strict_pf:pf,starts:receipts.length,points_per_start:receipts.length?round(pf/receipts.length):null,receipts,boundary};
 if(a.category==='TRADE'){
 const t=own.trade_results.find(t=>t.id===a.id),side=t?.sides.find(s=>Number(s.roster)===a.roster),p=side?.players.find(p=>String(p.player_id)===a.player_id);assert(p,'Trade missing ownership receipt '+a.id);
 const expected=p.receipts.filter(r=>r.week<=end);assert.equal(receipts.length,expected.length);assert(Math.abs(pf-expected.reduce((n,r)=>n+r.points,0))<.011);
 const scored=historicalTrades.transactions.find(t=>t.year===year&&t.id===a.id)?.sides.find(s=>s.manager===row.manager)?.players.find(p=>String(p.player_id)===a.player_id);
 assert(scored);row.timing_supported_trade_pf=scored.pf;
 }
 seasonRows.push(row);
 }
 ledger.push(...seasonRows);coverage.push({year,acquisitions:seasonRows.length,strict_starts:seasonRows.reduce((n,r)=>n+r.starts,0),unattributed_starts:index.size-seasonRows.reduce((n,r)=>n+r.starts,0),categories:Object.fromEntries([...new Set(seasonRows.map(r=>r.category))].map(k=>[k,seasonRows.filter(r=>r.category===k).length]))});
}
const categories=['TRADE','WAIVER','FREE_AGENT','DRAFT','ARCHIVED_KEEPER'];
const rank=rows=>[...rows].filter(r=>r.starts>0).sort((a,b)=>b.strict_pf-a.strict_pf||b.starts-a.starts||a.year-b.year||a.id.localeCompare(b.id)).map(r=>({year:r.year,manager:r.manager,category:r.category,player_id:r.player_id,name:r.name,id:r.id,strict_pf:r.strict_pf,starts:r.starts,points_per_start:r.points_per_start,cost:r.cost}));
const rankings=Object.fromEntries(categories.map(k=>[k,rank(ledger.filter(r=>r.category===k))]));
const combined=rank(ledger.filter(r=>r.category!=='ARCHIVED_KEEPER'));
const output={status:'RESEARCH_ONLY_NOT_FOR_PUBLICATION',scope:'2020–2025 completed Sleeper regular seasons',coverage,ledger,rankings,combined,limitations:['All categories use strict ownership windows; same-week boundary points excluded consistently','Trade-only timing-supported points separately retained, not used in combined rankings','Draft and keeper receipts end at first completed exit; no reacquisition credit','Keeper classification is archive-derived and not fully independently certified','Unattributed starts explicitly counted; no causal or cost-adjusted acquisition grade','FAAB null means unknown, never zero']};
fs.writeFileSync(dir+'/acquisition-hall-of-fame-research.json',JSON.stringify(output,null,2)+'\n');
console.log('ACQUISITION HALL COVERAGE '+JSON.stringify(coverage));
console.log('ACQUISITION HALL LEADERS '+JSON.stringify(Object.fromEntries(categories.map(k=>[k,rankings[k].slice(0,3)]))));
