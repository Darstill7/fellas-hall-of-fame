/* Franchise section orientation: visual and accessible navigation only. */
(function(){
"use strict";
const nav=document.querySelector('nav.profile-chapters');
if(!nav)return;
const links=[...nav.querySelectorAll('a[href^="#"]')];
const sections=links.map(link=>({link,section:document.getElementById(link.getAttribute("href").slice(1))})).filter(x=>x.section);
if(!sections.length)return;
const status=document.createElement('p');status.className='chapter-reading-status';status.setAttribute('aria-live','off');
status.append('Currently exploring: ');const strong=document.createElement('strong');status.append(strong);nav.append(status);
function update(){
 let best=null;
 for(const x of sections){const y=x.section.getBoundingClientRect().top;if(y<Math.min(260,innerHeight*.48))best=x;}
 if(!best)best=sections[0];
 for(const x of sections)if(x===best)x.link.setAttribute('aria-current','location');else x.link.removeAttribute('aria-current');
 strong.textContent=best.link.textContent.trim();
}
let ticking=false;
function schedule(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;update()})}
addEventListener('scroll',schedule,{passive:true});
addEventListener('resize',schedule,{passive:true});
addEventListener('hashchange',schedule);
update();
})();
