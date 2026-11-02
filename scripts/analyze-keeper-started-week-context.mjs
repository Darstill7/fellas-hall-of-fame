// Compare only verified keeper starts with same-week observed positional starters.
// Observed league starters are not certified freely available replacements.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const certified=read('data-integrity/keeper-2025-verified-starts-v1.json');
const context=read('data-integrity/keeper-2025-weekly-starter-context-v1.json');
assert.equal(certified.rows.length,20);
const medianByWeek=new Map(context.weeks.map(w=>[w.week,w.positions]));
const round=n=>Math.round(n*100)/100;
const rows=certified.rows.map(k=>{
 const weeks=k.receipts.map(r=>{
  const p=medianByWeek.get(r.week)?.[k.position];
  assert.ok(p&&Number.isFinite(p.medianStarterPoints),'Missing positional benchmark '+k.player+'/'+r.week);
  assert.ok(Number.isFinite(r.points));
  return {week:r.week,actualStartedPoints:r.points,observedLeagueStarterMedian:p.medianStarterPoints,
   differenceFromObservedStarterMedian:round(r.points-p.medianStarterPoints),
   leagueStarterSampleSize:p.observedStarters,source:r.source};
 });
 assert.equal(weeks.length,k.regularStarts);
 assert.ok(Math.abs(round(weeks.reduce((s,w)=>s+w.actualStartedPoints,0))-k.verifiedRegularStartedPoints)<.011);
 return {manager:k.manager,player:k.player,round:k.round,position:k.position,
  verifiedStarts:weeks.length,verifiedStartedPoints:k.verifiedRegularStartedPoints,
  observedMedianDifferenceTotal:round(weeks.reduce((s,w)=>s+w.differenceFromObservedStarterMedian,0)),
  weeklyEvidence:weeks,actualWaiverReplacementValue:null,keeperDecisionGrade:null};
});
const output={schema:'fellas-2025-keeper-started-week-positional-context-v1',
 status:'descriptive_week_matched_starter_context_not_causal_value',
 limitations:['Weekly comparisons only include weeks the keeper started for his original draft team.',
 'League starter medians include owned and started players, not actual waiver replacements.',
 'FLEX starter composition is observed, but positional medians do not estimate ex ante availability.',
 'Missing starts are not penalized against hypothetical replacement; injury and management decisions require separate attribution.',
 'No keeper grade or position-adjusted WAR is established.'],rows};
const target='data-integrity/keeper-2025-started-week-positional-context-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),output);
else fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log('2025 keeper started-week positional context PASS: '+rows.length+' keeper profiles, '+rows.reduce((s,r)=>s+r.verifiedStarts,0)+' starts');
