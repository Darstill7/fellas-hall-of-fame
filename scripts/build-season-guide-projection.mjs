// Compatible season-guide projection from verified full-era regular-season inputs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const stats=read(root+'full-era-career-statistics.json');
const legacy=read('data/season_guide.json');
const ledgers=[...read('data-integrity/frozen-regular-matchups-2016-2019-v1.json').seasons,...read('data-integrity/frozen-regular-matchups-2020-2025-v1.json').seasons,read(root+'live-completed-regular-2026.json')];
const placements=read('data/fellas_final_placements_2016_2025_verified.json');
const norm=n=>n==='Tom'?'Thommy':n==='EvansBrandon'?'Evans':n;
const output={},changes=[];
for(const s of stats.seasons){
 const year=s.year,source=ledgers.find(x=>x.year===year),current=year===2026;
 const champion=current?null:norm(placements.seasons.find(x=>x.year===year).champion);
 assert.equal(champion,legacy[year].champion,'Preserve verified champion '+year);
 const standings=Object.entries(s.managers).map(([name,r])=>({name,w:r.w,l:r.l,t:r.t,pf:r.pf_cents/100,pa:r.pa_cents/100,games:r.games})).sort((a,b)=>(b.w+b.t/2)/b.games-(a.w+a.t/2)/a.games||b.pf-a.pf||a.name.localeCompare(b.name));
 const games=source.games.length;
 assert.equal(standings.reduce((n,r)=>n+r.games,0),games*2);
 assert(standings.every(r=>r.games===s.regular_weeks));
 const scored=source.games.flatMap(g=>[[g.home,g.away,g.home_cents,g.away_cents],[g.away,g.home,g.away_cents,g.home_cents]].map(([team,opponent,pf,pa])=>({year,week:g.week,team,opponent,points:pf/100,margin:(pf-pa)/100,phase:'Regular'})));
 const wins=scored.filter(x=>x.margin>0),stable=(a,b)=>a.week-b.week||a.team.localeCompare(b.team);
 const leader=standings[0],record=leader.w+'–'+leader.l+(leader.t?'–'+leader.t:'');
 output[year]={year,champion,standings,coverage:year+' verified regular-season results; '+games+' games. Reconstructed standings, not official tiebreaker seed order.'+(current?' 2026 currently through Week '+s.regular_weeks+'.':''),games,summary:current?year+' season results are verified through Week '+s.regular_weeks+'. '+leader.name+' leads the reconstructed standings at '+record+'; the championship is not yet decided.':year+' reconstructed regular-season leader: '+leader.name+' ('+record+'). '+champion+' won the championship. Scores and regular-season records come from reconciled ESPN/Sleeper matchups; postseason outcomes are separate.',seasonHigh:scored.slice().sort((a,b)=>b.points-a.points||stable(a,b))[0]??null,biggestWin:wins.slice().sort((a,b)=>b.margin-a.margin||stable(a,b))[0]??null,closestWin:wins.slice().sort((a,b)=>a.margin-b.margin||stable(a,b))[0]??null};
 for(const w of s.weekly)for(const g of source.games.filter(g=>g.week===w.week)){assert.equal(w.scores[g.home],g.home_cents);assert.equal(w.scores[g.away],g.away_cents);}
 changes.push({year,before_games:legacy[year].games,after_games:games,changed_managers:standings.filter(r=>{const old=legacy[year].standings.find(x=>x.name===r.name);return !old||['w','l','t','pf','pa','games'].some(k=>old[k]!==r[k]);}).map(r=>r.name)});
}
assert.equal(Object.values(output).reduce((n,s)=>n+s.games,0),652+5*stats.live_watermark.completed_regular_week);
assert.equal(output[2020].games,65);assert.equal(output[2021].games,65);
fs.writeFileSync(root+'season-guide-preview.json',JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(root+'season-guide-migration-audit.json',JSON.stringify({status:'RESEARCH_ONLY',completedThrough:{year:2026,week:stats.live_watermark.completed_regular_week},changes},null,2)+'\n');
console.log('SEASON GUIDE PROJECTION PASS '+JSON.stringify({years:Object.keys(output).length,changes}));
