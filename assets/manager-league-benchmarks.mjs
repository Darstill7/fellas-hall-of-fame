import {draftContext,tradeContext,managerDecisionSummary} from './manager-decision-context.mjs';
const names=['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=x=>Number.isFinite(x)?x.toLocaleString():'N/A';
const metric=x=>x===null?'N/A':Number(x).toFixed(1);
try{
 const [drafts,trades]=await Promise.all(['v9_draft_engine.json','v9_trade_engine.json'].map(async name=>{const r=await fetch('../data/'+name,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' for '+name);return r.json()}));
 if(!Array.isArray(drafts)||!Array.isArray(trades.sides))throw Error('Invalid evidence source structure');
 const d=draftContext(drafts),t=tradeContext(trades);
 const rows=names.map(name=>managerDecisionSummary(name,d,t));
 document.getElementById('benchmarks').innerHTML=rows.map(x=>'<tr><td><a href="manager-decision-audit.html?manager='+encodeURIComponent(x.name)+'">'+esc(x.name)+'</a></td><td>'+count(x.picks)+'</td><td>'+count(x.comparablePicks)+'</td><td>'+(x.picks?Number(100*x.comparablePicks/x.picks).toFixed(1)+'%':'N/A')+'</td><td>'+metric(x.avgPeerAdjusted)+'</td><td>'+count(x.verifiedTradeSides)+'</td><td>'+metric(x.avgTradeEdge)+'</td></tr>').join('');
 document.getElementById('status').textContent=rows.length+' managers · '+d.length+' eligible archived draft picks · '+t.length+' verified nonprovisional trade sides. Not a skill ranking.';
}catch(e){document.getElementById('status').textContent='Source error: '+e.message;document.getElementById('benchmarks').textContent='Evidence unavailable. No substitute values are shown.'}
