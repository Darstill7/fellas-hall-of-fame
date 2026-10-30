import fs from 'node:fs';
import {makeReportCards,WEIGHTS} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const rows=makeReportCards({drafts:read('v9_draft_engine.json'),trades:read('v9_trade_engine.json'),careers:read('career_core_generated.json'),luck:read('all_time_luck_ratings_v1.json'),waivers:read('waiver_award_candidates.json'),endings:read('manager_verified_season_endings_v1.json'),brackets:read('verified_sleeper_playoff_brackets_2020_2025.json'),guide:read('season_guide.json')});
if(rows.length!==10||new Set(rows.map(r=>r.name)).size!==10)throw Error('Expected all ten current Fellas managers');
if(Object.values(WEIGHTS).reduce((a,b)=>a+b,0)!==100)throw Error('Report-card category weights must total 100');
for(const [i,r] of rows.entries()){
 if(r.rank!==i+1||!Number.isFinite(r.provisional)||r.provisional<0||r.provisional>100)throw Error('Invalid report card score '+r.name);
 if(r.scores.waivers!==null||r.scores.lineups!==null)throw Error('Uncertified waiver/lineup grades must remain N/A');
 if(r.coverage.playoffVerified>r.coverage.playoffEligible||r.coverage.playoffByes>r.coverage.playoffVerified)throw Error('Invalid bracket qualification count '+r.name);
 if(r.coverage.verifiedChampionships<0||r.coverage.minimumPlayoffs<r.coverage.verifiedChampionships)throw Error('Invalid playoff coverage '+r.name);
 if(r.coverage.verifiedTradeSides<4&&r.scores.trading!==null)throw Error('Unqualified trade score '+r.name);
 if(r.coverage.draftPicks<12&&r.scores.drafting!==null)throw Error('Unqualified draft score '+r.name);
}
if(!fs.readFileSync('analytics/manager-report-cards.html','utf8').includes('manager-report-card-page.mjs'))throw Error('Report card UI disconnected');
console.log('Report card preview PASS: '+rows.map(r=>r.name+' '+r.provisional.toFixed(1)).join(' | '));

const brackets=read('verified_sleeper_playoff_brackets_2020_2025.json');
if(brackets.seasons.length!==6||brackets.seasons.some(s=>s.seeds.length!==6||s.byes.length!==2||s.semifinalists.length!==4||s.finalists.length!==2||!s.finalists.includes(s.champion)))throw Error('Invalid certified bracket shape');
const stilly=rows.find(r=>r.name==='Stilly');
if(stilly.coverage.playoffVerified!==3)throw Error('Stilly verified 2022–2025 playoff count mismatch');

// A new canonical weekly win and all-play improvement must move the report-card score;
// playoff qualification is fixed until a newly verified postseason bracket is added.
const original=rows.find(x=>x.name==='Stilly');
const input={drafts:read('v9_draft_engine.json'),trades:read('v9_trade_engine.json'),careers:read('career_core_generated.json'),luck:read('all_time_luck_ratings_v1.json'),waivers:read('waiver_award_candidates.json'),endings:read('manager_verified_season_endings_v1.json'),brackets:read('verified_sleeper_playoff_brackets_2020_2025.json'),guide:read('season_guide.json')};
input.careers.managers.Stilly={...input.careers.managers.Stilly};
input.careers.managers.Stilly.w+=1;input.careers.managers.Stilly.games+=1;
input.luck.ranked=input.luck.ranked.map(x=>x.manager==='Stilly'?{...x,expectedWins:x.expectedWins+1,games:x.games+1}:x);
const revised=makeReportCards(input).find(x=>x.name==='Stilly');
if(revised.provisional<=original.provisional)throw Error('Weekly performance did not improve report-card rating');
if(revised.coverage.playoffVerified!==original.coverage.playoffVerified)throw Error('Regular season update fabricated postseason qualification');
console.log('Weekly report-card response PASS: Stilly '+original.provisional+' -> '+revised.provisional);
