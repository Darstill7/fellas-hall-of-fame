// Independent metadata audit of the research-only trade PAR estimates.
// Exact starter points are verified by verify-trade-par-start-ledger-parity.mjs.
// This script must NEVER equate an implied aggregate deduction to a sourced
// per-week positional/slot-eligible replacement baseline.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const research=read('data/trade_par_preview.json');
const matched=research.records.filter(t=>t.year>=2020&&t.year<=2025).flatMap(t=>t.sides.flatMap(s=>s.matched||[]));
assert.ok(String(research.status).toLowerCase().includes('experimental'),'Research PAR has not been independently certified');
assert.equal(matched.length,110,'Tracked matched asset set changed: audit replacement provenance');
let explicitWeeklyBaselines=0,implausible=0;
for(const row of matched){
 assert.ok(Number.isFinite(row.points)&&Number.isFinite(row.par)&&Number.isInteger(row.starts)&&row.starts>0);
 const provenance=row.weeklyReplacementBaseline||row.weeklyBaselines||row.replacementBenchmarks;
 if(Array.isArray(provenance)&&provenance.length===row.starts)explicitWeeklyBaselines++;
 // Implied season-aggregate baseline is a consistency diagnostic, never proof
 // of the missing per-week position/slot benchmark.
 const implied=row.points-row.par;
 if(!Number.isFinite(implied)||implied<-.03)implausible++;
}
const evans=read('data/trade_par_exception_2025_evans_zero_point_start_v1.json');
const diggs=read('data/trade_par_exception_2025_diggs_baseline_v1.json');
assert.equal(evans.evidence.postTradeLineupStarts,1);
assert.equal(evans.evidence.postTradeStarterPoints,0);
assert.equal(diggs.evidence.postTradeLineupStarts,2);
assert.equal(diggs.evidence.postTradeStarterPoints,7.1);
assert.ok(explicitWeeklyBaselines===0,'Per-week baseline evidence has appeared: independently audit its definition before certification');
const method=fs.readFileSync(path.join(root,'FELLAS_WAR_METHOD.md'),'utf8');
assert.ok(method.includes('no WAR player or manager scores are certified yet'),'WAR method must remain separate from existing experimental trade PAR');
const report=[
 '# Trade PAR weekly replacement-baseline provenance audit','',
 '## Independent checks and the unresolved methodology boundary','',
 '- **110/110 matched asset groups** have aggregate points and PAR fields, with point-to-ledger parity separately checked by the 611-starter-week test.',
 '- **'+explicitWeeklyBaselines+'/'+matched.length+' asset groups** attach an auditable, week-specific replacement benchmark with model/source provenance inside the PAR preview. Thus the original replacement deductions cannot be independently reproduced from the preview alone.',
 '- **'+implausible+'** asset groups have negative or nonfinite implied aggregate replacement deductions; investigate if this count becomes nonzero.',
 '- Trade PAR source status: '+research.status+'. Do not call the 18 matched two-sided samples a fully certified PAR baseline.',
 '- Existing Fellas WAR specification proposes different, slot/roster-eligible replacement models and explicitly marks WAR scores uncertified; **do not** substitute WAR bench values into inherited trade PAR.',
 '- **Mike Evans, 2025 Week 7:** one starting-slot appearance scoring 0.0 points; cannot assign 0 PAR until the source-specific WR replacement deduction is known.',
 '- **Stefon Diggs, 2025 Weeks 12–13:** two starts scoring 3.0 and 4.1 points; cannot infer PAR without those weeks’ WR replacement deductions.',
 '',
 'Required promotion evidence: scoring format and year/week, exact lineup slot including FLEX eligibility, how league/bench/waiver replacement is selected, player pool and exclusions, weekly replacement points, versioned source receipts, negative-value policy, and an independently rerunnable formula. Verified starter points alone prove none of these.',
 '',
 'Status: **REPLACEMENT BASELINE NOT INDEPENDENTLY REPRODUCED — research sample only**. This audit is informational, not an automatic failure; it forbids promotion to a certified trade-efficiency ranking until the provenance exists.',
 ''
].join('\n');
console.log(report);
if(process.argv.includes('--github-summary')&&process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report);
