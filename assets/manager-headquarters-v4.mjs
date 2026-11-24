// Manager Profiles 4.0: a compact, source-backed front office dossier.
// Optional production dataset is never substituted with research-only data.
const labels={DRAFT:'Draft selections',ARCHIVED_KEEPER:'Archived keeper selections',DRAFT_KEEPER_UNKNOWN:'Draft / keeper status unknown',WAIVER:'Waiver claims',FREE_AGENT:'Free agents',TRADE:'Trades',COMMISSIONER:'Commissioner adjustments'};
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});
const pf=n=>typeof n==='number'&&Number.isFinite(n)?fmt(n/100)+' PF':'Not available';
const signed=n=>typeof n==='number'&&Number.isFinite(n)?(n>0?'+':'')+pf(n):'Not available';
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e};
export function validateScorecard(data,name,cutoff){
 if(data.status!=='VERIFIED_RELEASE'||data.completedThrough?.year!==cutoff.year||data.completedThrough?.week!==cutoff.week)throw Error('Front office release does not match current career cutoff');
 const matches=data.supportedEvidence?.careerScorecards?.filter(x=>x.manager===name)||[];
 if(matches.length!==1)throw Error('Expected one manager scorecard');
 const m=matches[0],cats=Object.values(m.categories||{});
 for(const x of [m.total,...cats])for(const k of ['supported_starts','supported_pf_cents','strict_pf_cents'])if(!Number.isSafeInteger(x[k]))throw Error('Invalid scoring receipt aggregate');
 for(const k of ['supported_starts','supported_pf_cents','strict_pf_cents'])if(cats.reduce((n,x)=>n+x[k],0)!==m.total[k])throw Error('Category reconciliation failed: '+k);
 if(!Array.isArray(m.draftSeasons)||!Array.isArray(m.tradeRivalries)||!Array.isArray(m.keeperSlots))throw Error('Incomplete scorecard');
 if(m.total.supported_starts<0||cats.some(x=>x.supported_starts<0||!Number.isSafeInteger(x.acquisitions)||x.acquisitions<0))throw Error('Invalid acquisition count');
 const years=new Set();
 for(const r of m.draftSeasons){
  if(r.manager!==name||!Number.isInteger(r.year)||r.year<2020||r.year>cutoff.year||years.has(r.year))throw Error('Invalid annual draft identity');years.add(r.year);
  if(!Number.isInteger(r.graded_picks)||!Number.isInteger(r.total_picks)||r.graded_picks<0||r.total_picks<1||r.graded_picks>r.total_picks||r.provisional!==true)throw Error('Invalid provisional draft report');
 }
 const rivals=new Set();
 for(const r of m.tradeRivalries){
  const rival=r.a===name?r.b:r.b===name?r.a:null;
  if(!rival||rival===name||rivals.has(rival)||!Number.isSafeInteger(r.a_minus_b_supported_cents)||!Number.isInteger(r.trades)||r.trades<1)throw Error('Invalid trade rivalry');rivals.add(rival);
 }
 if(m.tradeRivalries.length&&m.tradeSurplusCents!==m.tradeRivalries.reduce((n,r)=>n+(r.a===name?1:-1)*r.a_minus_b_supported_cents,0))throw Error('Trade surplus reconciliation failed');
 if(m.keeperSlots.some(r=>r.manager!==name||r.category!=='ARCHIVED_KEEPER'))throw Error('Keeper identity mismatch');
 return m;
}
function disclosure(title,rows){
 const d=node('details',null,'gm4-disclosure');d.append(node('summary',title));
 const body=node('div',null,'gm4-rows');
 for(const [label,value,detail] of rows){const r=node('div',null,'gm4-row'),copy=node('div');copy.append(node('strong',label),node('small',detail));r.append(copy,node('b',value));body.append(r)}
 if(!rows.length)body.append(node('p','No qualifying verified entries.'));
 d.append(body);return d;
}
export async function mountManagerHeadquarters({name,host,root='../../',fetcher=fetch}){
 if(!host||!name||host.querySelector('#gm4-headquarters'))return;
 const section=node('section',null,'gm4-headquarters');section.id='gm4-headquarters';section.setAttribute('aria-labelledby','gm4-heading');
 const heading=node('h2','Front office résumé');heading.id='gm4-heading';
 section.append(node('p','FRANCHISE HEADQUARTERS / FRONT OFFICE','gm4-kicker'),heading,node('p','How '+name+' assembled the roster, season after season.','gm4-intro'));
 const status=node('p','Checking released scoring evidence…','gm4-status');status.setAttribute('role','status');section.append(status);
 const content=node('div');section.append(content);
 const legacy=node('a','Explore existing draft and trade research →','gm4-link');legacy.href=root+'analytics/greatest-worst-trades.html?manager='+encodeURIComponent(name);section.append(legacy);
 host.append(section);
 try{
  const [coreResponse,releaseResponse]=await Promise.all([fetcher(root+'data/career_core_generated.json'),fetcher(root+'data/front-office/managers.json')]);
  if(!coreResponse.ok||!releaseResponse.ok)throw Error('Released evidence not available');
  const [core,data]=await Promise.all([coreResponse.json(),releaseResponse.json()]);
  const m=validateScorecard(data,name,core.completedThrough);
  status.textContent='Sleeper era · 2020–'+data.completedThrough.year+' · through Week '+data.completedThrough.week+' · regular season only';
  const metrics=node('div',null,'gm4-metrics');
  for(const [label,value] of [['Starter production',pf(m.total.supported_pf_cents)],['Starts',fmt(m.total.supported_starts)],['Trade surplus',signed(m.tradeSurplusCents)]]){const card=node('div');card.append(node('small',label),node('strong',value));metrics.append(card)}
  content.append(metrics,node('p','Received starter points are descriptive, not proof of managerial skill. Timing-supported ownership and archive-derived keeper designations retain uncertainty.','gm4-note'));
  content.append(disclosure('Roster construction',Object.entries(m.categories).map(([k,v])=>[labels[k]||k,pf(v.supported_pf_cents),fmt(v.acquisitions)+' acquisitions · '+fmt(v.supported_starts)+' starts'])));
  content.append(disclosure('Annual draft report cards (provisional)',m.draftSeasons.slice().sort((a,b)=>b.year-a.year).map(s=>[
   String(s.year)+(s.active_season?' · In progress':''),s.grade??'Not graded',
   [s.graded_picks+'/'+s.total_picks+' graded selections',s.best_selection?'Best observed return: '+(s.best_selection.name||s.best_selection.player_id):null,s.worst_selection?'Lowest observed return: '+(s.worst_selection.name||s.worst_selection.player_id):null].filter(Boolean).join(' · ')
  ])));
  content.append(disclosure('Trade rivalries',m.tradeRivalries.map(r=>[r.a===name?r.b:r.a,signed((r.a===name?1:-1)*r.a_minus_b_supported_cents),fmt(r.trades)+' eligible trades'])));
  content.append(disclosure('Keeper slot comparisons (provisional)',m.keeperSlots.map(r=>[(r.name||r.player_id)+' · '+r.year,pf(r.observed_pf_cents),'Round '+r.round+' · '+(r.ordinary_alternatives?'Observed vs later-pick median: '+signed(r.ordinary_alternatives.observed_surplus_cents):'No qualifying later picks')+' · archive classification'])));
 }catch(error){content.replaceChildren();status.textContent='Verified front office release not available for this completed week. Existing research remains accessible below.';console.warn('Manager 4.0 evidence:',error.message)}
}
