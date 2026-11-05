// Verified championship brackets only. Bye seasons count; consolation does not.
export function buildPlayoffResume(espn,sleeper,name,placementArchive=null,allEra=null){
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
  const officialSeason=allEra?.seasons?.find(y=>y.year===s.year);
  const official=officialSeason?.finishes?.find(p=>p.manager===manager);
  const finalPlace=official?.rank??placementArchive?.seasons?.find(y=>y.year===s.year)?.finalPlacements?.find(p=>p.manager===manager)?.place;
  const suffix=n=>n%100>=11&&n%100<=13?'th':n%10===1?'st':n%10===2?'nd':n%10===3?'rd':'th';
  const finish=allEra&&officialSeason&&!official?'Not in league':
    finalPlace===10&&s.year>=2020?'10th · Shitter of the Year':
    finalPlace===officialSeason?.teams&&s.year<=2019?'Last place · ESPN':
    finalPlace===1?'Champion':
    finalPlace===2?'Runner-up':
    finalPlace?finalPlace+suffix(finalPlace)+' of '+(officialSeason?.teams||10):
    !qualified?'Did not qualify':s.champion===manager?'Champion':finalist?'Runner-up':'Qualified';
  return {year:s.year,qualified,finalist,champion:s.champion===manager,finish,finalPlace,
   bye:qualified&&Array.isArray(s.byes)&&s.byes.includes(manager)};
 });
 const allEraRow=allEra?.managers?.find(m=>m.manager===manager);
 const allEraSummary=allEraRow?{
  seasons:allEraRow.seasonsPlayed,finishScore:allEraRow.meanFinishScore,
  topThree:allEraRow.topThree,topHalf:allEraRow.topHalf,
  lastPlace:allEraRow.lastPlaceFinishes.length
 }:null;
 const finalRanks=timeline.filter(y=>Number.isInteger(y.finalPlace)&&y.year>=2020).map(y=>y.finalPlace);
 const finalPlaceSummary=finalRanks.length?{
  seasons:finalRanks.length,
  averageFinish:Number((finalRanks.reduce((total,x)=>total+x,0)/finalRanks.length).toFixed(2)),
  topThree:finalRanks.filter(x=>x<=3).length,
  bottomThree:finalRanks.filter(x=>x>=8).length
 }:null;
 return {manager,appearances:timeline.filter(y=>y.qualified).length,
  championshipGames:timeline.filter(y=>y.finalist).length,
  championships:timeline.filter(y=>y.champion).length,timeline,finalPlaceSummary,allEraSummary};
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
 const title=node('h2',null,'Career résumé');
 const intro=node('p','profile-playoff-intro','Championships, playoff results and final finishes · verified completed seasons, 2016–2025. The 2026 season is still in progress.');
 const status=node('p','profile-playoff-status','Loading postseason history…');
 status.setAttribute('role','status');
 section.append(title,intro,status);
 snapshot.after(section);
 try{
  const responses=await Promise.all([
   fetch('../../data/verified_espn_playoff_brackets_2016_2019.json'),
   fetch('../../data/verified_sleeper_playoff_brackets_2020_2025.json'),
   fetch('../../data/sleeper_postseason_placement_receipts_2020_2025.json'),
   fetch('../../data/fellas_final_placements_2016_2025_verified.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Verified brackets unavailable');
  const [espn,sleeper,placementArchive,allEra]=await Promise.all(responses.map(r=>r.json()));
  const resume=buildPlayoffResume(espn,sleeper,heading.textContent.trim(),placementArchive,allEra);
  // Show the high-level finishing résumé before the deeper season-by-season archive.
  const completed=resume.timeline.filter(year=>Number.isInteger(year.finalPlace));
  const mostRecent=completed.at(-1);
  const bestPlace=completed.length?Math.min(...completed.map(year=>year.finalPlace)):null;
  const context=node('div','profile-career-finish-summary');
  context.setAttribute('aria-label','Verified career finishing summary');
  const contextHeading=node('strong',null,'Completed-season results');
  const line=node('p',null,
   (resume.allEraSummary?resume.allEraSummary.seasons:completed.length)+' documented seasons · '+
   (resume.allEraSummary?resume.allEraSummary.topThree:completed.filter(year=>year.finalPlace<=3).length)+
   ' top-three finishes · '+(bestPlace===null?'No verified final place':'Best finish: #'+bestPlace));
  context.append(contextHeading,line);
  if(mostRecent)context.append(node('p','profile-career-latest',
   'Most recent completed season: '+mostRecent.year+' · '+mostRecent.finish));
  section.insertBefore(context,status);
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
   'All 2016–2025 final positions come from official ESPN ranks and verified Sleeper brackets. ESPN last place and Sleeper Shitter Bowl are distinct formats. Consolation teams do not count as playoff qualifiers.');
  history.append(summary);
  if(resume.allEraSummary){
   const era=resume.allEraSummary;
   history.append(node('p','profile-playoff-note profile-playoff-allera',
    '2016–2025 final places: '+era.seasons+' seasons · '+era.finishScore.toFixed(2)+
    '/100 field-adjusted finish score · '+era.topThree+' top-three finishes · '+
    era.lastPlace+' last-place finishes. 2016 had eight teams.'));
  }
  if(resume.finalPlaceSummary){
   const f=resume.finalPlaceSummary;
   const sample=node('p','profile-playoff-note profile-playoff-summary',
    'Sleeper-era final finishes: '+f.seasons+' completed '+(f.seasons===1?'season':'seasons')+
    ' · '+f.averageFinish.toFixed(2)+' average place · '+f.topThree+' top-three · '+
    f.bottomThree+' bottom-three.');
   history.append(sample);
  }
  history.append(list,note);
  const recordsLink=node('a','profile-career-record-link','Explore all career records →');
  recordsLink.href='../record-books.html?manager='+encodeURIComponent(resume.manager)+'#owned-records';
  status.replaceWith(metrics,history,recordsLink);
 }catch(error){
  status.textContent='Verified playoff résumé is temporarily unavailable. Other career history remains accessible below.';
  console.error('Manager playoff résumé unavailable',error);
 }
}

