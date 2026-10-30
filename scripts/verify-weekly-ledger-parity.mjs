import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const mirror=read('data/season_weekly_matchups_2016_2026_v1.json');
let games=0,years=0;
for(const year of mirror.seasonYears){
 const source=ledger.games.filter(g=>g.year===year);
 const target=mirror.bySeason[String(year)];
 if(!target||source.length!==target.games.length)throw Error(year+' archive shape differs');
 const key=g=>[g.week,g.stage,g.home,g.away].join('|');
 const lookup=new Map(target.games.map(g=>[key(g),g]));
 if(lookup.size!==target.games.length)throw Error(year+' duplicate mirror matchups');
 for(const game of source){
  const found=lookup.get(key(game));
  if(!found)throw Error(year+' absent game '+key(game));
  for(const field of ['homeScore','awayScore','winner','margin'])if(found[field]!==game[field])throw Error(year+' mismatch '+key(game)+' '+field+': '+found[field]+' vs '+game[field]);
  games++;
 }
 const rows=new Map();
 for(const g of source.filter(g=>g.stage==='regular'))for(const [manager,points,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
  const r=rows.get(manager)||{manager,w:0,l:0,t:0,pf:0,pa:0,games:0};
  r.games++;r.pf+=points;r.pa+=against;
  if(points>against)r.w++;else if(points<against)r.l++;else r.t++;
  rows.set(manager,r);
 }
 for(const [manager,r] of rows){
  const found=target.standings.find(x=>x.manager===manager);
  if(!found)throw Error(year+' missing standings '+manager);
  for(const field of ['w','l','t','games'])if(found[field]!==r[field])throw Error(year+' '+manager+' '+field+' mismatch');
  if(Math.abs(found.pf-Math.round(r.pf*100)/100)>.001||Math.abs(found.pa-Math.round(r.pa*100)/100)>.001)throw Error(year+' '+manager+' PF/PA mismatch');
 }
 years++;
}
console.log('CANONICAL MATCHUP MIRROR PARITY PASS: '+games+' games, '+years+' seasons');
