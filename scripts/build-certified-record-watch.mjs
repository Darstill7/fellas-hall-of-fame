// Read-only watch research. No public alerts without category-specific certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const norm=n=>n==='Tom'?'Thommy':n;
const key=g=>JSON.stringify([g.year,g.week,...[norm(g.home),norm(g.away)].sort()]);
export function buildWatch(ledger,{year,week,regularSeasonWeeks,excludedKeys=[],certificates=[]}){
 const empty=reason=>({status:'withheld',reason,year,week,items:[],research:[]});
 if(!Number.isInteger(week)||week<1||week>regularSeasonWeeks||!Array.isArray(ledger?.games))return empty('invalid cutoff');
 const exclusions=new Set(excludedKeys),games=ledger.games.filter(g=>g.stage==='regular'&&!exclusions.has(key(g)));
 const seen=new Set(),appearances=new Set(),groups=new Map();
 for(const g of games){
  if(!Number.isInteger(g.year)||!Number.isInteger(g.week)||g.week<1||g.year>year||g.year===year&&g.week>week||![g.homeScore,g.awayScore].every(Number.isFinite)||!g.home||!g.away||norm(g.home)===norm(g.away))return empty('invalid or mixed-cutoff fixture');
  if(seen.has(key(g)))return empty('duplicate fixture');seen.add(key(g));
  for(const n of [norm(g.home),norm(g.away)]){const k=JSON.stringify([g.year,g.week,n]);if(appearances.has(k))return empty('duplicate manager week');appearances.add(k);}
  const k=g.year+':'+g.week;groups.set(k,(groups.get(k)??0)+1);
 }
 const current=games.filter(g=>g.year===year);
 if(current.length!==week*5||Array.from({length:week},(_,i)=>groups.get(year+':'+(i+1))).some(n=>n!==5))return empty('incomplete current season');
 const active=new Set(current.filter(g=>g.week===week).flatMap(g=>[norm(g.home),norm(g.away)]));
 if(active.size!==10||current.some(g=>!active.has(norm(g.home))||!active.has(norm(g.away))))return empty('inconsistent manager identity');
 const fingerprint=createHash('sha256').update(JSON.stringify(games.map(g=>[key(g),norm(g.home),g.homeScore,g.awayScore]).sort((a,b)=>a[0].localeCompare(b[0])))).digest('hex');
 const research=[];
 for(const [side,id] of [['W','single-season-regular-winning-streak'],['L','single-season-regular-losing-streak']]){
  const runs=new Map(),latest=new Map();let priorBest=0,priorHolders=[],allBest=0,holders=[];
  for(const g of [...games].sort((a,b)=>a.year-b.year||a.week-b.week)){
   for(const [manager,p,q] of [[norm(g.home),g.homeScore,g.awayScore],[norm(g.away),g.awayScore,g.homeScore]]){
    const k=g.year+':'+manager,prev=runs.get(k),result=p>q?'W':p<q?'L':'T';
    const run=result===side?(prev?.week===g.week-1?prev.run:0)+1:0;
    const row={manager,year:g.year,week:g.week,run,startWeek:g.week-run+1};
    runs.set(k,row);
    if(g.year===year)latest.set(manager,row);
    if(run>allBest){allBest=run;holders=[];}
    if(run===allBest&&run>0)holders.push(row);
    if(g.year!==year||g.week<week){
     if(run>priorBest){priorBest=run;priorHolders=[];}
     if(run===priorBest&&run>0)priorHolders.push(row);
    }
   }
  }
  if(priorBest<3)continue;
  for(const row of latest.values()){
   if(row.run<3||row.week!==week)continue;
   const remaining=regularSeasonWeeks-week,alreadyHolder=priorHolders.some(h=>h.manager===row.manager&&h.year===year&&h.startWeek===row.startWeek);
   let type=null;
   if(row.run>priorBest)type=alreadyHolder?'extended':'broken';
   else if(row.run===priorBest&&!alreadyHolder)type='tied';
   else if(row.run<allBest&&allBest-row.run<=2&&allBest-row.run<=remaining)type='approaching';
   if(!type)continue;
   const eventId=JSON.stringify([id,year,week,row.manager,type,row.run]);
   research.push({id,eventId,type,manager:row.manager,year,week,run:row.run,startWeek:row.startWeek,priorRecord:priorBest,record:allBest,holders,priorHolders,remaining,toTie:Math.max(0,allBest-row.run),toBreak:Math.max(0,allBest+1-row.run),scope:'single regular season; contiguous calendar weeks',status:'research-only-not-certified'});
  }
 }
 // Trust boundary: caller must supply reviewed certificates, never infer them
 // from a passing CI job, archive rank, or candidate research status.
 const items=research.filter(e=>certificates.some(c=>c.categoryId===e.id&&c.status==='certified'&&c.year===year&&c.throughWeek===week&&c.ledgerSha256===fingerprint&&c.approvedEventIds?.includes(e.eventId)&&typeof c.reviewReference==='string'&&c.reviewReference.length>0)).map(e=>({...e,status:'certified'}));
 assert.equal(new Set(research.map(e=>e.eventId)).size,research.length);
 return {status:items.length?'certified-items-available':'no-certified-alerts',year,week,ledgerSha256:fingerprint,items,research};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const ledger=read('data/unified_record_book_2016_2026.json'),audit=read('data/week14_2020_2021_stage_classification_audit_v1.json');
 const week=Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
 const excludedKeys=audit.years.flatMap(y=>y.week14Games.map(g=>key({...g,year:y.year})));
 assert.equal(excludedKeys.length,8);
 assert.equal(ledger.games.filter(g=>excludedKeys.includes(key(g))&&g.stage==='regular').length,8);
 // No reviewed watch certificates are currently authorized.
 console.log(JSON.stringify(buildWatch(ledger,{year:2026,week,regularSeasonWeeks:14,excludedKeys}),null,2));
}
