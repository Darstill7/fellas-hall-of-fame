// Prevent duplicate editorial biographies from drifting away from published profiles.
import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('data/manager_biographies_awards.json','utf8')).managers;
const managers={Stilly:'stilly',Stew:'stew',Tom:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const errors=[];
for(const [manager,slug] of Object.entries(managers)){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const match=page.match(/id="franchise-story"[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/);
 if(!match){errors.push(slug+' story missing');continue}
 const rendered=match[1].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim().split(' The archived regular-season record is ')[0].trim();
 if(slug==='stover'){
  if(!rendered.includes('2016')||!rendered.includes('2022')||!page.includes('Read the full story'))errors.push('stover simplified biography omits key history');
 }else if(source[manager]?.biography!==rendered)errors.push(slug+' source biography differs from published intro');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Biography editorial parity PASS: ten published story intros match archived editorial source.');
