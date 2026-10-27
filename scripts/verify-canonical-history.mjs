import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const canonical=json('data/manager_record_books_2016_2026.json').managers;
const seasons=json('data/season_weekly_matchups_2016_2026_v1.json');
const league=json('data/league.json');
const ids={stilly:'Stilly',stew:'Stew',tom:'Thommy',stover:'Stover',birch:'Birch',tony:'Tony',mitch:'Mitch',kuhl:'Kuhl',jmid:'JMid',scott:'Scott'};
const problems=[];
const check=(ok,message)=>{if(!ok)problems.push(message)};
const name=id=>id==='Thommy'?'Tom':id;
for(const [slug,id] of Object.entries(ids)){
 const m=canonical.find(x=>x.manager===id);
 check(!!m,'Missing canonical manager '+id);
 if(!m)continue;
 const expected=[m.regular.w,m.regular.l,...(m.regular.t?[m.regular.t]:[])].join('–');
 const page=read('managers/'+slug+'/index.html');
 const detailed=read('managers/'+slug+'.html');
 check(page.includes('<strong>'+expected+'</strong><small>All-time regular-season W–L'),id+' directory page record differs from '+expected);
 check(page.includes('data-manager-weekly-log="'+id+'"'),id+' directory page lacks unified weekly log');
 check(detailed.includes('data-manager-weekly-log="'+id+'"'),id+' detailed profile lacks unified weekly log');
 const lm=league.managers[name(id)];
 check(lm?.record===expected,id+' shared league.json differs from '+expected+'; got '+lm?.record);
 const annual=seasons.managerAnnual[id]||[];
 let w=0,l=0,t=0,games=0;
 for(const s of annual){w+=s.w;l+=s.l;t+=s.t;games+=s.games}
 check(w===m.regular.w&&l===m.regular.l&&t===m.regular.t&&games===m.regular.games,id+' annual totals do not sum to canonical record');
 for(const a of m.annual){const s=annual.find(x=>x.year===a.year);check(!!s&&s.w===a.w&&s.l===a.l&&s.t===a.t,id+' '+a.year+' annual record drift')}
}
const extract=p=>{const match=read(p).match(/<script id="(?:records-data|book-data)" type="application\/json">([\s\S]*?)<\/script>/);return match?JSON.parse(match[1]):null};
for(const p of ['analytics/records.html','analytics/records-archive.html']){
 const d=extract(p);check(!!d,p+' missing embedded fallback');
 for(const id of Object.values(ids)){
  const m=canonical.find(x=>x.manager===id);
  const x=(d?.career||d?.career_records||[]).find(x=>x.manager===name(id));
  check(!!x&&x.w===m.regular.w&&x.l===m.regular.l,p+' has stale career record for '+id);
 }
}
const games=seasons.seasonYears.reduce((sum,y)=>sum+seasons.bySeason[y].games.length,0);
check(games===799,'Unexpected archived game count: '+games);
if(problems.length){console.error('Canonical Fellas data audit FAILED:');problems.forEach(p=>console.error(' - '+p));process.exit(1)}
console.log('Canonical Fellas data audit PASS: 10 manager profiles (both URLs), 10 shared careers, annual totals and primary records boards consistent through 2026 Week 7.');
