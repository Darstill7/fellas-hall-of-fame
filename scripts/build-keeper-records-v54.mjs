// Completed 2025 keeper cohort only; no opportunity-cost or decision grades.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const draft=read('v9_draft_engine.json'),pilot=read('draft_keeper_value_pilot_2025_2026w8_v1.json'),research=read('draft_intelligence_research_2025_2026w8_v1.json');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const keepers=draft.filter(x=>x.year===2025&&x.keeper).map(x=>({manager:norm(x.manager),player:x.player,position:x.position,round:x.round,points:cents(x.reg_starter_points),starts:x.reg_starts}));
assert.equal(keepers.length,20);
const pairs=research.keeperResearch.season2025.map(r=>{
 const a=keepers.filter(x=>x.manager===r.manager);assert.equal(a.length,2);
 assert.equal(a.reduce((s,x)=>s+x.points,0),cents(r.observedStartedPoints));
 for(const k of r.keepers)assert.ok(a.some(x=>x.player===k.name&&x.round===k.round&&x.position===k.position));
 assert.equal(r.keeperDecisionGrade,null);assert.equal(r.keeperOpportunityCost,null);
 return {manager:r.manager,keepers:a,points:cents(r.observedStartedPoints),medianEdge:cents(r.pointsVsStarterMedian),starts:a.reduce((s,x)=>s+x.starts,0)};
});
assert.equal(pairs.length,10);
const records=[];
function add(id,label,rows,key,direction,unit,qualification,source){
 assert.ok(rows.length);assert.ok(rows.every(x=>Number.isFinite(x[key])));
 const mark=Math[direction](...rows.map(x=>x[key])),evidence=rows.filter(x=>x[key]===mark);
 records.push({id,label,value:unit==='pts'?mark/100:mark,unit,scope:'Completed 2025 keeper-era season only',qualification,source,holders:[...new Set(evidence.map(x=>x.manager))].sort().map(manager=>({manager,evidence:evidence.filter(x=>x.manager===manager)}))});
}
const q='Observed regular-season original-manager starter production; not an evaluation of keeper decision quality';
const s='data/v9_draft_engine.json + data/draft_intelligence_research_2025_2026w8_v1.json';
for(const dir of ['max','min']){
 const word=dir==='max'?'Most':'Fewest';
 add('keeper-single-points-'+dir,word+' observed points from an individual keeper',keepers,'points',dir,'pts',q,s);
 add('keeper-pair-points-'+dir,word+' observed combined keeper points',pairs,'points',dir,'pts',q,s);
 add('keeper-pair-starts-'+dir,word+' observed combined keeper starts',pairs,'starts',dir,'starts',q,s);
 add('keeper-pair-median-edge-'+dir,(dir==='max'?'Highest':'Lowest')+' observed keeper-pair positional median comparison',pairs,'medianEdge',dir,'pts',q+'; observed starter median, not alternative keeper return',s);
}
add('keeper-late-round-points','Most observed points from a keeper costing round 10 or later',keepers.filter(x=>x.round>=10),'points','max','pts',q,s);
for(const p of ['QB','RB','WR','TE']){
 add('keeper-position-'+p.toLowerCase()+'-points','Most observed keeper points at '+p,keepers.filter(x=>x.position===p),'points','max','pts',q,s);
}
const picks=pilot.draftPicks.filter(x=>x.year===2025&&!x.keeper).map(x=>({...x,manager:norm(x.manager),edge:cents(x.pointsAbovePeerMedian)}));
assert.equal(picks.length,130);assert.ok(picks.every(x=>Number.isFinite(x.pointsAbovePeerMedian)&&x.peerCount>0));
for(const dir of ['max','min'])add('draft-peer-return-'+dir,(dir==='max'?'Highest':'Lowest')+' observed round-position peer-adjusted draft return',picks,'edge',dir,'pts','2025 nonkeeper picks only; archived peer median, not causal or decision-time value','data/draft_keeper_value_pilot_2025_2026w8_v1.json');
assert.equal(new Set(records.map(x=>x.id)).size,records.length);
fs.writeFileSync('data-integrity/keeper-records-v54.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',categoryCount:records.length,keeperCount:keepers.length,records},null,2)+'\n');
console.log('Keeper records: '+records.length+' candidates; 20 keeper selections, 130 nonkeeper peer comparisons.');