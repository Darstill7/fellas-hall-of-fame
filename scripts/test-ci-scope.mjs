import assert from 'node:assert/strict';
import {classify,changedPaths} from './classify-ci-scope.mjs';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
const cases=[
[[],'full'],[null,'full'],[['weekly-shitter/issue-03.html'],'targeted'],[['weekly-shitter/assets/issue-03-social.jpg'],'targeted'],[['tuesday-hangover/2026-week-11.html'],'targeted'],[['weekly-shitter/index.html'],'integration'],[['index.html'],'integration'],[['assets/app-shell-v34.mjs'],'integration'],[['assets/manager-profile.mjs'],'integration'],[['data/playoff_race_v1.json'],'full'],[['scripts/verify-canonical-history.mjs'],'full'],[['.github/workflows/verify-canonical-history.yml'],'full'],[['weekly-shitter/issue-03.html','data/ledger.json'],'full'],[['weekly-shitter/issue-03.html','index.html'],'integration'],[['weekly-shitter/assets/shared.js'],'full'],[['random.html'],'full'],[['../weekly-shitter/issue-03.html'],'full'],[['weekly-shitter/issue-03.html','.ci-ambiguous-change'],'full'],[['weekly-shitter/issue-03.html','weekly-shitter/assets/issue-03-social.svg'],'targeted']
];
for(const [paths,scope] of cases)assert.equal(classify(paths).scope,scope,JSON.stringify(paths));
const dir=mkdtempSync(join(tmpdir(),'fellas-ci-scope-'));const original=process.cwd();
try{
process.chdir(dir);const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','CI test');mkdirSync('weekly-shitter');writeFileSync('weekly-shitter/issue-03.html','old');git('add','.');git('commit','-qm','base');const base=git('rev-parse','HEAD');
writeFileSync('weekly-shitter/issue-03.html','new');git('add','.');git('commit','-qm','edit');const head=git('rev-parse','HEAD');assert.equal(classify(changedPaths(base,head)).scope,'targeted');
git('mv','weekly-shitter/issue-03.html','weekly-shitter/issue-04.html');git('commit','-qm','rename');assert.equal(classify(changedPaths(head,git('rev-parse','HEAD'))).scope,'full');
assert.throws(()=>changedPaths('bad',head));
}finally{process.chdir(original);rmSync(dir,{recursive:true,force:true});}
console.log('CI scope: '+cases.length+' classification fixtures and 3 git diff checks passed');
