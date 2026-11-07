// The Playoff Race must share the same completed-week boundary as canonical results.
import fs from 'node:fs';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=load('data/unified_record_book_2016_2026.json');
const race=load('data/playoff_race_v1.json');
const games=ledger.games.filter(g=>g.year===2026&&g.stage==='regular');
const week=Math.max(...games.map(g=>g.week));
if(week!==race.verified_through_week)throw Error('Playoff race stale: current Week '+week+' but forecast Week '+race.verified_through_week);
if(race.latest_results?.length!==5)throw Error('Missing latest five verified results');
const canonical=n=>n==='Tom'?'Thommy':n;
for(const [name,row] of Object.entries(race.teams)){
 const scores=games.flatMap(g=>g.home===canonical(name)?[{score:g.homeScore,opp:g.awayScore}]:g.away===canonical(name)?[{score:g.awayScore,opp:g.homeScore}]:[]);
 if(scores.length!==week)throw Error('Missing '+name+' regular games');
 const w=scores.filter(x=>x.score>x.opp).length,l=scores.filter(x=>x.score<x.opp).length;
 const pf=Math.round(scores.reduce((s,x)=>s+x.score,0)*100)/100;
 if(row.w!==w||row.l!==l||Math.abs(row.pf-pf)>.01)throw Error('Playoff race standings drift: '+name);
}
for(const g of race.latest_results){
 const owner=canonical(g.a),opponent=canonical(g.b);
 const found=games.find(x=>x.week===week&&x.home===owner&&x.away===opponent);
 if(!found||g.a_score!==found.homeScore||g.b_score!==found.awayScore)throw Error('Latest results do not match canonical ledger');
}
const page=fs.readFileSync('analytics/playoff-race.html','utf8');
for(const phrase of ['../data/playoff_race_v1.json','Standings & playoff picture','Remaining schedule','Latest completed results','not','provider odds']){
 if(!page.includes(phrase))throw Error('Missing current race content '+phrase);
}
for(const obsolete of ['Week 7 Archive','ARCHIVED OCTOBER 27, 2026','Week 7 forecast — not current']){
 if(page.includes(obsolete))throw Error('Public playoff race still uses a frozen Week 7 header');
}
if(!fs.readFileSync('scripts/apply-reviewed-sleeper-week.mjs','utf8').includes('rebuild-playoff-race.mjs'))
 throw Error('Approved weekly import does not rebuild playoff odds');
console.log('PLAYOFF RACE FRESHNESS PASS: Week '+week+', five confirmed results and '+Object.keys(race.teams).length+' manager projections');
