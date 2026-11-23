// Search original transaction history beyond ordinary regular-week collection for missing Drake acquisition.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const league='668633299786244096',pid='3242',root='data-integrity/historical-trade-draft-audits/';
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);const raw=await r.text();return {data:JSON.parse(raw),sha256:createHash('sha256').update(raw).digest('hex')}};
const sources=[],events=[],lineups=[];
for(let w=0;w<=18;w++){
 const p='league/'+league+'/transactions/'+w,{data,sha256}=await get(p);
 assert(Array.isArray(data));sources.push({path:p,sha256,count:data.length});
 for(const t of data)if(Object.hasOwn(t.adds||{},pid)||Object.hasOwn(t.drops||{},pid))events.push({bucket:w,id:t.transaction_id,type:t.type,status:t.status,created:t.created,updated:t.status_updated,adds:t.adds,drops:t.drops,roster_ids:t.roster_ids,settings:t.settings});
}
for(let w=9;w<=14;w++){
 const p='league/'+league+'/matchups/'+w,{data,sha256}=await get(p);assert(Array.isArray(data));sources.push({path:p,sha256,count:data.length});
 for(const r of data)if(r.players?.map(String).includes(pid)||r.starters?.map(String).includes(pid)){const i=r.starters.map(String).indexOf(pid);lineups.push({week:w,roster:r.roster_id,starter:i>=0,points:i>=0?r.starters_points?.[i]:null});}
}
const draftList=await get('league/'+league+'/drafts');sources.push({path:'league/'+league+'/drafts',sha256:draftList.sha256});
const picks=[];
for(const d of draftList.data){const p='draft/'+d.draft_id+'/picks',r=await get(p);sources.push({path:p,sha256:r.sha256});picks.push(...r.data.filter(x=>String(x.player_id)===pid));}
const report={status:'RESEARCH_ONLY_NO_AUTOMATIC_CREDIT',player_id:pid,league,events,lineups,picks,sources,limitations:['All transaction statuses included for investigation only; incomplete transactions are not ownership evidence.','Provider roster membership confirms ownership but not acquisition category.','Absence of a transaction is not proof of free agency.']};
fs.writeFileSync(root+'kenyan-drake-2021-source-reconciliation.json',JSON.stringify(report,null,2)+'\n');
console.log('KENYAN DRAKE SOURCE RECONCILIATION '+JSON.stringify({events,lineups,picks}));
