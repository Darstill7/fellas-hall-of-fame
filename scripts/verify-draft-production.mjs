import fs from 'node:fs';
import {buildDraftProduction} from '../assets/manager-draft-production.mjs';
const rows=JSON.parse(fs.readFileSync('data/v9_draft_engine.json','utf8'));
const managers=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const assert=(ok,message)=>{if(!ok)throw Error(message)};
assert(Array.isArray(rows)&&rows.length>500,'Sleeper draft source unexpectedly small');
for(const manager of managers){
 const production=buildDraftProduction(rows,manager);
 const sourceManager=manager==='Thommy'?'Tom':manager;
 const source=rows.filter(p=>p.manager===sourceManager&&!p.keeper&&p.year>=2020&&p.year<=2025);
 assert(production.selectionCount===source.length,'Selection count incorrect for '+manager);
 assert(production.byYear.every(s=>s.year>=2020&&s.year<=2025),'2026 leaked for '+manager);
 assert(production.starts===source.reduce((n,p)=>n+p.reg_starts,0),'Starter counts diverged for '+manager);
 assert(Math.abs(production.points-source.reduce((n,p)=>n+p.reg_starter_points,0))<0.011,'Observed points diverged for '+manager);
 assert(production.status==='observed_original_manager_starts_only'||!source.length,'Evidence scope invalid '+manager);
}
const minimal={year:2025,overall:1,round:1,manager:'Stilly',player:'Example',keeper:false,reg_starts:3,reg_starter_points:12.5};
const incomplete={...minimal,year:2026,overall:2,reg_starter_points:1000};
const keeper={...minimal,overall:3,keeper:true,reg_starter_points:900};
let x=buildDraftProduction([minimal,incomplete,keeper],'Stilly');
assert(x.selectionCount===1&&x.points===12.5&&x.starts===3,'2026 or keepers counted in completed contribution');
try{buildDraftProduction([minimal,minimal],'Stilly');throw Error('Duplicate was accepted')}catch(e){assert(/Duplicate/.test(e.message),'Unexpected duplicate-pick test error')}
const page=fs.readFileSync('assets/manager-draft-trade-career-page.mjs','utf8');
assert(page.includes("fetchJSON('data/v9_draft_engine.json')")&&page.includes('buildDraftProduction(draftProductionRows,manager)')&&
 page.includes('This is not total player production, surplus value or a drafting grade.')&&page.includes('career-draft-production'),
 'Career website missing evidence-limited draft production section');
console.log('Draft production evidence PASS: completed Sleeper seasons, no keeper/2026 leakage, source totals and all managers');
