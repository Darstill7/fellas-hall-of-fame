// Verify that legacy encyclopedia pages remain accessible and contain distinct editorial material.
// This is a preservation gate, NOT a claim that all dossier copy has migrated to current profiles.
import fs from 'node:fs';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const required=['manager-historical-records.js','manager-verified-season-endings.js','manager-trophy-cases.js','espn-franchise-lineage.js','manager-weekly-game-log.js','canonical-manager-record.js'];
let issues=[];
const headings=s=>[...s.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').trim()).filter(Boolean);
for(const slug of slugs){
 const legacy=fs.readFileSync('managers/'+slug+'.html','utf8');
 const primary=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const old=headings(legacy),modern=headings(primary);
 if(old.length<20||old.length<=modern.length)issues.push(slug+' older dossier may have lost its distinct long-form editorial coverage');
 if(!primary.includes('href="../'+slug+'.html"'))issues.push(slug+' profile no longer links to the long-form dossier');
 for(const module of required)if(!legacy.includes(module)||!primary.includes(module))issues.push(slug+' missing essential shared module '+module);
 if(!legacy.includes('They do not adjust fully for position scarcity, replacement value'))issues.push(slug+' measured trade rankings lack methodology limitation');
 if(!legacy.includes('data-canonical-manager-record="')||!primary.includes('data-canonical-manager-record="'))issues.push(slug+' missing canonical WLT binding');
}
if(issues.length){console.error('Dossier preservation audit FAILED: '+issues.join('; '));process.exit(1)}
console.log('Dossier preservation PASS: ten historical dossiers retain long-form headings and canonical bindings; full editorial parity remains unverified.');
