// Transparent 2025 Keeper Decision research score, NOT certified ex-ante decision skill.
// The numerical index is descriptive; keeper deadline choices and availability remain unknown.
import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const composite=read('data-integrity/keeper-2025-composite-evidence-v1.json');
const drops=read('data-integrity/keeper-2025-abandonment-receipts-v1.json').rows;
const bracket=read('data-integrity/keeper-2025-championship-bracket-contribution-v1.json');
assert.equal(bracket.rows.length,10);
const round=n=>Math.round(n*10)/10;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rows=composite.managers.map(m=>{
 const players=composite.players.filter(p=>p.manager===m.manager);
 assert.equal(players.length,2);
 const started=players.reduce((s,p)=>s+p.starts,0);
 const delta=m.descriptiveDifferenceFromLeagueStarterMedians;
 // Observed positional surplus is scaled and capped to avoid an extreme season dominating.
 const productionComponent=round(clamp(50+delta/4,0,100));
 // Reward later-round keeper capital; nominal draft cost, NOT verified counterfactual value.
 const capitalComponent=round(players.reduce((s,p)=>s+clamp((p.keeperRound-1)/14*100,0,100),0)/2);
 const playoffPoints=m.verifiedPlayoffStarterPoints;
 const bracketEvidence=bracket.rows.find(x=>x.manager===m.manager);
 assert.ok(bracketEvidence,'Missing championship bracket evidence for '+m.manager);
 assert.ok(Math.abs(bracketEvidence.verifiedWeek15To17KeeperStartedPoints-playoffPoints)<.011);
 // Only starts in championship-bracket games count, not consolation matchups or byes.
 const postseasonComponent=round(clamp(bracketEvidence.verifiedChampionshipBracketKeeperStartedPoints,0,100));
 const releases=drops.filter(x=>x.manager===m.manager);
 // Evidence flag only. Do not infer the appropriate numerical penalty absent injury/alternative review.
 const abandonmentPenalty=null;
 const descriptiveIndex=round(.55*productionComponent+.30*capitalComponent+.15*postseasonComponent);
 return {manager:m.manager,keepers:players.map(p=>({player:p.player,round:p.keeperRound,position:p.position})),
  observedProductionComponent:productionComponent,nominalKeeperCapitalComponent:capitalComponent,
  observedPostseasonContributionComponent:postseasonComponent,
  observedResearchIndex:descriptiveIndex,verifiedOriginalManagerStartedWeeks:started,
  verifiedRegularStartedPoints:m.verifiedRegularStarterPoints,
  verifiedPostseasonStartedPoints:playoffPoints,
  verifiedChampionshipBracketStartedPoints:bracketEvidence.verifiedChampionshipBracketKeeperStartedPoints,
  otherWeek15To17StartedPoints:bracketEvidence.otherWeek15To17KeeperStartedPoints,
  championshipBracketQualifier:bracketEvidence.qualifiedFor2025ChampionshipBracket,
  verifiedDropCount:releases.length,verifiedDrops:releases.map(x=>x.keeper),
  abandonmentPenalty,actualDeadlineAlternativePoolCertified:false,
  certifiedKeeperDecisionScore:null,publicReportCardKeeperGrade:null};
}).sort((a,b)=>b.observedResearchIndex-a.observedResearchIndex);
assert.equal(rows.length,10);
assert.equal(rows.reduce((s,x)=>s+x.verifiedDropCount,0),2);
const report={schema:'fellas-2025-keeper-decision-research-index-v1',
 scoreLabel:'2025 Keeper Decision Research Index (championship-bracket-only playoff scoring; not official grade)',
 status:'research_only_public_grade_not_certified',
 methodology:{indexRange:'0–100',observedProductionWeight:.55,nominalDraftCapitalWeight:.30,observedPostseasonWeight:.15,
  productionFormula:'clip(50 + same-week positional starter median difference / 4, 0, 100)',
  capitalFormula:'average clip((keeperRound-1)/14 * 100, 0, 100)',
  postseasonFormula:'clip(verified keeper starter points in 2025 championship-bracket games, 0, 100); exclude consolation and bye weeks',
  abandonmentPenalty:'not applied: completed outright drops displayed as evidence flags pending necessity and actual alternatives',
  weightingStatus:'proposed research weights, not calibrated or approved as a Keeper Decision grade'},
 criticalLimitations:['The observed research index is retrospective and is NOT a measure of decision-time skill.',
 'Keeper round does not establish exact protected-player alternatives, and position starter medians are not waiver replacement values.',
 'Only championship-bracket keeper starters are rewarded in the 15% playoff component; consolation starts and byes are excluded.',
 'Championship starter points measure production, not wins caused or playoff leverage.',
 'Do not merge this score into Madden OVR or a public manager report card until calibration, contemporary availability and abandonment necessity are verified.'],rows};
const target='data-integrity/keeper-2025-decision-research-index-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report);
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Keeper research index PASS:',rows.length,'managers, official Keeper Decision grades remain null');
