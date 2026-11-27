// Read-only watch research. No public alerts without category-specific certification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const norm=n=>n==='Tom'?'Thommy':n;
const key=g=>JSON.stringify([g.year,g.week,...[norm(g.home),norm(g.away)].sort()]);
export function buildWatch(ledger,{year,week,regularSeasonWeeks,excludedKeys=[],certificates=[]}){
 const empty=reason=>({status:'withheld',reason,year,week,items:[],research:[]});
 if(!Number.isInteger(year)||!Number.isInteger(regularSeasonWeeks)||regularSeasonWeeks<1||!Number.isInteger(week)||week<1||week>regularSeasonWeeks||!Array.isArray(ledger?.games))return empty('invalid cutoff');
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
   if(row.run===allBest&&row.run>priorBest)type=alreadyHolder?'extended':'broken';
   else if(row.run===allBest&&row.run===priorBest&&!alreadyHolder)type='tied';
   else if(row.run<allBest&&allBest-row.run<=2&&allBest-row.run<=remaining)type='approaching';
   if(!type)continue;
   const eventId=JSON.stringify([id,year,week,row.manager,type,row.run]);
   research.push({id,eventId,type,manager:row.manager,year,week,run:row.run,startWeek:row.startWeek,priorRecord:priorBest,record:allBest,holders,priorHolders,remaining,toTie:Math.max(0,allBest-row.run),toBreak:Math.max(0,allBest+1-row.run),scope:'single regular season; contiguous calendar weeks',status:'research-only-not-certified'});
  }
 }
 // Career regular-season streaks may bridge only adjacent seasons with
 // complete manager regular-season coverage and known historical schedules.
 // These are explicitly NOT all-game streaks.
 const ordered=[...games].sort((a,b)=>a.year-b.year||a.week-b.week);
 const historicalLengths={2016:13,2017:12,2018:13,2019:13,2020:13,2021:13,2022:14,2023:14,2024:14,2025:14};
 const managerSeasonWeeks=new Map();
 for(const g of ordered)for(const n of [norm(g.home),norm(g.away)]){
  const k=JSON.stringify([n,g.year]);if(!managerSeasonWeeks.has(k))managerSeasonWeeks.set(k,new Set());managerSeasonWeeks.get(k).add(g.week);
 }
 const full=(n,y,length)=>{const weeks=managerSeasonWeeks.get(JSON.stringify([n,y]));return Number.isInteger(length)&&weeks?.size===length&&Array.from({length},(_,i)=>i+1).every(w=>weeks.has(w));};
 for(const [side,id] of [['W','career-regular-winning-streak'],['L','career-regular-losing-streak']]){
  const runs=new Map(),latest=new Map();let priorBest=0,allBest=0,priorHolders=[],holders=[];
  for(const g of ordered)for(const [manager,p,q] of [[norm(g.home),g.homeScore,g.awayScore],[norm(g.away),g.awayScore,g.homeScore]]){
   const prev=runs.get(manager),result=p>q?'W':p<q?'L':'T';
   const adjacent=prev&&(g.year===prev.year&&g.week===prev.week+1||g.year===prev.year+1&&g.week===1&&prev.week===historicalLengths[prev.year]&&full(manager,prev.year,historicalLengths[prev.year]));
   const run=result===side?(adjacent?prev.run:0)+1:0;
   const row={manager,year:g.year,week:g.week,run,startYear:run>1?prev.startYear:g.year,startWeek:run>1?prev.startWeek:g.week};
   runs.set(manager,row);if(g.year===year)latest.set(manager,row);
   if(run>allBest){allBest=run;holders=[];}if(run===allBest&&run>0)holders.push(row);
   if(g.year!==year||g.week<week){if(run>priorBest){priorBest=run;priorHolders=[];}if(run===priorBest&&run>0)priorHolders.push(row);}
  }
  if(priorBest<3)continue;
  for(const row of latest.values()){
   if(row.run<3||row.week!==week)continue;
   const remaining=regularSeasonWeeks-week,alreadyHolder=priorHolders.some(h=>h.manager===row.manager&&h.startYear===row.startYear&&h.startWeek===row.startWeek);
   let type=null;
   if(row.run===allBest&&row.run>priorBest)type=alreadyHolder?'extended':'broken';
   else if(row.run===allBest&&row.run===priorBest&&!alreadyHolder)type='tied';
   else if(row.run<allBest&&allBest-row.run<=2&&allBest-row.run<=remaining)type='approaching';
   if(type)research.push({...row,id,eventId:JSON.stringify([id,year,week,row.manager,type,row.run]),type,priorRecord:priorBest,record:allBest,holders,priorHolders,remaining,toTie:Math.max(0,allBest-row.run),toBreak:Math.max(0,allBest+1-row.run),scope:'career regular-season streak; postseason ignored; only verified-length adjacent seasons bridged',status:'research-only-not-certified'});
  }
 }
 const careerTotals=new Map();
 const total=(n)=>{if(!careerTotals.has(n))careerTotals.set(n,{wins:0,games:0,pointsCents:0,beforeWins:0,beforeGames:0,beforePointsCents:0});return careerTotals.get(n);};
 for(const g of ordered)for(const [n,p,q] of [[norm(g.home),g.homeScore,g.awayScore],[norm(g.away),g.awayScore,g.homeScore]]){
  const t=total(n),w=Number(p>q),c=Math.round(p*100);
  t.wins+=w;t.games++;t.pointsCents+=c;
  if(g.year!==year||g.week<week){t.beforeWins+=w;t.beforeGames++;t.beforePointsCents+=c;}
 }
 for(const manager of active){
  const t=careerTotals.get(manager),remaining=regularSeasonWeeks-week;
  for(const [id,field,before,targets] of [['career-win-milestone','wins','beforeWins',[25,50,75,100,125,150,175,200]],['career-game-milestone','games','beforeGames',[25,50,75,100,125,150,175,200]],['career-points-milestone','pointsCents','beforePointsCents',[500000,1000000,1500000,2000000,2500000,3000000]]]){
   for(const target of targets){
    const value=t[field],gap=target-value,achieved=t[before]<target&&value>=target;
    // Points are unbounded in theory; only report actual crossings, never
    // imply a projected score is achievable with certainty.
    const approaching=field!=='pointsCents'&&gap>0&&gap<=2&&gap<=remaining;
    if(!achieved&&!approaching)continue;
    const type=achieved?'milestone-achieved':'milestone-approaching',scale=field==='pointsCents'?100:1;
    research.push({id,eventId:JSON.stringify([id,year,week,manager,type,target]),type,manager,year,week,value:value/scale,target:target/scale,gap:Math.max(0,gap)/scale,remaining,scope:'career regular season; points from matchup sums, not official PF',status:'research-only-not-certified'});
   }
  }
 }
 // Scoring record crossings compare against the complete pre-week baseline.
 const scoreRows=ordered.flatMap(g=>[[norm(g.home),norm(g.away),g.homeScore,g.awayScore],[norm(g.away),norm(g.home),g.awayScore,g.homeScore]].map(([manager,opponent,p,q])=>({manager,opponent,year:g.year,week:g.week,p:Math.round(p*100),q:Math.round(q*100)})));
 const isLatest=r=>r.year===year&&r.week===week;
 const priorScores=scoreRows.filter(r=>!isLatest(r)),newScores=scoreRows.filter(isLatest);
 function scoringCrossing(id,prior,latest,direction,scope,scale=100){
  if(!prior.length||!latest.length)return;
  const sign=direction==='low'?-1:1;
  const priorBest=Math.max(...prior.map(r=>sign*r.value)),newBest=Math.max(...latest.map(r=>sign*r.value));
  if(newBest<priorBest)return;
  const priorHolders=prior.filter(r=>sign*r.value===priorBest);
  for(const r of latest.filter(r=>sign*r.value===newBest)){
   const type=newBest===priorBest?'tied':'broken';
   research.push({...r,id,eventId:JSON.stringify([id,year,week,r.manager,r.opponent??null,type,r.value]),year,week,type,value:r.value/scale,priorRecord:priorBest*sign/scale,record:newBest*sign/scale,priorHolders:priorHolders.map(h=>({...h,value:h.value/scale})),scope,status:'research-only-not-certified'});
  }
 }
 for(const [id,eligible,value,direction] of [
  ['weekly-highest-score',()=>true,r=>r.p,'high'],
  ['weekly-lowest-score',()=>true,r=>r.p,'low'],
  ['weekly-highest-score-in-loss',r=>r.p<r.q,r=>r.p,'high'],
  ['weekly-lowest-score-in-win',r=>r.p>r.q,r=>r.p,'low']
 ]){
  scoringCrossing(id,priorScores.filter(eligible).map(r=>({...r,value:value(r)})),newScores.filter(eligible).map(r=>({...r,value:value(r)})),direction,'single regular-season game; raw cross-era points');
 }
 // Historical season totals use only complete known schedules. Active-season
 // alerts identify a threshold already crossed, not a certified final result.
 const seasonScores=new Map();
 for(const r of scoreRows){
  const k=JSON.stringify([r.manager,r.year]),a=seasonScores.get(k)??{manager:r.manager,year:r.year,value:0,before:0,games:0};
  a.value+=r.p;a.games++;if(!isLatest(r))a.before+=r.p;seasonScores.set(k,a);
 }
 const historicalSeasons=[...seasonScores.values()].filter(r=>r.year<year&&full(r.manager,r.year,historicalLengths[r.year]));
 const activeSeasons=[...seasonScores.values()].filter(r=>r.year===year);
 if(historicalSeasons.length){
  const priorBest=Math.max(...historicalSeasons.map(r=>r.value),...activeSeasons.map(r=>r.before));
  const currentBest=Math.max(...activeSeasons.map(r=>r.value));
  for(const r of activeSeasons.filter(r=>r.value===currentBest&&r.value>=priorBest&&r.value>r.before)){
   const type=r.value===priorBest?'tied':r.before===priorBest?'extended':'broken';
   research.push({id:'season-points-threshold',eventId:JSON.stringify(['season-points-threshold',year,week,r.manager,type,r.value]),type,manager:r.manager,year,week,value:r.value/100,priorRecord:priorBest/100,record:r.value/100,scope:'active regular-season cumulative matchup points; completed-season record not final until season end',status:'research-only-not-certified'});
  }
 }
 // Weekly titles deliberately retain the commissioner-approved paired
 // Week 14 exceptions; never include bye scores or partial ordinary weeks.
 const awardGames=ledger.games.filter(g=>g.stage==='regular');
 const awardWeeks=new Map();
 for(const g of awardGames){
  const k=JSON.stringify([g.year,g.week]),a=awardWeeks.get(k)??[];
  a.push({manager:norm(g.home),p:Math.round(g.homeScore*100)},{manager:norm(g.away),p:Math.round(g.awayScore*100)});awardWeeks.set(k,a);
 }
 const titleCounts=new Map();
 for(const [k,a] of awardWeeks){
  const [y,w]=JSON.parse(k),expected=y===2016||([2020,2021].includes(y)&&w===14)?8:10;
  if(a.length!==expected||new Set(a.map(r=>r.manager)).size!==expected||a.some(r=>!Number.isFinite(r.p)))continue;
  for(const side of ['high','low']){
   const best=(side==='high'?Math.max:Math.min)(...a.map(r=>r.p));
   for(const r of a.filter(r=>r.p===best)){
    const id=JSON.stringify([r.manager,side]),t=titleCounts.get(id)??{manager:r.manager,side,value:0,before:0};
    t.value++;if(y!==year||w!==week)t.before++;titleCounts.set(id,t);
   }
  }
 }
 for(const side of ['high','low']){
  const rows=[...titleCounts.values()].filter(r=>r.side===side);
  if(!rows.length)continue;
  const priorBest=Math.max(...rows.map(r=>r.before)),best=Math.max(...rows.map(r=>r.value));
  if(priorBest<1)continue;
  for(const r of rows.filter(r=>active.has(r.manager)&&r.value===best&&r.value>r.before)){
   const type=r.value===priorBest?'tied':r.before===priorBest?'extended':'broken',id='career-weekly-'+side+'-titles';
   research.push({id,eventId:JSON.stringify([id,year,week,r.manager,type,r.value]),type,manager:r.manager,year,week,value:r.value,priorRecord:priorBest,record:best,scope:'weekly scoring awards including approved eight-manager Week 14 sets; tied scores share title',status:'research-only-not-certified'});
  }
 }
 // Rivalry milestones count an unordered meeting once; directional wins
 // belong only to the winner. No assumed future opponent or schedule.
 const pairCounts=new Map();
 for(const g of ordered){
  const participants=[norm(g.home),norm(g.away)].sort(),k=JSON.stringify(participants);
  const t=pairCounts.get(k)??{participants,meetings:0,wins:{[participants[0]]:0,[participants[1]]:0}};
  t.meetings++;
  const winner=g.homeScore>g.awayScore?norm(g.home):g.homeScore<g.awayScore?norm(g.away):null;
  if(winner)t.wins[winner]++;
  if(g.year===year&&g.week===week){
   const emit=(id,manager,opponent,value,owners)=>research.push({id,eventId:JSON.stringify([id,year,week,...(manager?[manager,opponent]:participants),value]),type:'milestone-achieved',manager,opponent,participants:owners,year,week,value,target:value,scope:'regular-season rivalry; observed meetings only',status:'research-only-not-certified'});
   if([10,15,20,25,30].includes(t.meetings))emit('rivalry-meetings-milestone',null,null,t.meetings,participants);
   if(winner&&[5,10,15,20].includes(t.wins[winner]))emit('rivalry-wins-milestone',winner,participants.find(n=>n!==winner),t.wins[winner],[winner]);
  }
  pairCounts.set(k,t);
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
