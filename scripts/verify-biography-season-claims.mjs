// Check concrete championship, season record and PF statements in editorial profiles.
// Scope deliberately limited to assertions represented as verified facts.
import fs from 'node:fs';
import {managerPersonas} from '../assets/manager-personas.mjs';
const guide=JSON.parse(fs.readFileSync('data/season_guide.json','utf8'));
const checks=[
 ['jmid',2024,'JMid',8,6,1730.22,['league-leading 1,730.22 points']],
 ['mitch',2025,'Mitch',13,1,1894.88,['13–1 season in 2025']],
 ['birch',2019,'Birch',11,2,null,['took the title in 2019 after an 11–2 regular season']]
];
const fails=[];
for(const [slug,year,name,w,l,pf,phrases] of checks){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const row=guide[year]?.standings?.find(x=>x.name===name);
 if(!row||row.w!==w||row.l!==l||(pf!==null&&Math.abs(row.pf-pf)>.01)||!phrases.every(phrase=>page.includes(phrase)))fails.push(slug+' '+year+' season/claim mismatch');
 if(slug==='jmid'&&guide[year].standings.some(x=>x.pf>pf+.01))fails.push('JMid 2024 was not season points leader');
 if(slug==='birch'&&guide[year].champion!==name)fails.push('Birch 2019 title mismatch');
}
const titles=[['tom',[2016,2017,2018,2024],'Thommy'],['stilly',[2023],'Stilly'],['stover',[2022],'Stover'],['tony',[2021],'Tony'],['scott',[2025],'Scott']];
for(const [slug,years,name] of titles){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!page.includes('id="franchise-story"'))fails.push(slug+' biography missing');
 for(const year of years)if(guide[year]?.champion!==name)fails.push(slug+' '+year+' championship source mismatch');
}
// Visitor-facing baseball-card capsules must be sourced and complete.
const expectedNames=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
if(JSON.stringify(Object.keys(managerPersonas).sort())!==JSON.stringify(expectedNames.sort()))fails.push('Manager capsule directory is not exactly ten current managers');
for(const [manager,persona] of Object.entries(managerPersonas)){
 if(!persona.name||!persona.origin||persona.origin.length<130||persona.origin.length>690)fails.push(manager+' lacks a substantive, concise card biography');
 if(/championship payoff|portfolio of remembered|chase brown chapter|moves involving several players/i.test(persona.origin))fails.push(manager+' retains vague editorial shorthand');
}
const textFile=p=>fs.readFileSync(p,'utf8');
for(const path of ['index.html','hall/index.html','analytics/records.html']){
 if(textFile(path).includes('Corrections archive'))fails.push(path+' exposes a public corrections-archive link');
}
const search=textFile('analytics/search.html');
for(const route of ['../data-integrity/replay-booth.html','../data-integrity/audit.html']){
 if(search.includes('href="'+route+'"')||search.includes('"url":"'+route+'"')||search.includes('"url": "'+route+'"'))fails.push('Public search still exposes '+route);
}
for(const path of ['data-integrity/replay-booth.html','data-integrity/replay-booth/index.html','data-integrity/audit.html','data-integrity/audit/index.html']){
 const page=textFile(path);
 if(!page.includes('noindex,nofollow,noarchive')||!page.includes('location.replace(')||page.includes('Data Integrity & Corrections'))fails.push(path+' is not a safe archive redirect');
}
if(fails.length){console.error('Biography season claim audit FAILED:\n'+fails.join('\n'));process.exit(1)}
console.log('Biography season claim audit PASS: 3 specific season/points claims and 8 championship years checked; narrative provenance requires separate review.');
