// Stored source archive reconciliation. No fresh provider retrieval is implied.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read('data/unified_record_book_2016_2026.json');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>{assert(Number.isFinite(n));return Math.round(n*100);};
const key=(w,a,b)=>JSON.stringify([w,...[norm(a),norm(b)].sort()]);
const handle={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const owner=(y,h)=>{const k=h.toLowerCase();const n=y===2023&&k==='jmidd'?'Evans':handle[k];assert(n,'Unknown owner '+y+' '+h);return n;};
const report=[];
function reconcile(year,source,rows){
 const games=ledger.games.filter(g=>g.year===year&&g.stage==='regular'),index=new Map(games.map(g=>[key(g.week,g.home,g.away),g]));
 assert.equal(index.size,games.length,'Duplicate canonical matchups '+year);
 assert.equal(rows.length,games.length,'Source coverage '+year);
 const seen=new Set();
 for(const s of rows){const k=key(s.week,s.a,s.b),g=index.get(k);assert(g,'Missing '+year+' '+k);assert(!seen.has(k),'Duplicate source '+year+' '+k);seen.add(k);
 const home=norm(g.home)===norm(s.a);assert.equal(cents(g.homeScore),cents(home?s.sa:s.sb),year+' '+k+' home score');assert.equal(cents(g.awayScore),cents(home?s.sb:s.sa),year+' '+k+' away score');
 const winner=g.homeScore>g.awayScore?'HOME':g.homeScore<g.awayScore?'AWAY':'TIE';assert.equal(g.winner,winner,year+' '+k+' winner');assert.equal(cents(g.margin),Math.abs(cents(g.homeScore)-cents(g.awayScore)),year+' '+k+' margin');
 }
 assert.equal(seen.size,index.size);report.push({year,source,matched:seen.size});
}
const ep='data/espn_history_2016_2019.json';
for(const s of read(ep).seasons){const ids=new Map(s.teams.map(t=>[t.id,t.manager]));reconcile(s.year,ep,s.games.filter(g=>g.stage==='NONE').map(g=>({week:g.period,a:ids.get(g.home),b:ids.get(g.away),sa:g.hs,sb:g.as})));}
for(let y=2020;y<=2025;y++){const p='data/sleeper_matchups_'+y+'.json';reconcile(y,p,read(p).flatMap(w=>w.games.map(g=>({week:w.week,a:owner(y,g.home[0]),b:owner(y,g.away[0]),sa:g.home[2],sb:g.away[2]}))));}
assert.equal(report.length,10);assert.equal(report.reduce((s,r)=>s+r.matched,0),660);
// Source parity is not stage certification. These eight rows remain unchanged in the ledger.
const anomalies=ledger.games.filter(g=>[2020,2021].includes(g.year)&&g.week===14&&g.stage==='regular');
for(const year of [2020,2021]){
 assert.equal(anomalies.filter(g=>g.year===year).length,4,'Expected legacy Week 14 anomaly count '+year);
 assert.equal(ledger.games.filter(g=>g.year===year&&g.stage==='regular'&&g.week<=13).length,65,'Expected 13-week regular coverage '+year);
}
assert.equal(anomalies.length,8);
console.log(JSON.stringify({status:'stored-source-parity-not-stage-certification',completedSeasons:report,total:660,legacyRegularLabeledMatchups:660,knownPostseasonMislabels:8,archiveMatchupsExcludingKnownMislabels:652,stageCertification:'pending; four championship opening and four non-winners postseason fixtures; exact non-winners bracket classification unverified',activeSeason:'separate receipt reconciliation required'},null,2));
