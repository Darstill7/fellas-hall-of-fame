// Derived from canonical regular-season matchups, never a hand-maintained leaderboard.
const host=document.getElementById('verified-streak-records');
const format=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const make=(tag,value,className)=>{const el=document.createElement(tag);if(className)el.className=className;if(value!==undefined)el.textContent=value;return el};
const card=(heading,value,detail,context)=>{
 const article=make('article',undefined,'category-card');article.append(make('h3',heading),make('div',value,'category-meta'),make('p',detail),make('small',context,'record-source'));return article;
};
async function render(){
 try{
  const response=await fetch('../data/unified_record_book_2016_2026.json');
  if(!response.ok)throw Error('Canonical matchup history unavailable');
  const book=await response.json();
  const games=book.games.filter(g=>g.stage==='regular');
  if(!games.length)throw Error('No verified regular-season games');
  const weekScores=new Map(),teamSeasons=new Map();
  for(const g of games){
   const weekKey=g.year+'|'+g.week,entries=weekScores.get(weekKey)||[];
   entries.push({name:g.home,points:g.homeScore},{name:g.away,points:g.awayScore});
   weekScores.set(weekKey,entries);
   for(const [name,score,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
    const key=g.year+'|'+name,rows=teamSeasons.get(key)||[];
    rows.push({year:g.year,name,week:g.week,loss:score<against});
    teamSeasons.set(key,rows);
   }
  }
  const weekly=[...weekScores].map(([key,scores])=>{
   const [year,week]=key.split('|').map(Number),top=Math.max(...scores.map(s=>s.points));
   return {year,week,top,names:scores.filter(s=>s.points===top).map(s=>s.name)};
  }).sort((a,b)=>a.year-b.year||a.week-b.week);
  const completed=[],active=new Map();
  for(const w of weekly){
   for(const [name,s] of active){
    if(s.year!==w.year||s.end!==w.week-1||!w.names.includes(name)){
     completed.push(s);active.delete(name);
    }
   }
   for(const name of w.names){
    const current=active.get(name);
    if(current){current.end=w.week;current.length++;current.scores.push(w.top)}
    else active.set(name,{name,year:w.year,start:w.week,end:w.week,length:1,scores:[w.top]});
   }
  }
  completed.push(...active.values());
  completed.sort((a,b)=>b.length-a.length||a.year-b.year||a.start-b.start||a.name.localeCompare(b.name));
  const longest=completed[0],twoPlus=completed.filter(s=>s.length>=2);
  const starts=[];
  for(const rows of teamSeasons.values()){
   rows.sort((a,b)=>a.week-b.week);
   let length=0;
   for(const row of rows){if(!row.loss)break;length++}
   starts.push({name:rows[0].name,year:rows[0].year,length});
  }
  starts.sort((a,b)=>b.length-a.length||a.year-b.year||a.name.localeCompare(b.name));
  const worst=starts[0];
  host.replaceChildren();
  host.append(card('Most consecutive weekly top scores',longest.length+' weeks',
   longest.name+' · '+longest.year+' · Weeks '+longest.start+'–'+longest.end,
   'Weekly league-high scores: '+longest.scores.map(format).join(' / ')));
  host.append(card('Most consecutive losses to open a season',worst.length+' losses',
   worst.name+' · '+worst.year+' · Opened 0–'+worst.length,
   'Regular-season opening results; ongoing seasons included'));
  const details=make('details',undefined,'leader-nonholders');
  const summary=make('summary','Explore every consecutive weekly scoring-title streak ('+twoPlus.length+')');
  const list=make('div',undefined,'category-list');
  for(const s of twoPlus){
   const item=make('div',undefined,'category-card');
   item.append(make('h3',s.name+' · '+s.year+' · '+s.length+' weeks'),
    make('small','Weeks '+s.start+'–'+s.end+' · '+s.scores.map(format).join(' / '),'record-source'));
   list.append(item);
  }
  details.append(summary,list);
  host.append(details);
 }catch(error){
  host.replaceChildren(make('p','The streak audit is temporarily unavailable; consult the verified matchup archive.','scope'));
  console.error('Unable to reconstruct documented streak records',error);
 }
}
if(host)render();
