import fs from 'node:fs';
const html=fs.readFileSync('analytics/playoff-race.html','utf8');
const required=['2026 Playoff Race — Week 7 Archive','ARCHIVED OCTOBER 27, 2026 · THROUGH WEEK 7','not current standings or live odds','Archived Week 7 forecast — not current','matchups in the archived forecast','"verified_through_week":7','"as_of":"2026-10-27"','official tiebreaker'];
for(const phrase of required)if(!html.includes(phrase))throw Error('Week 7 archive scope/caveat missing: '+phrase);
if(html.includes('Real upcoming matchups')||html.includes('Week 8 results verified'))throw Error('Archived playoff forecasts presented as current');
console.log('Playoff race page is identified as a Week 7 historical snapshot, not live odds.');
