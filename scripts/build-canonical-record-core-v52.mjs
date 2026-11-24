// First canonical record family. Recompute rather than copy archived leaders.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const normalize=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
export function buildCore(ledger,archive){
 assert.equal(ledger.duplicatesFound,0);
 const games=ledger.games.filter(g=>g.stage==='regular');
 const keys=new Set(),teams=new Map(),rows=[];
 for(const g of games){
  assert.ok(Number.isInteger(g.year)&&Number.isInteger(g.week)&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore));
  const home=normalize(g.home),away=normalize(g.away);
  assert.ok(home&&away&&home!==away);
  const key=[g.year,g.week,...[home,away].sort()].join(':');
  assert.ok(!keys.has(key),'Duplicate matchup '+key);keys.add(key);
  for(const [manager,opponent,points,against] of [[home,away,cents(g.homeScore),cents(g.awayScore)],[away,home,cents(g.awayScore),cents(g.homeScore)]]){
   const row={manager,opponent,points,against,year:g.year,week:g.week};
   rows.push(row);if(!teams.has(manager))teams.set(manager,[]);teams.get(manager).push(row);
  }
 }
 const throughWeek=Math.max(...games.filter(g=>g.year===2026).map(g=>g.week));
 assert.equal(archive.asOf,ledger.updated,'Canonical archive date mismatch');
 assert.match(archive.scope,new RegExp('2026 Week '+throughWeek+'(?:;|\\b)'));
 const career=[...teams].map(([manager,a])=>({manager,games:a.length,w:a.filter(x=>x.points>x.against).length,l:a.filter(x=>x.points<x.against).length,t:a.filter(x=>x.points===x.against).length,pf:a.reduce((s,x)=>s+x.points,0),pa:a.reduce((s,x)=>s+x.against,0),highLoss:a.filter(x=>x.points>=12000&&x.points<x.against).length}));
 for(const c of career){const m=archive.managers.find(x=>normalize(x.manager)===c.manager);assert.ok(m);for(const k of ['games','w','l','t'])assert.equal(c[k],m.regular[k],c.manager+' '+k);}
 assert.equal(career.length,archive.managers.length);
 const scope='Recovered paired regular-season games 2016–2026 Week '+throughWeek;
 const records=[];
 const add=(id,label,eligible,metric,direction='max',unit='pts',qualification='All recovered paired regular-season games')=>{
  assert.ok(eligible.length,id);const value=Math[direction](...eligible.map(metric));const winners=eligible.filter(x=>metric(x)===value);
  const holders=[...new Set(winners.map(x=>x.manager))].sort().map(manager=>({manager,evidence:winners.filter(x=>x.manager===manager)}));
  records.push({id,label,value:unit==='pts'?value/100:value,unit,scope,qualification,holders,shared:holders.length>1,source:'data/unified_record_book_2016_2026.json'});
 };
 const wins=rows.filter(r=>r.points>r.against),losses=rows.filter(r=>r.points<r.against);
 add('highest-score','Highest regular-season score',rows,r=>r.points);
 add('lowest-score','Lowest regular-season score',rows,r=>r.points,'min');
 add('highest-score-loss','Most points in a loss',losses,r=>r.points);
 add('lowest-score-win','Fewest points in a win',wins,r=>r.points,'min');
 add('biggest-win','Largest regular-season victory',wins,r=>r.points-r.against);
 add('narrowest-win','Closest regular-season victory',wins,r=>r.points-r.against,'min');
 add('biggest-defeat','Largest regular-season defeat',losses,r=>r.against-r.points);
 add('narrowest-defeat','Closest regular-season defeat',losses,r=>r.against-r.points,'min');
 add('giant-slayer-win','Highest opponent score overcome',wins,r=>r.against);
 add('most-wins','Career regular-season wins',career,r=>r.w,'max','wins');
 add('most-games','Most recorded regular-season games',career,r=>r.games,'max','games');
 add('career-points','Most regular-season points scored',career,r=>r.pf);
 add('points-against','Most regular-season points faced',career,r=>r.pa);
 add('high-score-losses','Most losses while scoring at least 120',career,r=>r.highLoss,'max','games');
 const rival=[];
 for(const [manager,a] of teams){const opponents=new Map();for(const r of a){if(!opponents.has(r.opponent))opponents.set(r.opponent,[]);opponents.get(r.opponent).push(r);}for(const [opponent,list] of opponents)rival.push({manager,opponent,games:list.length,wins:list.filter(r=>r.points>r.against).length});}
 add('rival-wins','Most regular-season wins against one opponent',rival,r=>r.wins,'max','wins');
 add('rival-games','Most regular-season meetings against one opponent',rival,r=>r.games,'max','games');
 assert.equal(new Set(records.map(r=>r.id)).size,records.length);
 return {schemaVersion:1,throughWeek,asOf:ledger.updated,regularGames:games.length,categoryCount:records.length,scope,status:'partial-core-not-complete-ownership',records};
}
const ledger=read('unified_record_book_2016_2026.json'),archive=read('manager_record_books_2016_2026.json');
const output=buildCore(ledger,archive);
const file='data-integrity/canonical-record-core-v52.json',body=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(file,'utf8'),body);else fs.writeFileSync(file,body);
console.log('Canonical record core: '+output.categoryCount+' definitions, '+output.regularGames+' games through Week '+output.throughWeek+'; partial inventory only.');
