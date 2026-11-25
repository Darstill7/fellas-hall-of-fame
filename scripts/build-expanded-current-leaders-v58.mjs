import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {recordWatchScoreInput} from '../assets/weekly-record-watch.mjs';
import {buildCore} from './build-canonical-record-core-v52.mjs';
import {buildCompleted} from './build-canonical-record-completed-v52.mjs';
import {buildLegacyRecords,expandedAliases} from './legacy-record-definitions-v57.mjs';

const read = name=>JSON.parse(fs.readFileSync('data/'+name+'.json','utf8'));
const ledger=read('unified_record_book_2016_2026');
const archive=read('manager_record_books_2016_2026');
const placements=read('fellas_final_placements_2016_2025_verified');
const catalog=read('expanded_records_verified_v1');
const core=buildCore(ledger,archive);
const completed=buildCompleted(placements,read('fellas_final_placements_2020_2025'),
  read('sleeper_postseason_placement_receipts_2020_2025'),read('legendary_records_2016_2025_v1'),
  read('postseason_records_verified_v1'),read('scoring_floor_research_2016_2025_v1'),ledger);
const legacy=buildLegacyRecords({ledger,archive,placements,catalog,weekly:read('season_weekly_matchups_2016_2026_v1')});
const sources=new Map([
  ...core.records.filter(r=>expandedAliases.core.includes(r.id)).map(r=>[r.id,r]),
  ...completed.records.filter(r=>expandedAliases.historical.includes(r.id)).map(r=>[r.id,r]),
  ...legacy.records.map(r=>[r.id,r])
]);
assert.equal(sources.size,catalog.categoryCount);
const categories=catalog.categories.map(({key,label,description})=>{
  const record=sources.get(key);
  assert.ok(record?.holders.length,key);
  return {key,label,description,value:record.value,unit:record.unit,scope:record.scope,
    qualification:record.qualification,source:record.source,holders:record.holders.map(({manager})=>manager).sort()};
});
const {year,week}=legacy.through;
const seasonScoreHash=createHash('sha256').update(recordWatchScoreInput(ledger.games,year)).digest('hex');
const output={schemaVersion:1,year,throughWeek:week,asOf:ledger.updated,seasonScoreHash,
  pairedRegularGames:legacy.regularGames,categories};
const path='data/expanded-record-current-leaders-v58.json';
const body=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(path,'utf8'),body,'Current Expanded leaders are stale');
else fs.writeFileSync(path,body);
console.log('Expanded leader marks: '+categories.length+' existing definitions through Week '+week);
