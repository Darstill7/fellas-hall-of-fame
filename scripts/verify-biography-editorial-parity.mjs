// Keep concise manager introductions and complete historical biographies connected.
// The short landing-page summary is an independent teaser, not a copy of the full bio.
import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('data/manager_biographies_awards.json','utf8')).managers;
const loader=fs.readFileSync('assets/legacy-resume.js','utf8');
const managers={Stilly:'stilly',Stew:'stew',Tom:'tom',Stover:'stover',Birch:'birch',Tony:'tony',Mitch:'mitch',Kuhl:'kuhl',JMid:'jmid',Scott:'scott'};
const errors=[];
if(!loader.includes("fetch('../../data/manager_biographies_awards.json')")||
   !loader.includes('.managers[manager]')||
   !loader.includes('career-bio-prose')||
   !loader.includes('detail.biography'))
 errors.push('Full biography renderer no longer uses the canonical editorial source');
for(const [manager,slug] of Object.entries(managers)){
 const page=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const match=page.match(/id="franchise-story"[\s\S]*?<p class="lead">([\s\S]*?)<\/p>/);
 if(!match){errors.push(slug+' short profile introduction missing');continue}
 const summary=match[1].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim();
 if(summary.length<80||summary.length>450)errors.push(slug+' intro length is not suited to short profile');
 const full=source[manager]?.biography;
 if(typeof full!=='string'||full.trim().length<300||full===summary)
  errors.push(slug+' full historical biography unavailable or duplicated as teaser');
 if(!page.includes('data-legacy-resume="'+manager+'"')||
    !page.includes('src="../../assets/legacy-resume.js"'))
  errors.push(slug+' profile is not connected to the full biography renderer');
}
if(errors.length){console.error('Biography editorial parity FAILED:\n'+errors.join('\n'));process.exit(1)}
console.log('Biography editorial parity PASS: ten concise intros and distinct full editorial biographies wired to canonical renderer.');
