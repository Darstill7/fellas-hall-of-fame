// Completed-season keeper ledger: observed lineup benefit and draft-capital cost remain separate.
// No hindsight ranking is promoted into ex-ante keeper decision skill.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data-integrity/keeper-draft-slot-reconciliation-v1.json');
const rules=read('data-integrity/sleeper-season-rule-matrix-2020-2026.json');
assert.equal(rules.seasons.find(x=>x.year===2025).keepersEnabled,true);
const entries=data.rows.filter(x=>x.year===2025);
assert.equal(entries.length,20,'Expected 2025 keeper entries');
const groups=new Map();
for(const k of entries){
 const g=groups.get(k.manager)??{manager:k.manager,keeperSelections:0,regularStartedPoints:0,
 playoffStartedPoints:0,keeperRounds:[],players:[]};
 g.keeperSelections++;g.regularStartedPoints+=k.regularStartedPoints;
 g.playoffStartedPoints+=k.playoffStartedPoints;g.keeperRounds.push(k.round);
 g.players.push({player:k.player,round:k.round,overall:k.overall,regularStartedPoints:k.regularStartedPoints,
  playoffStartedPoints:k.playoffStartedPoints});
 groups.set(k.manager,g);
}
const round=n=>Math.round(n*100)/100;
const managers=[...groups.values()].map(x=>({
 ...x,regularStartedPoints:round(x.regularStartedPoints),
 playoffStartedPoints:round(x.playoffStartedPoints),
 totalObservedKeeperStartedPoints:round(x.regularStartedPoints+x.playoffStartedPoints),
 keeperRounds:x.keeperRounds.sort((a,b)=>a-b),
 players:x.players.sort((a,b)=>a.overall-b.overall),
 decisionGrade:null,overallKeeperValue:null,
 status:'observed_contribution_only_not_causal_or_cost_adjusted'
})).sort((a,b)=>a.manager.localeCompare(b.manager));
assert.equal(managers.reduce((n,x)=>n+x.keeperSelections,0),20);
const report={schema:'fellas-2025-keeper-realized-contribution-v1',
 status:'descriptive_2025_completed_season_no_keeper_skill_grade',
 caveats:['Observed starting points are not incremental wins or proof of optimal keeper decisions.',
 'Draft round is observed but cost of the foregone selection is not certified.',
 'Retained player eligibility and alternatives at keeper deadline remain unverified.'],
 managers};
const file='data-integrity/keeper-2025-realized-contribution-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(file),report,'2025 keeper contribution report stale');
else fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
console.log('Completed 2025 keeper contribution ledger:',managers.length,'managers, 20 picks, no certified skill grades');
