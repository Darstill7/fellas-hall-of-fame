// Verify factual trade asset/year claims retained in current manager stories.
// Absence in trade-side dataset does not disprove other kinds of acquisition.
import fs from 'node:fs';
const sides=JSON.parse(fs.readFileSync('data/v9_trade_engine.json','utf8')).sides;
const cases=[
 ['stilly','Stilly',2023,['Mike Evans','Derrick Henry']],
 ['stew','Stew',2022,['Justin Jefferson',"Ja'Marr Chase"]],
 ['tony','Tony',2021,['Joe Mixon']],
 ['tony','Tony',2022,['James Robinson']],
 ['kuhl','Kuhl',2024,['J.K. Dobbins']],
 ['jmid','JMid',2024,['Kyren Williams','Calvin Ridley']]
];
const errors=[];
for(const [slug,manager,year,players] of cases){
 const html=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const story=html.match(/id="franchise-story"[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/)?.[1]||'';
 for(const player of players){
  const found=sides.some(s=>s.manager===manager&&s.year===year&&s.assets.includes(player)&&s.confidence.startsWith('verified')&&!s.provisional);
  if(!found)errors.push(manager+' '+year+' '+player+' not verified in trade model');
  const plain=player.replaceAll("'",'’');
  if(!story.includes(plain)&&!story.includes(player))errors.push(slug+' biography no longer includes cited '+player);
 }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Biography trade claim audit PASS: '+cases.length+' manager/year asset groups checked; not a complete acquisition ledger.');
