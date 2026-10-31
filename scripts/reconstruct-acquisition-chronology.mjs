// Archived add/waiver event chronology. Day-level timestamps only; no reconstructed
// drop, trade, lock, claim priority, or full free-agent availability is asserted.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const years=[2020,2021,2022,2023,2024,2025,2026],events=[],coverage=[];
for(const year of years){
 const a=read('data/acquisitions_'+year+'.json');
 const provider=read('data-integrity/faab-provider-receipts-'+year+'.json');
 const receipt=new Map(provider.receipts.filter(r=>r.status==='complete').map(r=>[String(r.id),r]));
 let missingDates=0,missingPlayerIds=0;
 for(const week of a.weeks){
  for(const tx of week.tx){
   if(!['add','waiver'].includes(tx.type))continue;
   const date=typeof tx.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(tx.date)?tx.date:null;
   if(!date)missingDates++;
   const rosterIds=(tx.teamIds??[]).map(String);
   const players=(tx.players??[]).map(p=>({id:p.id==null?null:String(p.id),name:p.name??null,position:p.position??null}));
   if(players.some(p=>p.id===null))missingPlayerIds++;
   const claim=receipt.get(String(tx.id));
   events.push({year,week:tx.week??week.week,transactionId:String(tx.id),date,
    eventType:tx.type,acquiringTeamIds:rosterIds,players,
    providerCompletedWaiver:tx.type==='waiver'?Boolean(claim):null,
    exactProcessingOrder:'unknown',dropInformation:'not_in_acquisition_archive'});
  }
 }
 coverage.push({year,events:events.filter(x=>x.year===year).length,missingDates,missingPlayerIds});
}
events.sort((a,b)=>a.year-b.year||(a.date??'9999').localeCompare(b.date??'9999')||a.transactionId.localeCompare(b.transactionId));
const perDay=new Map();
for(const e of events){
 const k=e.year+'|'+e.date;
 perDay.set(k,(perDay.get(k)??0)+1);
}
for(const e of events)e.sameDayEventCount=perDay.get(e.year+'|'+e.date);
const output={schema:'fellas-archived-acquisition-chronology-v1',status:'date_level_only_no_free_agent_certification',
 limitations:['Archive includes adds and waivers but not the full drop/trade event stream.',
 'Date is only day-level evidence; order on the same day is unknown.',
 'Missing archive records cannot be interpreted as no transaction.',
 'Completed waiver records verify the acquired player but not which alternatives were available.',
 'Do not infer a complete ownership ledger or replacement pool from these events.'],coverage,events};
const path='data-integrity/faab-acquisition-chronology-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(path),output,'Chronology stale');
else fs.writeFileSync(path,JSON.stringify(output,null,2)+'\n');
console.log('Acquisition chronology:',events.length,'archived events; day-level only');
