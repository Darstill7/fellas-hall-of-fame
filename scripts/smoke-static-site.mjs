// Exercise the published GitHub Pages-style base path over real HTTP locally.
// Tests routing and static asset availability, not JavaScript rendering or mobile layout.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),base='/fellas-hall-of-fame/';
const type=p=>p.endsWith('.html')?'text/html':p.endsWith('.json')?'application/json':p.endsWith('.js')?'text/javascript':'application/octet-stream';
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith(base)){res.writeHead(404);res.end();return}
 let relative=decodeURIComponent(url.pathname.slice(base.length));
 if(!relative||relative.endsWith('/'))relative+='index.html';
 const file=path.resolve(root,relative);
 if(!(file.startsWith(root+path.sep))){res.writeHead(403);res.end();return}
 try{const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':type(file)});res.end(data)}
 catch{res.writeHead(404);res.end()}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const route=p=>'http://127.0.0.1:'+port+base+p;
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const files=['','managers/','seasons/','analytics/records.html','analytics/rivalries.html','analytics/rivalry-war-room.html',
 'data/unified_record_book_2016_2026.json','data/career_core_generated.json','data/season_guide.json',
 'data/manager_record_books_2016_2026.json','data/manager_legacy_resumes.json',
 'seasons/weekly-matchup-archive.html','managers/record-books.html','analytics/records-archive.html','analytics/legacy.html',
 ...slugs.flatMap(s=>['managers/'+s+'/','managers/'+s+'.html']),
 'assets/canonical-manager-record.js','assets/manager-h2h-explorer.js','assets/rivalry-archive-v3.js',
 'assets/manager-historical-records.js','assets/manager-trophy-cases.js','assets/manager-verified-season-endings.js','assets/espn-franchise-lineage.js'];
const rivalry=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
for(let i=0;i<rivalry.length;i++)for(let j=i+1;j<rivalry.length;j++)files.push('rivalries/'+rivalry[i]+'-vs-'+rivalry[j]+'.html');
let failures=[];
try{
 for(const relative of files){
  const response=await fetch(route(relative));if(!response.ok){failures.push(relative+' HTTP '+response.status);continue}
  if(relative.endsWith('.json'))try{await response.json()}catch{failures.push(relative+' invalid JSON')}
  if(relative.endsWith('.html')||relative===''||relative.endsWith('/')){
   const html=await response.text();
   const scripts=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(src=>!/^https?:|^\/\//.test(src));
   for(const src of scripts){
    const url=new URL(src,route(relative));const r=await fetch(url);
    if(!r.ok)failures.push(relative+' asset '+src+' HTTP '+r.status);
   }
  }
 }
}finally{server.close()}
if(failures.length){console.error(failures.join('\n'));process.exitCode=1}
else console.log('HTTP static-site smoke PASS: '+files.length+' routes, all manager and rivalry pages, referenced static assets, and canonical JSON files');
