import fs from 'node:fs';
const current=fs.readFileSync('analytics/sportscenter.html','utf8');
const archived=fs.readFileSync('analytics/sportscenter-week7-archive.html','utf8');
for(const phrase of ['data/season_weekly_matchups_2016_2026_v1.json','recap-title','Latest final scoreboard','recap-highlights','sportscenter-week7-archive.html']){
 if(!current.includes(phrase))throw Error('Current SportsCenter missing weekly data view '+phrase);
}
for(const old of ['2026 Season Highlights — Week 7 Archive','Archived after Week 7 · Not live']){
 if(current.includes(old))throw Error('SportsCenter current page is mislabeled as a Week 7 archive');
}
for(const phrase of ['Week 7 Archive','Archived after Week 7 · Not live','Historical snapshot']){
 if(!archived.includes(phrase))throw Error('SportsCenter historical Week 7 archive lost clear labeling');
}
console.log('SPORTSCENTER CURRENT-WEEK TEST PASS: verified matchup-driven digest and separate historical Week 7 archive.');
