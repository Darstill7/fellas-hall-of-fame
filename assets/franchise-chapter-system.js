/* Fellas franchise section orientation — progressive enhancement, no record logic. */
(function(){
"use strict";
const nav=document.querySelector("nav.profile-chapters");
if(!nav)return;
const sections=[...nav.querySelectorAll('a[href^="#"]')].map(link=>({
 link,
 target:document.getElementById(link.getAttribute("href").slice(1))
})).filter(x=>x.target);
if(!sections.length)return;
const status=document.createElement("p");
status.className="chapter-reading-status";
status.setAttribute("aria-live","off");
status.append(document.createTextNode("Currently exploring: "));
const strong=document.createElement("strong");
status.appendChild(strong);
nav.appendChild(status);
function update(){
 const threshold=Math.min(260,window.innerHeight*.48);
 let current=sections[0];
 for(const item of sections){
   if(item.target.getBoundingClientRect().top<threshold)current=item;
 }
 for(const item of sections){
   if(item===current)item.link.setAttribute("aria-current","location");
   else item.link.removeAttribute("aria-current");
 }
 strong.textContent=current.link.textContent.trim();
}
let scheduled=false;
function schedule(){
 if(scheduled)return;
 scheduled=true;
 requestAnimationFrame(function(){scheduled=false;update()});
}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",schedule,{passive:true});
window.addEventListener("hashchange",schedule);
update();
})();
