// Synchronize server-rendered fallback statistics from the verified release data.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const core=JSON.parse(read('data/career_core_generated.json')),guide=JSON.parse(read('data/season_guide.json'));
const changes=[];
const record=m=>m.w+'–'+m.l+(m.t?'–'+m.t:'');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):e.name.endsWith('.html')?[d+'/'+e.name]:[]);
for(const file of ['index.html',...walk('managers'),...walk('seasons'),...walk('analytics')]){
 if(/-archive\.html$/.test(file))continue;
 const before=read(file);
 let after=before.replace(/(<(?:strong|span)\b[^>]*\bdata-canonical-manager-(record|games)="([^"]+)"[^>]*>)([^<]*)(<\/(?:strong|span)>)/g,(all,open,type,name,old,close)=>{
  const m=core.managers[name==='Tom'?'Thommy':name];assert(m,'Unknown canonical manager '+name+' in '+file);
  return open+(type==='record'?record(m):m.games)+close;
 });
 if(file==='seasons/index.html'){
  const block=/<script\s+type="application\/json"\s+id="seasons-data">[\s\S]*?<\/script>/;
  assert(block.test(after),'Season guide embedded data not found');
  after=after.replace(block,'<script type="application/json" id="seasons-data">'+JSON.stringify(guide).replace(/</g,'\\u003c')+'</script>');
  after=after.replace(/archived Week \d+ snapshot; use the 2026 Season hub/g,'archived Week '+core.completedThrough.week+' snapshot; use the 2026 Season hub');
 }
 if(before!==after)changes.push({file,before,after});
}
if(process.argv.includes('--check'))assert.equal(changes.length,0,'Stale static fallback files: '+changes.map(x=>x.file).join(', '));
else for(const c of changes)fs.writeFileSync(c.file,c.after);
console.log('CAREER STATIC FALLBACK SYNC '+JSON.stringify({completedThrough:core.completedThrough,changed:changes.map(c=>c.file)}));
