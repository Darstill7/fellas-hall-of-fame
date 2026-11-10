// Opponent scoring-average record: completed regular seasons, canonical matchups only.
const container=document.getElementById('opponent-average-record');
const number=(n,dp=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const table=(entries,captionText)=>{
 const t=el('table',undefined,'opponent-average-table');t.append(el('caption',captionText));
 const thead=el('thead'),tr=el('tr');
 for(const heading of ['Rank','Manager','Season','PA / game','Total PA','Games','Record'])tr.append(el('th',heading));
 thead.append(tr);t.append(thead);
 const body=el('tbody');
 for(const item of entries){const line=el('tr');
  for(const value of [item.rank,item.manager,item.year,number(item.average),number(item.pa),item.games,item.w+'–'+item.l+(item.t?'–'+item.t:'')])line.append(el('td',String(value)));
  if(item.rank===1)line.className='record-best';
  body.append(line);
 }t.append(body);return t;
};
async function loadOpponentAverage(){
 try{
  const response=await fetch('../data/unified_record_book_2016_2026.json',{cache:'no-store'});
  if(!response.ok)throw Error('Matchup ledger HTTP '+response.status);
  const source=await response.json();
  if(!Array.isArray(source.games))throw Error('Invalid canonical matchup ledger');
  const bySeason=new Map(),seasonWeeks=new Map();
  for(const game of source.games){
   if(game.stage!=='regular')continue;
   const year=Number(game.year),week=Number(game.week);
   if(!Number.isInteger(year)||!Number.isInteger(week))throw Error('Invalid game year or week');
   const weeks=seasonWeeks.get(year)||new Set();weeks.add(week);seasonWeeks.set(year,weeks);
   const scoreHome=Math.round(Number(game.homeScore)*100),scoreAway=Math.round(Number(game.awayScore)*100);
   if(!Number.isSafeInteger(scoreHome)||!Number.isSafeInteger(scoreAway))throw Error('Non-numeric matchup score');
   for(const [name,forCents,againstCents] of [[game.home,scoreHome,scoreAway],[game.away,scoreAway,scoreHome]]){
    const key=year+'|'+name,item=bySeason.get(key)||{year,manager:name,paCents:0,games:0,w:0,l:0,t:0};
    item.paCents+=againstCents;item.games++;
    if(forCents>againstCents)item.w++;else if(forCents<againstCents)item.l++;else item.t++;
    bySeason.set(key,item);
   }
  }
  const latestYear=Math.max(...seasonWeeks.keys());
  if(!Number.isFinite(latestYear))throw Error('No regular seasons');
  const rows=[...bySeason.values()].map(item=>({...item,pa:item.paCents/100,average:item.paCents/(100*item.games)}));
  // Completed-season results are intentionally not mixed with the in-progress latest year.
  const completed=rows.filter(item=>item.year<latestYear&&item.games>=12)
   .sort((a,b)=>b.average-a.average||b.pa-a.pa||a.year-b.year||a.manager.localeCompare(b.manager));
  if(!completed.length)throw Error('No completed eligible seasons');
  completed.forEach((item,i)=>{item.rank=1+completed.findIndex(other=>other.average===item.average)});
  const winner=completed[0];
  container.replaceChildren();
  const hero=el('div',undefined,'opponent-average-hero');
  hero.append(el('span','ALL-TIME RECORD · HIGHEST OPPONENT SCORING AVERAGE','eyebrow'),
   el('strong',number(winner.average)+' points/game','opponent-average-value'),
   el('p',winner.manager+' · '+winner.year+' · '+number(winner.pa)+' points against over '+winner.games+' games ('+winner.w+'–'+winner.l+(winner.t?'–'+winner.t:'')+')'));
  container.append(hero);
  container.append(table(completed.slice(0,10),'Highest opponent points per regular-season game: all-time top ten'));
  const details=el('details',undefined,'leader-nonholders');
  details.append(el('summary','Explore all '+completed.length+' eligible manager-seasons'));
  details.append(table(completed,'All completed seasons, ranked by opponent points per game'));
  container.append(details);
  const ongoing=rows.filter(item=>item.year===latestYear)
   .sort((a,b)=>b.average-a.average||b.pa-a.pa);
  if(ongoing.length){
   const preview=el('details',undefined,'leader-nonholders');
   preview.append(el('summary',latestYear+' in progress · opponent scoring averages (not eligible for the record yet)'));
   ongoing.forEach((item,i)=>{item.rank=i+1});
   preview.append(table(ongoing,'Current season through Week '+Math.max(...seasonWeeks.get(latestYear))+' · provisional standings'));
   container.append(preview);
  }
  container.append(el('p','Method: opponents\u2019 total regular-season points divided by recorded matchups. Completed seasons with at least 12 recovered games qualify. All years are compared descriptively; ESPN and Sleeper scoring rules differed. Bye weeks are not counted as games.','muted'));
 }catch(error){
  console.error('Opponent scoring average record failed:',error);
  container.replaceChildren(el('p','The opponent scoring-average leaderboard is temporarily unavailable. No historical records are shown without verified matchups.','scope'));
 }
}
if(container)loadOpponentAverage();
