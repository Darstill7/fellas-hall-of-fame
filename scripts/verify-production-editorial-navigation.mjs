// Production editorial quality: separate completed seasons from live-season cutoffs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const home=fs.readFileSync('index.html','utf8');
assert.ok(home.includes('2026 SportsCenter &amp; Playoff Race')&&
 home.includes('Both views now read the verified season ledger'),
 'Homepage must link to latest weekly SportsCenter and Playoff Race rather than frozen archives');
for(let year=2020;year<=2025;year++){
 const page=fs.readFileSync('seasons/'+year+'.html','utf8');
 assert.ok(page.includes('<h1>'+year+'</h1>')&&
  page.includes(year+' · Completed season')&&
  page.includes(year+' championship and final standings'),
  year+' completed season must be clearly identified');
 for(const old of ['Fellas OS v8','The Fellas OS v5','REVIEW BUILD',
  '2026 · Week 6 snapshot','Verified through 2026 W6','2026 Week 6 standings verified'])
  assert.ok(!page.includes(old),year+' contains obsolete internal or season-cutoff label: '+old);
 assert.ok(page.includes('<a href="../managers/">Managers</a>')&&
  page.includes('<a href="../seasons/">Seasons</a>'),
  year+' archive global navigation must lead to directories');
 assert.ok(page.includes('☰ Explore site')&&
  page.includes('<a href="../managers/">👤 Managers</a>')&&
  page.includes('<a href="../seasons/">📅 Seasons</a>')&&
  page.includes('<a href="../managers/"><span>♟</span>Managers</a>'),
  year+' mobile menu and dock must lead to manager/season directories');
 assert.ok(page.includes('id="verified-placements"'),
  year+' archive must preserve verified postseason results');
}
const year2025=fs.readFileSync('seasons/2025.html','utf8');
assert.ok(year2025.includes('Scott beat Tom 156.32–86.00'),
 'Verified 2025 championship outcome changed');
console.log('Production editorial navigation PASS: homepage archive and all six completed Sleeper seasons have consistent public labels.');
