// Static season-edition guarantees. Browser gate separately checks layout and interaction.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const current=read('seasons/2026.html');
const source=JSON.parse(read('data/season_weekly_matchups_2016_2026_v1.json'));
const year=source.bySeason['2026'];
const games=year.games.filter(g=>g.stage==='regular');
const week=Math.max(...games.map(g=>g.week));
assert(Number.isInteger(week)&&week>0,'2026 week must come from canonical ledger');
assert.equal(games.length,5*week,'Five complete 2026 matchups per verified week');
assert.equal(games.filter(g=>g.week===week).length,5,'Five latest matches must exist');
assert.equal(year.standings.length,10,'All 10 managers require ledger standings');
assert.equal(year.complete,false,'Current season must not be presented as completed');
const currentRefs=['season-intro','season-status','latest-week','games-count','standings','latest-games','pulse-heading','season-pulse-grid'];
for(const id of currentRefs)assert(current.includes('id="'+id+'"'),'Current-season element missing: '+id);
for(const id of ['season-pulse','season-standings','season-latest','season-research'])
 assert(current.includes('id="'+id+'"'),'Current season navigation anchor missing: '+id);
assert(current.includes('season-editions-phase2.css'),'Missing shared stylesheet');
assert(current.includes("source.bySeason?.['2026']"),'2026 must use canonical ledger');
assert(current.includes("latest.flatMap(game=>"),'Season pulse must be derived from verified results');
assert(current.includes("regular.length!==week*5"),'Incomplete weekly data must be rejected');
assert(current.includes('record-holders.html'),'Current season must link to Record Book');
assert(current.includes('class="manager"><a href='),'Current standings should link to manager profiles');
for(let yr=2020;yr<=2025;yr++){
 const html=read('seasons/'+yr+'.html');
 assert(html.includes('class="season-page fellas-season-classic"'),'Missing completed-edition class '+yr);
 assert(html.includes('season-editions-phase2.css'),'Missing editorial CSS '+yr);
 assert(html.includes('championship-stories.html?year='+yr),'Missing season-specific story '+yr);
 assert(html.includes('./?year='+yr),'Missing return to selected season edition '+yr);
 assert(html.includes('<h1>'+yr+'</h1>'),'Missing canonical year heading '+yr);
 assert(html.includes('href="../managers/"'),'Missing manager index '+yr);
 assert(html.includes('href="../analytics/record-holders.html"'),'Missing records destination '+yr);
 assert(html.includes('verified-sleeper-placement-ui.mjs'),'Preserve postseason verification '+yr);
 assert(html.includes('Playoff Bracket'),'Preserve original playoff bracket '+yr);
}
const css=read('assets/season-editions-phase2.css');
assert(css.includes('@media(max-width:700px)'),'Mobile display must be handled');
assert(css.includes('prefers-reduced-motion'),'Respect reduced motion');
console.log('PASS: canonical 2026 scoreboard, derived weekly pulse and 2020–2025 verified editorial editions');
