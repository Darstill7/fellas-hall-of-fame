// Production editorial quality: avoid mixing archived season identity with live years.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const home=fs.readFileSync('index.html','utf8');
const page=fs.readFileSync('seasons/2025.html','utf8');
assert.ok(home.includes('Historical feature · Week 7')&&
 home.includes('Both linked features are archived at Week 7'),
 'Homepage must distinguish the older SportsCenter archive from current standings');
assert.ok(page.includes('<h1>2025</h1>')&&
 page.includes('2025 · Completed season')&&
 page.includes('2025 championship and final standings'),
 '2025 completed season must be clearly identified');
for(const old of ['Fellas OS v8','The Fellas OS v5','REVIEW BUILD',
 '2026 · Week 6 snapshot','Verified through 2026 W6','2026 Week 6 standings verified'])
 assert.ok(!page.includes(old),'Obsolete internal or season-cutoff label: '+old);
assert.ok(page.includes('<a href="../managers/">Managers</a>')&&
 page.includes('<a href="../seasons/">Seasons</a>'),
 'Season archive global navigation must lead to directories');
assert.ok(page.includes('Scott beat Tom 156.32–86.00'),
 'Verified 2025 championship outcome changed');
console.log('Production editorial navigation PASS: current homepage and 2025 archive labeled without stale build metadata.');
