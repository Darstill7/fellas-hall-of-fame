import fs from 'node:fs';
const guide=JSON.parse(fs.readFileSync('data/season_guide.json','utf8'));
for(let year=2020;year<=2025;year++){
 const path='seasons/'+year+'.html',html=fs.readFileSync(path,'utf8');
 const expected=(guide[year]?.champion==='Thommy'?'Tom':guide[year]?.champion);
 if(!expected||!html.includes('<div class="label">Champion</div><div class="metric">'+expected+'</div>'))throw Error('Championship hero disagrees with canonical guide: '+year);
 if(!html.includes(year+' · Completed season')||!html.includes(year+' archive')||!html.includes('The Fellas · '+year+' season archive.'))throw Error('Completed season must show its own historical year: '+year);
 if(/REVIEW BUILD|static-first pre-publish|Fellas OS v8|2026 · Week 6 snapshot|data-integrity\/audit.html|data-integrity\/replay-booth.html/.test(html))throw Error('Developer or unrelated live labels remain: '+year);
 if(html.includes('href="../managers/stilly.html"')||!html.includes('href="../managers/"'))throw Error('Historical season Managers link does not go to the directory: '+year);
 const rows=(html.match(/<td class="rank">\d+<\/td>/g)||[]).length;
 if(rows!==10)throw Error('Historical season standings changed: '+year+' '+rows);
}
console.log('Six completed Sleeper seasons have correct champions, 10-team standings and launch-ready archive navigation.');
