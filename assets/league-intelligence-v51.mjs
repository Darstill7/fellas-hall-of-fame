// Descriptive comparison of actual completed games, never a projection.
export function buildLeagueComparison(d){
 const ranked=[...d.standings].sort((a,b)=>b.pf-a.pf||a.name.localeCompare(b.name));
 return d.standings.map((r,i)=>({name:r.name,standing:i+1,scoringRank:1+ranked.filter(x=>Math.round(x.pf*100)>Math.round(r.pf*100)).length,avg:r.pf/d.week,w:r.w,l:r.l,t:r.t??0,streak:r.streak}));
}
export function mountLeagueComparison(host,d,personal){
 if(!host)return;host.replaceChildren();
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
 const rows=buildLeagueComparison(d);
 host.append(el('h2','League intelligence'),el('p','Through Week '+d.week+' · actual standings vs season scoring rank','source-note'));
 const table=el('table',null,'league-compare-table'),head=el('thead'),tr=el('tr');
 for(const label of ['Manager','W–L','PF rank','Avg PF','Playoffs']){const th=el('th',label);th.scope='col';tr.append(th)}head.append(tr);table.append(head);
 const body=el('tbody');for(const r of rows){const tr=el('tr'),th=el('th',r.name);th.scope='row';const odds=personal(r.name)?.odds?.playoff;tr.append(th,el('td',r.w+'–'+r.l+(r.t?'–'+r.t:'')),el('td','#'+r.scoringRank),el('td',r.avg.toFixed(2)),el('td',Number.isFinite(odds)?odds+'%':'—'));body.append(tr)}table.append(body);host.append(table,el('p','Scoring rank is descriptive, not a power ranking. Playoff percentages are model estimates, not clinches.','source-note'));
 const links=el('div',null,'league-compare-links');for(const [label,href] of [['Playoff race','analytics/playoff-race.html'],['Schedule luck','analytics/schedule-draw-all-play.html'],['Manager directory','managers/'],['Scores & results','analytics/sportscenter.html']]){const a=el('a',label);a.href=href;links.append(a)}host.append(links);
}
