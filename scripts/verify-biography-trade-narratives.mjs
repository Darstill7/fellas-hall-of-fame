// Verify the published biography's concrete narrative trade examples against
// source-side transaction receipts. A receiving-side trade ID does not prove
// every additional FAAB component is known. No hindsight winner grades.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const bios=read('data/manager_biographies_awards.json').managers;
const sides=read('data/v9_trade_engine.json').sides;
const expected=[
 {manager:'Stilly',id:'1023059879336013824',date:'2023-10-26',received:['Mike Evans','Derrick Henry'],other:'Tony',otherReceived:['Cooper Kupp']},
 {manager:'Stilly',id:'1144362000575840256',date:'2024-09-24',received:['Terry McLaurin',"De'Von Achane",'Tank Dell'],other:'Tom',otherReceived:['Christian McCaffrey','Diontae Johnson','Tee Higgins']},
 {manager:'Stilly',id:'1146947320588861440',date:'2024-10-02',received:['Chase Brown'],other:'Tom',otherReceived:['Jordan Love']},
 {manager:'Stew',id:'896468742987522048',date:'2022-11-10',received:['Ja\'Marr Chase'],other:'Birch',otherReceived:['Cordarrelle Patterson','Jeff Wilson','Chase Claypool']},
 {manager:'Stew',id:'1012571602774532096',date:'2023-09-27',received:['CeeDee Lamb','Travis Etienne Jr.'],other:'Kuhl',otherReceived:['James Conner',"De'Von Achane",'Puka Nacua']},
 {manager:'Tony',id:'1023059879336013824',date:'2023-10-26',received:['Cooper Kupp'],other:'Stilly',otherReceived:['Mike Evans','Derrick Henry']},
 {manager:'Kuhl',id:'1012571602774532096',date:'2023-09-27',received:['James Conner',"De'Von Achane",'Puka Nacua'],other:'Stew',otherReceived:['CeeDee Lamb','Travis Etienne Jr.']},
 {manager:'JMid',id:'',date:'2024-09-17',received:['Calvin Ridley','Kyren Williams'],other:'Stew',otherReceived:['James Cook III']},
 {manager:'Stover',id:'',date:'2024-09-12',received:['Davante Adams'],other:'Stew',otherReceived:['Malik Nabers']}
];
const match=(row,e)=>row.date===e.date&&row.manager===e.manager&&e.received.every(p=>row.assets.includes(p));
for(const e of expected){
 const my=sides.find(s=>match(s,e));
 assert.ok(my,'Missing trade receipt for '+e.manager+' '+e.date);
 if(e.id)assert.equal(my.trade_id,e.id,'Unexpected trade ID '+e.manager+' '+e.date);
 const partner=sides.find(s=>s.trade_id===my.trade_id&&s.date===e.date&&s.manager===e.other);
 assert.ok(partner,'Counterparty absent: '+e.manager+'/'+e.other+'/'+e.date);
 assert.deepEqual(partner.assets,e.otherReceived,'Other receiving-side assets drifted '+e.date);
 assert.ok(String(my.confidence).startsWith('verified')&&String(partner.confidence).startsWith('verified'),'Unverified sources '+e.date);
 const biography=bios[e.manager]?.biography||'';
 const [year,month,day]=e.date.split('-');
 const dateString=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric'},{timeZone:'UTC'}).format(new Date(Date.UTC(+year,+month-1,+day)))+', '+year;
 assert.ok(biography.includes(dateString),'Date absent from biography: '+e.manager+' '+dateString);
 for(const player of [...e.received,...e.otherReceived]){
  // Every referenced player must be legible in narrative context. For rare
  // provider suffixes (James Cook III), a nickname without suffix is accepted.
  assert.ok(biography.includes(player)||player==='James Cook III'&&biography.includes('James Cook'),'Trade asset missing in narrative '+e.manager+' '+player);
 }
}
const vague=/\b(?:Chase Brown chapter|2023 reshuffling involving|historical transactions include Joe Mixon and James Robinson|recorded trade history involving Justin Jefferson and Ja.Marr Chase illustrates)\b/i;
for(const [manager,entry] of Object.entries(bios)){
 assert.ok(typeof entry.biography==='string'&&entry.biography.length>=300,'Biography missing for '+manager);
 assert.ok(!vague.test(entry.biography),'Context-free shorthand has returned for '+manager);
}
console.log('PASS: source-matched narrative trades and contextual biographies for ten active Fellas managers.');
