// Source audit: node scripts/verify-regular-season-rivalries.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const source=read('data/season_weekly_matchups_2016_2026_v1.json');
const research=read('data/regular_season_rivalry_receipts_2016_2026w8_v1.json');
const active=new Set(['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott']);
if(research.rivalries.length!==45||research.currentManagerPairs!==45)
 throw Error('Missing current-manager rivalry pairs');
let total=0;
for(const pair of research.rivalries){
 const [a,b]=pair.managers;
 if(!active.has(a)||!active.has(b)||a===b)throw Error('Invalid current-manager rivalry');
 const games=source.seasonYears.flatMap(year=>
  source.bySeason[String(year)].games.filter(x=>x.stage==='regular'&&
    ((x.home===a&&x.away===b)||(x.home===b&&x.away===a)))
     .map(x=>({year,week:x.week,scoreA:x.home===a?x.homeScore:x.awayScore,
       scoreB:x.home===a?x.awayScore:x.homeScore,
       winner:x.winner==='TIE'?null:x.winner==='HOME'?x.home:x.away,margin:x.margin}))
 ).sort((x,y)=>x.year-y.year||x.week-y.week);
 if(pair.played!==games.length||pair.games.length!==games.length)
  throw Error('Head-to-head coverage mismatch '+a+'/'+b);
 for(let i=0;i<games.length;i++){
  const x=pair.games[i],y=games[i];
  if(JSON.stringify(x)!==JSON.stringify(y))throw Error('Head-to-head score mismatch '+a+'/'+b+' #'+i);
 }
 if(pair.record[a]!==games.filter(x=>x.winner===a).length||
   pair.record[b]!==games.filter(x=>x.winner===b).length||
   pair.record.ties!==games.filter(x=>!x.winner).length)
  throw Error('Head-to-head win record mismatch '+a+'/'+b);
 for(const [manager,scoreKey] of [[a,'scoreA'],[b,'scoreB']]){
  const points=Math.round(games.reduce((sum,x)=>sum+x[scoreKey],0)*100)/100;
  if(Math.abs(pair.totalPoints[manager]-points)>.005)
   throw Error('Head-to-head points mismatch '+a+'/'+b);
 }
 total+=games.length;
}
const top=[...research.rivalries].sort((a,b)=>b.played-a.played)[0];
if(top.managers.join('/')!=='Stew/Stilly'||top.played!==20||top.record.Stew!==10||
   top.record.Stilly!==10||Math.abs(top.totalPoints.Stilly-top.totalPoints.Stew-18.38)>.005)
 throw Error('Longest rivalry no longer a 20-game, 10-10 tie');
if(research.rivalries.some(x=>x.games.some(g=>g.year===2026&&g.week>8)))
 throw Error('Unverified future season match leaked into research');
console.log('RIVALRY RECEIPTS VERIFIED: 45 current-manager pairs, '+total+' paired head-to-head meetings; Stilly and Stew 10–10 across 20.');
