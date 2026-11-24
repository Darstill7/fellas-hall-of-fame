// Independent completeness scan against original provider lineups and every completed roster addition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fetchProviderJSON} from './lib/provider-retry.mjs';
const root='data-integrity/historical-trade-draft-audits/';
const read=n=>JSON.parse(fs.readFileSync(root+n+'.json','utf8'));
const final=read('historical-acquisition-final-review');
const get=p=>fetchProviderJSON('https://api.sleeper.app/v1/'+p);
const key=r=>[r.year,r.week,Number(r.roster),String(r.player_id)].join(':');
const ak=r=>[r.year,Number(r.roster),String(r.player_id),String(r.id)].join(':');
const receipts=new Map(final.receipts.map(r=>[key(r),r])),acquisitions=new Map(final.acquisitions.map(a=>[ak(a),a]));
assert.equal(receipts.size,final.receipts.length);assert.equal(acquisitions.size,final.acquisitions.length);
const findings=[],years=[],seen=new Set(),seenAcq=new Set();
const issue=(kind,detail)=>findings.push({kind,...detail});
for(let year=2020;year<=2025;year++){
 const draft=read(year+'-sleeper-draft-id-review'),league=draft.league_id,end=draft.regular_season_completed_weeks;
 const managers=new Map(draft.verified_picks.map(p=>[Number(p.original_roster),p.manager]));
 let starts=0,pf=0,adds=0;const types={},txIds=new Set();
 for(const p of draft.verified_picks){
  const id='draft:'+draft.draft_id+':'+p.pick,k=ak({year,roster:p.original_roster,player_id:p.player_id,id});
  if(!acquisitions.has(k))issue('MISSING_DRAFT_PICK',{year,id,player_id:p.player_id});else seenAcq.add(k);
 }
 for(let week=0;week<=end+1;week++){
  const tx=await get('league/'+league+'/transactions/'+week);assert(Array.isArray(tx));
  for(const t of tx.filter(t=>t.status==='complete')){
   assert(!txIds.has(t.transaction_id));txIds.add(t.transaction_id);
   types[t.type]=(types[t.type]??0)+1;
   if(week>end)continue;
   for(const [player_id,roster] of Object.entries(t.adds||{})){
    adds++;const k=ak({year,roster,player_id,id:t.transaction_id}),a=acquisitions.get(k);
    if(!a){issue('UNREPRESENTED_COMPLETED_ADDITION',{year,week,roster,player_id,id:t.transaction_id,type:t.type,updated:t.status_updated});continue;}
    seenAcq.add(k);
    const expected={trade:'TRADE',waiver:'WAIVER',free_agent:'FREE_AGENT',commissioner:'COMMISSIONER'}[t.type];
    if(a.category!==expected||a.time!==Number(t.status_updated)||a.week!==week)issue('ACQUISITION_SOURCE_MISMATCH',{year,week,player_id,id:t.transaction_id,expected,actual:a.category});
   }
  }
 }
 for(let week=1;week<=end;week++){
  const teams=await get('league/'+league+'/matchups/'+week);assert(Array.isArray(teams));assert.equal(new Set(teams.map(t=>t.roster_id)).size,teams.length);
  for(const t of teams){
   assert(Array.isArray(t.starters)&&Array.isArray(t.starters_points));assert.equal(t.starters.length,t.starters_points.length);
   for(let i=0;i<t.starters.length;i++){
    const player_id=String(t.starters[i]);if(player_id==='0')continue;
    const k=key({year,week,roster:t.roster_id,player_id});assert(!seen.has(k));seen.add(k);
    const value=t.starters_points[i];assert(Number.isFinite(value));const cents=Math.round(value*100);starts++;pf+=cents;
    const r=receipts.get(k);
    if(!r){issue('MISSING_ORIGINAL_START',{year,week,roster:t.roster_id,player_id,cents});continue;}
    if(r.pf_cents!==cents)issue('ORIGINAL_POINTS_MISMATCH',{year,week,roster:t.roster_id,player_id,expected:cents,actual:r.pf_cents});
    if(r.manager!==managers.get(Number(t.roster_id)))issue('MANAGER_IDENTITY_MISMATCH',{year,week,roster:t.roster_id,player_id,expected:managers.get(Number(t.roster_id)),actual:r.manager});
   }
  }
 }
 years.push({year,league,regular_weeks:end,starts,pf_cents:pf,completed_additions:adds,transaction_types:types});
}
for(const [k,r] of receipts)if(!seen.has(k))issue('RECEIPT_ABSENT_FROM_PROVIDER',{key:k,receipt:r});
for(const [k,a] of acquisitions)if(!seenAcq.has(k))issue('ACQUISITION_ABSENT_FROM_PROVIDER',{key:k,category:a.category});
const report={status:findings.length?'REVIEW_REQUIRED':'SOURCE_COMPLETENESS_PASS',scope:'Sleeper 2020–2025 regular season; original provider lineups and completed transactions',historical_package_sha256:final.content_sha256,years,findings,coverage:{provider_starts:seen.size,package_starts:receipts.size,matched_acquisitions:seenAcq.size,package_acquisitions:acquisitions.size},limitations:['Historical keeper flags and lineup-lock timestamps require separate evidence. ESPN 2016–2019 not in acquisition scope.']};
fs.writeFileSync(root+'final-historical-source-completeness-audit.json',JSON.stringify(report,null,2)+'\n');
console.log('FINAL HISTORICAL SOURCE COMPLETENESS '+JSON.stringify(report));
assert.equal(findings.length,0,'Historical discrepancies must be resolved before freezing');
