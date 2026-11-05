import fs from 'node:fs';
import {buildEvidenceSnapshots,ACTIVE_MANAGERS} from '../assets/manager-evidence-snapshots.mjs';
const get=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const audit=get('data-integrity/REPORT_CARD_NA_RECOVERY_AUDIT_2026-11-04.json');
const rows=buildEvidenceSnapshots({
 placements:get('data/fellas_final_placements_2016_2025_verified.json'),
 acquisitions:get('data/manager_acquisition_distinct_v1.json'),
 keeperResearch:get('data/keeper_2025_website_research_v1.json'),
 keeper2026:get('data/keeper_2026_website_research_v1.json'),
 startSit:get('data-integrity/sleeper-start-sit-ui-benchmarks-2026-week8.json'),
 draftTrade:get('data/manager_draft_trade_profile_evidence_v1.json'),
 faab:get('data-integrity/faab-manager-spend-research-v1.json')
});
if(rows.length!==10||audit.rows.length!==10||
 new Set(rows.map(x=>x.manager)).size!==10)throw Error('Expected exactly ten active manager evidence rows');
for(const e of rows){
 const verified=audit.rows.find(x=>x.manager===e.manager);
 if(!verified||!ACTIVE_MANAGERS.includes(e.manager)||
    e.finishing.seasons!==verified.career.completedSeasons||
    e.finishing.topThree!==verified.career.topThree||
    e.pickups.started!==verified.pickups.laterStarted||
    e.pickups.distinct!==verified.pickups.distinct||
    e.startSit.accuracyPercent!==verified.sleeperLineup.week8AccuracyPercent||
    e.keepers.startedPoints!==verified.keepers.startedPoints||
    e.keepers.current.startedPoints!==verified.keepers2026.startedPoints||
    e.keepers.current.starts!==verified.keepers2026.starts||
    e.faab.completedClaims!==verified.faab.completedClaims||
    e.faab.winningSpend!==verified.faab.winningSpend||
    e.drafts.documentedSeasonCount!==verified.drafts.documentedSeasons)
  throw Error('Evidence snapshot differs from original receipts for '+e.manager);
 if(e.faab.gradeStatus!=='not-rated'||e.keepers.current.gradeStatus!=='not-rated'||e.keepers.gradeStatus!=='not-rated'||e.startSit.gradeStatus!=='not-rated'||
    e.pickups.started>e.pickups.distinct)
  throw Error('Unjustified manager-skill grade or impossible pickup count '+e.manager);
}
for(const e of rows){
 if(e.faab.completedClaims!==e.faab.paidWins+e.faab.zeroDollarWins||
    e.faab.years.reduce((n,y)=>n+y.completedClaims,0)!==e.faab.completedClaims||
    e.faab.years.reduce((n,y)=>n+y.winningSpend,0)!==e.faab.winningSpend||
    e.faab.years.some(y=>y.completedClaims!==y.paidWins+y.zeroDollarWins)||
    e.faab.years.some(y=>y.year===2026&&y.winningSpend<0))
  throw Error('Manager FAAB provider source does not reconcile '+e.manager);
}
const cardSource=fs.readFileSync('assets/manager-report-card.mjs','utf8');
if(!cardSource.includes('waivers:null,lineups:null,keepers:null'))
 throw Error('Ungraded managerial decision categories should remain null');
const page=fs.readFileSync('assets/manager-report-card-page.mjs','utf8');
if(!page.includes("key==='trading'&&row.scores.trading===null")||
   !page.includes("row.coverage.verifiedTradeSides+'/4 verified sides'"))
 throw Error('Unrated trading cards must show verified sample counts');
if(!page.includes("v===null?'Not rated'")||!page.includes("score===null?'Not rated'"))
 throw Error('N/A grades must be labeled Not rated with descriptive evidence rather than false scores');
if(!page.includes('buildEvidenceSnapshots(')||!page.includes("evidenceSnapshot(x.name)")||
   !page.includes('report-fact-grid')||!page.includes('report-fact-method')||
   !page.includes('keeper_2025_website_research_v1.json')||
   !page.includes('keeper_2026_website_research_v1.json')||
   !page.includes('faab-manager-spend-research-v1.json')||!page.includes('report-faab-history'))
 throw Error('Evidence not wired into the public report card page');
const css=fs.readFileSync('analytics/manager-report-cards.html','utf8');
if(!css.includes('.report-fact-grid')||!css.includes('min-height:46px'))
 throw Error('New source-backed evidence disclosure lacks mobile presentation or touch targets');
const s=rows.find(x=>x.manager==='Stilly');
if(s.finishing.seasons!==10||s.startSit.accuracyPercent!==92.4||s.keepers.startedPoints!==204.26||
 s.pickups.started!==68||s.faab.completedClaims!==81||s.faab.winningSpend!==460)throw Error('Example Stilly source receipts changed');
console.log('Manager N/A evidence gate: 10 verified manager snapshots; factual metrics displayed; three skill grades remain deliberately unrated.');
