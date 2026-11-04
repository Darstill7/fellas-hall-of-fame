// Verified championship brackets only. Bye seasons count; consolation does not.
export function buildPlayoffResume(espn,sleeper,name,placementArchive=null){
 const seasons=[...(espn?.seasons||[]),...(sleeper?.seasons||[])].sort((a,b)=>a.year-b.year);
 if(seasons.length!==10||new Set(seasons.map(s=>s.year)).size!==10||
    seasons.some(s=>s.year<2016||s.year>2025))throw Error('Incomplete verified 2016–2025 brackets');
 const manager=name==='Tom'?'Thommy':name;
 const timeline=seasons.map(s=>{
  const entrants=s.participants||s.seeds;
  if(!Array.isArray(entrants)||!Array.isArray(s.finalists)||!s.champion)
   throw Error('Incomplete championship bracket for '+s.year);
  const qualified=entrants.includes(manager),finalist=s.finalists.includes(manager);
  if(finalist&&!qualified)throw Error('Finalist absent from playoff bracket '+s.year);
  const finalPlace=placementArchive?.seasons?.find(y=>y.year===s.year)?.finalPlacements?.find(p=>p.manager===manager)?.place;
  const finish=finalPlace===10?'10th · Shitter of the Year':
    finalPlace&&finalPlace>=3?finalPlace+(finalPlace===3?'rd':finalPlace===4?'th':finalPlace===5?'th':finalPlace===6?'th':finalPlace===7?'th':finalPlace===8?'th':'th')+' place':
    !qualified?'Did not qualify':s.champion===manager?'Champion':finalist?'Runner-up':'Qualified';
  return {year:s.year,qualified,finalist,champion:s.champion===manager,finish,finalPlace,
   bye:qualified&&Array.isArray(s.byes)&&s.byes.includes(manager)};
 });
 const finalRanks=timeline.filter(y=>Number.isInteger(y.finalPlace)).map(y=>y.finalPlace);
 const finalPlaceSummary=finalRanks.length?{
  seasons:finalRanks.length,
  averageFinish:Number((finalRanks.reduce((total,x)=>total+x,0)/finalRanks.length).toFixed(2)),
  topThree:finalRanks.filter(x=>x<=3).length,
  bottomThree:finalRanks.filter(x=>x>=8).length
 }:null;
 return {manager,appearances:timeline.filter(y=>y.qualified).length,
  championshipGames:timeline.filter(y=>y.finalist).length,
  championships:timeline.filter(y=>y.champion).length,timeline,finalPlaceSummary};
}
function node(tag,cls,value){
 const n=document.createElement(tag);
 if(cls)n.className=cls;
 if(value!==undefined)n.textContent=value;
 return n;
}
export async function mountManagerPlayoffResume(){
 const snapshot=document.querySelector('main .hero .profile-career-snapshot');
 const heading=document.querySelector('main .hero h1');
 if(!snapshot||!heading||document.getElementById('profile-playoff-resume'))return;
 const section=node('section','profile-playoff-resume');
 section.id='profile-playoff-resume';
 section.setAttribute('aria-label','Verified playoff résumé');
 const title=node('h2',null,'Playoff résumé');
 const intro=node('p','profile-playoff-intro','Verified championship brackets · 2016–2025. The 2026 season is in progress.');
 const status=node('p','profile-playoff-status','Loading postseason history…');
 status.setAttribute('role','status');
 section.append(title,intro,status);
 snapshot.after(section);
 try{
  const responses=await Promise.all([
   fetch('../../data/verified_espn_playoff_brackets_2016_2019.json'),
   fetch('../../data/verified_sleeper_playoff_brackets_2020_2025.json'),
   fetch('../../data/sleeper_postseason_placement_receipts_2020_2025.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Verified brackets unavailable');
  const [espn,sleeper,placementArchive]=await Promise.all(responses.map(r=>r.json()));
  const resume=buildPlayoffResume(espn,sleeper,heading.textContent.trim(),placementArchive);
  const metrics=node('div','profile-playoff-metrics');
  for(const [label,value] of [
   ['Playoff appearances',resume.appearances],
   ['Championship games',resume.championshipGames],
   ['Championship titles',resume.championships]
  ]){
   const tile=node('div','profile-playoff-metric');
   tile.append(node('strong',null,String(value)),node('span',null,label));
   metrics.append(tile);
  }
  const history=node('details','profile-playoff-history');
  const summary=node('summary',null,'View postseason seasons and results');
  const list=node('ol','profile-playoff-timeline');
  for(const season of resume.timeline){
   const item=node('li',season.qualified?'profile-playoff-qualified':'profile-playoff-not-qualified');
   item.append(node('strong',null,String(season.year)),
    node('span',null,season.finish+(season.bye?' · First-round bye':'')));
   list.append(item);
  }
  const note=node('p','profile-playoff-note',
   'Playoff qualification and completed 2020–2025 finishing positions are sourced from documented brackets. Consolation results do not count as playoff berths. Unverified finishes remain unassigned.');
  history.append(summary);
  if(resume.finalPlaceSummary){
   const f=resume.finalPlaceSummary;
   const sample=node('p','profile-playoff-note profile-playoff-summary',
    'Sleeper-era final finishes: '+f.seasons+' completed '+(f.seasons===1?'season':'seasons')+
    ' · '+f.averageFinish.toFixed(2)+' average place · '+f.topThree+' top-three · '+
    f.bottomThree+' bottom-three.');
   history.append(sample);
  }
  history.append(list,note);
  status.replaceWith(metrics,history);
 }catch(error){
  status.textContent='Verified playoff résumé is temporarily unavailable. Other career history remains accessible below.';
  console.error('Manager playoff résumé unavailable',error);
 }
}

