// Distinguish keeper *rules* from keeper-flagged archived draft selections.
// A missing keeper flag is not evidence that no keeper existed.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const seasons=read('data-integrity/sleeper-season-rule-matrix-2020-2026.json').seasons;
const draft=read('data/v9_draft_engine.json');
const providerAudit=read('data-integrity/keeper-era-provider-draft-audit-2023-2024.json');
for(const s of providerAudit.seasons){
 assert.ok([2023,2024].includes(s.year));
 assert.equal(s.picks,150);
 assert.equal(s.providerPicksWithKeeperFieldAbsent,150);
 assert.equal(s.providerPicksWithKeeperTrue+s.providerPicksWithKeeperFalse,0);
 assert.equal(s.keeperParticipation,'unknown'); // Original provider fields remain absent; owner confirmation is tracked separately.
}
const coverage=[];
for(const rule of seasons){
 const rows=draft.filter(x=>x.year===rule.year);
 assert.ok(rows.length,'No draft rows for '+rule.year);
 assert.ok(rows.every(x=>typeof x.keeper==='boolean'),'Unknown keeper flag in '+rule.year);
 const flagged=rows.filter(x=>x.keeper);
 if(rule.year<2025)assert.equal(flagged.length,0,'Pre-2025 keeper falsely attributed: '+rule.year);
 if(rule.keepersEnabled===false)assert.equal(flagged.length,0,'Keeper on season with confirmed no keepers');
 if(flagged.length)assert.ok(rule.keepersEnabled,'Keeper flag without keeper era');
 coverage.push({year:rule.year,keeperRulesActive:rule.keepersEnabled,
  providerConfiguredKeeperMaximum:rule.maxKeepers,
  archivedDraftPicks:rows.length,archivedKeeperFlaggedPicks:flagged.length,
  keeperUseObservedInDraftArchive:flagged.length>0,
  keeperUseStatus:rule.year<=2024?'confirmed_not_used_by_league_owner':
    flagged.length?'observed_in_draft_archive':'not_established_by_draft_flags',
  keeperEffectOnDraftGrade:'keeper_rows_excluded_from_draft_performance',
  archivedFlagCoverageNotProofOfNoKeepers:true});
}
const report={schema:'fellas-keeper-era-draft-evidence-v1',
 status:'historical_eligibility_and_draft_flags_kept_separate',
 notes:['League owner confirms no keepers until 2023.','Sleeper maxKeepers configuration is a limit, not evidence of participation.','For 2023 onward an absence of keeper-flagged archived draft rows does not prove nobody kept a player.','Manager drafting scores omit keeper-tagged rows rather than treating retained players as newly drafted.'],
 coverage};
const target='data-integrity/keeper-era-draft-evidence-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Keeper-era draft evidence stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('Keeper-era draft evidence:',coverage.map(x=>x.year+':'+x.archivedKeeperFlaggedPicks).join(', '));
