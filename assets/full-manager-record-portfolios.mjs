// Complete league-wide rankings and a personal best for each qualifying manager.
// Pure source-derived function: usable by both Node CI and the browser Record Book.
// No prediction, no projected scoring, no keeper/start-sit advice.
const round=(v,d=2)=>Number(Number(v).toFixed(d));
const n=v=>Math.round(Number(v)*100);
const norm=x=>x==='Thommy'?'Tom':x;
const cmp=(a,b)=>a.localeCompare(b);
export function buildCompleteManagerPortfolios(expanded,unified,finishes){
 if(expanded.categoryCount!==44||!Array.isArray(unified.games)||!Array.isArray(finishes.seasons))
  throw Error('Unsupported historical record source versions');
 const categorySource=new Map(expanded.categories.map(c=>[c.key,c]));
 const mainNames=['Stilly','Stew','Tom','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
 const regular=unified.games.filter(g=>g.stage==='regular');
 const weeksByManager=new Map(),seasonMap=new Map(),careerMap=new Map(),rivalMap=new Map();
 const add=(map,key,row)=>{if(!map.has(key))map.set(key,[]);map.get(key).push(row)};
 for(const g of regular){
  const year=Number(g.year),week=Number(g.week),home=norm(g.home),away=norm(g.away);
  const a=n(g.homeScore),b=n(g.awayScore);
  if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||home===away)throw Error('Invalid canonical matchup '+year+'/'+week);
  for(const row of [
   {manager:home,opponent:away,score:a,against:b},
   {manager:away,opponent:home,score:b,against:a}
  ]){
   const r={...row,year,week,margin:row.score-row.against,
    outcome:row.score>row.against?'W':row.score<row.against?'L':'T',
    era:g.era|| (year<=2019?'ESPN':'Sleeper')};
   add(weeksByManager,row.manager,r);
   add(seasonMap,year+'|'+row.manager,r);
   add(rivalMap,row.manager+'|'+row.opponent,r);
  }
 }
 for(const [manager,items] of weeksByManager){
  items.sort((a,b)=>a.year-b.year||a.week-b.week);
  const games=items.length,wins=items.filter(x=>x.outcome==='W').length,
   losses=items.filter(x=>x.outcome==='L').length,ties=games-wins-losses;
  careerMap.set(manager,{manager,games,wins,losses,ties,items,
   points:items.reduce((a,x)=>a+x.score,0),against:items.reduce((a,x)=>a+x.against,0)});
 }
 const buckets=new Map();
 const put=(id,manager,value,evidence,options={})=>{
  if(!Number.isFinite(value))throw Error('Bad metric '+id);
  if(!buckets.has(id))buckets.set(id,[]);
  buckets.get(id).push({manager,value,year:options.year??null,week:options.week??null,
   evidence, ...(options.opponent?{opponent:options.opponent}:{})});
 };
 const gameEvidence=x=>({year:x.year,week:x.week,opponent:x.opponent,
  points:round(x.score/100),opponentPoints:round(x.against/100),
  outcome:x.outcome,era:x.era});
 for(const [manager,entries] of weeksByManager){
  for(const x of entries){
   const e=gameEvidence(x),margin=round(Math.abs(x.margin)/100);
   put('highest-score',manager,round(x.score/100),e,{year:x.year,week:x.week});
   put('lowest-score',manager,round(x.score/100),e,{year:x.year,week:x.week});
   if(x.outcome==='L'){
    put('highest-score-loss',manager,round(x.score/100),e,{year:x.year,week:x.week});
    put('biggest-defeat',manager,margin,e,{year:x.year,week:x.week});
    put('narrowest-defeat',manager,margin,e,{year:x.year,week:x.week});
   }
   if(x.outcome==='W'){
    put('lowest-score-win',manager,round(x.score/100),e,{year:x.year,week:x.week});
    put('biggest-win',manager,margin,e,{year:x.year,week:x.week});
    put('narrowest-win',manager,margin,e,{year:x.year,week:x.week});
    put('giant-slayer-win',manager,round(x.against/100),e,{year:x.year,week:x.week});
   }
  }
 }
 for(const [manager,c] of careerMap){
  const e={games:c.games};
  const count=filter=>c.items.filter(filter).length;
  for(const [id,val] of [
   ['most-wins',c.wins],['most-games',c.games],['career-points',round(c.points/100)],
   ['points-against',round(c.against/100)],
   ['hundred-club',count(x=>x.score>=10000)],
   ['one-twenty-club',count(x=>x.score>=12000)],
   ['one-forty-club',count(x=>x.score>=14000)],
   ['one-sixty-club',count(x=>x.score>=16000)],
   ['wins-vs-130',count(x=>x.outcome==='W'&&x.against>=13000)],
   ['wins-below-100',count(x=>x.outcome==='W'&&x.score<10000)],
   ['high-score-losses',count(x=>x.outcome==='L'&&x.score>=12000)],
   ['nailbiters',count(x=>x.outcome==='W'&&x.margin<=300)],
   ['one-score-drama',count(x=>Math.abs(x.margin)<=300)],
   ['thirty-plus-wins',count(x=>x.margin>=3000)]
  ])put(id,manager,val,e);
  if(c.games>=60){
   put('win-rate',manager,round(100*(c.wins+c.ties*.5)/c.games),{games:c.games,minimum:60});
   put('career-ppg',manager,round(c.points/(100*c.games)),{games:c.games,minimum:60});
  }
  for(const [id,test] of [
   ['winning-streak',x=>x.outcome==='W'],
   ['scoring-streak-100',x=>x.score>=10000],
   ['scoring-streak-120',x=>x.score>=12000]
  ]){
   let consecutive=0,highest=0,end=null;
   for(const x of c.items){
    consecutive=test(x)?consecutive+1:0;
    if(consecutive>highest){highest=consecutive;end=x}
   }
   if(highest)put(id,manager,highest,{games:c.games,endingYear:end.year,
    endingWeek:end.week,note:'Consecutive documented regular-season appearances (not necessarily consecutive NFL weeks).'});
  }
 }
 for(const [key,rows] of seasonMap){
  const [y,manager]=key.split('|'),year=Number(y);
  if(year>2025||rows.length<12)continue;
  const games=rows.length,wins=rows.filter(x=>x.outcome==='W').length,
   losses=rows.filter(x=>x.outcome==='L').length,ties=games-wins-losses,
   total=rows.reduce((a,x)=>a+x.score,0),against=rows.reduce((a,x)=>a+x.against,0);
  const e={year,games,wins,losses,ties,points:round(total/100),against:round(against/100)};
  for(const [id,val] of [
   ['season-points',e.points],['season-average',round(total/(100*games))],
   ['season-wins',wins],['season-win-rate',round(100*(wins+ties*.5)/games)],
   ['season-point-diff',round((total-against)/100)],
   ['season-140-club',rows.filter(x=>x.score>=14000).length]
  ])put(id,manager,val,e,{year});
 }
 for(const [key,rows] of rivalMap){
  const [manager,opponent]=key.split('|'),meetings=rows.length;
  if(meetings<5)continue;
  const wins=rows.filter(x=>x.outcome==='W').length,
   losses=rows.filter(x=>x.outcome==='L').length,ties=meetings-wins-losses,
   points=rows.reduce((a,x)=>a+x.score,0),against=rows.reduce((a,x)=>a+x.against,0);
  const e={opponent,meetings,wins,losses,ties};
  for(const [id,val] of [
   ['rival-wins',wins],['rival-games',meetings],
   ['rival-margin',round((points-against)/100)],['rival-scoring',round(points/(100*meetings))]
  ])put(id,manager,val,e,{opponent});
  if(meetings>=6)put('rival-percentage',manager,round(100*(wins+ties*.5)/meetings),e,{opponent});
 }
 const placementsByManager=new Map();
 for(const season of finishes.seasons){
  for(const row of season.finishes){
   const manager=norm(row.manager);
   const e={year:season.year,rank:row.rank,teams:season.teams,
    normalized:round(100*(season.teams-row.rank)/(season.teams-1),6)};
   add(placementsByManager,manager,e);
  }
 }
 for(const [manager,ps] of placementsByManager){
  ps.sort((a,b)=>a.year-b.year);
  const years=ps.map(x=>x.year);
  put('seasons-played',manager,ps.length,{years});
  put('top-three-finishes',manager,ps.filter(x=>x.rank<=3).length,{years});
  put('top-half-finishes',manager,ps.filter(x=>x.rank<=Math.floor(x.teams/2)).length,{years});
  if(ps.length>=6)put('average-finish',manager,round(ps.reduce((a,x)=>a+x.normalized,0)/ps.length),
   {years,seasons:ps.length});
  for(let i=1;i<ps.length;i++){
   const prev=ps[i-1],now=ps[i];
   if(now.year!==prev.year+1)continue;
   const evidence={fromYear:prev.year,toYear:now.year,fromRank:prev.rank,toRank:now.rank,
    fromTeams:prev.teams,toTeams:now.teams};
   put('bounceback',manager,round(now.normalized-prev.normalized),evidence,{year:now.year});
  }
 }
 const rankings=[];
 for(const c of expanded.categories){
  const entries=buckets.get(c.key)||[];
  if(!entries.length)throw Error('No reconstructed entries '+c.key);
  const low=c.direction==='low';
  entries.sort((a,b)=>(low?a.value-b.value:b.value-a.value)||
   (a.year??0)-(b.year??0)||(a.week??0)-(b.week??0)||cmp(a.manager,b.manager));
  let rank=0,prev=null;
  entries.forEach((r,i)=>{if(i===0||r.value!==prev){rank=i+1;prev=r.value}r.rank=rank});
  rankings.push({key:c.key,label:c.label,group:c.group,description:c.description,
   unit:c.unit,direction:c.direction,qualifier:c.qualifier,
   rankableEntries:entries.length,
   leagueHolders:entries.filter(x=>x.rank===1),
   leaders:entries.slice(0,20),fullEntries:entries});
 }
 const byCategory=new Map(rankings.map(x=>[x.key,x]));
 const managers=Object.fromEntries(mainNames.map(name=>{
  const results=rankings.map(c=>{
   const eligible=c.fullEntries.filter(r=>r.manager===name);
   if(!eligible.length)return {
    categoryId:c.key,label:c.label,group:c.group,eligible:false,
    status:'no-qualifying-entry',unit:c.unit,qualifier:c.qualifier,
    leagueRank:null,value:null,evidence:null};
   const best=eligible[0];
   return {categoryId:c.key,label:c.label,group:c.group,eligible:true,
    status:best.rank===1?'league-record-coholder':best.rank<=3?'league-top-three':'personal-best',
    unit:c.unit,qualifier:c.qualifier,leagueRank:best.rank,value:best.value,
    year:best.year,week:best.week,evidence:best.evidence,
    eligibleEntries:eligible.length};
  });
  return [name,{manager:name,displayName:name==='Tom'?'Thommy':name,
   categories:results,qualifyingCategories:results.filter(x=>x.eligible).length,
   leagueRecordCategories:results.filter(x=>x.leagueRank===1).length,
   topThreeCategories:results.filter(x=>x.leagueRank!==null&&x.leagueRank<=3).length,
   ineligibleCategoryIds:results.filter(x=>!x.eligible).map(x=>x.categoryId)}];
 }));
 return {schema:'fellas-complete-44-manager-record-portfolios-v1',
  status:'reconstructed-from-canonical-sources',
  cutoff:{currentSeason:2026,throughWeek:9,completedSeasonsThrough:2025},
  sourcePaths:['data/expanded_records_verified_v1.json',
   'data/unified_record_book_2016_2026.json',
   'data/fellas_final_placements_2016_2025_verified.json'],
  categories:rankings,managers,
  coverage:{regularGames:regular.length,teamPerformances:regular.length*2,
   completedSeasons:finishes.seasons.length,categoryCount:rankings.length,
   eligibleManagerCount:mainNames.length}};
}
