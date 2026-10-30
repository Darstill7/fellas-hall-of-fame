import {weeklyOvrHistory} from '../assets/manager-weekly-ovr.mjs';
import fs from 'node:fs';import {makeRatings} from '../assets/fellas-rating-model.mjs';import {makeReportCards} from '../assets/manager-report-card.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p+'.json','utf8'));
const guide=read('season_guide'),careers=read('career_core_generated'),luck=read('all_time_luck_ratings_v1'),endings=read('manager_verified_season_endings_v1'),brackets=read('verified_sleeper_playoff_brackets_2020_2025'),espn=read('verified_espn_playoff_brackets_2016_2019');
const ratings=makeRatings({guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...brackets.seasons]});
const report=makeReportCards({drafts:read('v9_draft_engine'),trades:read('v9_trade_engine'),careers,luck,waivers:read('waiver_award_candidates'),endings,brackets,guide,espn});
const weekly=weeklyOvrHistory({ledger:read('unified_record_book_2016_2026'),guide,careers,luck,endings,playoffBrackets:[...espn.seasons,...brackets.seasons]});
if(weekly.length!==7||weekly.some(w=>w.rows.length!==10))throw Error('Madden weekly roster coverage incomplete');
for(const week of weekly)for(const r of week.rows)if(!Number.isFinite(r.ovr)||r.ovr<0||r.ovr>100)throw Error('Invalid weekly OVR '+week.week+' '+r.name);
if(ratings.length!==14||report.length!==10)throw Error('Incorrect manager population');
for(const r of report){const o=ratings.find(x=>x.name===r.name);if(!o||!Number.isFinite(o.score)||!o.qualifiedYears)throw Error('Madden OVR source missing '+r.name);if(r.scores.waivers!==null||r.scores.lineups!==null)throw Error('Decision skills must remain ungraded');}
const page=fs.readFileSync('analytics/manager-madden-cards.html','utf8'),ui=fs.readFileSync('assets/manager-madden-cards.mjs','utf8'),hub=fs.readFileSync('analytics/power-ratings.html','utf8');
if(!page.includes('manager-madden-cards.mjs')||!hub.includes('manager-madden-cards.html')||!ui.includes('makeRatings({guide,careers,luck,endings,playoffBrackets})')||!ui.includes("makeReportCards({drafts,trades,careers,luck,waivers,endings,brackets,guide,espn})"))throw Error('Madden card source/links disconnected');
if(!ui.includes('trajectory=weekly.filter')||!ui.includes('Biggest rise:')||!ui.includes('<polyline')||!ui.includes('2026 peak through W'))throw Error('OVR trend visualization or summary missing');
if(!ui.includes('weeklyOvrHistory')||!page.includes('id="week"'))throw Error('Madden weekly OVR selector missing');
if(!ui.includes("'N/A'")||!page.includes('not an average'))throw Error('Madden card provenance qualification missing');
console.log('MADDEN MANAGER CARDS PASS: '+ratings.length+' all-time OVR, '+report.length+' active evidence-backed reports');