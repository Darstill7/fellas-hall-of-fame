// Research-only compatibility projections for weekly matchup mirror and schedule luck.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const book=read(root+'unified-record-book-preview.json'),guide=read(root+'season-guide-preview.json'),stats=read(root+'full-era-career-statistics.json');
const old=read('data/season_weekly_matchups_2016_2026_v1.json'),oldLuck=read('data/all_time_luck_ratings_v1.json');
const completedThrough=book.completedThrough;
const bySeason={},managerAnnual={};
for(const s of stats.seasons){
 const games=book.games.filter(g=>g.year===s.year).map(({year,source,...g})=>({...g,weeksCovered:g.weeksCovered??null,twoWeekAggregate:g.twoWeekAggregate??false}));
 const standings=guide[s.year].standings.map(({name,...r})=>({manager:name,...r}));
 const regularGames=games.filter(g=>g.stage==='regular').length,postseasonGames=games.length-regularGames;
 assert.equal(regularGames,guide[s.year].games);
 assert.equal(standings.reduce((n,r)=>n+r.games,0),2*regularGames);
 bySeason[s.year]={year:s.year,complete:s.year<completedThrough.year,regularGames,postseasonGames,standings,games};
 for(const r of standings)(managerAnnual[r.manager]??=[]).push({year:s.year,...r});
}
for(const [m,rows] of Object.entries(managerAnnual))for(const k of ['games','w','l','t'])assert.equal(rows.reduce((n,r)=>n+r[k],0),stats.career[m][k]);
const mirror={...old,scope:'2016–2026 through completed Week '+completedThrough.week+'; verified regular team matchups and archived postseason',seasonYears:stats.seasons.map(s=>s.year),bySeason,managerAnnual,completedThrough,status:'RESEARCH_ONLY'};
const round=n=>Math.round(n*100)/100;
const ranked=Object.entries(stats.career).map(([manager,r])=>{
 const bySeason=Object.fromEntries(stats.seasons.filter(s=>s.managers[manager]).map(s=>{const a=s.managers[manager];return [s.year,{games:a.games,actualWins:a.w+a.t/2,expectedWins:(a.all_play_w+a.all_play_t/2)/(Object.keys(s.managers).length-1)}]}));
 const expectedWins=Object.values(bySeason).reduce((n,a)=>n+a.expectedWins,0);
 assert(Math.abs(expectedWins-stats.records.schedule_luck[manager].expected_wins)<1e-9);
 const actualWins=r.w+r.t/2,luck=actualWins-expectedWins;
 return {manager,games:r.games,actualWins,expectedWins,bySeason,luckWins:round(luck),luckPer14:round(luck/r.games*14)};
}).sort((a,b)=>(b.actualWins-b.expectedWins)-(a.actualWins-a.expectedWins)||a.manager.localeCompare(b.manager));
assert(Math.abs(ranked.reduce((n,r)=>n+r.actualWins-r.expectedWins,0))<1e-9);
const luck={...oldLuck,scope:'2016–2026 verified regular season through completed Week '+completedThrough.week,limitations:['Regular-season results only; 2016 eight-team league normalized using seven opponents.'],ranked,completedThrough,status:'RESEARCH_ONLY'};
fs.writeFileSync(root+'weekly-matchup-mirror-preview.json',JSON.stringify(mirror,null,2)+'\n');
fs.writeFileSync(root+'all-time-luck-preview.json',JSON.stringify(luck,null,2)+'\n');
console.log('MATCHUP MIRROR AND LUCK PROJECTION PASS '+JSON.stringify({seasons:Object.keys(bySeason).length,managers:ranked.length,regular:Object.values(bySeason).reduce((n,s)=>n+s.regularGames,0),completedThrough}));
