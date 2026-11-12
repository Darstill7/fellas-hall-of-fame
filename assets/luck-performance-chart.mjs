// Interactive all-play comparison; single verified dataset, no hard-coded manager ratings.
const source='../data/luck_performance_profiles_2016_2026_v1.json';
const svgNS='http://www.w3.org/2000/svg';
const svg=document.getElementById('luck-plot'),scope=document.getElementById('scope');
const includeShort=document.getElementById('include-short'),managerChoice=document.getElementById('manager-choice'),status=document.getElementById('chart-status');
const detail=document.getElementById('selected-manager'),tbody=document.querySelector('#luck-table tbody');
let archive=null,selected=null,visible=[];
const fmt=(value,decimals=2)=>(value>0?'+':'')+Number(value).toFixed(decimals);
const display=name=>name==='Thommy'?'Tom':name;
const dom=(name,cls,text)=>{const e=document.createElement(name);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const node=(name,attrs={})=>{const e=document.createElementNS(svgNS,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e};
const text=(x,y,t,cls,anchor)=>{const e=node('text',{x,y,class:cls||'',...(anchor?{'text-anchor':anchor}:{})});e.textContent=t;return e};
function dataset(){
 const mode=scope.value;
 if(mode==='career')return archive.managers.filter(m=>includeShort.checked||m.completedSeasons>=8).map(m=>({manager:m.manager,scoring:m.completedScoringStrengthPct,luck:m.completedScheduleLuckWins,per14:m.completedScheduleLuckWins*14/m.completedWeeks,weeks:m.completedWeeks,seasons:m.completedSeasons,actual:m.completedActualWins,expected:m.completedExpectedWins,short:m.completedSeasons<8,kind:'career'}));
 return archive.managers.flatMap(m=>{
  const s=m.seasonHistory.find(y=>String(y.year)===mode);
  if(!s)return[];
  return [{manager:m.manager,scoring:s.scoringStrengthPct,luck:s.scheduleLuckWins,per14:s.scheduleLuckWins*14/s.pairedWeeks,weeks:s.pairedWeeks,seasons:1,actual:s.actualWinCredits,expected:s.expectedWins,short:m.completedSeasons<8,kind:s.seasonStatus}];
 });
}
function managerHref(m){return '../managers/'+(m==='Thommy'?'tom':m.toLowerCase())+'/'}
function showSelected(name){
 selected=name;
 if(managerChoice)managerChoice.value=name;
 const r=visible.find(x=>x.manager===name);
 detail.replaceChildren();
 if(!r)return;
 const title=dom('h3',null,display(name)+(r.kind==='provisional'?' · 2026 provisional':''));
 const line=dom('p','muted',r.scoring.toFixed(1)+'% scoring strength · '+fmt(r.luck)+' actual wins vs expectation · '+fmt(r.per14)+' per 14 weeks.');
 const info=dom('p','note',r.actual+' actual win credits against '+r.expected.toFixed(2)+' expected in '+r.weeks+' fully paired weeks'+(r.kind==='career'?' across '+r.seasons+' completed seasons.':'.'));
 const a=dom('a','detail-action','Explore '+display(name)+'’s profile →');a.href=managerHref(name);
 detail.append(title,line,info,a);
 for(const circle of svg.querySelectorAll('.point'))circle.classList.toggle('is-selected',circle.dataset.manager===name);
 const activePoint=[...svg.querySelectorAll('.point')].find(circle=>circle.dataset.manager===name);
 if(activePoint)svg.append(activePoint);
 for(const row of tbody.querySelectorAll('tr'))row.style.background=row.dataset.manager===name?'#243f4e':'';
}
function draw(){
 if(!archive)return;
 visible=dataset();
 if(!visible.length){status.textContent='No verified manager data for this selection.';return}
 if(!visible.some(x=>x.manager===selected))selected=visible.find(x=>x.manager==='Birch')?.manager||visible[0].manager;
 const minScoring=Math.min(...visible.map(x=>x.scoring),50),maxScoring=Math.max(...visible.map(x=>x.scoring),50);
 const minLuck=Math.min(...visible.map(x=>x.per14),0),maxLuck=Math.max(...visible.map(x=>x.per14),0);
 const xMin=Math.floor((minScoring-4)/5)*5,xMax=Math.ceil((maxScoring+4)/5)*5;
 const yPad=Math.max(.55,(maxLuck-minLuck)*.15),yMax=Math.ceil((maxLuck+yPad)*2)/2,yMin=Math.floor((minLuck-yPad)*2)/2;
 const width=900,height=470,left=95,right=34,top=35,bottom=72;
 const fx=v=>left+(v-xMin)/(xMax-xMin)*(width-left-right);
 const fy=v=>height-bottom-(v-yMin)/(yMax-yMin)*(height-top-bottom);
 svg.replaceChildren(node('title'));
 svg.firstChild.textContent='Luck vs Performance: scoring strength horizontal axis and Schedule Luck wins per 14 games vertical axis';
 const count=5;
 for(let i=0;i<=count;i++){
  const x=left+(width-left-right)*i/count;
  const val=xMin+(xMax-xMin)*i/count;
  svg.append(node('line',{x1:x,y1:top,x2:x,y2:height-bottom,class:'gridline'}),text(x,height-bottom+23,val.toFixed(0)+'%','tick','middle'));
 }
 for(let i=0;i<=count;i++){
  const y=top+(height-top-bottom)*i/count,val=yMax-(yMax-yMin)*i/count;
  svg.append(node('line',{x1:left,y1:y,x2:width-right,y2:y,class:'gridline'}),text(left-13,y+4,(val>0?'+':'')+val.toFixed(1),'tick','end'));
 }
 if(xMin<=50&&xMax>=50)svg.append(node('line',{x1:fx(50),y1:top,x2:fx(50),y2:height-bottom,class:'zero'}));
 svg.append(node('line',{x1:left,y1:fy(0),x2:width-right,y2:fy(0),class:'zero'}));
 svg.append(node('line',{x1:left,y1:top,x2:left,y2:height-bottom,class:'axisline'}),node('line',{x1:left,y1:height-bottom,x2:width-right,y2:height-bottom,class:'axisline'}));
 svg.append(text((left+width-right)/2,height-17,'SCORING STRENGTH · % OF OPPONENTS OUTSCORED','axis-title','middle'));
 const axis=text(19,(top+height-bottom)/2,'SCHEDULE LUCK / 14 WEEKS','axis-title','middle');
 axis.setAttribute('transform','rotate(-90 19 '+((top+height-bottom)/2)+')');svg.append(axis);
 for(const m of visible){
  const circle=node('circle',{cx:fx(m.scoring),cy:fy(m.per14),r:13,fill:m.short?'#7fb5da':'#e3bf75',class:'point',tabindex:0,role:'button','aria-label':display(m.manager)+': scoring strength '+m.scoring.toFixed(1)+' percent; Schedule Luck '+fmt(m.luck)+' wins; select'});
  circle.dataset.manager=m.manager;
  circle.append(node('title'));circle.firstChild.textContent=display(m.manager)+': '+m.scoring.toFixed(1)+'% scoring · '+fmt(m.luck)+' wins of Schedule Luck';
  circle.addEventListener('click',()=>showSelected(m.manager));
  circle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showSelected(m.manager)}});
  svg.append(circle);
 }
 const chosen=visible.find(x=>x.manager===selected);
 const labelX=fx(chosen.scoring),labelY=fy(chosen.per14);
 // SVG draw order matters: selected overlapping marker is brought to the front.
 const selectedCircle=[...svg.querySelectorAll('.point')].find(circle=>circle.dataset.manager===selected);
 if(selectedCircle)svg.append(selectedCircle);
 svg.append(text(Math.max(left+25,Math.min(width-right-25,labelX)),Math.max(top+14,labelY-17),display(chosen.manager),'point-label','middle'));
 // A full-size dropdown ensures even coincident or crowded dots remain discoverable.
 managerChoice.replaceChildren();
 for(const m of [...visible].sort((a,b)=>display(a.manager).localeCompare(display(b.manager)))){
  const opt=dom('option',null,display(m.manager));opt.value=m.manager;managerChoice.append(opt);
 }
 managerChoice.value=selected;
 tbody.replaceChildren();
 const sorted=[...visible].sort((a,b)=>b.per14-a.per14||a.manager.localeCompare(b.manager));
 for(const m of sorted){
  const tr=dom('tr');tr.dataset.manager=m.manager;
  const first=dom('td'),btn=dom('button',null,display(m.manager));
  btn.type='button';btn.style.cssText='background:none;border:0;padding:10px 0;text-decoration:underline;color:#e8cc8d;font:inherit;font-weight:800;min-height:44px;cursor:pointer';
  btn.addEventListener('click',()=>{showSelected(m.manager);if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)svg.scrollIntoView({behavior:'smooth',block:'nearest'})});
  first.append(btn);tr.append(first);
  for(const value of [m.kind==='career'?m.seasons+' / '+m.weeks:'1 / '+m.weeks,m.scoring.toFixed(1)+'%',fmt(m.luck),fmt(m.per14)])tr.append(dom('td',null,value));
  tbody.append(tr);
 }
 status.textContent=visible.length+' verified managers · '+(scope.value==='career'?'Completed seasons 2016–2025':scope.value==='2026'?'2026 provisional through approved Week '+archive.currentThroughWeek:'Season '+scope.value)+'. Click a dot or a manager name for details.';
 showSelected(selected);
}
async function start(){
 try{
  const response=await fetch(source,{cache:'no-store'});if(!response.ok)throw Error('Cannot load verified dataset');
  archive=await response.json();
  if(!Array.isArray(archive.managers)||archive.managers.length<10||archive.schema!=='fellas-luck-performance-profiles-v1')throw Error('Unexpected chart data schema');
  const query=new URLSearchParams(location.search);
  if(query.get('manager')){const raw=query.get('manager');selected=raw==='Tom'?'Thommy':raw}
  if([...scope.options].some(o=>o.value===query.get('season')))scope.value=query.get('season');
  if(selected){
   const target=archive.managers.find(m=>m.manager===selected);
   if(scope.value==='career'&&target&&target.completedSeasons<8)includeShort.checked=true;
  }
  scope.addEventListener('change',draw);includeShort.addEventListener('change',draw);
  managerChoice.addEventListener('change',()=>showSelected(managerChoice.value));
  draw();
 }catch(error){status.textContent='Verified scoring comparison is temporarily unavailable.';tbody.replaceChildren(dom('tr',null,''));detail.textContent='The source data could not be loaded. The static Record Book remains available.';console.error(error)}
}
start();
