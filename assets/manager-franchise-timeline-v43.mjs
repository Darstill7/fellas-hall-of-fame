// Franchise Timeline 4.3: regular-season performance and postseason placement remain separate.
const normalize=n=>n==='Tom'?'Thommy':n;
export function buildFranchiseTimeline(core,guide,endings,name){
 name=normalize(name);
 const m=core.managers?.[name];if(!m?.annual)throw Error('Career archive unavailable');
 const finishRows=endings?.managers?.[name]??[];
 if(!Array.isArray(finishRows)||new Set(finishRows.map(r=>r.year)).size!==finishRows.length)throw Error('Duplicate or invalid season endings');
 const rows=[];
 for(const [key,a] of Object.entries(m.annual)){
  const year=Number(key),season=guide[key],standings=season?.standings;
  if(!Number.isInteger(year)||year<2016||year>2026||!Array.isArray(standings)||new Set(standings.map(r=>normalize(r.name))).size!==standings.length)throw Error('Invalid season archive '+key);
  const r=standings.find(r=>normalize(r.name)===name);
  if(!r||!['w','l','t'].every(k=>Number.isInteger(a[k]??0)&&(a[k]??0)>=0&&(a[k]??0)===(r[k]??0))||a.games!==a.w+a.l+(a.t??0)||a.games!==r.games||a.games<1||![r.pf,r.pa].every(Number.isFinite))throw Error('Season record mismatch '+key);
  const f=year===2026?null:finishRows.find(x=>x.year===year);
  const champion=normalize(season.champion);
  if(f?.finalRank===1&&champion!==name||champion===name&&f?.finalRank!==1)throw Error('Championship sources disagree '+key);
  const finish=Number.isInteger(f?.finalRank)&&f.finalRank>=1&&f.finalRank<=standings.length?f.finalRank:null;
  const award=finish!==null&&finish===standings.length&&f?.awards?.includes('Shitter of the Year');
  rows.push({year,era:year<2020?'ESPN':'Sleeper',w:r.w,l:r.l,t:r.t??0,games:a.games,pf:r.pf,pa:r.pa,winPct:(r.w+(r.t??0)/2)/a.games,average:r.pf/a.games,scoringRank:1+standings.filter(x=>x.pf>r.pf).length,leagueSize:standings.length,finish,award:!!award,active:year===2026,source:f?.source??null,note:f?.note??null,awardNote:award?f.awardNote:null});
 }
 if(rows.reduce((n,r)=>n+r.games,0)!==m.games||['w','l','t'].some(k=>rows.reduce((n,r)=>n+r[k],0)!==(m[k]??0)))throw Error('Career season totals disagree');
 return rows.sort((a,b)=>b.year-a.year);
}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
const ordinal=n=>n===1?'1st':n===2?'2nd':n===3?'3rd':n+'th';
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const result=r=>r.active?'Season in progress':r.finish===1?'Champion':r.finish===2?'Runner-up':r.award?'Shitter of the Year':r.finish?ordinal(r.finish)+' place':'Final placement unavailable';
export async function mountFranchiseTimeline({name,host,root='../../'}){
 if(!host||host.querySelector('.gm43-timeline'))return;
 const section=el('section',null,'gm43-timeline');section.id='gm43-timeline';
 const h=el('h2','Franchise timeline');h.id='gm43-heading';section.setAttribute('aria-labelledby',h.id);section.append(el('p','FRANCHISE HEADQUARTERS / HISTORY','gm43-kicker'),h);
 const status=el('p','Checking season archive evidence…','gm43-status');status.setAttribute('role','status');section.append(status);host.prepend(section);
 try{
  const get=async file=>{const r=await fetch(root+'data/'+file);if(!r.ok)throw Error('Unavailable '+file);return r.json()};
  const [core,guide,endings]=await Promise.all([get('career_core_generated.json'),get('season_guide.json'),get('manager_verified_season_endings_v1.json')]);
  const rows=buildFranchiseTimeline(core,guide,endings,name);
  status.textContent='Regular-season results and final placements are separate. Completed seasons only for honors; 2026 is ongoing.';
  const filters=el('div',null,'gm43-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter franchise timeline');
  const list=el('div',null,'gm43-list');section.append(filters,list);
  const options=[['All seasons',()=>true],['ESPN',r=>r.era==='ESPN'],['Sleeper',r=>r.era==='Sleeper'],['Finals',r=>r.finish===1||r.finish===2],['Shitter years',r=>r.award]];
  function show(filter){
   list.replaceChildren();
   const visible=rows.filter(filter);
   if(!visible.length){list.append(el('p','No verified seasons in this category.'));return}
   for(const r of visible){
    const d=el('details',null,'gm43-season');if(r.finish===1)d.classList.add('gm43-champion');
    const summary=el('summary'),identity=el('span',null,'gm43-year');identity.append(el('strong',String(r.year)),el('small',r.era));
    const copy=el('span',null,'gm43-result');copy.append(el('strong',result(r)),el('small',r.w+'–'+r.l+(r.t?'–'+r.t:'')+' regular season'));summary.append(identity,copy);d.append(summary);
    const body=el('div',null,'gm43-body'),metrics=el('div',null,'gm43-metrics');
    for(const [label,value] of [['Points for',fmt(r.pf)],['Points against',fmt(r.pa)],['Scoring rank','#'+r.scoringRank+' of '+r.leagueSize],['Win percentage',(r.winPct*100).toFixed(1)+'%'],['Weekly PF',fmt(r.average)]]){const item=el('div');item.append(el('small',label),el('strong',value));metrics.append(item)}
    body.append(metrics);
    if(r.note)body.append(el('p',r.note));if(r.awardNote)body.append(el('p',r.awardNote));if(r.source)body.append(el('p','Final placement source: '+r.source,'gm43-status'));
    const link=el('a','Explore '+r.year+' season archive →');link.href=root+'seasons/'+(r.year>=2020?r.year+'.html':'espn-origins.html');body.append(link);d.append(body);list.append(d);
   }
  }
  for(const [label,filter] of options){const b=el('button',label);b.type='button';b.setAttribute('aria-pressed',String(label==='All seasons'));b.addEventListener('click',()=>{for(const other of filters.children)other.setAttribute('aria-pressed',String(other===b));show(filter)});filters.append(b)}
  show(options[0][1]);
 }catch(error){status.textContent='Synchronized franchise timeline unavailable. Existing season history remains accessible.';console.warn('Manager 4.3 timeline:',error.message)}
}
