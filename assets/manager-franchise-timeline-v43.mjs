import {sharedProfileJson} from './manager-mobile-v47.mjs';
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
export function compareFranchiseSeasons(rows,first,second){
 const a=rows.find(r=>r.year===first),b=rows.find(r=>r.year===second);
 if(!a||!b||first===second)throw Error('Select two distinct archived seasons');
 return {a,b,winPctDelta:b.winPct-a.winPct,scoringRankDelta:a.scoringRank-b.scoringRank,averageDelta:b.average-a.average,crossEra:a.era!==b.era};
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
  const get=file=>sharedProfileJson(root+'data/'+file);
  const [core,guide,endings]=await Promise.all([get('career_core_generated.json'),get('season_guide.json'),get('manager_verified_season_endings_v1.json')]);
  const rows=buildFranchiseTimeline(core,guide,endings,name);
  status.textContent='Regular-season results and final placements are separate. Completed seasons only for honors; 2026 is ongoing.';
  const complete=rows.filter(r=>!r.active);
  if(complete.length){
   const best=complete.reduce((a,b)=>b.winPct>a.winPct?b:a),rank=complete.reduce((a,b)=>b.scoringRank<a.scoringRank?b:a);
   const highlights=el('div',null,'gm43-metrics');
   for(const [label,value] of [['Best win percentage',best.year+' · '+(best.winPct*100).toFixed(1)+'%'],['Best scoring rank',rank.year+' · #'+rank.scoringRank],['Championships',String(complete.filter(r=>r.finish===1).length)]]){const item=el('div');item.append(el('small',label),el('strong',value));highlights.append(item)}
   section.append(highlights);
  }
  const evolution=el('details',null,'gm43-season');evolution.append(el('summary','Career evolution · annual win percentage'));
  const bars=el('div',null,'gm43-body');
  for(const r of rows.slice().reverse()){const line=el('div',null,'gm43-bar');const meter=el('meter');meter.min=0;meter.max=1;meter.value=r.winPct;meter.setAttribute('aria-label',r.year+' win percentage');line.append(el('span',String(r.year)+(r.active?'*':'')),meter,el('strong',(r.winPct*100).toFixed(1)+'%'));bars.append(line)}
  bars.append(el('p','* Current season incomplete. Win percentage includes half credit for ties.'));evolution.append(bars);section.append(evolution);
  if(rows.length>=2){
   const comparison=el('details',null,'gm43-season');comparison.append(el('summary','Compare two seasons'));
   const body=el('div',null,'gm43-body'),controls=el('div',null,'gm43-compare'),output=el('div');output.setAttribute('aria-live','polite');
   const selects=[];
   for(const [i,label] of ['Earlier comparison season','Later comparison season'].entries()){const wrap=el('label',label),select=el('select');for(const r of rows){const option=el('option',String(r.year)+(r.active?' (in progress)':''));option.value=String(r.year);select.append(option)}select.value=String(rows[i===0?1:0].year);wrap.append(select);controls.append(wrap);selects.push(select)}
   function update(){output.replaceChildren();try{const c=compareFranchiseSeasons(rows,...selects.map(s=>Number(s.value)));for(const [label,a,b] of [['Record',c.a.w+'–'+c.a.l+(c.a.t?'–'+c.a.t:''),c.b.w+'–'+c.b.l+(c.b.t?'–'+c.b.t:'')],['Win percentage',(c.a.winPct*100).toFixed(1)+'%',(c.b.winPct*100).toFixed(1)+'%'],['Scoring rank','#'+c.a.scoringRank+' of '+c.a.leagueSize,'#'+c.b.scoringRank+' of '+c.b.leagueSize],['Weekly PF',fmt(c.a.average),fmt(c.b.average)],['Final outcome',result(c.a),result(c.b)]]){const line=el('div',null,'gm43-comparison-row');line.append(el('strong',label),el('span',a),el('span',b));output.append(line)}if(c.crossEra)output.append(el('p','Cross-era scoring rules may differ; raw PF is not normalized.'));if(c.a.active||c.b.active)output.append(el('p','Current season comparison is provisional.'))}catch{output.append(el('p','Select two different seasons.'))}}
   selects.forEach(s=>s.addEventListener('change',update));body.append(controls,output);comparison.append(body);section.append(comparison);update();
  }
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
