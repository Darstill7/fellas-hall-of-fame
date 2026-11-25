import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('tuesday-hangover/2026-week-11.html','utf8');
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const race=JSON.parse(fs.readFileSync('data/playoff_race_v1.json','utf8'));
const games=ledger.games.filter(g=>g.year===2026&&g.week===11&&g.stage==='regular');
assert.equal(games.length,5);
const cards=[...html.matchAll(/<section class="game">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
assert.equal(cards.length,5);
for(const g of games){const winner=g.winner==='HOME'?g.home:g.away,loser=g.winner==='HOME'?g.away:g.home;
const win=g.winner==='HOME'?g.homeScore:g.awayScore,loss=g.winner==='HOME'?g.awayScore:g.homeScore;
const c=cards.find(c=>c.includes('<span>'+winner+'</span>')&&c.includes('<span>'+loser+'</span>'));assert.ok(c,winner+' matchup');assert.ok(c.includes(win.toFixed(2))&&c.includes(loss.toFixed(2)));assert.ok(c.includes('+'+(win-loss).toFixed(2)+' WIN'));assert.ok(c.includes('THE ROAST'));}
const season=ledger.games.filter(g=>g.year===2026&&g.stage==='regular'&&g.week<=11);
assert.equal(season.length,55);
const streaks={};
for(const n of new Set(season.flatMap(g=>[g.home,g.away]))){
 const rows=season.filter(g=>g.home===n||g.away===n).sort((a,b)=>a.week-b.week);
 assert.deepEqual(rows.map(g=>g.week),Array.from({length:11},(_,i)=>i+1),n+' complete season coverage');
 const results=rows.map(g=>{assert.ok(['HOME','AWAY'].includes(g.winner));return (g.home===n?g.winner==='HOME':g.winner==='AWAY')?'W':'L'});
 let count=0;for(let i=results.length-1;i>=0&&results[i]===results.at(-1);i--)count++;
 streaks[n]=results.at(-1)+count;
 const team=race.teams[n==='Thommy'?'Tom':n];
 assert.equal(results.filter(x=>x==='W').length,team.w,n+' wins');
 assert.equal(results.filter(x=>x==='L').length,team.l,n+' losses');
 assert.equal(Math.round(rows.reduce((s,g)=>s+(g.home===n?g.homeScore:g.awayScore),0)*100)/100,team.pf,n+' PF');
}
assert.equal(streaks.Stew,'W7');assert.ok(html.includes('seventh straight victory')&&html.includes('Seven straight wins after a 1–3 start'));assert.ok(!/fifth straight victory|Five straight wins/.test(html));
const ranked=games.flatMap(g=>[[g.home,g.homeScore],[g.away,g.awayScore]]).sort((a,b)=>b[1]-a[1]);
assert.equal(ranked[0][0],'Tony');assert.equal((ranked[0][1]-ranked[1][1]).toFixed(2),'0.04');assert.equal(ranked[6][0],'Stover');
const history=ledger.games.filter(g=>g.stage==='regular'&&(g.year<2026||g.year===2026&&g.week<=11));const pair={};
for(const g of history){if(!['HOME','AWAY'].includes(g.winner))continue;const key=g.winner==='HOME'?g.home+'|'+g.away:g.away+'|'+g.home;pair[key]=(pair[key]||0)+1;}
assert.equal(pair['Stilly|Thommy'],12);assert.equal(Math.max(...Object.values(pair)),12);
for(const [n,t] of Object.entries(race.teams)){const name=n==='Tom'?'Thommy':n;assert.ok(html.includes('<td>'+name+'</td><td>'+t.w+'–'+t.l+'</td><td class="streak '+(streaks[name][0]==='W'?'win':'loss')+'">'+streaks[name]+'</td><td>'+t.pf.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+'</td><td>'+race.scenarios['6'][n].playoff_pct+'%</td>'),name+' standings');}
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]));
assert.ok(!/writer accountability|published pick|editorial spread|sportsbook/i.test(html));
assert.ok(html.includes('og:image:type" content="image/jpeg"'));console.log('PASS: five canonical scores, margins, ten standings rows, distinct retrospective publication and navigation');
