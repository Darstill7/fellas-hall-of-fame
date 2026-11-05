import {auditPlacementStatistics} from './placement-statistics.mjs';
import {auditAllEraFinishes} from './all-era-final-placements.mjs';
const root=document.getElementById('placement-stat-results');
const espnHistory=document.getElementById('espn-last-place-history');
const add=(tag,text)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;return element};
function makeTable(members){
 const frame=add('div');frame.className='placement-stat-table-wrap';
 const table=add('table');table.className='placement-stat-table';
 const thead=add('thead'),header=add('tr');
 for(const name of ['Manager','Seasons','Avg','Median','Top 3','Top 5','Bottom 3','Last']){
  header.append(add('th',name));
 }
 thead.append(header);table.append(thead);
 const tbody=add('tbody');
 for(const m of members){
  const row=add('tr'),first=add('td'),link=add('a',m.manager);
  link.href='../managers/record-books.html?manager='+encodeURIComponent(m.manager)+'#owned-records';
  first.append(link);row.append(first);
  for(const v of [m.seasonsPlayed,m.averageFinish.toFixed(2),m.medianFinish.toFixed(1),
   m.topThree,m.topFive,m.bottomThree,m.shitterOfTheYear.length])row.append(add('td',String(v)));
  tbody.append(row);
 }
 table.append(tbody);frame.append(table);return frame;
}
function allEraTable(members){
 const frame=add('div');frame.className='placement-stat-table-wrap';
 const table=add('table');table.className='placement-stat-table';
 const thead=add('thead'),head=add('tr');
 for(const title of ['Manager','Seasons','Finish score','Top 3','Top half','Last'])head.append(add('th',title));
 thead.append(head);table.append(thead);
 const body=add('tbody');
 for(const m of members){
  const row=add('tr'),name=add('td'),a=add('a',m.manager);
  a.href='../managers/record-books.html?manager='+encodeURIComponent(m.manager)+'#owned-records';
  name.append(a);row.append(name);
  for(const val of [m.seasonsPlayed,m.meanFinishScore.toFixed(2),m.topThree,m.topHalf,m.lastPlaceYears.length])
   row.append(add('td',String(val)));
  body.append(row);
 }
 table.append(body);frame.append(table);return frame;
}
async function show(){
 if(!root)return;
 try{
  const responses=await Promise.all([
   fetch('../data/fellas_final_placements_2020_2025.json'),
   fetch('../data/sleeper_postseason_placement_receipts_2020_2025.json'),
   fetch('../data/fellas_final_placements_2016_2025_verified.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Placement sources unavailable');
  const [master,receipts,allEra]=await Promise.all(responses.map(r=>r.json()));
  const audit=auditPlacementStatistics(master,receipts);
  const fullHistory=auditAllEraFinishes(allEra);
  if(espnHistory){
   espnHistory.replaceChildren();
   const title=add('h2','ESPN last-place finishes · 2016–2019');
   const note=add('p','Official ESPN final ranks and losers-bracket finals. These predate the verified Sleeper Toilet Bowl rules, so they are listed separately.');
   note.className='placement-stat-help';
   espnHistory.append(title,note);
   const list=add('div');list.className='placement-shame-list';
   for(const s of allEra.seasons.filter(x=>x.provider==='ESPN').sort((a,b)=>b.year-a.year)){
    const row=add('a');row.href='../seasons/'+s.year+'.html';
    row.className='placement-shame-row';
    row.append(add('span',String(s.year)),add('strong',s.lastPlace),add('span',s.teams+'-team season · official last place'));
    list.append(row);
   }
   espnHistory.append(list);
  }

  root.replaceChildren();
  const heading=add('h3','All-era final placements · 2016–2025');
  root.append(heading);
  const overview=add('p','Field-size adjusted finish score: champion = 100, last place = 0. ESPN 2016 had eight teams; all later seasons had ten. This compares finishing results—not strength of schedule or points.');
  overview.className='placement-stat-help';root.append(overview);
  root.append(add('h3','Career comparison · 6+ seasons'));root.append(allEraTable(fullHistory.managers.filter(m=>m.seasonsPlayed>=6)));
  root.append(add('h3','Shorter careers · fewer than 6 seasons'));root.append(allEraTable(fullHistory.managers.filter(m=>m.seasonsPlayed<6)));
  const separator=add('h3','Sleeper-only finishes · 2020–2025');separator.style.marginTop='24px';root.append(separator);
  const fully=audit.stats.filter(m=>m.seasonsPlayed===6);
  const partial=audit.stats.filter(m=>m.seasonsPlayed<6);
  const explanation=add('p','Average and median use final postseason place (1 = best, 10 = last). Last is the number of Shitter of the Year finishes. Only managers present for all six seasons qualify for the six-season average-finish record.');
  explanation.className='placement-stat-help';root.append(explanation);
  root.append(add('h3','All six Sleeper seasons'));
  root.append(makeTable(fully));
  root.append(add('h3','Shorter Sleeper tenures'))root.append(makeTable(partial));
  if(audit.findings.length){
   const note=add('p','2020 third-place finishing order is verified, but the third-place game score remains under review because the screenshot and archived scores differ by 0.10.');
   note.className='placement-stat-help';root.append(note);
  }
 }catch(error){
  root.replaceChildren(add('p','The finishing-position comparison is temporarily unavailable.'));
  if(espnHistory)espnHistory.replaceChildren(add('p','The ESPN last-place history is temporarily unavailable.'));
  console.error('Placement statistics unavailable',error);
 }
}
if(typeof document!=='undefined')show();
