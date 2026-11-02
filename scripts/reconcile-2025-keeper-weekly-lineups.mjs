// Keeper lineup reconciliation: the 2025 archive contains scored regular-season
// snapshots through week 14, but not postseason lineup snapshots.
// Compare only observable starts; do not infer missing weeks or playoff points.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const draft=read('data/v9_draft_engine.json');
const keepers=draft.filter(x=>x.year===2025&&x.keeper);
assert.equal(keepers.length,20,'Expected twenty archived 2025 keeper selections');
const norm=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b/g,'').replace(/[^a-z0-9]/g,'');
const weeks=[];
for(let week=1;week<=14;week++){
 const path=week===1||week===7?'data/war_rosters_2025_week'+week+'.json':'data/sleeper_roster_snapshots_2025_week'+week+'.json';
 if(!fs.existsSync(path))continue;
 const raw=read(path),rosters=Array.isArray(raw)?raw:raw.rosters;
 assert.ok(Array.isArray(rosters),'Malformed weekly roster source '+path);
 weeks.push({week,path,rosters});
}
const rows=[],coverage=[];
for(const k of keepers){
 const observed=[],ambiguities=[];
 let started=0,points=0,bench=0,absent=0,missingTeam=0;
 for(const w of weeks){
  const matches=w.rosters.filter(r=>String(r.teamId??r.id)===String(k.team_id));
  if(matches.length!==1){missingTeam++;ambiguities.push({week:w.week,issue:'team_roster_missing_or_duplicated'});continue;}
  const roster=matches[0];
  const entries=[...(roster.starters??[]).map(p=>({...p,slot:'starter'})),...(roster.bench??[]).map(p=>({...p,slot:'bench'}))];
  const found=entries.filter(p=>norm(p.name)===norm(k.player));
  if(found.length>1){ambiguities.push({week:w.week,issue:'duplicate_player_name_on_roster'});continue;}
  if(!found.length){absent++;continue;}
  const p=found[0];
  if(p.slot==='bench'){bench++;observed.push({week:w.week,status:'bench',points:Number.isFinite(p.points)?p.points:null});continue;}
  if(!Number.isFinite(p.points)){ambiguities.push({week:w.week,issue:'starter_score_missing'});continue;}
  started++;points+=p.points;
  observed.push({week:w.week,status:'starter',points:p.points});
 }
 const round=n=>Math.round(n*100)/100;
 const diff=round(points-Number(k.reg_starter_points));
 rows.push({manager:k.manager==='Tom'?'Thommy':k.manager,teamId:String(k.team_id),player:k.player,
  draftSlot:k.overall,observedRegularWeeks:weeks.length,observedStarts:started,
  observedStarterPoints:round(points),archivedRegularStarts:k.reg_starts,
  archivedRegularStarterPoints:k.reg_starter_points,observedBenchWeeks:bench,
  absentFromRosterWeeks:absent,missingTeamWeeks:missingTeam,
  startCountDifference:started-k.reg_starts,starterPointDifference:diff,
  regularParityStatus:ambiguities.length?'ambiguous_source':
   started===k.reg_starts&&Math.abs(diff)<0.011?'match':'mismatch_requires_review',
  weekEvidence:observed,ambiguities,
  playoffLineupParity:'not_testable_no_postseason_scored_snapshots',
  keeperDecisionGrade:null,overallKeeperValue:null});
}
for(const manager of [...new Set(rows.map(x=>x.manager))].sort()){
 const subset=rows.filter(r=>r.manager===manager);
 coverage.push({manager,keepers:subset.length,matchingRegularTotals:subset.filter(r=>r.regularParityStatus==='match').length,
  mismatchingRegularTotals:subset.filter(r=>r.regularParityStatus==='mismatch_requires_review').length,
  ambiguousRegularTotals:subset.filter(r=>r.regularParityStatus==='ambiguous_source').length,
  verifiedPostseasonLineups:0});
}
const report={schema:'fellas-2025-keeper-weekly-lineup-reconciliation-v1',
 status:'scored_regular_week_source_comparison_not_keeper_grade',
 limitations:['2025 scored roster snapshots cover regular weeks 1-14 only; they cannot verify playoff starter points.',
 'A player absent from a weekly scored roster is not counted as a zero or proof of a drop.',
 'Names are normalized for matching, not a verified provider player-ID join; ambiguities remain unverified.',
 'A discrepant total is not silently overwritten; original archive and week evidence are both retained.'],
 sourceWeeks:weeks.map(x=>({week:x.week,path:x.path})),coverage,rows};
const target='data-integrity/keeper-2025-weekly-lineup-reconciliation-v1.json';
if(process.argv.includes('--check'))assert.deepEqual(read(target),report,'Weekly keeper reconciliation stale');
else fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
console.log('2025 Keeper weekly lineup reconciliation:',rows.length,'keepers,',
 rows.filter(x=>x.regularParityStatus==='match').length,'matching,',
 rows.filter(x=>x.regularParityStatus==='mismatch_requires_review').length,'mismatched,',
 rows.filter(x=>x.regularParityStatus==='ambiguous_source').length,'ambiguous');
