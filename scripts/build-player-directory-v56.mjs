import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>JSON.parse(fs.readFileSync('data-integrity/'+n+'.json','utf8'));
const base=read('player-hall-of-fame-v56'),history=read('player-transaction-history-v56'),champ=read('player-championship-records-v56');
const byId=new Map(history.players.map(p=>[p.id,p]));
assert.equal(byId.size,base.playerCount);
const records=[...base.records,...champ.records,...history.records];
const players=base.players.map(p=>{
 const h=byId.get(p.id);assert.ok(h);
 return {...p,draft:h.draft,transactions:h.transactions,records:records.filter(r=>r.holders.some(x=>x.playerId===p.id)).map(r=>({id:r.id,label:r.label,value:r.value,unit:r.unit,scope:r.scope,qualification:r.qualification,shared:r.holders.length>1}))};
});
const dir='data-integrity/player-directory-preview';
fs.mkdirSync(dir,{recursive:true});
for(const p of players){assert.match(p.id,/^[A-Za-z0-9_-]+$/);fs.writeFileSync(dir+'/'+p.id+'.json',JSON.stringify(p)+'\n');}
const summary=players.map(({id,name,position,aliases,pointsCents,starts,managerCount,seasonCount})=>({id,name,position,aliases,pointsCents,starts,managerCount,seasonCount}));
fs.writeFileSync(dir+'/index.json',JSON.stringify({schemaVersion:1,status:'research-preview',coverage:base.coverage,players:summary})+'\n');
assert.equal(new Set(summary.map(p=>p.id)).size,summary.length);
console.log('Player directory: '+players.length+' individual profile files; '+records.length+' candidate player record categories.');
