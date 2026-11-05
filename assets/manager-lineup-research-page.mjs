import {validateLineupCoverage} from './lineup-history-coverage.mjs';
const $=id=>document.getElementById(id);
const slots=['QB','RB','RB','WR','WR','TE','FLEX','FLEX','DEF'];
const eligible=(p,s)=>s==='FLEX'?['RB','WR','TE'].includes(p.position):p.position===s;
function optimal(roster){const pool=[...roster.starters,...roster.bench];let states=new Map([[0,0]]);for(const p of pool.filter(x=>Number.isFinite(x.points))){const next=new Map(states);for(const [mask,score] of states)for(let i=0;i<slots.length;i++){if(mask&(1<<i)||!eligible(p,slots[i]))continue;const key=mask|(1<<i),n=score+p.points;if(!next.has(key)||next.get(key)<n)next.set(key,n)}states=next}return states.get(511)??null}
function evaluate(r){const pool=[...r.starters,...r.bench];if(r.starters.some(p=>p.empty===true&&String(p.id)==='0'))return {gap:null,reason:'Vacant starting slot'};const best=optimal(r);const sum=r.starters.reduce((n,p)=>n+Number(p.points||0),0);if(!pool.every(p=>Number.isFinite(p.points)))return {gap:null,reason:'Unscored roster player'};if(r.starters.length!==9||optimal({starters:r.starters,bench:[]})===null)return {gap:null,reason:'Illegal or incomplete actual starter slots'};if(!Number.isFinite(r.points))return {gap:null,reason:'Missing team points'};if(new Set(pool.map(p=>String(p.id))).size!==pool.length)return {gap:null,reason:'Duplicate player IDs'};if(!r.starters.every(p=>['QB','RB','WR','TE','DEF'].includes(p.position)))return {gap:null,reason:'Nonstandard starter position'};if(Math.abs(sum-r.points)>=.07)return {gap:null,reason:'Starter-score mismatch'};if(best===null)return {gap:null,reason:'No feasible lineup under assumed slots'};if(best+.07<r.points)return {gap:null,reason:'Optimizer below observed score'};if(best<=0)return {gap:null,reason:'Nonpositive optimal scored lineup'};return {gap:Math.max(0,best-r.points),accuracy:100*r.points/best,reason:null}}
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function renderHistoricalCoverage(){
 const target=$('historical-coverage');if(!target)return;
 try{
  const response=await fetch('../data/lineup_hindsight_coverage_2020_2025.json');
  if(!response.ok)throw Error('Historical coverage source unavailable');
  const data=validateLineupCoverage(await response.json());
  const details=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='2020–2025 archive: '+data.researchComparable+' / '+data.teamWeeks+
   ' comparable weeks · '+data.excludedWeeks+' excluded';
  details.append(summary);
  const wrap=document.createElement('div');wrap.className='wrap';
  const table=document.createElement('table'),head=document.createElement('thead'),hrow=document.createElement('tr');
  for(const label of ['Season','Compared','Excluded']){
   const th=document.createElement('th');th.textContent=label;hrow.append(th);
  }
  head.append(hrow);table.append(head);const body=document.createElement('tbody');
  for(const season of data.seasons){
   const tr=document.createElement('tr');
   for(const value of [season.year,season.comparable+' / '+season.teamWeeks,season.excluded]){
    const td=document.createElement('td');td.textContent=String(value);tr.append(td);
   }
   body.append(tr);
  }
  table.append(body);wrap.append(table);details.append(wrap);
  const note=document.createElement('p');
  note.textContent='Five archived observations had vacant starting slots and three had incomplete or incompatible starter configurations. Excluded weeks have no modeled percentage. These are postgame comparisons under assumed historical slots, not certified pre-kickoff decisions.';
  details.append(note);target.replaceChildren(details);
 }catch(err){
  target.textContent='Historical coverage summary could not be verified. The original weekly records remain available below.';
  console.error('Historical lineup coverage unavailable',err);
 }
}
const managerAliases={darstill:'Stilly',dsylvester9:'Stew',thommy:'Thommy',yogurtslinger15:'Stover',dillionpanthers15:'Stover',birchhh:'Birch',tsteg:'Tony',huppdawg80:'Mitch',ckuhl5:'Kuhl',jmidd:'JMid',sheffla:'Scott',evansbrandonm:'Evans',koble2323:'Koble'};
const currentTeamManagers={'1':'Stilly','2':'JMid','3':'Thommy','4':'Stew','5':'Scott','6':'Mitch','7':'Tony','8':'Stover','9':'Kuhl','10':'Birch'};
let current2026Weeks=8;
function yearWeeks(year){return year===2020?13:year===2026?current2026Weeks:14}
const pageParams=new URLSearchParams(location.search);
const requestedSeason=pageParams.get('season');
if(['career','all','2020','2021','2022','2023','2024','2025','2026'].includes(requestedSeason))$('season').value=requestedSeason;
let activeLoad=0;
async function load(){
 const requestId=++activeLoad;
 const retainedManager=[...$('detail-manager').options].find(o=>o.value===$('detail-manager').value)?.textContent??null;
 const selected=$('season').value;
 for(const id of ['results','detail-summary','weekly-results','career-summary','career-results'])
  $(id).textContent='';
 $('detail-manager').replaceChildren();const years=selected==='career'?[2020,2021,2022,2023,2024,2025,2026]:selected==='all'?[2020,2021,2022,2023,2024,2025]:[Number(selected)];$('status').textContent='Checking '+(selected==='career'?'2020–2026':selected==='all'?'2020–2025':selected)+' evidence…';$('results').textContent='';try{
 if(years.includes(2026)){
  const response=await fetch('../data/keeper_2026_website_research_v1.json');
  if(!response.ok)throw Error('Missing certified 2026 research coverage metadata');
  const metadata=await response.json();
  const count=Number(metadata.throughWeek);
  if(metadata.season!==2026||!Number.isInteger(count)||count<8||count>14)
   throw Error('Invalid 2026 completed-week coverage');
  if(count>=9&&Date.now()<Date.parse('2026-11-10T06:00:00Z'))
   throw Error('Week 9 is not final before November 10');
  current2026Weeks=count;
  $('season').querySelector('option[value="2026"]').textContent='2026 (Weeks 1–'+count+')';
  $('current-coverage').textContent='through completed Week '+count;
 }
 const fetched=await Promise.all(years.flatMap(year=>Array.from({length:yearWeeks(year)},(_,i)=>{const week=i+1,path=year===2025&&(week===1||week===7)?'war_rosters_2025_week'+week+'.json':'sleeper_roster_snapshots_'+year+'_week'+week+'.json';return fetch('../data/'+path).then(r=>{if(!r.ok)throw Error(path+' HTTP '+r.status);return r.json()}).then(doc=>({year,week,doc}))})));
 if(requestId!==activeLoad)return;
 const map=new Map(),exclusionReasons=new Map();let observations=0;
 for(const {year,week,doc} of fetched){
  const rosters=Array.isArray(doc)?doc:doc.rosters;
  if(rosters?.length!==10)throw Error('Incomplete roster count '+year+'/'+week);
  const teams=new Set();
  for(const r of rosters){
   if(!Array.isArray(r.starters)||!Array.isArray(r.bench))throw Error('Invalid source roster '+year+'/'+week);
   const team=String(r.teamId??r.id??'');
   if(year===2026){
    if(!currentTeamManagers[team]||teams.has(team))throw Error('Missing/duplicate 2026 team '+team+' in Week '+week);
    teams.add(team);
   }else if(!r.owner)throw Error('Missing historical owner '+year+'/'+week);
   const name=year===2026?currentTeamManagers[team]:managerAliases[String(r.owner).toLowerCase()];
   if(!name)throw Error('Unmapped historical owner '+r.owner+' '+year+'/'+week);
   const key=['all','career'].includes(selected)?name:year+'|'+name;
   const stat=map.get(key)||{name,weeks:0,comparable:0,gap:0,accuracySum:0,accuracyCount:0,observations:[]};
   stat.weeks++;observations++;
   const result=evaluate(r);
   if(result.gap!==null){
    stat.comparable++;stat.gap+=result.gap;
    if(Number.isFinite(result.accuracy)){stat.accuracySum+=result.accuracy;stat.accuracyCount++;}
    stat.observations.push({year,week,accuracy:result.accuracy,actual:r.points,optimal:r.points+result.gap,gap:result.gap,reason:null});
   }else{
    exclusionReasons.set(result.reason,(exclusionReasons.get(result.reason)||0)+1);
    stat.observations.push({year,week,accuracy:null,actual:null,optimal:null,gap:null,reason:result.reason});
   }
   map.set(key,stat);
  }
 }
 const expected=years.reduce((n,y)=>n+yearWeeks(y)*10,0);if(observations!==expected)throw Error('Incomplete archived team weeks');
 if(selected==='2026'&&current2026Weeks===8){
  const stilly=map.get('2026|Stilly'),kuhl=map.get('2026|Kuhl');
  if(!stilly||!kuhl||stilly.accuracyCount!==current2026Weeks||kuhl.accuracyCount!==current2026Weeks)throw Error('Missing eight completed weeks for Sleeper benchmark managers');
  if((stilly.accuracySum/current2026Weeks).toFixed(1)!=='92.4'||(kuhl.accuracySum/current2026Weeks).toFixed(1)!=='83.1')
   throw Error('Sleeper Week 8 benchmark parity mismatch');
 }
 const names=[...map.values()].sort((a,b)=>{
  const av=a.accuracyCount?a.accuracySum/a.accuracyCount:-Infinity;
  const bv=b.accuracyCount?b.accuracySum/b.accuracyCount:-Infinity;
  return selected==='2026'?bv-av||a.name.localeCompare(b.name):a.name.localeCompare(b.name);
 });
 const detailSelect=$('detail-manager');
 const requestedManager=pageParams.get('manager');
 const prior=detailSelect.value;
 detailSelect.replaceChildren();
 for(const stat of names){
  const option=document.createElement('option');
  option.value=['all','career'].includes(selected)?stat.name:years[0]+'|'+stat.name;
  option.textContent=stat.name;
  detailSelect.append(option);
 }
 const preferred=['all','career'].includes(selected)?'Stilly':years[0]+'|Stilly';
 detailSelect.value=[...detailSelect.options].some(o=>o.value===prior)?prior:
  [...detailSelect.options].some(o=>o.textContent.toLowerCase()===String(retainedManager??requestedManager??'').toLowerCase())?
   [...detailSelect.options].find(o=>o.textContent.toLowerCase()===String(retainedManager??requestedManager).toLowerCase()).value:
  [...detailSelect.options].some(o=>o.value===preferred)?preferred:detailSelect.options[0]?.value??'';
 function drawWeekly(){
  const stat=map.get(detailSelect.value);
  if(!stat){$('detail-summary').textContent='No manager data available.';$('weekly-results').textContent='';return;}
  const entries=[...stat.observations].sort((a,b)=>a.year-b.year||a.week-b.week);
  const comparable=entries.filter(o=>Number.isFinite(o.accuracy));
  const best=comparable.length?[...comparable].sort((a,b)=>b.accuracy-a.accuracy||a.year-b.year||a.week-b.week)[0]:null;
  const worst=comparable.length?[...comparable].sort((a,b)=>a.accuracy-b.accuracy||a.year-b.year||a.week-b.week)[0]:null;
  const fmt=x=>Number.isFinite(x)?x.toFixed(2):'N/A';
  $('weekly-results').innerHTML=entries.map(o=>{
   const key=o.year+'|'+o.week;
   const bestKey=best?.year+'|'+best?.week,worstKey=worst?.year+'|'+worst?.week;
   const cls=key===bestKey?'best':key===worstKey?'worst':'';
   return '<tr class="'+cls+'"><th scope="row">'+(['all','career'].includes(selected)?o.year+' · ':'')+'Week '+o.week+'</th>'+
    '<td class="metric">'+(o.accuracy===null?'N/A':o.accuracy.toFixed(1)+'%')+'</td>'+
    '<td>'+(o.reason?esc(o.reason):'Comparable archived lineup')+'</td></tr>';
  }).join('');
  const label=o=>(['all','career'].includes(selected)?o.year+' ':'')+'Week '+o.week+' ('+o.accuracy.toFixed(1)+'%)';
  $('detail-summary').textContent=stat.name+' · '+stat.comparable+'/'+stat.weeks+
   ' research-comparable weeks · average '+(stat.accuracyCount?(stat.accuracySum/stat.accuracyCount).toFixed(1)+'%':'N/A')+
   ' · best '+(best?label(best):'N/A')+' · worst '+(worst?label(worst):'N/A')+
   '. These are observed hindsight results, not certified start/sit skill.';
 }
 // Recency-weighted historical context uses per-season means to avoid raw-points
 // era bias. Partial seasons and excluded team-weeks receive less weight.
 // This remains retrospective efficiency, never a manager-skill or OVR grade.
 const halfLife=3.5,referenceYear=2026;
 function drawProgression(){
  const stat=map.get(detailSelect.value);
  if(!stat){$('career-results').textContent='';$('career-summary').textContent='No manager evidence';return;}
  const byYear=new Map();
  for(const o of stat.observations){
   const v=byYear.get(o.year)??[];
   v.push(o);byYear.set(o.year,v);
  }
  const seasons=[...byYear].sort(([a],[b])=>a-b).map(([year,observations])=>{
   const valid=observations.filter(o=>Number.isFinite(o.accuracy));
   const expectedWeeks=year===2026?14:yearWeeks(year);
   const fraction=valid.length/expectedWeeks;
   const recency=Math.pow(.5,(referenceYear-year)/halfLife);
   const weight=fraction*recency;
   return {year,total:observations.length,valid:valid.length,
    mean:valid.length?valid.reduce((n,o)=>n+o.accuracy,0)/valid.length:null,
    avgGap:valid.length?valid.reduce((n,o)=>n+o.gap,0)/valid.length:null,
    weight:valid.length?weight:0};
  });
  const usable=seasons.filter(x=>x.mean!==null);
  const weightSum=usable.reduce((n,x)=>n+x.weight,0);
  const career=weightSum>0?usable.reduce((n,x)=>n+x.mean*x.weight,0)/weightSum:null;
  $('career-results').innerHTML=seasons.map(x=>'<tr><th scope="row">'+x.year+
   (x.year===2026?' (ongoing)':'')+'</th><td>'+x.valid+'/'+x.total+
   '</td><td class="metric">'+(x.mean===null?'N/A':x.mean.toFixed(1)+'%')+
   '</td><td class="metric">'+(x.avgGap===null?'N/A':x.avgGap.toFixed(2))+
   '</td><td class="metric">'+(weightSum?((x.weight/weightSum)*100).toFixed(1)+'%':'N/A')+
   '</td></tr>').join('');
  $('career-summary').textContent=stat.name+' · '+usable.length+' seasons with comparable weeks'+
   ' · recency-weighted observed efficiency '+(career===null?'N/A':career.toFixed(1)+'%')+
   ' · half-life '+halfLife+' seasons · coverage-adjusted · no certified skill grade.';
 }
 detailSelect.onchange=()=>{drawWeekly();drawProgression();};
 drawWeekly();drawProgression();$('results').innerHTML=names.map(x=>'<tr><th scope="row">'+esc(x.name)+'</th><td>'+x.comparable+'/'+x.weeks+'</td><td class="metric">'+(x.accuracyCount?(x.accuracySum/x.accuracyCount).toFixed(1)+'%':'N/A')+'</td></tr>').join('');
 $('status').textContent=(selected==='career'?'2020–2026':selected==='all'?'2020–2025':selected)+' · '+observations+' archived team-weeks · '+names.reduce((n,x)=>n+x.comparable,0)+' research-comparable · '+names.reduce((n,x)=>n+x.weeks-x.comparable,0)+' excluded. Exclusions by cause: '+([ ...exclusionReasons.entries()].map(([reason,n])=>reason+' '+n).join('; ')||'none')+'. These are hindsight observations, not start/sit skill ratings.';
 }catch(e){if(requestId!==activeLoad)return;
  for(const id of ['results','detail-summary','weekly-results','career-summary','career-results'])$(id).textContent='';
  $('detail-manager').replaceChildren();
  $('status').textContent='Source or model error: '+e.message+' — no substitute scores shown.'}}
$('season').addEventListener('change',load);void renderHistoricalCoverage();load();
