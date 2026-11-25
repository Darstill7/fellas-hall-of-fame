// Evidence-only weekly editorial packet. No article publication or inferred quotes.
import fs from 'node:fs';
import {matchesRecordWatchScores} from '../assets/weekly-record-watch.mjs';
import {captureRecordOwnership,ownershipWatchPath,verifyOwnershipWatch} from './weekly-record-ownership.mjs';
import {buildEditorialPacket} from './build-weekly-shitter-research.mjs';
import {buildEditorialContext} from './weekly-shitter-context.mjs';
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
// Compare this week's results against earlier recorded regular-season games only.
const prior=ledger.games.filter(g=>g.stage==='regular'&&(g.year<year||(g.year===year&&g.week<week)));
const observations=(games,name)=>games.flatMap(g=>normalizeManager(g.home)===name?[{game:g,points:cents(g.homeScore),against:cents(g.awayScore)}]:normalizeManager(g.away)===name?[{game:g,points:cents(g.awayScore),against:cents(g.homeScore)}]:[]);
const milestones=[];
for(const row of scores){
 const history=observations(prior,row.manager),current=observations(d.latest,row.manager)[0];
 if(!current||!history.length)continue;
 const add=(category,value,previous,receipt,relation)=>milestones.push({manager:row.manager,category,value,previous,relation,priorGames:history.length,receipt,scope:'Recorded regular-season matchups; raw scores across scoring eras; archive coverage may be incomplete'});
 const max=history.reduce((a,b)=>b.points>a.points?b:a),min=history.reduce((a,b)=>b.points<a.points?b:a);
 if(current.points>=max.points)add('career-high-week',current.points/100,max.points/100,max.game,current.points===max.points?'TIED':'NEW');
 if(current.points<=min.points)add('career-low-week',current.points/100,min.points/100,min.game,current.points===min.points?'TIED':'NEW');
 const margin=current.points-current.against;
 const best=history.reduce((a,b)=>(b.points-b.against)>(a.points-a.against)?b:a);
 const worst=history.reduce((a,b)=>(b.points-b.against)<(a.points-a.against)?b:a);
 if(margin>0&&margin>=best.points-best.against)add('largest-win-margin',margin/100,(best.points-best.against)/100,best.game,margin===best.points-best.against?'TIED':'NEW');
 if(margin<0&&margin<=worst.points-worst.against)add('largest-loss-margin',-margin/100,(worst.against-worst.points)/100,worst.game,margin===worst.points-worst.against?'TIED':'NEW');
 // Keep streak comparisons inside each season; missing weeks break a run.
 const outcome=x=>x.points>x.against?'W':x.points<x.against?'L':'T';
 const kind=row.streak[0],run=Number(row.streak.slice(1));
 if(kind==='T')continue;
 // Exclude the entire active streak from the previous benchmark.
 const startWeek=week-run+1;
 let longest=0,count=0,last=null,end=null,receipt=null;
 for(const x of history.filter(x=>x.game.year!==year||x.game.week<startWeek).sort((a,b)=>a.game.year-b.game.year||a.game.week-b.game.week)){
  count=outcome(x)===kind?(last&&last.year===x.game.year&&last.week+1===x.game.week?count+1:1):0;
  if(count>longest){longest=count;end=x.game;receipt={year:end.year,endWeek:end.week,startWeek:end.week-count+1};}
  last=x.game;
 }
 if(longest>0&&run>=longest)milestones.push({manager:row.manager,category:kind==='W'?'longest-within-season-winning-streak':'longest-within-season-losing-streak',value:run,previous:longest,relation:run===longest?'TIED':'NEW',receipt,scope:'Recorded consecutive regular-season weeks within a single season; gaps break streaks'});
}
const originalResearch=buildEditorialPacket(ledger,guide,week,[]);
const originalContext=buildEditorialContext(originalResearch,ledger,race,trades);
let recordOwnership={status:'UNAVAILABLE_OR_STALE',entries:[]};
if(fs.existsSync(ownershipWatchPath)){
 try{
  const report=read(ownershipWatchPath);
  const entries=verifyOwnershipWatch(report,captureRecordOwnership(read));
  recordOwnership={status:'APPROVED_LEDGER_VERIFIED',previousWeek:report.previousWeek,week:report.week,entries};
 }catch(error){
  console.warn('Ownership changes omitted from editorial packet: '+error.message);
 }
}
async function currentWeeklySource(path,weekField){
 if(!fs.existsSync(path))return null;
 try{
  const source=read(path);
  if(source.year===year&&source[weekField]===week&&
   await matchesRecordWatchScores(ledger,year,source.seasonScoreHash))return source;
 }catch(error){console.warn('Weekly source omitted: '+path+' · '+error.message);}
 return null;
}
const freshness=await currentWeeklySource('data/site-freshness-v58.json','approvedWeek');
const attainable=await currentWeeklySource('data/conditional-record-watch-v51.json','throughWeek');
const sourceFreshness=freshness?{approvedWeek:week,surfaces:freshness.surfaces,specialtyGaps:freshness.specialtyGaps}:null;
const attainableMilestones=attainable?
 {status:'APPROVED_LEDGER_VERIFIED',careerWins:attainable.careerWins,winningStreaks:attainable.items}:
 {status:'UNAVAILABLE_OR_STALE'};
const packet={originalResearch,originalContext,recordOwnership,sourceFreshness,attainableMilestones,schema:1,year,week,generatedAt:new Date().toISOString(),revision:process.env.GITHUB_SHA??null,publicationStatus:'RESEARCH_ONLY',matchups,scores,streaks,weeklyMedian:d.median.thresholds.at(-1),medianStandings:d.median.rows,playoff:d.standings.map(r=>{const p=buildPersonalDashboard(d,race,r.name);return {manager:r.name,odds:p.odds,nextOpponent:p.opponent?.name??null}}),tradeStatus:tradeFresh?'CUTOFF_VERIFIED':'UNAVAILABLE_OR_STALE',trades:tradeFresh?trades:[],waivers:{status:'NOT_VERIFIED',entries:[]},writerPredictions:{status:'NOT_VERIFIED',entries:[]},historicalMilestones:{status:'LEDGER_DERIVED_REVIEW_REQUIRED',entries:milestones},groupChatContext:{status:'COMMISSIONER_INPUT_REQUIRED'},sources:['data/season_guide.json','data/unified_record_book_2016_2026.json','data/playoff_race_v1.json','data/trade_museum_stage66.json'],cautions:['Playoff probabilities are model estimates, not official clinches.','Trade points are raw credited starter points, not adjusted trade grades.','No inferred quotes, waiver claims or writer predictions.','No automatic article publication.']};
const out=(process.env.RUNNER_TEMP||'/tmp')+'/fellas-editorial';fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/packet.json',JSON.stringify(packet,null,2)+'\n');
console.log('Editorial research only: Week '+week+', '+matchups.length+' games, '+scores.length+' managers, '+streaks.length+' streak receipts; waivers and predictions unverified.');
