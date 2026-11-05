import fs from 'node:fs';
import {buildDraftPositionPeers} from '../assets/manager-draft-position-peers.mjs';
import {buildDraftProduction} from '../assets/manager-draft-production.mjs';
const assert=(ok,message)=>{if(!ok)throw Error(message)};
const data=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8'));
const managers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
let total=0,exact=0,adjacent=0,unavailable=0;
for(const name of managers){
 const x=buildDraftPositionPeers(data,name);
 const original=buildDraftProduction(data,name);
 assert(x.status==='position_aware_observed_starter_points_not_skill','Incorrect method label '+name);
 assert(x.selectedPicks===original.selectionCount,'Original-manager count mismatch '+name);
 assert(x.comparablePicks+x.unavailableCount===x.selectedPicks,'Hidden denominator '+name);
 assert(x.exactCount+x.adjacentCount===x.comparablePicks,'Tier counts mismatch '+name);
 assert(x.byYear.every(y=>y.year>=2020&&y.year<=2025),'Incomplete season leakage '+name);
 assert(x.byYear.every(y=>y.exact+y.adjacent+y.unavailable===y.eligible&&
  y.above+y.tied+y.below===y.exact+y.adjacent),'Annual partitions incorrect '+name);
 assert(x.examples.every(p=>p.difference>0&&p.peerCount>=5&&
  ['exact_round','adjacent_rounds'].includes(p.comparisonTier)),'Positive sample invalid '+name);
 assert(x.unavailable.every(p=>p.adjacentPeers<5&&p.exactPeers<5),'Unqualified withheld sample '+name);
 total+=x.selectedPicks;exact+=x.exactCount;adjacent+=x.adjacentCount;unavailable+=x.unavailableCount;
}
assert(total===760,'Unexpected active manager draft picks '+total);
assert(exact+adjacent+unavailable===760,'Incomplete active-manager source population');
assert(exact===165&&adjacent===436&&unavailable===159,
 'Position-aware comparison counts changed without source review');
const make=(manager,overall,points,{year=2025,round=5,position='RB',keeper=false}={})=>({
 manager,overall,year,round,position,player:'Test '+overall,keeper,reg_starts:1,reg_starter_points:points
});
const same=[make('Stilly',1,100),make('Stew',2,10),make('Tony',3,20),
 make('Birch',4,30),make('Mitch',5,40),make('Kuhl',6,50)];
const exactTest=buildDraftPositionPeers(same,'Stilly');
assert(exactTest.exactCount===1&&exactTest.examples[0].peerMedian===30&&
 exactTest.examples[0].difference===70,'Exact-round leave-one-out median incorrect');
const adjacent=[make('Stilly',1,100),make('Stew',2,10,{round:4}),
 make('Tony',3,20,{round:6}),make('Birch',4,30,{round:4}),
 make('Mitch',5,40,{round:6}),make('Kuhl',6,50,{round:4})];
const fallback=buildDraftPositionPeers(adjacent,'Stilly');
assert(fallback.exactCount===0&&fallback.adjacentCount===1&&
 fallback.examples[0].peerMedian===30,'Adjacent-round fallback not applied');
assert(buildDraftPositionPeers(adjacent.slice(0,5),'Stilly').unavailableCount===1,
 'Unsupported sparse position cohort should remain unavailable');
const excluded=[...same,make('Stilly',7,1000,{year:2026}),
 make('Stilly',8,2000,{keeper:true}),make('Stew',9,3000,{position:'QB'})];
assert(buildDraftPositionPeers(excluded,'Stilly').examples[0].difference===70,
 'Keeper, 2026, or wrong-position peer contaminated benchmark');
let rejected=false;
try{buildDraftPositionPeers([...same,same[0]],'Stilly')}catch(error){rejected=/duplicate/i.test(String(error))}
assert(rejected,'Duplicate ESPN/Sleeper pick key not rejected');
const page=fs.readFileSync('assets/manager-draft-trade-career-page.mjs','utf8');
assert(page.includes('buildDraftPositionPeers(draftProductionRows,manager)')&&
 page.includes('career-draft-position-peers')&&
 page.includes('No OVR or Report Card is changed.')&&
 page.includes('fewer than five other selections qualify'),
 'Site must preserve position peer evidence and non-grade labeling');
console.log('Position-aware draft study PASS: '+total+' current-manager picks; '+exact+
 ' exact, '+adjacent+' adjacent, '+unavailable+' unavailable; validated attribution, leave-one-out medians and no 2026/keeper leakage.');
