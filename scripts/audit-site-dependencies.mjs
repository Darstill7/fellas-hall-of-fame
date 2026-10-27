// Inventory historical data dependencies across the website. Advisory only.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),refs=[],sources={};
const extensions=new Set(['.html','.js','.mjs']);
const ignore=new Set(['.git','node_modules','dist']);
function walk(dir){
 for(const d of fs.readdirSync(dir,{withFileTypes:true})){
  if(ignore.has(d.name))continue;
  const full=path.join(dir,d.name);
  if(d.isDirectory()){walk(full);continue}
  if(!extensions.has(path.extname(full)))continue;
  const rel=path.relative(root,full);
  if(rel.startsWith('scripts'+path.sep)||rel.startsWith('.github'+path.sep))continue;
  const source=fs.readFileSync(full,'utf8');
  const found=[...new Set([...source.matchAll(/[A-Za-z0-9_./-]+\.json\b/g)].map(m=>m[0]).filter(v=>v.includes('data/')||v.includes('manager_')||v.includes('league.json')))];
  if(!found.length)continue;
  sources[rel]=found;
  for(const item of found)refs.push({consumer:rel,source:item});
 }
}
walk(root);
const duplicates=['manager_legacy_resumes.json','manager_record_books_2016_2026.json','season_weekly_matchups_2016_2026_v1.json','manager_rivalry_analytics_v1.json','manager_rivalry_resumes_v1.json'];
const flagged=refs.filter(r=>duplicates.some(d=>r.source.endsWith(d)));
const report={generatedAt:'Run-time inventory; see CI date',consumerFiles:Object.keys(sources).length,references:refs.length,legacySourceReferences:flagged.length,flagged,byConsumer:sources};
fs.mkdirSync('data-integrity',{recursive:true});
fs.writeFileSync('data-integrity/site-dependency-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log('Dependency inventory:',report.consumerFiles,'consumer files,',report.references,'JSON references,',report.legacySourceReferences,'legacy references.');
for(const r of flagged.slice(0,80))console.log(r.consumer+' -> '+r.source);
