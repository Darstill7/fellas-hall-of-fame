(()=>{'use strict';
const $=id=>document.getElementById(id), fmt=x=>Number(x).toFixed(2), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let archive;
const row=(items)=>'<tr>'+items.map(v=>'<td>'+v+'</td>').join('')+'</tr>';
const head=(items)=>'<thead><tr>'+items.map(v=>'<th>'+v+'</th>').join('')+'</tr></thead>';
function selectYear(){const d=archive.years[$('year').value];$('manager').innerHTML=d.teams.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('');$('manager').value=d.teams.includes('Stilly')?'Stilly':d.teams[0];render()}
function render(){const y=$('year').value,d=archive.years[y],name=$('manager').value,stat=d.stats.find(s=>s.manager===name);
$('actual').textContent=stat.w+'–'+stat.l+(stat.t?'-'+stat.t:'');
$('expected').textContent=fmt(stat.expectedWins);
$('luck').textContent=(stat.luck>0?'+':'')+fmt(stat.luck);
const t=d.teams;let h=head(['Scoring team / Schedule →',...t.map(esc)]),body='<tbody>';for(const team of t){body+='<tr><th>'+esc(team)+'</th>';for(const schedule of t){const entry=d.matrix.find(x=>x.team===team&&x.schedule===schedule);const label=entry?entry.w+'–'+entry.l+(entry.t?'-'+entry.t:''):'—';body+='<td><button type="button" data-team="'+esc(team)+'" data-schedule="'+esc(schedule)+'" aria-label="'+esc(team)+' using '+esc(schedule)+' schedule: '+label+'" '+(team===name?'style="border-color:#e3bd71"':'')+'>'+label+'</button></td>'}body+='</tr>'}body+='</tbody>';$('matrix').innerHTML=h+body;
$('matrix').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>showDetails(b.dataset.team,b.dataset.schedule)));
const stats=d.stats.slice().sort((a,b)=>b.sos-a.sos);
$('rankings').innerHTML=head(['Rank','Manager','Record','Opponent PPG (SOS)','All-play expected W','Luck (wins)','Total PA'])+'<tbody>'+stats.map((s,i)=>row([i+1,esc(s.manager),s.w+'–'+s.l,fmt(s.sos),fmt(s.expectedWins),(s.luck>0?'+':'')+fmt(s.luck),fmt(s.pa)])).join('')+'</tbody>';
showDetails(name,name);renderLeaders()}
function showDetails(team,schedule){const y=$('year').value,d=archive.years[y],x=d.matrix.find(r=>r.team===team&&r.schedule===schedule);if(!x)return;
$('detail').innerHTML='<strong>'+esc(team)+' using '+esc(schedule)+'’s '+y+' schedule: '+x.w+'–'+x.l+(x.t?'-'+x.t:'')+'</strong><p>'+x.games+' comparable weeks. '+(team===schedule?'Actual opponents used.':'The reciprocal substitution rule avoids self-matchups.')+'</p><div class="scroller"><table>'+head(['Week','Replacement opponent','Your points','Opponent points','Result'])+'<tbody>'+x.details.map(g=>row([g.week,esc(g.opponent),fmt(g.points),fmt(g.opponentPoints),g.result])).join('')+'</tbody></table></div>';
}
function renderLeaders(){if(!archive)return;const kind=$('leaderType').value;const all=Object.entries(archive.years).flatMap(([y,d])=>d.stats.map(s=>({...s,year:+y,winPct:s.games?(s.w+.5*s.t)/s.games:0}))).filter(s=>s.games>=10);let list=all.slice();if(kind==='sos')list.sort((a,b)=>b.sos-a.sos);if(kind==='luckLow')list.sort((a,b)=>a.luck-b.luck);if(kind==='luckHigh')list.sort((a,b)=>b.luck-a.luck);if(kind==='pf')list.sort((a,b)=>b.pf-a.pf);if(kind==='winPct')list.sort((a,b)=>b.winPct-a.winPct);
$('leaders').innerHTML=head(['Rank','Year','Manager','W–L','PF','Opponent PPG','Expected wins','Luck'])+'<tbody>'+list.slice(0,25).map((s,i)=>row([i+1,s.year,esc(s.manager),s.w+'–'+s.l,fmt(s.pf),fmt(s.sos),fmt(s.expectedWins),(s.luck>0?'+':'')+fmt(s.luck)])).join('')+'</tbody>'}
fetch('../data/all_time_schedule_matrix_v1.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{archive=d;const years=Object.keys(d.years).sort((a,b)=>b-a);$('year').innerHTML=years.map(y=>'<option value="'+y+'">'+y+(y==='2026'?' (through Week 6)':'')+'</option>').join('');$('year').value='2025';$('year').addEventListener('change',selectYear);$('manager').addEventListener('change',render);$('leaderType').addEventListener('change',renderLeaders);selectYear()}).catch(e=>{$('detail').textContent='Historical schedule data could not be loaded.';});
})();