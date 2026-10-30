import fs from 'node:fs';
import {historicalOvrHistory,singleSeasonOvrHistory,SEASON_WEIGHTS} from '../assets/manager-historical-ovr.mjs';
const read=n=>JSON.parse(fs.readFileSync('data/'+n+'.json','utf8'));
const guide=read('season_guide'),careers=read('career_core_generated'),luck=read('all_time_luck_ratings_v1'),endings=read('manager_verified_season_endings_v1');
const playoffBrackets=[...read('verified_espn_playoff_brackets_2016_2019').seasons,...read('verified_sleeper_playoff_brackets_2020_2025').seasons];
const seasonOnly=singleSeasonOvrHistory({guide,careers,luck,playoffBrackets});
if(seasonOnly.length!==10||Object.values(SEASON_WEIGHTS).reduce((a,b)=>a+b,0)!==100)throw Error('Season OVR coverage/weights invalid');
for(const season of seasonOnly){
 const expected=Object.entries(careers.managers).filter(([,c])=>c.annual[String(season.year)]?.games).map(([name])=>name);
 if(season.rows.length!==expected.length||season.rows.some(r=>!expected.includes(r.name)))throw Error('Season OVR manager coverage invalid '+season.year);
 if(season.rows.some((r,i)=>r.rank!==i+1||!Number.isFinite(r.score)||r.score<0||r.score>100))throw Error('Season OVR rank or score invalid '+season.year);
 const champion=season.rows.filter(r=>r.champion);
 if(champion.length!==1||champion[0].name!==guide[season.year].champion)throw Error('Season OVR champion inconsistent '+season.year);
}
const original=historicalOvrHistory({guide,careers,luck,endings,playoffBrackets});
if(original.length!==10||original[0].year!==2016||original.at(-1).year!==2025)throw Error('Historical rating year coverage incorrect');
for(const season of original){
 if(!season.rows.length||season.rows.some(r=>!Number.isFinite(r.ovr)||r.ovr<0||r.ovr>100||!Number.isInteger(r.rank)))throw Error('Invalid historical OVR '+season.year);
 if(new Set(season.rows.map(r=>r.name)).size!==season.rows.length)throw Error('Repeated manager '+season.year);
 const ranks=season.rows.map(r=>r.rank).sort((a,b)=>a-b);
 if(ranks.some((rank,i)=>rank!==i+1))throw Error('Historical ranks must be consecutive '+season.year);
 for(const row of season.rows){
  const manager=careers.managers[row.name];
  if(!manager||!Object.keys(manager.annual).some(y=>Number(y)<=season.year))
   throw Error('Manager rated before joining the league: '+row.name+' '+season.year);
 }
}
const clone=x=>JSON.parse(JSON.stringify(x)),futureCareers=clone(careers),futureLuck=clone(luck);
for(const r of Object.values(futureCareers.managers))if(r.annual['2025']){r.annual['2025'].w+=30;r.w+=30}
for(const l of futureLuck.ranked)if(l.bySeason['2025']){l.bySeason['2025'].expectedWins+=25;l.expectedWins+=25}
const mutated=historicalOvrHistory({guide,careers:futureCareers,luck:futureLuck,endings,playoffBrackets});
for(let i=0;i<original.length-1;i++)if(JSON.stringify(mutated[i])!==JSON.stringify(original[i]))throw Error('Future results leaked into '+original[i].year+' ratings');
const module=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
if(!module.includes('historicalOvrHistory({guide,careers,luck,endings,playoffBrackets})')||!module.includes('Legacy OVR through the years'))throw Error('Manager profile historical OVR rendering missing');
const cards=fs.readFileSync('assets/manager-madden-cards.mjs','utf8');
if(!cards.includes('historicalSeasons=historicalOvrHistory')||!cards.includes("historicalDetails")||!cards.includes("yearEndRatings.length"))throw Error('Historical OVR not available for all former and current managers');
console.log('HISTORICAL OVR PASS: 2016–2025 verified cutoffs, all managers, no future-season leakage');
