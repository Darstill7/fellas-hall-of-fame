// Smoke check key public data bindings without requiring a browser.
// Run: node scripts/verify-core-consumers.mjs
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const assert=(test,msg)=>{if(!test)throw Error(msg)};
const careers=JSON.parse(read('data/career_core_generated.json'));
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const managers={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const recordRenderer=read('assets/canonical-manager-record.js');
const h2hRenderer=read('assets/manager-h2h-explorer.js');
assert(recordRenderer.includes('data/career_core_generated.json'),'Manager headlines must read generated career core');
assert(h2hRenderer.includes('data/unified_record_book_2016_2026.json'),'Manager H2H must read canonical ledger');
assert(!h2hRenderer.includes('2026 Weeks 1–6'),'Outdated rivalry coverage claim');
for(const [slug,id] of Object.entries(managers)){
 assert(!!careers.managers[id],'Missing generated manager '+id);
 for(const path of ['managers/'+slug+'/index.html','managers/'+slug+'.html']){
  const html=read(path);
  assert(html.includes('data-canonical-manager-record="'+id+'"'),'Missing canonical career binding: '+path);
  assert(html.includes('canonical-manager-record.js'),'Missing career renderer: '+path);
 }
}
const count=ledger.games.filter(g=>g.stage==='regular').length;
assert(careers.regularSeasonGames===count,'Generated regular season game count differs');
for(const [id,m] of Object.entries(careers.managers)){
 assert(m.w+m.l+m.t===m.games,'Invalid manager record: '+id);
 for(const [opponent,h] of Object.entries(m.h2h)){
  const reverse=careers.managers[opponent]?.h2h?.[id];
  assert(!!reverse&&h.w===reverse.l&&h.l===reverse.w&&h.t===reverse.t&&h.games===reverse.games,'Asymmetric H2H: '+id+' / '+opponent);
 }
}
console.log('Public core consumers verified for '+Object.keys(managers).length+' active managers and '+count+' regular-season games');
