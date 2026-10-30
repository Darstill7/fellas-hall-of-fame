import fs from 'node:fs';
import {historicalOvrHistory} from '../assets/manager-historical-ovr.mjs';
const read=n=>JSON.parse(fs.readFileSync('data/'+n+'.json','utf8'));
const guide=read('season_guide'),careers=read('career_core_generated'),luck=read('all_time_luck_ratings_v1'),endings=read('manager_verified_season_endings_v1');
const playoffBrackets=[...read('verified_espn_playoff_brackets_2016_2019').seasons,...read('verified_sleeper_playoff_brackets_2020_2025').seasons];
const original=historicalOvrHistory({guide,careers,luck,endings,playoffBrackets});
if(original.length!==10||original[0].year!==2016||original.at(-1).year!==2025)throw Error('Historical rating year coverage incorrect');
for(const season of original){
 if(!season.rows.length||season.rows.some(r=>!Number.isFinite(r.ovr)||r.ovr<0||r.ovr>100||!Number.isInteger(r.rank)))throw Error('Invalid historical OVR '+season.year);
 if(new Set(season.rows.map(r=>r.name)).size!==season.rows.length)throw Error('Repeated manager '+season.year);
}
const clone=x=>JSON.parse(JSON.stringify(x)),futureCareers=clone(careers),futureLuck=clone(luck);
for(const r of Object.values(futureCareers.managers))if(r.annual['2025']){r.annual['2025'].w+=30;r.w+=30}
for(const l of futureLuck.ranked)if(l.bySeason['2025']){l.bySeason['2025'].expectedWins+=25;l.expectedWins+=25}
const mutated=historicalOvrHistory({guide,careers:futureCareers,luck:futureLuck,endings,playoffBrackets});
for(let i=0;i<original.length-1;i++)if(JSON.stringify(mutated[i])!==JSON.stringify(original[i]))throw Error('Future results leaked into '+original[i].year+' ratings');
const module=fs.readFileSync('assets/manager-profile-madden.mjs','utf8');
if(!module.includes('historicalOvrHistory({guide,careers,luck,endings,playoffBrackets})')||!module.includes('Historical OVR journey'))throw Error('Manager profile historical OVR rendering missing');
console.log('HISTORICAL OVR PASS: 2016–2025 verified cutoffs, all managers, no future-season leakage');
