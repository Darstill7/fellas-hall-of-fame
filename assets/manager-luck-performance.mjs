// Visual scoring-strength vs opponent-draw summary for every verified manager.
export async function mountManagerLuckPerformance(profileName,hero){
 if(!hero||!profileName||hero.querySelector('[data-luck-performance]'))return;
 const manager=profileName==='Tom'?'Thommy':profileName;
 try{
  const response=await fetch('../../data/luck_performance_profiles_2016_2026_v1.json',{cache:'no-store'});
  if(!response.ok)throw Error('Luck/performance profile data unavailable');
  const data=await response.json();
  const row=data.managers?.find(r=>r.manager===manager);
  if(!row||!Number.isFinite(row.completedScoringStrengthPct)||!row.completedWeeks)return;
  const el=(tag,cls,text)=>{
   const node=document.createElement(tag);if(cls)node.className=cls;
   if(text!==undefined)node.textContent=text;return node;
  };
  const fmt=(n,d=2)=>(n>0?'+':'')+Number(n).toFixed(d);
  const section=el('section','fellas-luck-performance');
  section.dataset.luckPerformance=manager;
  section.setAttribute('aria-label','Luck versus performance');
  const title=el('h2','','Luck vs. Performance');
  const intro=el('p','flp-muted','How strong were your weekly scores, and how kind were your opponents? Completed seasons through 2025.');
  const grid=el('div','flp-grid');
  const strength=el('div','flp-panel');
  strength.append(el('div','flp-label','SCORING STRENGTH'),el('strong','flp-value',row.completedScoringStrengthPct.toFixed(1)+'%'));
  strength.append(el('p','flp-muted','Share of same-week opponents your team would have beaten. 50% is league-average scoring.'));
  const track=el('div','flp-track');
  track.setAttribute('role','meter');track.setAttribute('aria-label','Career weekly scoring strength');
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax','100');track.setAttribute('aria-valuenow',String(row.completedScoringStrengthPct));
  const fill=el('div','flp-fill');fill.style.width=Math.max(0,Math.min(100,row.completedScoringStrengthPct))+'%';
  track.append(fill);strength.append(track);
  const luck=el('div','flp-panel');
  luck.append(el('div','flp-label','SCHEDULE LUCK'),el('strong','flp-value',fmt(row.completedScheduleLuckWins)+' wins'));
  luck.append(el('p','flp-muted',row.completedActualWins+' actual win credits vs '+row.completedExpectedWins.toFixed(2)+' expected in '+row.completedWeeks+' fully paired weeks.'));
  const interpretation=el('p','flp-interpretation',row.completedScheduleLuckWins>0?'Actual opponents were more favorable than the league-wide average draw.':row.completedScheduleLuckWins<0?'Actual opponents were less favorable than the league-wide average draw.':'Actual wins matched scoring-based expectations.');
  luck.append(interpretation);grid.append(strength,luck);
  section.append(el('div','flp-heading','COMPLETED-SEASON RESEARCH'),title,intro,grid);
  const details=el('details','flp-history');
  const summary=el('summary','','See season-by-season scoring and schedule luck');
  details.append(summary);
  const tableWrap=el('div','flp-table-wrap');
  const table=el('table','flp-table');
  const thead=el('thead');const header=el('tr');
  for(const heading of ['Season','Scoring strength','Actual wins','Expected wins','Schedule Luck'])header.append(el('th','',heading));
  thead.append(header);table.append(thead);
  const tbody=el('tbody');
  for(const s of row.seasonHistory){
   const tr=el('tr');if(s.seasonStatus==='provisional')tr.className='flp-provisional';
   for(const value of [s.year+(s.seasonStatus==='provisional'?' *':''),s.scoringStrengthPct.toFixed(1)+'%',s.actualWinCredits,s.expectedWins.toFixed(2),fmt(s.scheduleLuckWins)]){
    tr.append(el('td','',String(value)));
   }
   tbody.append(tr);
  }
  table.append(tbody);tableWrap.append(table);details.append(tableWrap);
  const note=el('p','flp-footnote','* 2026 is provisional through approved Week '+(data.currentThroughWeek??'—')+' and is excluded from the career metrics above. League size is accounted for in weekly scoring strength; incomplete 2020/2021 Week 14 is excluded.');
  const link=el('a','flp-link','Compare every manager’s Schedule Luck →');
  link.href='../../analytics/record-holders.html#schedule-luck-leaderboard';
  details.append(note,link);section.append(details);
  const style=el('style');
  style.textContent=`
.fellas-luck-performance{margin:20px 0;padding:clamp(18px,3vw,28px);color:#f6f2e9;background:linear-gradient(145deg,#172f3e,#0e1f2c);border:1px solid #536a76;border-top:3px solid #dfc181;border-radius:14px;max-width:100%}
.fellas-luck-performance .flp-heading,.fellas-luck-performance .flp-label{color:#e1c68c;font-size:11px;font-weight:850;letter-spacing:.12em}
.fellas-luck-performance h2{font-size:clamp(25px,4vw,35px);line-height:1.15;margin:7px 0 8px;font-family:Georgia,serif}
.fellas-luck-performance .flp-muted{font-size:13px;color:#c4d3dc;line-height:1.55;margin:7px 0 13px}
.fellas-luck-performance .flp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}
.fellas-luck-performance .flp-panel{min-width:0;padding:17px;background:#0d202d;border:1px solid #45606d;border-radius:10px}
.fellas-luck-performance .flp-value{display:block;font-size:clamp(25px,5vw,37px);font-variant-numeric:tabular-nums;line-height:1.2;margin-top:7px}
.fellas-luck-performance .flp-track{position:relative;height:8px;border-radius:10px;background:#3b5360;margin-top:15px;overflow:hidden}
.fellas-luck-performance .flp-track:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;background:#fff9}
.fellas-luck-performance .flp-fill{height:100%;background:#dfc181;border-radius:10px}
.fellas-luck-performance .flp-interpretation{font-size:12px;line-height:1.5;color:#e1c68c;margin:11px 0 0}
.fellas-luck-performance .flp-history{margin-top:20px;padding-top:15px;border-top:1px solid #536a76}
.fellas-luck-performance summary{cursor:pointer;font-size:14px;font-weight:750;min-height:44px}
.fellas-luck-performance summary:focus-visible,.fellas-luck-performance a:focus-visible{outline:3px solid #e1c68c;outline-offset:3px}
.fellas-luck-performance .flp-table-wrap{overflow-x:auto;margin-top:10px}
.fellas-luck-performance .flp-table{width:100%;border-collapse:collapse;min-width:530px;font-size:12px;font-variant-numeric:tabular-nums}
.fellas-luck-performance th,.fellas-luck-performance td{padding:10px 8px;text-align:right;border-bottom:1px solid #405663;white-space:nowrap}
.fellas-luck-performance th:first-child,.fellas-luck-performance td:first-child{text-align:left}
.fellas-luck-performance th{color:#e1c68c}
.fellas-luck-performance .flp-provisional{font-style:italic;color:#e8d7ae}
.fellas-luck-performance .flp-footnote{font-size:12px;line-height:1.6;color:#c4d3dc}
.fellas-luck-performance .flp-link{display:inline-flex;min-height:44px;align-items:center;color:#f5d492;font-weight:750}
@media(max-width:620px){.fellas-luck-performance .flp-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.fellas-luck-performance *{scroll-behavior:auto}}
`;
  section.prepend(style);
  const snapshot=hero.querySelector('[data-profile-career-snapshot]');
  (snapshot||hero.querySelector(':scope > .lead')||hero.querySelector('h1'))?.after(section);
 }catch(error){console.warn('Luck versus performance temporarily unavailable',error)}
}
