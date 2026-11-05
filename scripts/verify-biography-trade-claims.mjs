// Verify trade references in full published biographies, not condensed profile teasers.
import fs from 'node:fs';
const sides=JSON.parse(fs.readFileSync('data/v9_trade_engine.json','utf8')).sides;
const biographies=JSON.parse(fs.readFileSync('data/manager_biographies_awards.json','utf8')).managers;
const loader=fs.readFileSync('assets/legacy-resume.js','utf8');
const cases=[
 ['stilly','Stilly',2023,['Mike Evans','Derrick Henry']],
 ['stew','Stew',2022,['Justin Jefferson',"Ja'Marr Chase"]],
 ['tony','Tony',2021,['Joe Mixon']],
 ['tony','Tony',2022,['James Robinson']],
 ['kuhl','Kuhl',2024,['J.K. Dobbins']],
 ['jmid','JMid',2024,['Kyren Williams','Calvin Ridley']]
];
const errors=[];
if(!loader.includes('manager_biographies_awards.json')||!loader.includes('career-bio-prose'))
 errors.push('Biography renderer does not load full editorial source');
for(const [slug,manager,year,players] of cases){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const biography=biographies[manager]?.biography||'';
 if(!page.includes('id="legacy-resume"')||!page.includes('assets/legacy-resume.js'))
  errors.push(slug+' full biography module is no longer mounted');
 for(const player of players){
  const found=sides.some(s=>s.manager===manager&&s.year===year&&s.assets.includes(player)&&
   String(s.confidence).startsWith('verified')&&!s.provisional);
  if(!found)errors.push(manager+' '+year+' '+player+' not verified in trade model');
  if(!biography.includes(player)&&!biography.includes(player.replaceAll("'",'’')))
   errors.push(slug+' full biography no longer includes '+player);
 }
}
if(errors.length){console.error('Biography trade claim audit FAILED:\n'+errors.join('\n'));process.exit(1)}
console.log('Biography trade claim audit PASS: all '+cases.length+' cited trade groups verified in fully rendered career biographies.');
