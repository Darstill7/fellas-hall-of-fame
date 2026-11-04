import {auditPlacementStatistics} from './placement-statistics.mjs';
const root=document.getElementById('placement-stat-results');
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
async function show(){
 if(!root)return;
 try{
  const responses=await Promise.all([
   fetch('../data/fellas_final_placements_2020_2025.json'),
   fetch('../data/sleeper_postseason_placement_receipts_2020_2025.json')
  ]);
  if(responses.some(r=>!r.ok))throw Error('Placement sources unavailable');
  const [master,receipts]=await Promise.all(responses.map(r=>r.json()));
  const audit=auditPlacementStatistics(master,receipts);
  root.replaceChildren();
  const fully=audit.stats.filter(m=>m.seasonsPlayed===6);
  const partial=audit.stats.filter(m=>m.seasonsPlayed<6);
  const explanation=add('p','Average and median use final postseason place (1 = best, 10 = last). Last is the number of Shitter of the Year finishes. Only managers present for all six seasons qualify for the six-season average-finish record.');
  explanation.className='placement-stat-help';root.append(explanation);
  root.append(add('h3','All six seasons · 2020–2025'));root.append(makeTable(fully));
  root.append(add('h3','Shorter tenures · listed separately'));root.append(makeTable(partial));
  if(audit.findings.length){
   const note=add('p','2020 third-place finishing order is verified, but the third-place game score remains under review because the screenshot and archived scores differ by 0.10.');
   note.className='placement-stat-help';root.append(note);
  }
 }catch(error){
  root.replaceChildren(add('p','The finishing-position comparison is temporarily unavailable.'));
  console.error('Placement statistics unavailable',error);
 }
}
if(typeof document!=='undefined')show();
