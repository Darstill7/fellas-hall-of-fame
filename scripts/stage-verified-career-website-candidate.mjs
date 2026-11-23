// Stage the four mutually verified projections in an isolated directory.
// No canonical website writes. Publish only as a complete release after downstream gates.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root='data-integrity/historical-trade-draft-audits/';
const check=spawnSync(process.execPath,['scripts/test-career-projection-agreement.mjs'],{stdio:'inherit'});
assert.equal(check.status,0,'Cross-dataset verification required');
const files={
 'manager-profile-career-preview.json':'data/manager_profile_career_summary_v2.json',
 'career-core-preview.json':'data/career_core_generated.json',
 'season-guide-preview.json':'data/season_guide.json',
 'unified-record-book-preview.json':'data/unified_record_book_2016_2026.json'
};
const stage=root+'website-migration-candidate';
const temp=fs.mkdtempSync(root+'website-migration-tmp-');
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest={status:'RESEARCH_ONLY_NOT_DEPLOYABLE',completedThrough:null,files:[],remaining:['weekly matchup mirror','manager record books','season endings','all-time luck','embedded HTML and browser consumer parity','postseason eligibility','front office and playoff race freshness','production release approval']};
try{
 for(const [source,target] of Object.entries(files)){
  const bytes=fs.readFileSync(root+source),parsed=JSON.parse(bytes);
  if(parsed.completedThrough){manifest.completedThrough??=parsed.completedThrough;assert.deepEqual(parsed.completedThrough,manifest.completedThrough);}
  const dest=path.join(temp,target);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
  manifest.files.push({path:target,sha256:sha(bytes),previous_sha256:sha(fs.readFileSync(target))});
 }
 assert(manifest.completedThrough);
 const guide=JSON.parse(fs.readFileSync(path.join(temp,'data/season_guide.json'),'utf8'));
 assert.equal(guide[manifest.completedThrough.year].standings[0].games,manifest.completedThrough.week);
 fs.writeFileSync(path.join(temp,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.rmSync(stage,{recursive:true,force:true});fs.renameSync(temp,stage);
 for(const entry of manifest.files){assert.equal(sha(fs.readFileSync(entry.path)),entry.previous_sha256,'Canonical file must remain unchanged');assert.equal(sha(fs.readFileSync(path.join(stage,entry.path))),entry.sha256);}
 console.log('WEBSITE MIGRATION CANDIDATE PASS '+JSON.stringify({files:manifest.files.length,completedThrough:manifest.completedThrough,canonical_writes:0}));
}finally{if(fs.existsSync(temp))fs.rmSync(temp,{recursive:true,force:true});}
