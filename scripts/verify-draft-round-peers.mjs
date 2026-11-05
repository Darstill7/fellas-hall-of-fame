import fs from 'node:fs';
import {buildDraftRoundPeers} from '../assets/manager-draft-round-peers.mjs';
import {buildDraftProduction} from '../assets/manager-draft-production.mjs';
const assert=(value,message)=>{if(!value)throw Error(message)};
const rows=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8'));
assert(Array.isArray(rows)&&rows.length>=1000,'Draft engine missing expected seasons');
const managers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
let compared=0;
for(const manager of managers){
 const result=buildDraftRoundPeers(rows,manager);
 const production=buildDraftProduction(rows,manager);
 assert(result.status==='descriptive_peer_comparison_not_draft_skill','Comparison mislabeled '+manager);
 assert(result.selectedPicks===production.selectionCount,'Production scope mismatch '+manager);
 assert(result.comparablePicks+result.uncomparablePicks===result.selectedPicks,'Missing peer observations '+manager);
 assert(result.byYear.every(r=>r.year>=2020&&r.year<=2025),'Provisional 2026 leaked '+manager);
 assert(result.byYear.reduce((n,y)=>n+y.comparablePicks,0)===result.comparablePicks,'Annual peer count mismatch '+manager);
 assert(result.byYear.every(y=>y.aboveMedian+y.atMedian+y.belowMedian===y.comparablePicks),'Peer partition broken '+manager);
 assert(result.examples.every(e=>e.difference>0&&e.peerCount>=5),'Ineligible positive example '+manager);
 const expected=rows.filter(p=>p.manager===(manager==='Thommy'?'Tom':manager)&&p.year>=2020&&p.year<=2025&&!p.keeper).length;
 assert(result.selectedPicks===expected,'Incorrect manager attribution '+manager);
 compared+=result.comparablePicks;
}
assert(compared===880,'Unexpected number of year-round comparable selections: '+compared);
const make=(manager,overall,points,year=2025,round=1,keeper=false)=>({
 manager,overall,year,round,player:'Test '+overall,keeper,reg_starts:1,reg_starter_points:points
});
const benchmark=[make('Stilly',1,100),make('Stew',2,0),make('Tony',3,10),
 make('Birch',4,20),make('Mitch',5,30),make('Kuhl',6,40)];
const one=buildDraftRoundPeers(benchmark,'Stilly');
assert(one.comparablePicks===1&&one.examples[0].peerMedian===20&&one.examples[0].difference===80,
 'Leave-one-out median must exclude selection itself');
assert(buildDraftRoundPeers(benchmark.slice(0,5),'Stilly').uncomparablePicks===1,
 'Cohorts with under five other picks must be withheld');
const contaminated=[...benchmark,make('Stilly',7,10000,2026),make('Stilly',8,9000,2025,1,true)];
const same=buildDraftRoundPeers(contaminated,'Stilly');
assert(same.selectedPicks===1&&same.examples[0].difference===80,'Incomplete season or keeper leaked into study');
const withNegative=[make('Stilly',1,-2),make('Stew',2,1),make('Tony',3,2),
 make('Birch',4,3),make('Mitch',5,4),make('Kuhl',6,5)];
assert(buildDraftRoundPeers(withNegative,'Stilly').examples.length===0,'Negative difference misrepresented as positive');
let rejected=false;
try{buildDraftRoundPeers([...benchmark,benchmark[0]],'Stilly')}catch(error){rejected=/duplicate/i.test(String(error))}
assert(rejected,'Duplicate overall selection not rejected');
const page=fs.readFileSync('assets/manager-draft-trade-career-page.mjs','utf8');
assert(page.includes('buildDraftRoundPeers(draftProductionRows,manager)')&&
 page.includes('career-draft-round-peers')&&page.includes('No OVR or report-card grade is changed.')&&
 page.includes('at least five peers')&&page.includes('other original picks from the same year and round'),
 'Manager profile peer comparison must explain coverage and limitations');
console.log('PASS: 880 complete-season draft selections compared; 10 managers; leave-one-out medians, 2026 and keeper exclusion, peer threshold, source integrity.');
