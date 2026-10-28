// Check concrete championship, season record and PF statements in editorial profiles.
// Scope deliberately limited to assertions represented as verified facts.
import fs from 'node:fs';
const guide=JSON.parse(fs.readFileSync('data/season_guide.json','utf8'));
const checks=[
 ['jmid',2024,'JMid',8,6,1730.22,'8–6 record and a documented league-high 1,730.22 points for'],
 ['mitch',2025,'Mitch',13,1,1894.88,'13–1 and scored 1,894.88 points'],
 ['birch',2019,'Birch',11,2,null,'won the championship in 2019 after an 11–2 regular season']
];
const fails=[];
for(const [slug,year,name,w,l,pf,phrase] of checks){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const row=guide[year]?.standings?.find(x=>x.name===name);
 if(!row||row.w!==w||row.l!==l||(pf!==null&&Math.abs(row.pf-pf)>.01)||!page.includes(phrase))fails.push(slug+' '+year+' season/claim mismatch');
 if(slug==='jmid'&&guide[year].standings.some(x=>x.pf>pf+.01))fails.push('JMid 2024 was not season points leader');
 if(slug==='birch'&&guide[year].champion!==name)fails.push('Birch 2019 title mismatch');
}
const titles=[['tom',[2016,2017,2018,2024],'Thommy'],['stilly',[2023],'Stilly'],['stover',[2022],'Stover'],['tony',[2021],'Tony'],['scott',[2025],'Scott']];
for(const [slug,years,name] of titles){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 if(!page.includes('id="franchise-story"'))fails.push(slug+' biography missing');
 for(const year of years)if(guide[year]?.champion!==name)fails.push(slug+' '+year+' championship source mismatch');
}
if(fails.length){console.error('Biography season claim audit FAILED:\n'+fails.join('\n'));process.exit(1)}
console.log('Biography season claim audit PASS: 3 specific season/points claims and 8 championship years checked; narrative provenance requires separate review.');
