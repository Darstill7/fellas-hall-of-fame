import {normalizeManager,fellasLeague} from './league-config.mjs';
// Scope: consecutive wins within a single regular season, never across seasons or postseason.
export function buildWinningStreakWatch(ledger,dashboard){
 const week=dashboard?.week,year=fellasLeague.season;
 if(!Number.isInteger(week)||week<1||week>=fellasLeague.regularSeasonWeeks||!Array.isArray(ledger?.games))return [];
 const games=ledger.games.filter(g=>g.stage==='regular').sort((a,b)=>a.year-b.year||a.week-b.week);
 const runs=new Map(),seen=new Set(),current=new Map();let best=0,holders=[];
 for(const g of games){
  if(!Number.isInteger(g.year)||!Number.isInteger(g.week)||g.week<1||g.year>year||![g.homeScore,g.awayScore].every(Number.isFinite))return [];
  if(g.year===year&&g.week>week)return [];
  const home=normalizeManager(g.home),away=normalizeManager(g.away);if(!home||!away||home===away)return [];
  for(const [name,pf,pa] of [[home,g.homeScore,g.awayScore],[away,g.awayScore,g.homeScore]]){
   const key=g.year+':'+name,k=key+':'+g.week;if(seen.has(k))return [];seen.add(k);
   const prev=runs.get(key)||{run:0,last:0};
   // Do not bridge missing weeks.
   const run=pf>pa?(prev.last===g.week-1?prev.run:0)+1:0;
   runs.set(key,{run,last:g.week});
   if(run>best){best=run;holders=[{name,year:g.year}]}else if(run===best&&!holders.some(h=>h.name===name&&h.year===g.year))holders.push({name,year:g.year});
   if(g.year===year)current.set(name,{run,last:g.week});
  }
 }
 if(best<3||current.size!==10||dashboard.standings?.length!==10||dashboard.standings.some(t=>{const x=current.get(t.name);return !x||x.last!==week||x.run!==(t.streak.startsWith('W')?Number(t.streak.slice(1)):0)}))return [];
 const remaining=fellasLeague.regularSeasonWeeks-week;
 return dashboard.standings.flatMap(t=>{
  const run=current.get(t.name).run,tie=best-run;
  const breakGap=tie<remaining?tie+1:null;
  // Alert on an attainable tie even when a new mark is out of reach.
  // Sole holder extending their own mark is not a challenger.
  if(run<3||tie<0||tie>2||tie>remaining||(tie===0&&new Set(holders.map(h=>h.name)).size===1&&holders[0].name===t.name))return [];
  return [{manager:t.name,record:best,holders,run,tie,breakGap,week,year,remaining}];
 }).sort((a,b)=>a.tie-b.tie||a.manager.localeCompare(b.manager));
}
// Chase the frozen current mark. Future wins by any manager can move it.
export function buildCareerWinsMilestones(ledger,dashboard){
 const year=fellasLeague.season,week=dashboard?.week;
 if(!Number.isInteger(week)||week<1||week>=fellasLeague.regularSeasonWeeks||
    !Array.isArray(ledger?.games)||dashboard.standings?.length!==fellasLeague.managers.length)return [];
 const totals=new Map(),current=new Map();
 for(const game of ledger.games){
  if(game.stage!=='regular')continue;
  if(game.year>year||(game.year===year&&game.week>week)||
     ![game.homeScore,game.awayScore].every(Number.isFinite))return [];
  if(game.homeScore===game.awayScore)continue;
  const winner=normalizeManager(game.homeScore>game.awayScore?game.home:game.away);
  totals.set(winner,(totals.get(winner)??0)+1);
  if(game.year===year)current.set(winner,(current.get(winner)??0)+1);
 }
 if(dashboard.standings.some(team=>(current.get(team.name)??0)!==team.w))return [];
 const record=Math.max(0,...totals.values());
 const holders=[...totals].filter(([,wins])=>wins===record).map(([manager])=>manager).sort();
 const remaining=fellasLeague.regularSeasonWeeks-week;
 if(record<=0)return [];
 return dashboard.standings.flatMap(({name})=>{
  const wins=totals.get(name)??0;
  const toMatch=record-wins;
  if(toMatch<1||toMatch>2||toMatch>remaining)return [];
  return [{manager:name,wins,record,holders,toMatch,toPass:toMatch<remaining?toMatch+1:null,week,remaining}];
 }).sort((a,b)=>a.toMatch-b.toMatch||a.manager.localeCompare(b.manager));
}

export function renderWinningStreakWatch(host,items,milestones=[]){
 if(!host)return;host.replaceChildren();host.hidden=!items.length&&!milestones.length;if(host.hidden)return;
 const el=(tag,value)=>{const n=document.createElement(tag);n.textContent=value;return n};
 host.append(el('h2','Record Watch'));
 for(const x of items){const row=el('article','');row.className='record-watch-row';row.append(el('strong',x.manager+' · '+x.run+' consecutive wins'),el('p',x.record+' wins · '+x.holders.map(h=>h.name+' ('+h.year+')').join(', ')),el('p',x.tie?x.tie+' to match the current mark'+(x.breakGap?' · '+x.breakGap+' to exceed it':''):x.breakGap+' to exceed the current mark'),el('small','Single regular season · through Week '+x.week+' · '+x.remaining+' games remain. The mark can move.'));const a=el('a','Explore Record Book ›');a.href='analytics/records.html';row.append(a);host.append(row)}
 for(const x of milestones){
  const row=el('article','');row.className='record-watch-row career-wins-milestone';
  row.append(el('strong',x.manager+' · '+x.wins+' career wins'),
   el('p',x.toMatch+' more '+(x.toMatch===1?'win':'wins')+' to match the current mark of '+x.record),
   el('small','Through Week '+x.week+' · '+x.remaining+' regular-season games remain. The mark can move.'));
  const evidence=el('a','Career wins record ›');
  evidence.href='analytics/record-holders.html#established-record-career-wins';
  row.append(evidence);host.append(row);
 }
}
