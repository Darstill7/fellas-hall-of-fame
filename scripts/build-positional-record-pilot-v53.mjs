// Positional research only: validate each starter sum against the canonical paired score.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync('data/'+p,'utf8'));
const norm=n=>n==='Tom'?'Thommy':n;
const owners={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',dillionpanthers15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const positions=['QB','RB','WR','TE','DEF'];
const cents=n=>Math.round(n*100);
const ledger=read('unified_record_book_2016_2026.json');
const paired=new Map();
for(const g of ledger.games.filter(g=>g.stage==='regular'&&g.year>=2020)){
 for(const [name,score] of [[g.home,g.homeScore],[g.away,g.awayScore]]){
  const key=[g.year,g.week,norm(name)].join(':');assert.ok(!paired.has(key),key);paired.set(key,cents(score));
 }
}
const accepted=[],excluded=[],seen=new Set(),coverage=[];
for(let year=2020;year<=2026;year++){
 const data=read('player_starts_'+year+'.json');assert.equal(data.year,year);
 for(const w of data.weeks)for(const t of w.teams){
  const owner=String(t.owner).toLowerCase();
  const manager=year===2023&&owner==='jmidd'?'Evans':owners[owner];
  const key=[year,w.week,manager].join(':');
  assert.ok(manager,'Unknown owner '+t.owner);assert.ok(!seen.has(key),'Duplicate '+key);seen.add(key);
  const reason=!paired.has(key)?'No paired regular-season score':t.players.length!==9?'Incomplete starter list':new Set(t.players.map(p=>p[0])).size!==9?'Duplicate starter ID':t.players.some(p=>!p[0]||!positions.includes(p[2])||!Number.isFinite(p[3]))?'Unknown position or score':t.players.reduce((s,p)=>s+cents(p[3]),0)!==paired.get(key)?'Starter sum differs from canonical score':null;
  if(reason){excluded.push({year,week:w.week,manager,reason});continue;}
  const counts=Object.fromEntries(positions.map(p=>[p,t.players.filter(x=>x[2]===p).length]));
  if(counts.QB!==1||counts.DEF!==1||counts.RB<2||counts.WR<2||counts.TE<1){excluded.push({year,week:w.week,manager,reason:'Starter positions do not meet known lineup structure'});continue;}
  accepted.push({year,week:w.week,manager,players:t.players.map(([id,name,position,points])=>({id,name,position,cents:cents(points)}))});
 }
 coverage.push({year,sourceWeeks:data.weeks.map(w=>w.week),pairedTeamWeeks:[...paired.keys()].filter(k=>k.startsWith(year+':')).length,accepted:accepted.filter(x=>x.year===year).length});
}
const records=[];
for(const pos of positions){
 const starts=accepted.flatMap(t=>t.players.filter(p=>p.position===pos).map(p=>({...p,manager:t.manager,year:t.year,week:t.week})));
 const groups=accepted.map(t=>({manager:t.manager,year:t.year,week:t.week,cents:t.players.filter(p=>p.position===pos).reduce((s,p)=>s+p.cents,0)}));
 for(const [kind,rows] of [['individual-starter',starts],['position-group',groups]])for(const dir of ['max','min']){
  assert.ok(rows.length);const value=Math[dir](...rows.map(r=>r.cents));const evidence=rows.filter(r=>r.cents===value);
  records.push({id:pos.toLowerCase()+'-'+kind+'-'+dir,position:pos,kind,direction:dir,value:value/100,unit:'pts',holders:[...new Set(evidence.map(r=>r.manager))].sort(),evidence});
 }
}
const missing=[...paired.keys()].filter(k=>!seen.has(k));
const output={schemaVersion:1,status:'research-only-incomplete-coverage',scope:'Recovered and score-reconciled Sleeper regular-season starters; position groups include actual NFL positions started in FLEX; no kicker slot; exclude missing, incomplete or mismatched team-weeks',coverage,acceptedTeamWeeks:accepted.length,excludedTeamWeeks:excluded.length,missingPairedTeamWeeks:missing,excluded,categoryCount:records.length,records};
fs.writeFileSync('data-integrity/positional-record-pilot-v53.json',JSON.stringify(output,null,2)+'\n');
console.log('Positional research: '+records.length+' candidates; '+accepted.length+' accepted team-weeks, '+excluded.length+' excluded, '+missing.length+' missing paired team-weeks. Not certified all-era records.');
