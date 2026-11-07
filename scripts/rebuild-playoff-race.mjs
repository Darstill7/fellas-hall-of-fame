// Regenerate playoff-race projections from the same canonical game ledger as every manager profile.
// Run after each approved weekly import; fails closed if five final games aren't present.
import fs from 'node:fs';
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const file='data/playoff_race_v1.json',data=JSON.parse(fs.readFileSync(file,'utf8'));
const games=ledger.games.filter(x=>x.year===2026&&x.stage==='regular');
const week=Math.max(...games.map(x=>x.week));
if(!Number.isInteger(week)||week<1||week>14)throw Error('Invalid completed season week');
for(let w=1;w<=week;w++)if(games.filter(g=>g.week===w).length!==5)throw Error('Incomplete canonical Week '+w);
const owners=Object.keys(data.teams),canonical=n=>n==='Tom'?'Thommy':n;
const team={},round=(n,d=2)=>+n.toFixed(d);
for(const name of owners){
 const scores=games.flatMap(g=>g.home===canonical(name)?[{score:g.homeScore,opp:g.awayScore}]:g.away===canonical(name)?[{score:g.awayScore,opp:g.homeScore}]:[]);
 if(scores.length!==week)throw Error('Incomplete manager '+name);
 const pf=round(scores.reduce((s,r)=>s+r.score,0)),pa=round(scores.reduce((s,r)=>s+r.opp,0));
 const wins=scores.filter(r=>r.score>r.opp).length,losses=scores.filter(r=>r.score<r.opp).length;
 const avg=pf/week,sd=Math.sqrt(scores.reduce((s,r)=>s+(r.score-avg)**2,0)/week);
 team[name]={...data.teams[name],w:wins,l:losses,pf,pa,mean:round(avg),sd:round(sd)};
}
const leagueMean=Object.values(team).reduce((s,t)=>s+t.mean,0)/owners.length;
for(const name of owners){const t=team[name];t.forecast_mean=round(.7*t.mean+.3*leagueMean);t.forecast_sd=round(Math.max(19,Math.min(38,t.sd)))}
for(const name of owners){
 let w=0,l=0;
 for(const weekNo of new Set(games.map(g=>g.week))){
  const scores=games.filter(g=>g.week===weekNo).flatMap(g=>[{name:g.home,score:g.homeScore},{name:g.away,score:g.awayScore}]);
  const own=scores.find(x=>x.name===canonical(name));
  if(!own)throw Error('All-play scoring missing '+name+' Week '+weekNo);
  for(const other of scores)if(other!==own){if(own.score>other.score)w++;else if(own.score<other.score)l++}
 }
 team[name].apw=w;team[name].apl=l;
}
const remaining=Object.entries(data.fixtures).filter(([w])=>+w>week).flatMap(([w,rows])=>rows.map(([a,b])=>({week:+w,a,b})));
if(remaining.length&&remaining.length!==(14-week)*5)throw Error('Missing future fixture');
let seed=20261100+week;
function rand(){seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}
function normal(){return Math.sqrt(-2*Math.log(Math.max(rand(),1e-12)))*Math.cos(2*Math.PI*rand())}
const iterations=25000,results=Object.fromEntries(owners.map(n=>[n,{p:0,b:0,total:0,wins:[],seeds:Array(10).fill(0)}]));
for(let i=0;i<iterations;i++){
 const teams=Object.fromEntries(owners.map(n=>[n,{w:team[n].w,pf:team[n].pf}]));
 for(const g of remaining){
  const a=Math.max(0,team[g.a].forecast_mean+normal()*team[g.a].forecast_sd);
  const b=Math.max(0,team[g.b].forecast_mean+normal()*team[g.b].forecast_sd);
  teams[g.a].pf+=a;teams[g.b].pf+=b;
  if(a>=b)teams[g.a].w++;else teams[g.b].w++;
 }
 const ranked=owners.slice().sort((a,b)=>teams[b].w-teams[a].w||teams[b].pf-teams[a].pf);
 ranked.forEach((n,index)=>{const r=results[n];r.p+=+(index<6);r.b+=+(index<2);r.total+=teams[n].w;r.wins.push(teams[n].w);r.seeds[index]++});
}
const scenario={};for(const n of owners){const r=results[n];r.wins.sort((a,b)=>a-b);scenario[n]={playoff_pct:round(100*r.p/iterations,1),top2_pct:round(100*r.b/iterations,1),projected_wins:round(r.total/iterations,1),median_wins:r.wins[12500],seed_mode:r.seeds.indexOf(Math.max(...r.seeds))+1}}
const strength={};for(const n of owners){const opponents=remaining.filter(g=>g.a===n||g.b===n).map(g=>team[g.a===n?g.b:g.a].forecast_mean);strength[n]=opponents.length?round(opponents.reduce((s,x)=>s+x,0)/opponents.length):null}
const latest=games.filter(g=>g.week===week).map(g=>({a:g.home==='Thommy'?'Tom':g.home,b:g.away==='Thommy'?'Tom':g.away,a_score:g.homeScore,b_score:g.awayScore,winner:g.winner}));
if(latest.length!==5)throw Error('Missing latest final results');
const generated={...data,version:'v9.'+(6+week),as_of:new Date().toISOString().slice(0,10),
 source:'Canonical final Sleeper matchups Weeks 1–'+week+'; remaining archived future pairings',
 verified_through_week:week,
 method:iterations.toLocaleString('en-US')+' seeded simulations; 70% actual scoring average + 30% league average, standard deviation bounded 19–38, wins and assumed PF tiebreaker. No player projections or injuries.',
 caution:'Six playoff teams, two byes confirmed; Week 14 regular-season endpoint and official tiebreaker are assumed. Simulated percentages are not provider odds or mathematical clinches.',
 teams:team,scenarios:{'6':scenario},remaining_schedule_strength:strength,latest_results:latest,
 week8_results:week===8?latest:data.week8_results,
 week8_previews:[],
 status_notes:{mathematical_clinches:[],mathematical_eliminations:[],note:'No clinch or elimination declared without verified official tiebreaker.'}
};
fs.writeFileSync(file,JSON.stringify(generated,null,2)+'\n');
console.log('PLAYOFF RACE REFRESH PASS: Week '+week+', '+games.length+' games, '+remaining.length+' future fixtures, '+iterations.toLocaleString('en-US')+' simulations');
