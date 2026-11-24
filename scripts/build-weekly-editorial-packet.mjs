// Evidence-only weekly editorial packet. No article publication or inferred quotes.
import fs from 'node:fs';
import {buildHomeDashboard,buildPersonalDashboard} from '../assets/home-app-v3.mjs';
import {fellasLeague,normalizeManager} from '../assets/league-config.mjs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const guide=read('data/season_guide.json'),ledger=read('data/unified_record_book_2016_2026.json');
const d=buildHomeDashboard(guide,ledger),year=fellasLeague.season,week=d.week;
const race=read('data/playoff_race_v1.json');
const trades=read('data/trade_museum_stage66.json').filter(t=>t.year===year);
const cents=x=>Math.round(x*100);
const matchups=d.latest.map(g=>({home:normalizeManager(g.home),away:normalizeManager(g.away),homeScore:g.homeScore,awayScore:g.awayScore,winner:cents(g.homeScore)===cents(g.awayScore)?null:normalizeManager(g.homeScore>g.awayScore?g.home:g.away),margin:Math.abs(cents(g.homeScore)-cents(g.awayScore))/100,source:g.source}));
const scores=d.standings.map(r=>({manager:r.name,points:r.latest,streak:r.streak,w:r.w,l:r.l,t:r.t??0,pf:r.pf,pa:r.pa})).sort((a,b)=>b.points-a.points||a.manager.localeCompare(b.manager));
const streaks=scores.map(r=>{const games=ledger.games.filter(g=>g.year===year&&g.stage==='regular'&&[normalizeManager(g.home),normalizeManager(g.away)].includes(r.manager)).sort((a,b)=>b.week-a.week);return {manager:r.manager,streak:r.streak,receipts:games.slice(0,Number(r.streak.slice(1))).map(g=>({week:g.week,home:g.home,away:g.away,homeScore:g.homeScore,awayScore:g.awayScore,source:g.source}))}});
const tradeFresh=trades.length>0&&trades.every(t=>t.scoring_through_week===week);
const packet={schema:1,year,week,generatedAt:new Date().toISOString(),revision:process.env.GITHUB_SHA??null,publicationStatus:'RESEARCH_ONLY',matchups,scores,streaks,weeklyMedian:d.median.thresholds.at(-1),medianStandings:d.median.rows,playoff:d.standings.map(r=>{const p=buildPersonalDashboard(d,race,r.name);return {manager:r.name,odds:p.odds,nextOpponent:p.opponent?.name??null}}),tradeStatus:tradeFresh?'CUTOFF_VERIFIED':'UNAVAILABLE_OR_STALE',trades:tradeFresh?trades:[],waivers:{status:'NOT_VERIFIED',entries:[]},writerPredictions:{status:'NOT_VERIFIED',entries:[]},historicalMilestones:{status:'NOT_VERIFIED',entries:[]},groupChatContext:{status:'COMMISSIONER_INPUT_REQUIRED'},sources:['data/season_guide.json','data/unified_record_book_2016_2026.json','data/playoff_race_v1.json','data/trade_museum_stage66.json'],cautions:['Playoff probabilities are model estimates, not official clinches.','Trade points are raw credited starter points, not adjusted trade grades.','No inferred quotes, waiver claims or writer predictions.','No automatic article publication.']};
const out=(process.env.RUNNER_TEMP||'/tmp')+'/fellas-editorial';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/packet.json',JSON.stringify(packet,null,2)+'\n');
console.log('Editorial research only: Week '+week+', '+matchups.length+' games, '+scores.length+' managers, '+streaks.length+' streak receipts; waivers and predictions unverified.');
