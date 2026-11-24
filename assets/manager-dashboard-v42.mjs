import {sharedProfileJson} from './manager-mobile-v47.mjs';
// A single-cutoff personalized dashboard; no stale probability mixing.
export function buildManagerDashboard(core,guide,race,name){
 const m=core.managers?.[name],season=guide['2026'],rows=season?.standings;
 if(!m||!Array.isArray(rows)||rows.length!==10||new Set(rows.map(r=>r.name)).size!==10)throw Error('Missing canonical manager standings');
 const week=Number(core.completedThrough?.week??String(season.summary||'').match(/Week\s+(\d+)/)?.[1]);
 if(!Number.isInteger(week)||week<1||week>14)throw Error('Invalid completed week');
 const guideWeek=Number(guide.completedThrough?.week??String(season.summary||'').match(/Week\s+(\d+)/)?.[1]);
 if(guideWeek!==week)throw Error('Mixed core and season cutoffs');
 const valid=r=>['w','l','t'].every(k=>Number.isInteger(r[k]??0)&&(r[k]??0)>=0)&&r.w+r.l+(r.t??0)===week&&Number.isFinite(r.pf)&&Number.isFinite(r.pa);
 if(!rows.every(valid))throw Error('Invalid standings');
 const r=rows.find(x=>x.name===name),annual=m.annual?.['2026'];
 if(!r||!annual||['w','l','t'].some(k=>(annual[k]??0)!==(r[k]??0)))throw Error('Career season record mismatch');
 if(m.games!==m.w+m.l+(m.t??0)||m.games<1)throw Error('Invalid career record');
 const scoringRank=1+rows.filter(x=>x.pf>r.pf).length;
 const alias=name==='Thommy'?'Tom':name;
 let playoff=null;
 if(race?.verified_through_week===week){
  const team=race.teams?.[name]??race.teams?.[alias],odds=race.scenarios?.['6']?.[name]??race.scenarios?.['6']?.[alias];
  if(team&&odds&&team.w===r.w&&team.l===r.l&&Math.round(team.pf*100)===Math.round(r.pf*100)&&[odds.playoff_pct,odds.top2_pct].every(x=>Number.isFinite(x)&&x>=0&&x<=100)&&odds.top2_pct<=odds.playoff_pct)playoff={playoff:odds.playoff_pct,bye:odds.top2_pct};
 }
 return {week,season:{...r,scoringRank,average:r.pf/week},career:{wins:m.w,winPct:(m.w+(m.t??0)/2)/m.games,seasons:Object.keys(m.annual||{}).length},playoff};
}
// Reconcile the complete weekly ledger before drawing trends or streaks.
export function buildSeasonTrajectory(ledger,guide,name,week){
 const rows=guide['2026'].standings, games=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
 if(games.length!==week*5)throw Error('Weekly ledger cutoff mismatch');
 const names=new Set(rows.map(r=>r.name)),totals=new Map([...names].map(n=>[n,{w:0,l:0,t:0,pf:0,pa:0}]));
 const history=[],seen=new Set(),cents=n=>Math.round(n*100);
 for(const g of games){
  if(!Number.isInteger(g.week)||g.week<1||g.week>week||g.home===g.away||!names.has(g.home)||!names.has(g.away)||![g.homeScore,g.awayScore].every(Number.isFinite))throw Error('Invalid weekly fixture');
  for(const [n,o,p,a] of [[g.home,g.away,g.homeScore,g.awayScore],[g.away,g.home,g.awayScore,g.homeScore]]){
   const k=g.week+':'+n;if(seen.has(k))throw Error('Duplicate weekly manager');seen.add(k);
   const result=cents(p)>cents(a)?'W':cents(p)<cents(a)?'L':'T',t=totals.get(n);t[result.toLowerCase()]++;t.pf+=cents(p);t.pa+=cents(a);
   if(n===name)history.push({week:g.week,opponent:o,pf:p,pa:a,result});
  }
 }
 for(const r of rows){const t=totals.get(r.name);if(t.w!==r.w||t.l!==r.l||t.t!==(r.t??0)||t.pf!==cents(r.pf)||t.pa!==cents(r.pa))throw Error('Weekly ledger disagrees with standings: '+r.name)}
 history.sort((a,b)=>a.week-b.week);if(history.length!==week)throw Error('Incomplete manager trajectory');
 const leagueAverage=[...totals.values()].reduce((n,t)=>n+t.pf,0)/100/rows.length/week;
 const recent=history.slice(-5),latest=history.at(-1);let streak=0;for(const g of history.slice().reverse()){if(g.result!==latest.result)break;streak++}
 return {history,recent,leagueAverage,streak:latest.result+streak,seasonHigh:history.reduce((a,b)=>b.pf>a.pf?b:a),recentAverage:recent.reduce((n,g)=>n+g.pf,0)/recent.length};
}
export function buildUpcomingSchedule(core,guide,race,name,week){
 if(race?.verified_through_week!==week)return [];
 const normalize=n=>n==='Tom'?'Thommy':n;
 const names=new Set(guide['2026'].standings.map(r=>r.name)),result=[];
 for(let w=week+1;w<=14;w++){
  const fixtures=race.fixtures?.[w];if(!Array.isArray(fixtures)||fixtures.length!==5)break;
  const pairs=fixtures.map(p=>Array.isArray(p)?p.map(normalize):[]);
  const flat=pairs.flat();if(pairs.some(p=>p.length!==2)||flat.length!==10||new Set(flat).size!==10||flat.some(n=>!names.has(n)))break;
  const pair=pairs.find(p=>p.includes(name)),opponent=pair.find(n=>n!==name);
  const h=core.managers[name].h2h?.[opponent];
  const record=h&&[h.w,h.l,h.t??0].every(n=>Number.isInteger(n)&&n>=0)&&h.games===h.w+h.l+(h.t??0)?{w:h.w,l:h.l,t:h.t??0}:null;
  result.push({week:w,opponent,record});
 }
 return result;
}
export function careerMilestones(wins){
 if(!Number.isInteger(wins)||wins<0)throw Error('Invalid career wins');
 const target=(Math.floor(wins/10)+1)*10;
 return {target,remaining:target-wins};
}
const make=(tag,txt,cls)=>{const n=document.createElement(tag);if(txt!=null)n.textContent=txt;if(cls)n.className=cls;return n};
export async function mountManagerDashboard({name,host,root='../../'}){
 if(!host||host.querySelector('.gm42-dashboard'))return;
 const panel=make('div',null,'gm42-dashboard'),status=make('p','Checking synchronized career and playoff evidence…','gm42-status');status.setAttribute('role','status');panel.append(status);host.append(panel);
 try{
  const get=file=>sharedProfileJson(root+'data/'+file);
  const [core,guide,race,ledger]=await Promise.all([get('career_core_generated.json'),get('season_guide.json'),get('playoff_race_v1.json').catch(()=>null),get('unified_record_book_2016_2026.json').catch(()=>null)]);
  const d=buildManagerDashboard(core,guide,race,name),fmt=n=>n.toLocaleString('en-US',{maximumFractionDigits:2});
  status.textContent='Synchronized through Week '+d.week+' · regular season';
  const grid=make('div',null,'gm42-grid');
  for(const [label,value] of [['League scoring rank','#'+d.season.scoringRank+' of 10'],['Average weekly PF',fmt(d.season.average)],['Career wins',fmt(d.career.wins)],['Career win percentage',fmt(d.career.winPct*100)+'%'],['Seasons played',fmt(d.career.seasons)]]){
   const item=make('div',null,'gm42-metric');item.append(make('small',label),make('strong',value));grid.append(item);
  }
  panel.append(grid);
  const outlook=make('section',null,'gm42-outlook');outlook.append(make('h3','Road to the playoffs'));
  if(d.playoff){for(const [label,value] of [['Playoff probability',d.playoff.playoff],['First-round bye probability',d.playoff.bye]]){const row=make('div',null,'gm42-probability');const caption=make('label',label+' · '+fmt(value)+'%');const meter=make('meter');meter.min=0;meter.max=100;meter.value=value;meter.setAttribute('aria-label',label);row.append(caption,meter);outlook.append(row)}outlook.append(make('p','Model estimates, not mathematical clinches or official odds.'))}
  else outlook.append(make('p','Matching completed-week playoff simulation not available. No outdated odds displayed.'));
  panel.append(outlook);
  const milestone=careerMilestones(d.career.wins),watch=make('section',null,'gm42-outlook');watch.append(make('h3','Milestone watch'),make('p',name+' is '+milestone.remaining+' regular-season '+(milestone.remaining===1?'win':'wins')+' away from '+milestone.target+' career wins.'));panel.append(watch);
  const schedule=buildUpcomingSchedule(core,guide,race,name,d.week),next=make('section',null,'gm42-outlook');next.append(make('h3','Remaining schedule'));
  if(schedule.length){next.append(make('p',race.provider_schedule_verified===true?'Provider-verified fixtures':'Archived schedule preview · future pairings not independently verified'));for(const game of schedule){const h=game.record;next.append(make('p','Week '+game.week+' · '+game.opponent+(h?' · Career regular-season H2H '+h.w+'–'+h.l+(h.t?'–'+h.t:''):' · H2H unavailable')));}}else next.append(make('p','Matching future schedule unavailable.'));panel.append(next);
  const trend=make('section',null,'gm42-outlook');trend.append(make('h3','Season trajectory'));panel.append(trend);
  try{
   const t=buildSeasonTrajectory(ledger,guide,name,d.week);
   const latest=t.history.at(-1);trend.append(make('p',name+' '+(latest.result==='W'?'defeated':latest.result==='L'?'lost to':'tied')+' '+latest.opponent+' in Week '+latest.week+', '+fmt(latest.pf)+'–'+fmt(latest.pa)+'. Currently #'+d.season.scoringRank+' in league scoring.'));
   trend.append(make('p','Current streak: '+t.streak+' · Last '+t.recent.length+' average: '+fmt(t.recentAverage)+' PF · League average: '+fmt(t.leagueAverage)+' PF'));
   const bars=make('div',null,'gm42-trend');const max=Math.max(1,...t.history.map(g=>g.pf),t.leagueAverage);
   for(const g of t.history){const item=make('div',null,'gm42-trend-item');item.append(make('span','W'+g.week));const bar=make('meter');bar.min=0;bar.max=max;bar.value=Math.max(0,g.pf);bar.setAttribute('aria-label','Week '+g.week+' '+fmt(g.pf)+' points');item.append(bar,make('strong',fmt(g.pf)),make('span',g.result));bars.append(item)}
   trend.append(bars,make('p','Season high: '+fmt(t.seasonHigh.pf)+' PF vs '+t.seasonHigh.opponent+' (Week '+t.seasonHigh.week+').'));
   const log=make('details');log.append(make('summary','Last '+t.recent.length+' matchup results'));
   for(const g of t.recent.slice().reverse())log.append(make('p','Week '+g.week+' · '+g.result+' vs '+g.opponent+' · '+fmt(g.pf)+'–'+fmt(g.pa)));
   trend.append(log);
  }catch(error){trend.append(make('p','Weekly scoring trend unavailable until matchup evidence agrees with standings.'))}

 }catch(error){status.textContent='Synchronized dashboard unavailable. Existing season results remain accessible.';console.warn('Manager 4.2 dashboard:',error.message)}
}
