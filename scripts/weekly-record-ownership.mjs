import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {buildHomeDashboard} from '../assets/home-app-v3.mjs';
import {fellasLeague} from '../assets/league-config.mjs';
import {buildRecordCategories,establishedRecordAnchor,recordCategoryLabels} from '../assets/manager-record-ownership.mjs';

export const ownershipWatchPath = 'data/weekly-record-ownership-v57.json';
const ledgerPath = 'data/unified_record_book_2016_2026.json';
const hash = games => createHash('sha256').update(JSON.stringify(games)).digest('hex');

export function captureRecordOwnership(read) {
  const ledger = read(ledgerPath);
  const guide = read('data/season_guide.json');
  const archive = read('data/manager_record_books_2016_2026.json');
  const {week} = buildHomeDashboard(guide,ledger);
  const year = fellasLeague.season;
  assert.equal(archive.asOf,ledger.updated,'Manager record archive date is stale');
  assert.match(archive.scope,new RegExp(year+' Week '+week+'\\b'),'Manager record archive cutoff is stale');
  const postseason = {
    espn:read('data/verified_espn_playoff_brackets_2016_2019.json'),
    sleeper:read('data/verified_sleeper_playoff_brackets_2020_2025.json'),
    placements:read('data/fellas_final_placements_2020_2025.json'),
    placementReceipts:read('data/sleeper_postseason_placement_receipts_2020_2025.json'),
    allEra:read('data/fellas_final_placements_2016_2025_verified.json')
  };
  const categories = buildRecordCategories(archive,guide,postseason);
  assert.deepEqual(categories.map(row=>row.label).sort(),[...recordCategoryLabels].sort());
  const marks = recordCategoryLabels.map(label=>{
    const {rows,direction,unit} = categories.find(category=>category.label===label);
    assert.ok(rows.length && rows.every(row=>Number.isFinite(row.value)),label);
    const value = Math[direction](...rows.map(row=>row.value));
    const holders = [...new Set(rows.filter(row=>row.value===value).map(row=>row.manager))].sort();
    return {id:establishedRecordAnchor(label),label,value,unit,direction,holders};
  });
  return {year,week,asOf:ledger.updated,ledgerHash:hash(ledger.games),priorLedgerHash:hash(ledger.games.filter(game=>
    game.year!==year||game.week!==week||game.stage!=='regular'
  )),marks};
}

export function compareRecordOwnership(previous,current) {
  assert.equal(previous.year,current.year,'Ownership comparison requires the same regular season');
  assert.equal(previous.week+1,current.week,'Ownership comparison requires adjacent approved weeks');
  assert.equal(previous.ledgerHash,current.priorLedgerHash,'Prior approved game ledger changed');
  assert.deepEqual(previous.marks.map(row=>row.id),current.marks.map(row=>row.id),
    'Record definitions changed between snapshots');
  const changes = current.marks.flatMap((mark,i)=>{
    const before = previous.marks[i];
    assert.deepEqual([before.label,before.unit,before.direction],[mark.label,mark.unit,mark.direction],mark.id);
    const joined = mark.holders.filter(manager=>!before.holders.includes(manager));
    const left = before.holders.filter(manager=>!mark.holders.includes(manager));
    const holdersChanged = joined.length>0||left.length>0;
    const improved = mark.direction==='min'?mark.value<before.value:mark.value>before.value;
    const type = improved ? (holdersChanged?'BROKEN':'EXTENDED')
      : holdersChanged ? (before.value===mark.value&&left.length===0?'TIED':'OWNERSHIP_CHANGED') : null;
    if(!type)return [];
    return [{id:mark.id,label:mark.label,unit:mark.unit,type,previousValue:before.value,value:mark.value,
      previousHolders:before.holders,holders:mark.holders,joined,left,
      evidence:'analytics/record-holders.html#'+mark.id}];
  });
  return {schemaVersion:1,year:current.year,week:current.week,previousWeek:previous.week,previous,current,changes};
}

export function verifyOwnershipWatch(report,current) {
  assert.deepEqual(report,compareRecordOwnership(report.previous,current),'Weekly ownership report differs from the approved data');
  return report.changes;
}
