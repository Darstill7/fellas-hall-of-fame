import fs from 'node:fs';
import {makeReportCards,WEIGHTS} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const rows=makeReportCards({drafts:read('v9_draft_engine.json'),trades:read('v9_trade_engine.json'),careers:read('career_core_generated.json'),luck:read('all_time_luck_ratings_v1.json'),waivers:read('waiver_award_candidates.json'),endings:read('manager_verified_season_endings_v1.json'),brackets:read('verified_sleeper_playoff_brackets_2020_2025.json'),guide:read('season_guide.json'),espn:read('verified_espn_playoff_brackets_2016_2019.json')});
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
if(stilly.coverage.playoffVerified!==5)throw Error('Stilly verified 2022–2025 playoff count mismatch');

// A new canonical weekly win and all-play improvement must move the report-card score;
// playoff qualification is fixed until a newly verified postseason bracket is added.
const original=rows.find(x=>x.name==='Stilly');
const input={drafts:read('v9_draft_engine.json'),trades:read('v9_trade_engine.json'),careers:read('career_core_generated.json'),luck:read('all_time_luck_ratings_v1.json'),waivers:read('waiver_award_candidates.json'),endings:read('manager_verified_season_endings_v1.json'),brackets:read('verified_sleeper_playoff_brackets_2020_2025.json'),guide:read('season_guide.json'),espn:read('verified_espn_playoff_brackets_2016_2019.json')};
input.careers.managers.Stilly={...input.careers.managers.Stilly};
input.careers.managers.Stilly.w+=1;input.careers.managers.Stilly.games+=1;
input.luck.ranked=input.luck.ranked.map(x=>x.manager==='Stilly'?{...x,expectedWins:x.expectedWins+1,games:x.games+1}:x);
const revised=makeReportCards(input).find(x=>x.name==='Stilly');
if(revised.scores.regular<=original.scores.regular||revised.scores.allPlay<=original.scores.allPlay)throw Error('Weekly performance did not improve component grades');
if(revised.provisional<original.provisional)throw Error('Weekly win reduced overall report-card rating');
if(revised.coverage.playoffVerified!==original.coverage.playoffVerified)throw Error('Regular season update fabricated postseason qualification');
console.log('Weekly report-card response PASS: Stilly '+original.provisional+' -> '+revised.provisional);

const es=read('verified_espn_playoff_brackets_2016_2019.json');
if(es.seasons.length!==4||es.seasons.some(x=>![4,6].includes(x.participants.length)||x.finalists.length!==2))throw Error('ESPN bracket reconstruction invalid');

import {postseasonReport,LAST_COMPLETED_SEASON,HALF_LIFE} from '../assets/manager-postseason-success.mjs';
const endings=read('manager_verified_season_endings_v1.json');
const oldRing=postseasonReport('Thommy',endings);
const newRing=postseasonReport('Scott',endings);
if(oldRing.titles!==4||newRing.titles!==1)throw Error('Historical title counts changed');
if(!(newRing.effectiveTitles>.9&&newRing.effectiveTitles<=1))throw Error('Current title was not fully credited');
if(!(oldRing.effectiveTitles<4&&oldRing.effectiveTitles>1))throw Error('Older title decay/floor invalid');
const test={managers:{Test:[{year:2016,ending:'Champion'},{year:2025,ending:'Champion'},{year:2026,ending:'Champion'},{year:2017,ending:'Runner-up'}]}};
const weighted=postseasonReport('Test',test);
if(weighted.titles!==2||weighted.runners!==1||weighted.titleYears.includes(2026))throw Error('Incomplete season was included in historic results');
const expected=1+(.25+.75*Math.pow(.5,(2025-2016)/3.5));
if(Math.abs(weighted.effectiveTitles-expected)>.002)throw Error('Title half-life changed unexpectedly');
if(LAST_COMPLETED_SEASON!==2025||HALF_LIFE!==3.5)throw Error('Scoring vintage changed without methodology revision');
const page=fs.readFileSync('assets/manager-report-card-page.mjs','utf8');
if(!page.includes("const shown=managerQuery?rows.filter")||!page.includes('Scouting read:'))throw Error('Scouting summary or deep-link filtering missing');
console.log('Championship aging and evidence-gated scouting PASS');

const comparisonMarkup=fs.readFileSync('analytics/manager-report-cards.html','utf8');
const comparisonScript=fs.readFileSync('assets/manager-report-card-page.mjs','utf8');
for(const id of ['compare-a','compare-b','compare-go','comparison'])if(!comparisonMarkup.includes('id="'+id+'"'))throw Error('Missing report-card comparison control: '+id);
for(const guard of ["a.name===b.name","v===null?'N/A'","searchParams.set('a'","searchParams.set('b'","drawComparison()"])if(!comparisonScript.includes(guard))throw Error('Missing comparison invariant: '+guard);
console.log('Report card manager comparisons PASS');

const managerRoutes={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
for(const [slug,name] of Object.entries(managerRoutes)){
 const profile=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!profile.includes('../../analytics/manager-report-cards.html?manager='+name))throw Error('Missing report card profile link for '+name);
}
console.log('All 10 manager profiles link to corresponding report cards');

const auditHTML=fs.readFileSync('analytics/manager-decision-audit.html','utf8');
const auditJS=fs.readFileSync('assets/manager-decision-audit.mjs','utf8');
if(!auditHTML.includes('manager-decision-audit.mjs')||!fs.readFileSync('analytics/manager-report-cards.html','utf8').includes('manager-decision-audit.html'))throw Error('Decision audit not wired');
for(const source of ['v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json'])if(!auditJS.includes(source))throw Error('Decision audit source missing: '+source);
for(const rule of ["!x.keeper","x.year<=2025","String(x.confidence).startsWith('verified')","x.provisional===false","No qualifying evidence","no fallback values shown"])if(!auditJS.includes(rule))throw Error('Decision audit evidence guard missing: '+rule);
console.log('Decision audit source and certification guard PASS');

if(!auditHTML.includes('id="season"'))throw Error('Decision audit year selector unavailable');
for(const expected of ["const matchesYear=x=>","x.year<=2025&&matchesYear(x)","matchesYear(x)&&x.provisional===false",".filter(matchesYear)","for(const id of ['manager','type','season'])"])if(!auditJS.includes(expected))throw Error('Decision audit season filter not applied consistently: '+expected);
for(const file of ['v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json'])if(!auditHTML.includes('../data/'+file))throw Error('Decision audit provenance link missing: '+file);
console.log('Decision audit season filtering and source links PASS');

const annualHTML=fs.readFileSync('analytics/manager-annual-report-cards.html','utf8');
const annualJS=fs.readFileSync('assets/manager-annual-report-cards.mjs','utf8');
if(!annualHTML.includes('manager-annual-report-cards.mjs')||!fs.readFileSync('analytics/manager-report-cards.html','utf8').includes('manager-annual-report-cards.html'))throw Error('Annual report cards not integrated');
for(const source of ['season_guide.json','manager_verified_season_endings_v1.json','verified_espn_playoff_brackets_2016_2019.json','verified_sleeper_playoff_brackets_2020_2025.json','v9_draft_engine.json','v9_trade_engine.json','waiver_award_candidates.json'])if(!annualJS.includes(source))throw Error('Annual report source missing '+source);
for(const rule of ["standing=guide[year].standings.find","year===2026?'Season ongoing'","['Champion','Runner-up'].includes","x.provisional===false","!x.keeper","No scores are shown when source loading fails"])if(!annualJS.includes(rule))throw Error('Annual evidence rule missing '+rule);
console.log('Annual report card source and incomplete-season protections PASS');

for(const row of rows){if(row.evidence.gradedWeight!==row.availableWeight||row.evidence.ungradedWeight!==100-row.availableWeight||row.evidence.notAStatisticalConfidenceInterval!==true)throw Error('Report-card evidence coverage inconsistent '+row.name)}
const timelineHTML=fs.readFileSync('analytics/manager-performance-timeline.html','utf8'),timelineJS=fs.readFileSync('assets/manager-performance-timeline.mjs','utf8');
for(const expected of ['manager-performance-timeline.mjs','id="seasons"','not a reconstructed historical manager-skill rating'])if(!timelineHTML.toLowerCase().includes(expected.toLowerCase()))throw Error('Missing historical timeline guard '+expected);
for(const source of ['season_guide.json','manager_verified_season_endings_v1.json'])if(!timelineJS.includes(source))throw Error('Timeline missing source '+source);
if(!timelineJS.includes('record.w+.5*record.t')||!timelineJS.includes("year===2026?'Ongoing")||!timelineJS.includes('No substitute scores displayed.'))throw Error('Timeline scoring and provisional-year guard missing');
console.log('Timeline and evidence coverage integrity PASS');

import {scoutingProfile} from '../assets/manager-scouting-profile.mjs';
for(const row of rows){const d=scoutingProfile(row);if(!d.headline||!d.limitations.includes('comprehensive waiver and legal start/sit evidence unavailable')||!d.evidence.includes('not an independent fantasy-expert certification'))throw Error('Unqualified scouting claims for '+row.name);}
const reportPage=fs.readFileSync('assets/manager-report-card-page.mjs','utf8');
if(!reportPage.includes("import {scoutingProfile}")||!reportPage.includes('Career scouting dossier'))throw Error('Scouting dossier integration missing');
console.log('Evidence-limited manager scouting dossiers PASS');
