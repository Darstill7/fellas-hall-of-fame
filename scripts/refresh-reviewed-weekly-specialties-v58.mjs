// Rebuild scoped research from local receipts. Only already-listed trades may be rescored here.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const season=read('data/home-current-season-v1.json');
const {year,throughWeek:week}=season;
const run=(name,...args)=>execFileSync(process.execPath,['scripts/'+name+'.mjs',...args],{stdio:'inherit'});

run('verify-expanded-records');
run('build-expanded-current-leaders-v58');
run('build-expanded-current-leaders-v58','--check');
run('verify-faab-provider-receipts');
run('verify-2026-acquisition-source-parity');
run('verify-draft-production');
for(const script of ['build-positional-record-pilot-v53','build-player-hall-of-fame-v56',
  'build-player-championship-records-v56','build-player-transaction-history-v56','build-player-directory-v56'])run(script);

const certification='data-integrity/trade-certifications/'+year+'-week'+week+'.json';
const candidate='data-integrity/sleeper-sync-candidates/'+year+'-trades-through-week'+week+'.json';
const sources=[candidate,...['starter','kickoff'].map(key=>
  'data-integrity/trade-point-recalculations/'+year+'-'+key+'-evidence-through-week'+week+'.json')];
let tradeRefresh='KEPT_PREVIOUS_SCOPE';
if(fs.existsSync(certification)&&sources.every(file=>fs.existsSync(file))){
  const cert=read(certification);
  assert.equal(cert.status,'COMMISSIONER_APPROVED');
  assert.equal(cert.year,year);
  assert.equal(cert.through_week,week);
  assert.equal(cert.raw_candidate,candidate);
  const museum=read('data/trade_museum_stage66.json').filter(row=>row.year===year);
  const ids=museum.map(row=>String(row.id)).sort();
  assert.deepEqual(read(candidate).trades.map(row=>String(row.transaction_id)).sort(),ids,
    'Trade scope changed. Complete the separate certified receipts import before rescoring.');
  run('apply-reviewed-trade-timing',String(week));
  tradeRefresh='RESCORED_EXISTING_CERTIFIED_RECEIPTS';
}else console.log('Trade scoring retains its existing cutoff: exact-week reviewed sources are missing.');
run('verify-trade-museum-scope');
console.log(JSON.stringify({year,week,tradeRefresh,draftBoard:'VERIFIED_COMPLETED_EVENT',
  playerPreview:'REBUILT_FROM_SCOPED_RECEIPTS',waiverArchive:'SOURCE_VALIDATED'},null,2));
