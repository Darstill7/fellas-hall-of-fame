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

// Conditional counts by next-week winner, in one enumeration pass.
// Counts describe equally enumerated decisive outcomes, never forecast probabilities.
export function rootingGuide(model,manager,picks={}){
 const {names,wins,games}=model,idx=names.indexOf(manager);if(idx<0)throw Error('Unknown manager');
 for(const [k,v] of Object.entries(picks))if(!/^\d+$/.test(k)||!games[+k]||![games[+k].a,games[+k].b].includes(v))throw Error('Invalid pick');
 const targets=games.map((g,i)=>({...g,i})).filter(g=>g.week===model.week+1);
 const make=()=>({outcomes:0,playoffCertain:0,playoffPossible:0,byeCertain:0,byePossible:0});
 const rows=targets.map(g=>({...g,choices:[{winner:names[g.a],...make()},{winner:names[g.b],...make()}]}));
 const totals=wins.slice(),chosen=[];
 function visit(i){
  if(i===games.length){
   let above=0,tied=0;for(let j=0;j<names.length;j++)if(j!==idx){above+=+(totals[j]>totals[idx]);tied+=+(totals[j]===totals[idx]);}
   for(const row of rows){const c=row.choices[chosen[row.i]===row.a?0:1];c.outcomes++;c.playoffCertain+=+(above+tied<6);c.playoffPossible+=+(above<6);c.byeCertain+=+(above+tied<2);c.byePossible+=+(above<2);}
   return;
  }
  const g=games[i];for(const j of Object.hasOwn(picks,i)?[picks[i]]:[g.a,g.b]){chosen[i]=j;totals[j]++;visit(i+1);totals[j]--;}
 }
 visit(0);return rows;
}

// Conditional conventional six-team bracket: #3 vs #6, #4 vs #5.
// Each pair must be simultaneously feasible within ONE outcome, not merely
// independently attainable over different outcomes. Tied-win permutations
// can occupy any distinct slots within their shared interval.
export function bracketPaths(model,manager,picks={}){
 const {names,wins,games}=model,idx=names.indexOf(manager);if(idx<0)throw Error('Unknown manager');
 for(const [k,v] of Object.entries(picks))if(!/^\d+$/.test(k)||!games[+k]||![games[+k].a,games[+k].b].includes(v))throw Error('Invalid pick');
 const totals=wins.slice(),seedCounts=Array(10).fill(0),pairs=new Map();let outcomes=0,byePossible=0,firstRoundPossible=0,missPossible=0;
 function visit(i){
  if(i===games.length){
   outcomes++;const ranks=totals.map(w=>[1+totals.filter(v=>v>w).length,totals.filter(v=>v>=w).length]),[lo,hi]=ranks[idx];
   for(let s=lo;s<=hi;s++)seedCounts[s-1]++;
   byePossible+=+(lo<=2);missPossible+=+(hi>6);firstRoundPossible+=+(lo<=6&&hi>=3);
   for(let seed=Math.max(3,lo);seed<=Math.min(6,hi);seed++){
    const otherSeed=9-seed;
    for(let j=0;j<names.length;j++){if(j===idx)continue;const [a,b]=ranks[j];if(otherSeed<a||otherSeed>b)continue;
     const key=seed+':'+j;let row=pairs.get(key);if(!row){row={seed,opponentSeed:otherSeed,opponent:names[j],outcomes:0};pairs.set(key,row);}row.outcomes++;
    }
   }
   return;
  }
  const g=games[i];for(const j of Object.hasOwn(picks,i)?[picks[i]]:[g.a,g.b]){totals[j]++;visit(i+1);totals[j]--;}
 }
 visit(0);
 return {outcomes,seedCounts,byePossible,firstRoundPossible,missPossible,pairs:[...pairs.values()].sort((a,b)=>a.seed-b.seed||b.outcomes-a.outcomes||a.opponent.localeCompare(b.opponent))};
}

// Independent illustrative postseason forecast; never changes archived regular-season odds.
// Assumes fixed 3/6 and 4/5 bracket, #1 plays 4/5 winner, #2 plays 3/6 winner,
// single-week rounds, PF ranking, independent normal scores and no injuries.
export function championshipForecast(data,iterations=25000){
 const m=prepare(data);if(!Number.isInteger(iterations)||iterations<1||iterations>100000)throw Error('Invalid iterations');
 let state=(20260000+m.week)>>>0;
 const random=()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
 const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-12)))*Math.cos(2*Math.PI*random());
 const league=m.names.reduce((s,n)=>s+data.teams[n].mean,0)/10;
 const params=m.names.map(n=>{const t=data.teams[n];if(![t.mean,t.recent_mean,t.sd].every(Number.isFinite))throw Error('Missing forecast inputs '+n);return {mean:.6*t.mean+.25*t.recent_mean+.15*league,sd:Math.max(19,Math.min(38,t.sd))};});
 const score=i=>Math.max(0,params[i].mean+params[i].sd*normal());
 const win=(a,b)=>{const x=score(a),y=score(b);return x===y?(random()<.5?a:b):x>y?a:b;};
 const rows=m.names.map(name=>({name,playoffs:0,bye:0,semifinal:0,final:0,champion:0}));
 for(let i=0;i<iterations;i++){
  const w=m.wins.slice(),pf=m.points.slice();
  for(const g of m.games){const a=score(g.a),b=score(g.b);pf[g.a]+=a;pf[g.b]+=b;w[a===b?(random()<.5?g.a:g.b):a>b?g.a:g.b]++;}
  const ranked=m.names.map((_,j)=>j).sort((a,b)=>w[b]-w[a]||pf[b]-pf[a]||a-b);
  const [s1,s2,s3,s4,s5,s6]=ranked;for(const j of ranked.slice(0,6))rows[j].playoffs++;
  rows[s1].bye++;rows[s2].bye++;
  const q36=win(s3,s6),q45=win(s4,s5);for(const j of [s1,s2,q36,q45])rows[j].semifinal++;
  const f1=win(s1,q45),f2=win(s2,q36);rows[f1].final++;rows[f2].final++;rows[win(f1,f2)].champion++;
 }
 return {iterations,rows:rows.sort((a,b)=>b.champion-a.champion||a.name.localeCompare(b.name))};
}
