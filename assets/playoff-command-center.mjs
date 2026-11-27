// Exact decisive-game outcome enumeration. No assumption about future PF.
export function prepare(data){
 const names=Object.keys(data.teams||{}),week=data.verified_through_week,end=data.assumed_regular_season_end_week;
 if(names.length!==10||!Number.isInteger(week)||!Number.isInteger(end)||week<1||end<week||end>14||data.playoff_format?.teams!==6||data.playoff_format?.first_round_byes!==2)throw Error('Unsupported snapshot or format');
 const wins=names.map(n=>{const t=data.teams[n];if(!Number.isInteger(t.w)||!Number.isInteger(t.l)||t.w<0||t.l<0||t.w+t.l!==week||!Number.isFinite(t.pf))throw Error('Invalid team '+n);return t.w});
 const games=[];
 for(let w=week+1;w<=end;w++){
  const rows=data.fixtures?.[w],seen=new Set();if(!Array.isArray(rows)||rows.length!==5)throw Error('Missing Week '+w);
  for(const row of rows){if(!Array.isArray(row)||row.length!==2)throw Error('Invalid fixture');const [a,b]=row.map(n=>names.indexOf(n));if(a<0||b<0||a===b||seen.has(a)||seen.has(b))throw Error('Duplicate/unknown fixture');seen.add(a);seen.add(b);games.push({week:w,a,b});}
 }
 if(games.length>20)throw Error('Exact enumeration available with four or fewer weeks left');
 return {names,wins,games,week,end,points:names.map(n=>data.teams[n].pf)};
}
export function analyze(model,picks={}){
 const {names,wins,games}=model, totals=wins.slice(),rows=names.map(name=>({name,best:10,worst:1,playoffCertain:0,playoffPossible:0,byeCertain:0,byePossible:0,minWins:14,maxWins:0}));let outcomes=0;
 for(const [k,v] of Object.entries(picks)){if(!/^\d+$/.test(k)||!games[+k]||![games[+k].a,games[+k].b].includes(v))throw Error('Invalid pick');}
 function visit(i){
  if(i===games.length){outcomes++;for(let j=0;j<names.length;j++){let above=0,tied=0;for(let k=0;k<names.length;k++)if(k!==j){above+=+(totals[k]>totals[j]);tied+=+(totals[k]===totals[j]);}
   const best=above+1,worst=above+tied+1,r=rows[j];r.best=Math.min(r.best,best);r.worst=Math.max(r.worst,worst);r.minWins=Math.min(r.minWins,totals[j]);r.maxWins=Math.max(r.maxWins,totals[j]);r.playoffCertain+=+(worst<=6);r.playoffPossible+=+(best<=6);r.byeCertain+=+(worst<=2);r.byePossible+=+(best<=2);
  }return;}
  const g=games[i],choices=Object.hasOwn(picks,i)?[picks[i]]:[g.a,g.b];for(const j of choices){totals[j]++;visit(i+1);totals[j]--;}
 }
 visit(0);return {outcomes,rows:rows.map(r=>({...r,playoff:r.playoffCertain===outcomes?'Guaranteed':r.playoffPossible===0?'Impossible':'Open',bye:r.byeCertain===outcomes?'Guaranteed':r.byePossible===0?'Impossible':'Open'}))};
}

// Schedule difficulty measures opponents, not the selected team's own strength.
// Weight season and recent completed-game scoring equally enough to reward form,
// while keeping the larger season sample dominant. No player injury projections.
export function remainingSOS(data){
 const m=prepare(data),rows=m.names.map((name,i)=>{
 const opponents=m.games.filter(g=>g.a===i||g.b===i).map(g=>({week:g.week,name:m.names[g.a===i?g.b:g.a]}));
 if(!opponents.length)return {name,opponents,score:null,season:null,recent:null,record:null,allPlay:null,rank:null};
 const metrics=opponents.map(o=>{const t=data.teams[o.name];if(!Number.isFinite(t.mean)||!Number.isFinite(t.recent_mean)||!Number.isInteger(t.apw)||!Number.isInteger(t.apl)||t.apw+t.apl<=0)throw Error('Missing schedule strength inputs for '+o.name);return {...o,season:t.mean,recent:t.recent_mean,record:t.w/(t.w+t.l),allPlay:t.apw/(t.apw+t.apl),score:.7*t.mean+.3*t.recent_mean};});
 const avg=k=>metrics.reduce((s,x)=>s+x[k],0)/metrics.length;
 return {name,opponents:metrics,score:avg('score'),season:avg('season'),recent:avg('recent'),record:avg('record'),allPlay:avg('allPlay')};
 });
 rows.sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity)||a.name.localeCompare(b.name));let rank=0,last=null;
 rows.forEach((r,i)=>{if(r.score===null)return;const value=Math.round(r.score*100);if(value!==last)rank=i+1;r.rank=rank;last=value;});return rows;
}
