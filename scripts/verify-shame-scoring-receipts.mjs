import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('hall/shame.html','utf8');
const ledger=JSON.parse(fs.readFileSync('data/unified_record_book_2016_2026.json','utf8'));
const stories=JSON.parse(fs.readFileSync('data/championship_season_stories_2016_2025_v1.json','utf8'));
const game=ledger.games.find(g=>g.year===2026&&g.week===2&&g.stage==='regular'&&
 [g.home,g.away].includes('Scott')&&[g.home,g.away].includes('Tony'));
assert(game,'2026 Week 2 Scott vs Tony must be in canonical ledger');
const scored=name=>name===game.home?game.homeScore:game.awayScore;
assert.equal(scored('Scott'),46.38);
assert.equal(scored('Tony'),84.32);
assert.equal(game.margin,37.94);
for(const phrase of ['Scott · 2026','46.38 against Tony’s 84.32','37.94-point defeat','href="../seasons/2026.html"'])
 assert(html.includes(phrase),'Missing independently confirmed Scott Week 2 receipt: '+phrase);
const last=ledger.games.find(g=>g.year===2022&&g.week===17&&[g.home,g.away].includes('Stew')&&[g.home,g.away].includes('Stover'));
assert(last,'2022 title final archived team scoreboard missing');
const score=name=>name===last.home?last.homeScore:last.awayScore;
assert.equal(score('Stew'),48.16);
assert.equal(score('Stover'),99.22);
const story=stories.seasons.find(s=>s.year===2022);
assert(story?.sections.some(s=>s.text.includes('Buffalo–Cincinnati')&&s.text.includes('canceled')&&s.text.includes('48.16')),
 '2022 championship caveat not backed by published evidence');
for(const phrase of ['Stew · 2022','99.22–48.16','Buffalo–Cincinnati','game was canceled','href="championship-stories.html?year=2022"'])
 assert(html.includes(phrase),'Missing source-backed 2022 final caveat: '+phrase);
assert.equal((html.match(/class="card shame-card"/g)||[]).length,11,'Keep existing 11 Shame cards');
console.log('PASS: Scott Week 2 matchup and 2022 cancelled-game championship context match independent canonical receipts; 11 original Shame cards preserved.');
