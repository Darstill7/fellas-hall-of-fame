// Completed Sleeper seasons: provider-recovered numbered transaction windows.
// Activity is not managerial skill or evidence of uninterrupted ownership.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const owners={darstill:'Stilly',birchhh:'Birch',evansbrandonm:'Evans',yogurtslinger15:'Stover',dillionpanthers15:'Stover',thommy:'Thommy',ckuhl5:'Kuhl',dsylvester9:'Stew',huppdawg80:'Mitch',koble2323:'Koble',tsteg:'Tony',jmidd:'JMid',sheffla:'Scott'};
const scope='Provider-recovered completed Sleeper seasons 2020–2025, numbered transaction windows 1–18';
const src='data-integrity/provider-recovered-transactions-{year}-week{week}.json';
const records=[],seasons=[],weekly=[],allAdds=[],allEvents=[],seen=new Set(),coverage=[];
const add=(id,label,rows,key,dir,unit,qualification)=>{
 assert.ok(rows.length,id);assert.ok(rows.every(x=>Number.isFinite(x[key])),id);
 const mark=Math[dir](...rows.map(x=>x[key])),evidence=rows.filter(x=>x[key]===mark);
 records.push({id,label,value:mark,unit,scope,qualification,source:src,holders:[...new Set(evidence.map(x=>x.manager))].sort().map(manager=>({manager,evidence:evidence.filter(x=>x.manager===manager)}))});
};
for(let year=2020;year<=2025;year++){
 const roster=new Map();
 for(const w of read('data/player_starts_'+year+'.json').weeks)for(const t of w.teams){
  const handle=String(t.owner).toLowerCase(),manager=year===2023&&handle==='jmidd'?'Evans':owners[handle],id=String(t.roster);
  assert.ok(manager,'Unresolved season-local owner');if(roster.has(id))assert.equal(roster.get(id),manager);else roster.set(id,manager);
 }
 assert.equal(roster.size,10);assert.equal(new Set(roster.values()).size,10);
 const groups=new Map([...roster.values()].map(manager=>[manager,{manager,year,events:0,adds:0,drops:0,freeAgents:0,trades:0,tradePartners:new Set(),distinctPlayers:new Set(),activeWeeks:new Set(),eventIds:[]}]));
 let count=0;
 for(let week=1;week<=18;week++){
  const d=read('data-integrity/provider-recovered-transactions-'+year+'-week'+week+'.json');
  assert.equal(d.year,year);assert.equal(d.week,week);assert.ok(Array.isArray(d.transactions));assert.equal(d.normalizedRows,d.transactions.length);
  const weekRows=new Map([...roster.values()].map(manager=>[manager,{manager,year,week,events:0,adds:0,drops:0,eventIds:[]}]));
  for(const t of d.transactions){
   if(t.status!=='complete'||!['waiver','add','free_agent','trade'].includes(t.type))continue;
   const id=year+':'+t.transactionId;
   // Some provider windows repeat the same event. Never count it twice.
   if(seen.has(id))continue;seen.add(id);count++;
   const ids=[...new Set(t.teamIds.map(String))];assert.ok(ids.length);
   const managers=ids.map(id=>roster.get(id));assert.ok(managers.every(Boolean),'Unknown participant '+id);
   const isTrade=t.type==='trade';
   if(!isTrade)assert.equal(managers.length,1,'Nontrade receipt must identify one owner '+id);
   for(const manager of managers){
    const s=groups.get(manager),w=weekRows.get(manager);s.events++;w.events++;s.eventIds.push(id);w.eventIds.push(id);s.activeWeeks.add(week);
    if(isTrade){s.trades++;for(const other of managers.filter(x=>x!==manager))s.tradePartners.add(other);}
    else {
     const added=[...new Set((t.added??[]).map(x=>String(x.id)))],dropped=[...new Set((t.dropped??[]).map(x=>String(x.id)))];
     s.adds+=added.length;s.drops+=dropped.length;w.adds+=added.length;w.drops+=dropped.length;
     if(t.type!=='waiver')s.freeAgents+=added.length;
     for(const playerId of added){s.distinctPlayers.add(playerId);allAdds.push({manager,year,week,playerId,event:id});}
    }
    allEvents.push({manager,year,week,event:id,type:t.type});
   }
  }
  weekly.push(...weekRows.values());
 }
 coverage.push({year,windows:18,uniqueCompletedEvents:count});
 for(const s of groups.values())seasons.push({...s,distinctPlayers:s.distinctPlayers.size,tradePartners:s.tradePartners.size,activeWeeks:s.activeWeeks.size,reacquisitions:s.adds-s.distinctPlayers.size});
}
assert.equal(seasons.length,60);
const qualification='Distinct completed provider transaction IDs; failed claims excluded; a multi-team trade counts once per participating manager; adds/drops exclude trade transfers';
for(const [key,label,unit] of [['events','completed transaction participations','transactions'],['adds','nontrade player additions','players'],['drops','nontrade player drops','players'],['freeAgents','free-agent player additions','players'],['trades','completed trade participations','trades'],['distinctPlayers','distinct nontrade player acquisitions','players'],['activeWeeks','active transaction weeks','weeks'],['reacquisitions','repeat nontrade player acquisitions','players']]){
 for(const dir of ['max','min'])add('transaction-season-'+key+'-'+dir,(dir==='max'?'Most':'Fewest')+' '+label+' in one completed season',seasons,key,dir,unit,qualification);
}
for(const [key,label,unit] of [['events','completed transaction participations','transactions'],['adds','nontrade player additions','players'],['drops','nontrade player drops','players']])add('transaction-week-'+key+'-max','Most '+label+' in one provider week',weekly,key,'max',unit,qualification);
add('transaction-season-partners-max','Most different trading partners in one completed season',seasons,'tradePartners','max','managers',qualification);
const careers=new Map();
for(const s of seasons){if(!careers.has(s.manager))careers.set(s.manager,[]);careers.get(s.manager).push(s);}
const career=[...careers].map(([manager,a])=>({manager,seasons:a.length,events:a.reduce((s,x)=>s+x.events,0),adds:a.reduce((s,x)=>s+x.adds,0),drops:a.reduce((s,x)=>s+x.drops,0),trades:a.reduce((s,x)=>s+x.trades,0)}));
for(const [key,label,unit] of [['events','completed transaction participations','transactions'],['adds','nontrade player additions','players'],['drops','nontrade player drops','players'],['trades','completed trade participations','trades']])add('transaction-career-'+key+'-max','Most career observed '+label,career,key,'max',unit,qualification+'; unequal career lengths');
assert.equal(new Set(records.map(x=>x.id)).size,records.length);
fs.writeFileSync('data-integrity/transaction-records-v54.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates',scope,coverage,categoryCount:records.length,records},null,2)+'\n');
console.log('Transaction records: '+records.length+' candidates across '+seen.size+' unique completed provider transactions and '+seasons.length+' manager-seasons.');
