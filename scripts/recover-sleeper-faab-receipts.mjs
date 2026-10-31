// Research-only: fetch public Sleeper transaction receipts; never alter canonical records.
// Usage: node scripts/recover-sleeper-faab-receipts.mjs --output data-integrity/private-faab-receipts.json
// Optional: --start-league <2026-league-id> --rounds 18 --only-season 2025
import fs from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2);
const opt=(name,fallback)=>{const i=args.indexOf(name);return i===-1?fallback:args[i+1]};
const leagueStart=opt('--start-league','1340027406009761792');
const rounds=Number(opt('--rounds','18'));
const onlySeason=opt('--only-season',null);
const output=opt('--output',null);
if(!/^\d{12,22}$/.test(leagueStart)||!Number.isInteger(rounds)||rounds<1||rounds>22||onlySeason&&!/^20\d\d$/.test(onlySeason))throw Error('Invalid arguments');
const request=async endpoint=>{
 const url='https://api.sleeper.app/v1/'+endpoint;
 for(let attempt=0;attempt<3;attempt++){
  try{const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
   if(response.status===429||response.status>=500){if(attempt<2){await new Promise(r=>setTimeout(r,750*(attempt+1)));continue;}}
   if(!response.ok)throw Error('HTTP '+response.status+' '+endpoint);
   return await response.json();
  }catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,750*(attempt+1)));}
 }
};
const seasons=[];
let leagueId=leagueStart;
const ids=new Set();
while(leagueId&&!ids.has(leagueId)){
 ids.add(leagueId);
 const info=await request('league/'+leagueId);
 if(!info?.season||!info.league_id)throw Error('Malformed league '+leagueId);
 const year=Number(info.season);
 if(year<2020)break;
 seasons.push({year,leagueId:String(info.league_id),settings:info.settings||{},previousLeagueId:info.previous_league_id});
 leagueId=info.previous_league_id?String(info.previous_league_id):null;
 if(seasons.length>12)throw Error('Unexpected league lineage depth');
}
if(!seasons.length)throw Error('No Sleeper seasons found');
const results=[];
const unmapped=[];
const errors=[];
const seasonSummary=[];
for(const season of seasons){
 if(onlySeason&&String(season.year)!==onlySeason)continue;
 const archivePath='data/acquisitions_'+season.year+'.json';
 const archive=fs.existsSync(archivePath)?JSON.parse(fs.readFileSync(archivePath,'utf8')):null;
 const lookup=new Map();
 for(const week of archive?.weeks||[])for(const tx of week.tx||[])lookup.set(String(tx.id),tx);
 const seen=new Map();let completed=0,waivers=0,priced=0,unpriced=0;
 for(let round=1;round<=rounds;round++){
  let transactions;
  try{transactions=await request('league/'+season.leagueId+'/transactions/'+round)}
  catch(e){errors.push({year:season.year,round,error:String(e)});continue}
  if(!Array.isArray(transactions)){errors.push({year:season.year,round,error:'Non-array response'});continue}
  for(const tx of transactions){
   const id=String(tx.transaction_id||'');
   if(!id||seen.has(id))continue;
   seen.set(id,true);
   if(tx.status!=='complete')continue;
   completed++;
   if(tx.type!=='waiver')continue;
   waivers++;
   const amount=tx.settings?.waiver_bid;
   const isAmount=typeof amount==='number'&&Number.isInteger(amount)&&amount>=0;
   const original=lookup.get(id);
   if(isAmount)priced++;else unpriced++;
   const adds=tx.adds||{};
   const rosterIds=[...new Set(Object.values(adds).map(Number).filter(Number.isInteger))];
   const archivedTeamIds=(original?.teamIds||[]).map(Number);
   const rosterMatch=!!original&&rosterIds.every(r=>archivedTeamIds.includes(r))&&rosterIds.length>0;
   const record={year:season.year,round,transactionId:id,status:tx.status,transactionType:tx.type,waiverBid:isAmount?amount:null,receiptVerified:isAmount&&rosterMatch,archivedTransactionFound:!!original,rosterIds,archivedTeamIds,addedPlayerIds:Object.keys(adds),archivePlayerIds:(original?.players||[]).map(p=>String(p.id)),sourceEndpoint:'league/'+season.leagueId+'/transactions/'+round,reason:isAmount?(rosterMatch?'matching_id_and_roster':'requires_roster_or_archive_reconciliation'):'missing_waiver_bid_in_source'};
   results.push(record);
   if(!original)unmapped.push({year:season.year,round,transactionId:id,reason:'not in archived acquisitions'});
  }
 }
 seasonSummary.push({year:season.year,leagueId:season.leagueId,archivedTransactions:lookup.size,completedTransactions:completed,completedWaivers:waivers,waiversWithNumericBid:priced,waiversWithoutBid:unpriced,matchedAndVerified:results.filter(x=>x.year===season.year&&x.receiptVerified).length,missingArchiveMatches:unmapped.filter(x=>x.year===season.year).length});
}
const report={schema:'fellas-faab-receipt-recovery-v1',generatedAt:new Date().toISOString(),source:'Sleeper public read-only transaction API',readOnly:true,policy:'Only completed waiver settings.waiver_bid is a bid. waiver_budget is transferred FAAB and is excluded. No amounts inferred from old editorial pages, no unverified skill grades.',seasons:seasonSummary,receipts:results,unmapped,fetchErrors:errors};
if(output){const dest=path.resolve(output);if(!dest.startsWith(path.resolve('data-integrity')+path.sep))throw Error('Output must be written under data-integrity/');fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log('Wrote research-only receipts to '+dest);}
else console.log(JSON.stringify(report,null,2));
console.error('Summary: '+JSON.stringify(seasonSummary));
if(errors.length)process.exitCode=2;
