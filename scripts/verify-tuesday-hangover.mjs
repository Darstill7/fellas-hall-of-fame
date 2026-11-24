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
for(const [n,t] of Object.entries(race.teams)){const name=n==='Tom'?'Thommy':n;assert.ok(html.includes('<td>'+name+'</td><td>'+t.w+'–'+t.l+'</td><td>'+t.pf.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+'</td><td>'+race.scenarios['6'][n].playoff_pct+'%</td>'),name+' standings');}
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]));
assert.ok(!/writer accountability|published pick|editorial spread|sportsbook/i.test(html));
assert.ok(html.includes('og:image:type" content="image/jpeg"'));console.log('PASS: five canonical scores, margins, ten standings rows, distinct retrospective publication and navigation');
