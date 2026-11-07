// Verify current season page is driven by the completed-week ledger,
// while the original Week 7 frozen snapshot remains historically labeled.
import fs from 'node:fs';
const page=fs.readFileSync('seasons/2026.html','utf8');
const old=fs.readFileSync('seasons/2026-week7-archive.html','utf8');
for(const phrase of ['data/season_weekly_matchups_2016_2026_v1.json','2026 standings','latest-week','games-count','latest-games','playoff-race.html','2026-week7-archive.html']){
 if(!page.includes(phrase))throw Error('Current season missing data or navigation: '+phrase);
}
for(const obsolete of ['Archived Week 7','Standings after Week 7','Historical standings','Later results are not included in this snapshot.']){
 if(page.includes(obsolete))throw Error('Current 2026 season falsely presented as a frozen archive: '+obsolete);
}
for(const phrase of ['Archived Week 7','Week 7','not current results']){
 if(!old.includes(phrase))throw Error('Preserved Week 7 archive lost historical label: '+phrase);
}
const mirror=JSON.parse(fs.readFileSync('data/season_weekly_matchups_2016_2026_v1.json','utf8'));
const source=mirror.bySeason['2026'];
const week=Math.max(...source.games.filter(g=>g.stage==='regular').map(g=>g.week));
if(source.standings.length!==10||source.games.filter(g=>g.week===week&&g.stage==='regular').length!==5)throw Error('Current season mirror not complete');
console.log('CURRENT SEASON FRESHNESS PASS: dynamic ledger plus preserved historical Week 7 snapshot; current Week '+week);
