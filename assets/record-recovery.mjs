// Only reveal the fixed back-to-top affordance after the visitor has
// actually scrolled past the first-screen editorial content.
const control=document.querySelector('a.record-recovery');
if(control){
 const refresh=()=>{
  const threshold=Math.max(500,Math.floor(window.innerHeight*0.75));
  const show=window.scrollY>=threshold;
  control.classList.toggle('is-visible',show);
  control.setAttribute('aria-hidden',String(!show));
  control.tabIndex=show?0:-1;
 };
 refresh();
 window.addEventListener('scroll',refresh,{passive:true});
 window.addEventListener('resize',refresh,{passive:true});
 window.addEventListener('hashchange',()=>requestAnimationFrame(refresh));
}
