import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildFranchiseLegends} from '../assets/manager-franchise-legends-v46.mjs';
import {buildLegendsLibrary} from '../assets/legends-library-v46.mjs';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const args=['career_core_generated.json','unified_record_book_2016_2026.json','season_guide.json','manager_verified_season_endings_v1.json'].map(read);
const names=['Birch','JMid','Kuhl','Mitch','Scott','Stew','Stilly','Stover','Thommy','Tony'];let checks=0;
const check=(x,msg)=>{assert(x,msg);checks++};
const results=[];
for(const n of names){
 const f=buildFranchiseLegends(...args,n),a=f.anthology;
 check(f.name===n,'manager identity');
 check(f.chapters.length===Object.keys(args[0].managers[n].annual).length,'chapter coverage');
 check(a.evidence.length===2,'anthology anchors');
 for(const e of a.evidence)check(args[3].managers[n].some(r=>r.year===e.year&&r.finalRank===e.finish),'verified placement');
 const seasons=args[3].managers[n].filter(r=>r.year<2026);
 check(a.titles===seasons.filter(r=>r.finalRank===1).length,'titles');
 check(a.runnerUps===seasons.filter(r=>r.finalRank===2).length,'finals');
 for(const g of f.classics)check(args[1].games.some(r=>r.year===g.year&&r.week===g.week&&[r.home,r.away].map(x=>x==='Tom'?'Thommy':x).includes(n)&&r.stage==='regular'),'classic receipt');
 for(const w of a.windows)check(w.to-w.from+1===3||w.to-w.from+1===5,'consecutive career window');
 results.push({name:n,chapters:f.chapters.length,moments:f.moments.length,titles:a.titles});
}
const library=buildLegendsLibrary(...args);
check(library.filter(s=>s.category==='Franchise features').length===10,'all biographies');
const classics=library.filter(s=>s.category==='Forgotten classics').map(s=>{const g=s.evidence[0];return [g.year,g.week,...[s.manager,g.opponent].sort()].join(':')});
check(new Set(classics).size===classics.length,'deduplicated classics');
console.log('GM46 ACTUAL ARCHIVE '+JSON.stringify({checks,results,stories:library.length}));
