import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';

const root=process.cwd();
const ledgerPath='data/unified_record_book_2016_2026.json';
const original=fs.readFileSync(ledgerPath);
const ledger=JSON.parse(original);
const currentWeek=Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
if(currentWeek>=14){
  console.log('No next 2026 regular-season week remains for this rehearsal.');
  process.exit(0);
}
const week=currentWeek+1;
const rehearsal=fs.mkdtempSync(path.join(os.tmpdir(),'fellas-weekly-v58-'));
const relativize=file=>path.join(rehearsal,file);
const read=file=>JSON.parse(fs.readFileSync(relativize(file),'utf8'));
const run=(program,args,env={})=>spawnSync(program,args,{
  cwd:rehearsal,encoding:'utf8',env:{...process.env,...env},maxBuffer:8*1024*1024
});
try{
  const tracked=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
  for(const file of tracked){
    fs.mkdirSync(path.dirname(relativize(file)),{recursive:true});
    fs.copyFileSync(path.join(root,file),relativize(file));
  }
  const candidate='data-integrity/sleeper-sync-candidates/2026-week'+week+'.json';
  fs.mkdirSync(path.dirname(relativize(candidate)),{recursive:true});
  const synthetic=ledger.games.filter(g=>g.year===2026&&g.stage==='regular'&&g.week===currentWeek)
    .map(g=>({...g,week,source:'SYNTHETIC_TEST_ONLY'}));
  assert.equal(synthetic.length,5);
  fs.writeFileSync(relativize(candidate),JSON.stringify({status:'REVIEW_REQUIRED',
    league:'1340027406009761792',year:2026,week,matchupCount:5,games:synthetic}));
  const beforeMuseum=fs.readFileSync(relativize('data/trade_museum_stage66.json'));
  const beforeArchive=fs.readFileSync(relativize('data/expanded_records_verified_v1.json'));
  const beforeFaab=fs.readFileSync(relativize('data-integrity/faab-provider-receipts-2026.json'));
  const beforePlayers=fs.readFileSync(relativize('data/player_starts_2026.json'));
  const common={CANDIDATE:candidate,REVIEWED_WEEK:String(week),STAGING_COMMIT:'SYNTHETIC_TEST_ONLY',
    RUNNER_TEMP:rehearsal,GITHUB_STEP_SUMMARY:relativize('summary.md')};
  const denied=run('bash',['scripts/refresh-approved-week-v58.sh'],{...common,FELLAS_APPROVE_WEEKLY_IMPORT:'NO'});
  assert.notEqual(denied.status,0);
  assert.match(denied.stderr,/Human approval required/);
  assert.deepEqual(fs.readFileSync(relativize(ledgerPath)),original);
  const approved=run('bash',['scripts/refresh-approved-week-v58.sh'],{...common,
    FELLAS_APPROVE_WEEKLY_IMPORT:'YES',PUBLICATION_SCOPE:'matchups'});
  assert.equal(approved.status,0,approved.stdout+'\n'+approved.stderr);
  const report=read('data/site-freshness-v58.json');
  const packet=read('fellas-editorial/packet.json');
  const overlay=read('data/expanded-record-current-leaders-v58.json');
  assert.equal(report.approvedWeek,week);
  assert.equal(overlay.throughWeek,week);
  assert.deepEqual(report.blockers,[]);
  assert.ok(report.specialtyGaps.includes('museum'));
  assert.equal(packet.week,week);
  assert.equal(packet.sourceFreshness.approvedWeek,week);
  assert.equal(packet.attainableMilestones.status,'APPROVED_LEDGER_VERIFIED');
  assert.equal(packet.recordOwnership.status,'APPROVED_LEDGER_VERIFIED');
  assert.deepEqual(read(ledgerPath).games.slice(0,ledger.games.length),ledger.games);
  assert.deepEqual(fs.readFileSync(relativize('data/expanded_records_verified_v1.json')),beforeArchive);
  assert.deepEqual(fs.readFileSync(relativize('data/trade_museum_stage66.json')),beforeMuseum);
  assert.deepEqual(fs.readFileSync(relativize('data-integrity/faab-provider-receipts-2026.json')),beforeFaab);
  assert.deepEqual(fs.readFileSync(relativize('data/player_starts_2026.json')),beforePlayers);
  const full=run(process.execPath,['scripts/audit-site-freshness-v58.mjs','--check','--full']);
  assert.notEqual(full.status,0);
  assert.match(full.stderr,/blocked.*museum/);
  const compactFile='data/home-current-season-v1.json';
  const tampered=read(compactFile);
  tampered.games[0].homeScore+=0.01;
  fs.writeFileSync(relativize(compactFile),JSON.stringify(tampered));
  const corrupt=run(process.execPath,['scripts/audit-site-freshness-v58.mjs']);
  assert.notEqual(corrupt.status,0);
  assert.match(corrupt.stderr,/blocked.*home/);
  assert.deepEqual(fs.readFileSync(ledgerPath),original);
  console.log('Synthetic Week '+week+' passed matchup refresh, source gates, milestones and editorial handoff.');
}finally{
  fs.rmSync(rehearsal,{recursive:true,force:true});
}
