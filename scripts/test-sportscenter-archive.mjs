import fs from 'node:fs';
const html=fs.readFileSync('analytics/sportscenter.html','utf8');
for(const phrase of ['2026 Season Highlights — Week 7 Archive','THE FELLAS · 2026 SEASON ARCHIVE','Archived after Week 7 · Not live','does not include later games or upcoming schedules','"last_completed_week":7','Power Board is a statistical comparison, not the official standings']){
 if(!html.includes(phrase))throw Error('SportsCenter archived scope/clarity missing: '+phrase);
}
if(html.includes('THE FELLAS OS · WEEKLY DESK')||html.includes('Verified packaged snapshot'))throw Error('SportsCenter still exposes internal build language');
console.log('SportsCenter presents the completed Week 7 data as an archive, not live standings.');
