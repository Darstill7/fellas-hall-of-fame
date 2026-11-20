// Keep embedded public career standings aligned with the independently verified
// manager portfolio, without rewriting archived highlight events or awards.
// Usage: node scripts/sync-records-career-fallbacks.mjs [--check]
import fs from 'node:fs';
const records=JSON.parse(fs.readFileSync('data/manager_record_books_2016_2026.json','utf8')).managers;
const byName=new Map(records.map(m=>[m.manager==='Thommy'?'Tom':m.manager,m]));
for(const filename of ['analytics/records.html','analytics/records-archive.html']){
 const html=fs.readFileSync(filename,'utf8');
 const re=/(<script id="(?:book-data|records-data)" type="application\/json">)([\s\S]*?)(<\/script>)/;
 const match=html.match(re);
 if(!match)throw Error('Missing records source embed: '+filename);
 const data=JSON.parse(match[2]),rows=data.career||data.career_records;
 if(!Array.isArray(rows)||rows.length!==records.length)throw Error('Unexpected career fallback array in '+filename);
 const seen=new Set();
 for(const row of rows){
  const name=row.manager,m=byName.get(name);
  if(!m||seen.has(name))throw Error('Unverified or duplicate manager '+name+' in '+filename);
  seen.add(name);
  const {w,l,t}=m.regular,total=w+l+t;
  row.w=w;row.l=l;row.t=t;row.pct=Number(((w+t*0.5)/total).toFixed(4));
  if(Array.isArray(row.annual))row.annual=m.annual.map(y=>({year:y.year,w:y.w,l:y.l,t:y.t}));
 }
 const expected=html.replace(re,(_,prefix,_contents,suffix)=>prefix+JSON.stringify(data)+suffix);
 if(process.argv.includes('--check')){
  if(expected!==html)throw Error(filename+' career fallback does not match approved manager portfolio');
 }else fs.writeFileSync(filename,expected);
}
console.log('Career records fallback '+(process.argv.includes('--check')?'PARITY PASS':'refreshed')+': '+records.length+' managers; historical highlights unmodified.');
