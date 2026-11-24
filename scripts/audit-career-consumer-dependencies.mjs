// Inventory runtime and build-time dependencies before migrating career statistics.
import fs from 'node:fs';
import path from 'node:path';
const roots=['index.html','assets','managers','hall','analytics','rivalries','seasons','home','scripts','weeks','weekly-shitter','shitter','museum.html'];
const targets=['manager_profile_career_summary_v2.json','career_core_generated.json','manager_record_books_2016_2026.json','season_guide.json','unified_record_book_2016_2026.json','season_weekly_matchups_2016_2026_v1.json','manager_biographies_awards.json','manager_season_results_v1.json','manager_verified_season_endings_v1.json','all_time_luck_ratings_v1.json'];
const hits=Object.fromEntries(targets.map(t=>[t,[]]));
function scan(p){
 if(!fs.existsSync(p))return;
 const st=fs.statSync(p);
 if(st.isDirectory()){for(const name of fs.readdirSync(p).sort())scan(path.join(p,name));return;}
 if(!/\.(html|mjs|js)$/.test(p)||p.endsWith('audit-career-consumer-dependencies.mjs'))return;
 const lines=fs.readFileSync(p,'utf8').split('\n');
 for(let i=0;i<lines.length;i++)for(const t of targets)if(lines[i].includes(t))hits[t].push({path:p,line:i+1,layer:p.startsWith('scripts/')?'build_or_test':'website',excerpt:lines[i].trim().slice(0,240)});
}
for(const p of roots)scan(p);
const report={status:'RESEARCH_ONLY_LITERAL_REFERENCE_INVENTORY',limitations:['Computed URLs, inline hardcoded numbers and indirect data dependencies require separate checks. A reference is not proof of stale data.'],targets:Object.entries(hits).map(([file,references])=>({file,references,website_files:[...new Set(references.filter(r=>r.layer==='website').map(r=>r.path))],build_files:[...new Set(references.filter(r=>r.layer==='build_or_test').map(r=>r.path))]}))};
const root='data-integrity/historical-trade-draft-audits';
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(root+'/career-consumer-dependencies.json',JSON.stringify(report,null,2)+'\n');
console.log('CAREER CONSUMER INVENTORY '+JSON.stringify(report.targets.map(t=>({file:t.file,website_files:t.website_files.length,build_files:t.build_files.length,references:t.references.length}))));
