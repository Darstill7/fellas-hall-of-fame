import fs from 'node:fs';
const html=fs.readFileSync('seasons/2026.html','utf8');
for(const phrase of ['2026 · Archived Week 7','Standings after Week 7','not current results','Historical standings','<div class="metric">W7</div>','Later results are not included in this snapshot.','href="../managers/"']){
 if(!html.includes(phrase))throw Error('2026 archived season scope/navigation missing: '+phrase);
}
for(const obsolete of ['REVIEW BUILD','static-first pre-publish build','Fellas OS v8','<div class="metric">W6</div>','href="../managers/stilly.html"','data-integrity/audit.html','data-integrity/replay-booth.html','<i class="live-dot"></i>']){
 if(html.includes(obsolete))throw Error('2026 season archive still exposes stale or developer-facing label: '+obsolete);
}
const rowCount=(html.match(/<td class="rank">\d+<\/td>/g)||[]).length;
if(rowCount!==10)throw Error('2026 Week 7 standings must retain 10 manager rows; found '+rowCount);
console.log('2026 archived season labels and ten-team standings preserved.');
