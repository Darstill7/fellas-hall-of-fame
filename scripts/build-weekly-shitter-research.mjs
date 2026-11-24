// Research-only editorial packet. No article generation or publication.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const cents=n=>{if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw Error('Invalid score');return Math.round(n*100)};
export function buildEditorialPacket(ledger,guide,week,notes=[]){
 const names=new Set(['Stilly','JMid','Thommy','Stew','Scott','Mitch','Tony','Stover','Kuhl','Birch']);
 const games=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
 if(!Number.isInteger(week)||week<1||week>14||Math.max(...games.map(g=>g.week))!==week)throw Error('Requested week must match canonical cutoff');
 const totals=new Map([...names].map(n=>[n,{manager:n,w:0,l:0,t:0,pf:0,pa:0,allPlayW:0,allPlayL:0,allPlayT:0}]));
 let current=[];
 for(let w=1;w<=week;w++){
  const rows=games.filter(g=>g.week===w),seen=new Set(),scores=[];
  if(rows.length!==5)throw Error('Incomplete week '+w);
  for(const g of rows){
   const a=cents(g.homeScore),b=cents(g.awayScore);
   for(const [name,opp,pf,pa] of [[g.home,g.away,a,b],[g.away,g.home,b,a]]){
    if(!names.has(name)||seen.has(name))throw Error('Invalid manager identity in week '+w);
    seen.add(name);const t=totals.get(name);t.pf+=pf;t.pa+=pa;t[pf>pa?'w':pf<pa?'l':'t']++;
    scores.push({manager:name,opponent:opp,pf,pa,result:pf>pa?'W':pf<pa?'L':'T'});
   }
  }
  for(const s of scores){const t=totals.get(s.manager);for(const o of scores.filter(x=>x.manager!==s.manager))t[s.pf>o.pf?'allPlayW':s.pf<o.pf?'allPlayL':'allPlayT']++}
  if(w===week)current=scores.sort((a,b)=>b.pf-a.pf||a.manager.localeCompare(b.manager));
 }
 const standings=guide['2026']?.standings;
 if(!Array.isArray(standings)||standings.length!==10||new Set(standings.map(x=>x.name)).size!==10)throw Error('Standings unavailable');
 for(const s of standings){const t=totals.get(s.name);if(!t||s.games!==week||s.w!==t.w||s.l!==t.l||(s.t??0)!==t.t||cents(s.pf)!==t.pf||cents(s.pa)!==t.pa)throw Error('Standings mismatch: '+s.name)}
 const ranked=current.map(s=>({...s,scoringRank:1+current.filter(o=>o.pf>s.pf).length,season:totals.get(s.manager)}));
 if(!Array.isArray(notes)||notes.some(n=>typeof n.text!=='string'||!n.text.trim()||!['observation','correction','private_background','angle'].includes(n.kind)))throw Error('Invalid commissioner notes');
 return {status:'RESEARCH_ONLY',year:2026,week,source:'Canonical regular-season ledger and reconciled season guide',scoreUnit:'integer hundredths of fantasy points',matchups:games.filter(g=>g.week===week),scoring:ranked,highestScoringLosers:ranked.filter(s=>s.result==='L'),lowestScoringWinners:ranked.filter(s=>s.result==='W').reverse(),closestMatchups:games.filter(g=>g.week===week).sort((a,b)=>Math.abs(cents(a.homeScore)-cents(a.awayScore))-Math.abs(cents(b.homeScore)-cents(b.awayScore))),commissionerNotes:notes.map(n=>({kind:n.kind,text:n.text,verification:'USER_SUPPLIED_UNVERIFIED'})),requiresSeparateEvidence:['playoff simulations at same cutoff','original locked writer picks','trade receipts and ownership','pregame projections and lineup decisions','injury and bye news','upcoming schedule and forecasts'],publication:'Manual editorial review required. Private background never enters public copy.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
 const ledger=read('data/unified_record_book_2016_2026.json'),guide=read('data/season_guide.json');
 const week=Number(process.argv[2]);const notes=process.argv[3]?read(process.argv[3]):[];
 console.log(JSON.stringify(buildEditorialPacket(ledger,guide,week,notes),null,2));
}
