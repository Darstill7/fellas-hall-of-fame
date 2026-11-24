// Refresh only canonical career WLT fallbacks; preserve editorial and title data.
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const careers=JSON.parse(read('data/career_core_generated.json')).managers;
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const week=Math.max(...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
const slugs={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const canonical=id=>{const m=careers[id==='Tom'?'Thommy':id];if(!m)throw Error('Unknown manager '+id);return m};
const record=id=>{const {w,l,t}=canonical(id);return w+'–'+l+(t?'–'+t:'')};
const changes=new Map();
for(const [slug,id] of Object.entries(slugs)){
 for(const path of ['managers/'+slug+'/index.html','managers/'+slug+'.html']){
  const raw=read(path);let count=0;
  const next=raw.replace(/(<strong data-canonical-manager-record="([^"]+)"[^>]*>)[^<]+(<\/strong>)/g,(_,a,name,b)=>{if(name!==id)throw Error('Identity mismatch '+path);count++;return a+record(id)+b});
  if(path.endsWith('/index.html')&&!count)throw Error('Missing hero '+path);
  changes.set(path,next);
 }
}
for(const path of ['data/league.json','data/manager_legacy_resumes.json']){
 const raw=read(path),doc=JSON.parse(raw),rows=path.endsWith('league.json')?doc.managers:doc;
 for(const id of Object.values(slugs)){const key=id==='Thommy'?'Tom':id;if(!rows[key])throw Error('Missing '+key+' in '+path);rows[key].record=record(id)}
 if(path.endsWith('manager_legacy_resumes.json'))for(const key of Object.keys(rows))if(careers[key==='Tom'?'Thommy':key])rows[key].record=record(key);
 changes.set(path,JSON.stringify(doc,null,2)+'\n');
}
const path='analytics/legacy.html',raw=read(path);
const re=/(<script[^>]*id="legacyData"[^>]*>)([\s\S]*?)(<\/script>)/;
if(!re.test(raw))throw Error('Missing legacy fallback');
changes.set(path,raw.replace(re,(_,a,body,b)=>{
 const doc=JSON.parse(body);
 for(const row of doc.managers){const m=canonical(row.manager);row.career_wins=m.w;row.career_losses=m.l;row.career_ties=m.t;row.career_win_pct=(m.w+m.t/2)/m.games;if(!/2026 Week \d+/.test(row.record_scope))throw Error('Unexpected scope '+row.manager);row.record_scope=row.record_scope.replace(/2026 Week \d+/,'2026 Week '+week)}
 return a+JSON.stringify(doc)+b;
}));
for(const [path,next] of changes)if(next!==read(path))fs.writeFileSync(path,next);
console.log('Manager hero, shared WLT and legacy fallback refresh through Week '+week);
