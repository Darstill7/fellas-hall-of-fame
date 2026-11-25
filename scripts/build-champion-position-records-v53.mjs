// Scope is title-winning teams only, not every playoff team or finalist.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const source=read('championship_player_boxscores_2020_2025_v1.json');
const ledger=read('unified_record_book_2016_2026.json');
const brackets=read('verified_sleeper_playoff_brackets_2020_2025.json').seasons;
const positions=['QB','RB','WR','TE','DEF'];
assert.equal(source.games.length,12);
const seen=new Set(),games=[];
for(const g of source.games){
 const manager=norm(g.champion),b=brackets.find(s=>s.year===g.year);
 assert.ok(b&&norm(b.champion)===manager);
 assert.ok(['semifinal','championship'].includes(g.round));
 const key=g.year+':'+g.round;assert.ok(!seen.has(key));seen.add(key);
 assert.equal(g.starters.length,9);
 assert.ok(g.starters.every(p=>p.name&&positions.includes(p.position)&&Number.isFinite(p.points)));
 assert.equal(g.starters.reduce((s,p)=>s+cents(p.points),0),cents(g.score));
 const opponents=(g.round==='championship'?b.finalists:b.semifinalists).map(norm);
 assert.ok(opponents.includes(manager));
 const match=ledger.games.filter(x=>x.year===g.year&&x.week===g.week&&x.stage!=='regular'&&[[x.home,x.homeScore,x.away,x.awayScore],[x.away,x.awayScore,x.home,x.homeScore]].some(([n,p,o,q])=>norm(n)===manager&&opponents.includes(norm(o))&&norm(o)!==manager&&cents(p)===cents(g.score)&&cents(q)===cents(g.opponentScore)));
 assert.equal(match.length,1,'Bracket score receipt '+key);
 assert.ok(g.score>g.opponentScore);
 games.push({...g,manager,starters:g.starters.map(p=>({...p,cents:cents(p.points)}))});
}
for(let y=2020;y<=2025;y++)for(const r of ['semifinal','championship'])assert.ok(seen.has(y+':'+r));
const records=[];
for(const pos of positions)for(const round of ['championship','semifinal']){
 const eligible=games.filter(g=>g.round===round);
 const individuals=eligible.flatMap(g=>g.starters.filter(p=>p.position===pos).map(p=>({...p,manager:g.manager,year:g.year,week:g.week})));
 const groups=eligible.map(g=>({manager:g.manager,year:g.year,week:g.week,cents:g.starters.filter(p=>p.position===pos).reduce((s,p)=>s+p.cents,0)}));
 for(const [kind,rows] of [['individual-starter',individuals],['position-group',groups]])for(const direction of ['max','min']){
  assert.ok(rows.length);
  const value=Math[direction](...rows.map(r=>r.cents)),evidence=rows.filter(r=>r.cents===value);
  records.push({id:'champion-'+round+'-'+pos.toLowerCase()+'-'+kind+'-'+direction,position:pos,round,kind,direction,value:value/100,unit:'pts',holders:[...new Set(evidence.map(r=>r.manager))].sort(),evidence,scope:'2020–2025 title-winning managers only; '+round+'; actual started NFL positions including FLEX'});
 }
}
assert.equal(records.length,40);
fs.writeFileSync('data-integrity/champion-position-records-v53.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',scope:source.scope,verifiedGames:games.length,categoryCount:records.length,records},null,2)+'\n');
console.log('Champion positional records: '+records.length+' candidates from '+games.length+' bracket-reconciled winner lineups.');
