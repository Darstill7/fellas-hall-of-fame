// Prevent a moving staging branch from silently substituting unreviewed data.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/prepare-approved-weekly-release.yml',import.meta.url),'utf8');
const docs=readFileSync(new URL('../docs/WEEKLY_PUBLICATION.md',import.meta.url),'utf8');
assert.match(workflow,/staging_commit:\s*\n\s*description:[^\n]*full 40-character|staging_commit:\s*\n\s*description:[^\n]*Full 40-character/i,'Workflow requires reviewed SHA input');
assert.ok(workflow.includes("REVIEWED_STAGING_COMMIT: ${{ inputs.staging_commit }}"),'Explicit reviewed SHA must enter guarded shell through env');
assert.ok(workflow.includes('[[ "$REVIEWED_STAGING_COMMIT" =~ ^[0-9a-f]{40}$ ]]'),'Reject malformed and short reviewed SHAs');
assert.ok(workflow.includes('[[ "$SOURCE_COMMIT" != "$REVIEWED_STAGING_COMMIT" ]]'),'Refuse staging branch changes after review');
assert.ok(workflow.includes('git show "$SOURCE_COMMIT:${CANDIDATE}" > "$CANDIDATE"'),'Candidate must be loaded from pinned SHA');
assert.ok(!workflow.includes('git show "origin/automation/sleeper-weekly-stage:${CANDIDATE}"'),'Reject unpinned fetch of candidate');
assert.ok(docs.includes('staging_commit=<reviewed 40-character SHA>'),'Commissioner runbook must document exact source identity');
const isValid=s=>/^[0-9a-f]{40}$/.test(s);
assert.equal(isValid('a'.repeat(40)),true);
assert.equal(isValid('A'.repeat(40)),false);
assert.equal(isValid('a'.repeat(39)),false);
assert.equal(isValid('a'.repeat(41)),false);
assert.equal(isValid('not-a-commit'),false);
const approved='a'.repeat(40),advanced='b'.repeat(40);
assert.equal(approved===advanced,false,'A changed staging branch must invalidate former approval');
console.log('Approved staging SHA pinning contract passed: reviewed commit identity required, branch drift rejected.');

import {mkdtempSync,mkdirSync,writeFileSync,readFileSync as read,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

// Run the workflow's real shell step against fake git in a disposable directory.
const stageStart=workflow.indexOf('      - name: Validate reviewed week and retrieve fixed-source staging candidate');
const runStart=workflow.indexOf('        run: |\n',stageStart);
const runEnd=workflow.indexOf('\n      - name:',runStart+1);
assert.ok(stageStart!==-1&&runStart!==-1&&runEnd!==-1,'Approval step must be extractable');
const shell=workflow.slice(runStart+'        run: |\n'.length,runEnd).split('\n').map(line=>line.startsWith('          ')?line.slice(10):line).join('\n');
assert.ok(shell.includes('git show "$SOURCE_COMMIT:${CANDIDATE}"'),'Must execute pinned source read');
const dir=mkdtempSync(join(tmpdir(),'fellas-sha-approval-'));
try {
 const bin=join(dir,'bin');mkdirSync(bin);
 const git=join(bin,'git');
 writeFileSync(git,[
  '#!/usr/bin/env bash',
  'set -euo pipefail',
  'printf "%s\\n" "$*" >> "$MOCK_GIT_LOG"',
  'case "$1" in',
  '  fetch) exit 0 ;;',
  '  rev-parse) printf "%s\\n" "$MOCK_STAGING_HEAD"; exit 0 ;;',
  '  show)',
  '    if [[ "$2" != "$MOCK_STAGING_HEAD:data-integrity/sleeper-sync-candidates/2026-week10.json" ]]; then exit 8; fi',
  '    printf "%s\\n" "$MOCK_CANDIDATE_JSON"; exit 0 ;;',
  '  *) exit 9 ;;',
  'esac'
 ].join('\n'));
 chmodSync(git,0o755);
 const head='1'.repeat(40),advanced='2'.repeat(40);
 const candidate=JSON.stringify({year:2026,week:10,status:'REVIEW_REQUIRED',matchupCount:5,games:Array.from({length:5},()=>({}))});
 const execute=(reviewed,actual,week='10')=>{
  const log=join(dir,'git-commands.log');writeFileSync(log,'');
  const run=spawnSync('bash',['-c',shell],{
   cwd:dir,encoding:'utf8',
   env:{...process.env,PATH:bin+':'+process.env.PATH,REVIEWED_WEEK:week,REVIEWED_STAGING_COMMIT:reviewed,
    MOCK_STAGING_HEAD:actual,MOCK_CANDIDATE_JSON:candidate,MOCK_GIT_LOG:log,
    GITHUB_STEP_SUMMARY:join(dir,'summary.txt'),GITHUB_ENV:join(dir,'env.txt')}
  });
  return {run,log:read(log,'utf8')};
 };
 const ok=execute(head,head);
 assert.equal(ok.run.status,0,'Approved identical staging head must pass: '+ok.run.stderr);
 assert.match(ok.log,/show 1{40}:data-integrity\/sleeper-sync-candidates\/2026-week10\.json/,'Success must read pinned bytes');
 const drift=execute(head,advanced);
 assert.notEqual(drift.run.status,0,'Branch advance after review must stop approval');
 assert.match(drift.run.stdout,/Staging branch changed after approval/);
 assert.ok(!drift.log.includes('show '),'Drift must abort before reading candidate');
 const invalid=execute('1'.repeat(39),head);
 assert.notEqual(invalid.run.status,0,'Short approval SHA must be rejected');
 assert.equal(invalid.log,'','Invalid SHA must abort before any git fetch');
 const wrongWeek=execute(head,head,'15');
 assert.notEqual(wrongWeek.run.status,0,'Postseason week must be rejected before staging');
 assert.equal(wrongWeek.log,'','Invalid week must abort before any git fetch');
 console.log('PASS: executed isolated workflow step against matching, moved, malformed and postseason inputs.');
} finally {rmSync(dir,{recursive:true,force:true})}

