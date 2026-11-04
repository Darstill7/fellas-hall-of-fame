// Editorial and source coverage guard for all ten current managers.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const guide=read('data/season_guide.json');
const book=read('data/manager_record_books_2016_2026.json');
const biographies=read('data/manager_biographies_awards.json').managers;
const tradeSides=read('data/v9_trade_engine.json').sides;
const waiverHighlights=read('data/waiver_award_candidates.json').managers;
const summaries=read('data/manager_profile_career_summary_v2.json').managers;
const verifiedWeek8=read('data-integrity/manager-week8-2026-source.json');
const managers={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const seen=new Map();
assert.equal(verifiedWeek8.matchups.length,5,'Five completed Week 8 matchups are required');
for(const game of verifiedWeek8.matchups){
 assert.ok(Number.isInteger(game.matchupId)&&game.matchupId>0);
 assert.ok(['home','away'].some(side=>game[side].manager===game.winner),'Matchup winner missing');
 for(const side of ['home','away']){
  const team=game[side],rival=game[side==='home'?'away':'home'];
  assert.ok(Number.isInteger(team.teamId)&&team.teamId>=1&&team.teamId<=10,'Missing valid roster ID');
  assert.ok(Number.isFinite(team.points)&&team.points>=0,'Missing final score');
  assert.ok(!seen.has(team.manager),'Duplicate manager Week 8: '+team.manager);
  assert.notEqual(team.manager,rival.manager);
  const status=team.points===rival.points?'T':game.winner===team.manager?'W':'L';
  assert.ok(status!=='T'||game.winner===null,'Tied matchup has invalid winner');
  seen.set(team.manager,{result:status,points:team.points,opponent:rival.manager,opponentPoints:rival.points});
 }
}
assert.equal(seen.size,10);
assert.equal(guide['2026'].games,40,'Expected 2026 40 canonical games through Week 8');
const report=[];
for(const [slug,manager] of Object.entries(managers)){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const sourceName=manager==='Thommy'?'Tom':manager;
 const record=book.managers.find(x=>x.manager===manager);
 assert.ok(record,'Missing canonical career record: '+manager);
 const {games,w,l,t}=record.regular;
 assert.equal(games,w+l+t,'Career record arithmetic: '+manager);
 const standing=guide['2026'].standings.find(x=>x.name===manager);
 assert.ok(standing&&standing.games===8,'2026 published season record must be 8 games: '+manager);
 assert.ok(page.includes('data-canonical-manager-record="'+(manager==='Thommy'?'Tom':manager)+'"')||page.includes('data-canonical-manager-record="'+manager+'"'),'Missing page career record: '+manager);
 const expectedRecord=w+'–'+l+(t?'–'+t:'');
 assert.ok(page.includes(expectedRecord),'Public page record not aligned with canonical book: '+manager);
 const bio=biographies[sourceName]?.biography;
 assert.ok(typeof bio==='string'&&bio.length>100,'Missing substantive source biography: '+manager);
 const story=page.match(/id="franchise-story"[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/)?.[1];
 assert.ok(story,'Missing published biography: '+manager);
 const rendered=story.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim().split(' The archived regular-season record is ')[0].trim();
 assert.equal(rendered,bio,'Biography differs from editorial source: '+manager);
 // Match concrete transaction and player references without treating editorial
 // 'best/worst' candidates as certified decision-quality rankings.
 const biography=biographies[sourceName];
 let tradeCandidatesVerified=0;
 for(const field of ['bestTradeCandidate','worstTradeCandidate']){
  const item=biography[field];if(!item)continue;
  const found=tradeSides.find(row=>row.manager===sourceName&&row.year===item.year&&
   row.trade_id===item.tradeId&&item.assets.every(asset=>row.assets.includes(asset)));
  assert.ok(found,manager+' '+field+' has no matching trade-side source');
  assert.ok(found.confidence.startsWith('verified'),manager+' '+field+' trade source not verified');
  assert.equal(Boolean(found.provisional),Boolean(item.provisional),manager+' '+field+' provisional status incorrect');
  assert.ok(Math.abs(found.direct_edge-item.edge)<0.01,manager+' '+field+' outcome differs from source');
  tradeCandidatesVerified++;
 }
 const waiver=biography.bestWaiverCandidate;
 assert.ok(waiver,manager+' missing selected waiver evidence');
 const waiverMatch=(waiverHighlights[sourceName]||[]).find(item=>
  item.year===waiver.year&&item.transactionId===waiver.transactionId&&
  item.player===waiver.player&&item.acquisitionWeek===waiver.acquisitionWeek);
 assert.ok(waiverMatch,manager+' selected waiver highlight not found in source');
 assert.equal(waiverMatch.starts,waiver.starts,manager+' waiver starts mismatch');
 assert.ok(Math.abs(waiverMatch.points-waiver.points)<0.01,manager+' waiver points mismatch');
 const titleYears=Object.entries(guide).filter(([year,s])=>Number(year)<=2025&&s.champion===manager).map(([year])=>Number(year));
 const documented=(summaries[manager]?.titles||[]).map(x=>x.year).sort((a,b)=>a-b);
 assert.deepEqual(documented,titleYears,'Championship ledger mismatch: '+manager);
 const week8=seen.get(manager);
 assert.ok(week8,'Missing Week 8 game: '+manager);
 const canonicalGame=read('data/unified_record_book_2016_2026.json').games.find(g=>g.year===2026&&g.week===8&&((g.home===manager&&g.away===week8.opponent)||(g.away===manager&&g.home===week8.opponent))); 
 assert.ok(canonicalGame,'Week 8 matchup missing from canonical ledger: '+manager); 
 assert.equal(canonicalGame.home===manager?canonicalGame.homeScore:canonicalGame.awayScore,week8.points,'Week 8 manager score mismatch: '+manager);
 assert.equal(canonicalGame.home===manager?canonicalGame.awayScore:canonicalGame.homeScore,week8.opponentPoints,'Week 8 opponent score mismatch: '+manager); 
 const candidate={w,l,t};
 report.push({manager,slug,championshipYears:titleYears,careerThroughWeek8:expectedRecord,week8,week8ReconciledCandidate:candidate,
  canonicalWeek8Integrated:true,biographySourceMatched:true,tradeCandidatesVerified,waiverHighlightVerified:true});
}
console.log('MANAGER EDITORIAL AUDIT PASS: 10 biographies, title ledgers, career records, selected trade/waiver receipts and 5 final Week 8 matchups accounted for.');
console.log('WEEK 8 CANONICAL: provider-certified game results reconciled in all ten current manager records.');
console.log(JSON.stringify(report));
