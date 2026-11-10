// Verified record collections; uses only fully paired regular-season weeks.
// Historical career/season leaders exclude the latest incomplete season.
const root=document.getElementById('verified-record-collections');
const create=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const num=(v,places=2)=>Number(v).toLocaleString('en-US',{minimumFractionDigits:places,maximumFractionDigits:places});
function metricTable(entries,columns,caption){
 const table=create('table',undefined,'record-collections-table');
 table.append(create('caption',caption));
 const head=create('thead'),hrow=create('tr');
 for(const [label] of columns)hrow.append(create('th',label));
 head.append(hrow);table.append(head);
 const body=create('tbody');
 for(const row of entries){
  const tr=create('tr');if(row.rank===1)tr.className='record-collections-leader';
  for(const [,get] of columns)tr.append(create('td',String(get(row))));
  body.append(tr);
 }table.append(body);
 return table;
}
const ranks=(items,metric,descending=true)=>{
 const data=items.map(item=>({...item})).sort((a,b)=>(descending?metric(b)-metric(a):metric(a)-metric(b))||(a.year||0)-(b.year||0)||a.manager.localeCompare(b.manager));
 data.forEach((r,i)=>r.rank=1+data.findIndex(x=>metric(x)===metric(r)));
 return data;
};
function section(name,description,rows,columns,format,limit=10){
 const section=create('section',undefined,'record-collections-family');
 section.append(create('h3',name),create('p',description,'muted'));
 if(!rows.length){section.append(create('p','No eligible verified results.','muted'));return section}
 const winner=rows[0],hero=create('div',undefined,'record-collections-hero');
 hero.append(create('span',winner.manager+(winner.year?' · '+winner.year:''),'record-collections-holder'),
             create('strong',format(winner),'record-collections-number'));
 section.append(hero);
 section.append(metricTable(rows.slice(0,limit),columns,name+' · leaderboard'));
 if(rows.length>limit){
  const details=create('details');details.append(create('summary','Explore the complete '+rows.length+'-entry leaderboard'));
  details.append(metricTable(rows,columns,name+' · all eligible entries'));section.append(details);
 }
 return section;
}
async function start(){
 try{
  const res=await fetch('../data/unified_record_book_2016_2026.json',{cache:'no-store'});
  if(!res.ok)throw Error('Canonical ledger unavailable: '+res.status);
  const ledger=await res.json();
  if(!Array.isArray(ledger.games))throw Error('Invalid matchup records');
  const games=ledger.games.filter(g=>g.stage==='regular');
  const years=[...new Set(games.map(g=>Number(g.year)))];
  const latest=Math.max(...years);
  const weeks=new Map(),seasonMap=new Map(),careerMap=new Map();
  for(const g of games){
   const year=Number(g.year),week=Number(g.week),key=year+'|'+week;
   const home=Math.round(Number(g.homeScore)*100),away=Math.round(Number(g.awayScore)*100);
   if(!Number.isSafeInteger(home)||!Number.isSafeInteger(away))throw Error('Unusable game score');
   const rows=weeks.get(key)||[];
   rows.push({year,week,manager:g.home,points:home,opponent:g.away,against:away},
             {year,week,manager:g.away,points:away,opponent:g.home,against:home});
   weeks.set(key,rows);
  }
  let eligibleWeeks=0,excludedWeeks=0;
  const firstYear=Math.min(...years);
  for(const [weekKey,rows] of weeks){
   const year=rows[0].year,expectedSize=year===firstYear?8:10;
   const names=new Set(rows.map(r=>r.manager));
   if(rows.length!==expectedSize||names.size!==expectedSize){excludedWeeks++;continue}
   eligibleWeeks++;
   const scores=rows.map(r=>r.points);
   for(const r of rows){
    const rank=1+scores.filter(p=>p>r.points).length;
    const key=year+'|'+r.manager,record=seasonMap.get(key)||{
     year,manager:r.manager,games:0,weeklyTitles:0,topThree:0,lowest:0,secondHighLosses:0,
     closeLosses:0,expectedWins:0,actualWins:0,actualTies:0};
    record.games++;
    record.weeklyTitles+=Number(rank===1);
    record.topThree+=Number(rank<=3);
    record.lowest+=Number(!scores.some(p=>p<r.points));
    record.secondHighLosses+=Number(rank===2&&r.points<r.against);
    record.closeLosses+=Number(r.points<r.against&&r.against-r.points<=300);
    record.actualWins+=Number(r.points>r.against);
    record.actualTies+=Number(r.points===r.against);
    const others=scores.filter((_,i)=>rows[i]!==r);
    record.expectedWins+=(others.filter(p=>p<r.points).length+others.filter(p=>p===r.points).length*0.5)/others.length;
    seasonMap.set(key,record);
   }
  }
  const complete=[...seasonMap.values()].filter(s=>s.year<latest);
  for(const s of complete){
   const c=careerMap.get(s.manager)||{year:0,manager:s.manager,games:0,weeklyTitles:0,topThree:0,lowest:0,secondHighLosses:0,closeLosses:0};
   for(const k of ['games','weeklyTitles','topThree','lowest','secondHighLosses','closeLosses'])c[k]+=s[k];
   careerMap.set(s.manager,c);
  }
  const career=[...careerMap.values()];
  const lifetimeTitle=ranks(career,x=>x.weeklyTitles);
  const lifetimeTop=ranks(career,x=>x.topThree);
  const lifetimeLow=ranks(career,x=>x.lowest);
  const lifetimeSecond=ranks(career,x=>x.secondHighLosses);
  const seasonTop=ranks(complete,x=>x.topThree);
  const seasonClose=ranks(complete,x=>x.closeLosses);
  const luck=complete.map(s=>({...s,surplus:s.actualWins+s.actualTies/2-s.expectedWins}));
  const bestLuck=ranks(luck,x=>x.surplus);
  const worstLuck=ranks(luck,x=>x.surplus,false);
  root.replaceChildren();
  const stats=create('p','Verified from '+eligibleWeeks+' fully paired regular-season weeks; '+excludedWeeks+' incomplete weeks excluded from field rankings. Completed seasons: '+firstYear+'–'+(latest-1)+'.','muted');
  root.append(stats);
  const families=[
   {id:'dominance',title:'Weekly Dominance',items:[
    ['Most career weekly scoring titles','Highest-scoring manager in a fully paired league week.',lifetimeTitle,[['#',x=>x.rank],['Manager',x=>x.manager],['Titles',x=>x.weeklyTitles],['Weeks',x=>x.games]],x=>x.weeklyTitles+' weekly titles'],
    ['Most career top-three weekly scores','Rank 1–3 of the entire weekly league field.',lifetimeTop,[['#',x=>x.rank],['Manager',x=>x.manager],['Top three',x=>x.topThree],['Weeks',x=>x.games]],x=>x.topThree+' top-three weeks'],
    ['Most top-three weeks in one season','Regular season only, completed seasons.',seasonTop,[['#',x=>x.rank],['Manager',x=>x.manager],['Year',x=>x.year],['Top three',x=>x.topThree],['Weeks',x=>x.games]],x=>x.topThree+' weeks']
   ]},
   {id:'misery',title:'The Misery Index',items:[
    ['Most career weeks as lowest scorer','Bottom weekly scorer across the complete league field.',lifetimeLow,[['#',x=>x.rank],['Manager',x=>x.manager],['Bottom weeks',x=>x.lowest],['Weeks',x=>x.games]],x=>x.lowest+' bottom finishes'],
    ['Most second-highest scores in losses','Scored second in the league and still lost the head-to-head game.',lifetimeSecond,[['#',x=>x.rank],['Manager',x=>x.manager],['Painful losses',x=>x.secondHighLosses]],x=>x.secondHighLosses+' losses'],
    ['Most narrow defeats in a season','Losses by 3.00 points or fewer in a completed regular season.',seasonClose,[['#',x=>x.rank],['Manager',x=>x.manager],['Year',x=>x.year],['Losses',x=>x.closeLosses]],x=>x.closeLosses+' close losses']
   ]},
   {id:'luck',title:'Luck & Schedule',items:[
    ['Largest schedule advantage','Actual wins minus expected wins from a uniformly random weekly opponent; complete weeks only.',bestLuck,[['#',x=>x.rank],['Manager',x=>x.manager],['Year',x=>x.year],['Actual',x=>x.actualWins],['Expected',x=>num(x.expectedWins)],['Difference',x=>'+'+num(x.surplus)]],x=>'+'+num(x.surplus)+' wins'],
    ['Largest schedule disadvantage','Same all-play method; negative numbers indicate fewer actual wins than expected.',worstLuck,[['#',x=>x.rank],['Manager',x=>x.manager],['Year',x=>x.year],['Actual',x=>x.actualWins],['Expected',x=>num(x.expectedWins)],['Difference',x=>num(x.surplus)]],x=>num(x.surplus)+' wins']
   ]}
  ];
  for(const family of families){
   const node=create('div',undefined,'record-collections-group');node.id='records-'+family.id;
   node.append(create('h2',family.title));
   for(const [name,description,rows,columns,format]of family.items)
    node.append(section(name,description,rows,columns,format));
   root.append(node);
  }
  const current=[...seasonMap.values()].filter(s=>s.year===latest);
  if(current.length){
   const active=create('details',undefined,'record-collections-provisional');
   active.append(create('summary',latest+' provisional weekly rankings · separate from the completed records'));
   active.append(metricTable(ranks(current,x=>x.weeklyTitles),[
    ['#',x=>x.rank],['Manager',x=>x.manager],['Weekly titles',x=>x.weeklyTitles],
    ['Top three',x=>x.topThree],['Bottom',x=>x.lowest],['Weeks',x=>x.games]],latest+' current-season record watch'));
   root.append(active);
  }
  root.append(create('p','Statistical scope: team scores only; postseason excluded. Early ESPN and later Sleeper scoring formats differed. All-play is a descriptive opponent-draw comparison, not a prediction or an alternative official standings table.','muted'));
 }catch(e){
  console.error('Record collection unavailable:',e);
  root.replaceChildren(create('p','Verified record collections are unavailable. No unverified rankings will be substituted.','scope'));
 }
}
if(root)start();
