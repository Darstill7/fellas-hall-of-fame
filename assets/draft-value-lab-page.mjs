import {computeDraftValue} from '../assets/fellas-draft-value-lab.mjs';
const $=id=>document.getElementById(id),safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>n===null?'Not comparable':Number(n).toFixed(2),signed=n=>n===null?'N/A':(n>0?'+':'')+f(n);
let source=null,kind='draft',manager='ALL';
const row=p=>'<tr><td>'+safe(p.player)+'<small>'+(p.keeper?'Keeper · ':'')+safe(p.position)+(p.wasTraded?' · traded during season':'')+'</small></td><td>R'+p.round+' · #'+p.overall+'</td><td class="right">'+p.starts+'</td><td class="right">'+f(p.startedPoints)+'</td><td class="right">'+(p.peerMedian===null?'<span class="unavailable">N/A</span>':f(p.peerMedian))+'</td><td class="right '+(p.valuePoints===null?'unavailable':p.valuePoints>=0?'positive':'negative')+'">'+signed(p.valuePoints)+'</td></tr>';
const render=()=>{
 if(!source)return;
 const isKeeper=kind==='keeper',summary=source.managers.filter(x=>manager==='ALL'||x.manager===manager);
 const entries=source.picks.filter(p=>(manager==='ALL'||p.manager===manager)&&p.keeper===isKeeper).sort((a,b)=>(b.valuePoints??-Infinity)-(a.valuePoints??-Infinity)||a.overall-b.overall);
 const totalPts=summary.reduce((n,r)=>n+(isKeeper?r.keeperStartedPoints:r.draftedStartedPoints),0),
  selected=summary.reduce((n,r)=>n+(isKeeper?r.keeperPicks:r.nonkeeperPicks),0),
  comparable=entries.filter(p=>p.valuePoints!==null),value=comparable.reduce((n,p)=>n+p.valuePoints,0);
 const mode=isKeeper?'Keeper':'Draft',metric=isKeeper?'Slot surplus':'Value Points';
 const cards='<div class="grid"><div class="metric"><small>'+mode+' selections</small><strong>'+selected+'</strong><p>Confirmed 2026 selections</p></div>'+
  '<div class="metric"><small>Points from original-manager starts</small><strong>'+f(totalPts)+'</strong><p>Excludes bench points and points for other managers</p></div>'+
  '<div class="metric"><small>'+metric+' per comparable pick</small><strong>'+signed(comparable.length?value/comparable.length:null)+'</strong><p>'+comparable.length+' of '+entries.length+' compared to nonkeeper picks from the same round</p></div></div>';
 $('value-results').innerHTML=cards+'<section class="section-heading"><h2>'+mode+' return'+(manager==='ALL'?' · All managers':' · '+safe(manager))+'</h2><p>Every row shows actual started points, peer median, and the difference. Values from incomplete 2026 will change as the archived ledger updates.</p></section>'+
  '<div class="table-wrap"><table class="results"><thead><tr><th>Player</th><th>Draft slot</th><th class="right">Starts</th><th class="right">Started pts</th><th class="right">Round median</th><th class="right">Value pts</th></tr></thead><tbody>'+entries.map(p=>'<tr><td>'+safe(p.player)+'<small>'+safe(p.manager)+' · '+safe(p.position)+(p.wasTraded?' · traded':'')+'</small></td><td>R'+p.round+' · #'+p.overall+'</td><td class="right">'+p.starts+'</td><td class="right">'+f(p.startedPoints)+'</td><td class="right">'+(p.peerMedian===null?'<span class="unavailable">N/A</span>':f(p.peerMedian))+'</td><td class="right '+(p.valuePoints===null?'unavailable':p.valuePoints>=0?'positive':'negative')+'">'+signed(p.valuePoints)+'</td></tr>').join('')+'</tbody></table></div>';
};
(async()=>{
 try{
  const [b,v]=await Promise.all([fetch('../data/fellas_2026_sleeper_draft_board_verified_v1.json',{cache:'no-store'}),fetch('../data/v9_draft_engine.json',{cache:'no-store'})]);
  if(!b.ok||!v.ok)throw Error('Draft source unavailable');
  source=computeDraftValue(await b.json(),await v.json());
  $('manager-choice').innerHTML='<option value="ALL">Entire league</option>'+source.managers.map(x=>'<option value="'+safe(x.manager)+'">'+safe(x.manager)+'</option>').join('');
  const params=new URLSearchParams(location.search);if(source.managers.some(x=>x.manager===params.get('manager')))manager=params.get('manager');
  if(params.get('type')==='keeper')kind='keeper';
  $('manager-choice').value=manager;document.querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===kind)));
  $('manager-choice').addEventListener('change',e=>{manager=e.target.value;render()});
  document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kind;document.querySelectorAll('[data-kind]').forEach(z=>z.setAttribute('aria-pressed',String(z===b)));render()}));
  render();
 }catch(error){console.error(error);$('value-results').innerHTML='<p role="alert" class="note">Verified draft value data is unavailable. <a href="../analytics/drafts/">Return to Draft Engine.</a></p>'}
})();
