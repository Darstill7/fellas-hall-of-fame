import {makeRatings} from './fellas-rating-model.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const zero=()=>({games:0,w:0,l:0,t:0});
function result(a,b){return a>b?'w':a<b?'l':'t'}
export function weeklyOvrHistory({ledger,guide,careers,luck,endings,playoffBrackets}){
 const complete=ledger.games.filter(g=>g.year===2026&&g.stage==='regular'&&g.week<=7);
 const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
 const output=[];
 for(let week=1;week<=7;week++){
  const games=complete.filter(g=>g.week<=week),latest=games.filter(g=>g.week===week);
  if(latest.length!==5)throw Error('Unverified 2026 matchup coverage at week '+week);
  const careerData=clone(careers),luckData=clone(luck);
  const weeks=new Map();
  for(let w=1;w<=week;w++){
   const matches=games.filter(g=>g.week===w);
   if(matches.length!==5)throw Error('Missing 2026 weekly pairing '+w);
   const scores=matches.flatMap(g=>[[g.home,g.homeScore],[g.away,g.awayScore]]);
   if(new Set(scores.map(x=>x[0])).size!==10)throw Error('Duplicate or missing owner '+w);
   weeks.set(w,scores);
  }
  for(const name of names){
   const annual=zero();let expected=0;
   for(const g of games)for(const [owner,points,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]])if(owner===name){annual.games++;annual[result(points,against)]++}
   for(const scores of weeks.values()){const own=scores.find(s=>s[0]===name);if(!own)throw Error('Missing weekly owner '+name);expected+=scores.reduce((n,x)=>n+(x[0]!==name?(own[1]>x[1]?1:own[1]===x[1]?.5:0):0),0)/9}
   const career=careerData.managers[name];if(!career?.annual?.['2026'])throw Error('Missing current manager '+name);
   const original=career.annual['2026'];
   for(const k of ['games','w','l','t'])career[k]+=annual[k]-original[k];
   career.annual['2026']=annual;
   const l=luckData.ranked.find(x=>x.manager===name);if(!l?.bySeason?.['2026'])throw Error('Missing 2026 all-play source '+name);
   const prior=l.bySeason['2026'];l.games+=annual.games-prior.games;l.expectedWins+=expected-prior.expectedWins;l.actualWins+=annual.w-prior.actualWins;
   l.bySeason['2026']={games:annual.games,actualWins:annual.w,expectedWins:expected};
  }
  const rows=makeRatings({guide,careers:careerData,luck:luckData,endings,playoffBrackets});
  output.push({week,rows:rows.filter(r=>names.includes(r.name)).map(r=>({name:r.name,ovr:r.score,rank:r.rank,career:r.career,breakdown:r.breakdown}))});
 }
 return output;
}
