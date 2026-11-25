// Champion-side player performances only; identity links require an unambiguous name/position match to stable Sleeper IDs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const index=read('data-integrity/player-hall-of-fame-v56.json');
const boxes=read('data/championship_player_boxscores_2020_2025_v1.json').games;
const ledger=read('data/unified_record_book_2016_2026.json');
const norm=n=>n==='Tom'?'Thommy':n;
const cents=n=>Math.round(n*100);
const names=new Map();
for(const p of index.players)for(const alias of p.aliases)for(const pos of p.positions){
 const k=alias.toLowerCase().trim()+'|'+pos;
 if(!names.has(k))names.set(k,new Set());names.get(k).add(p.id);
}
const rows=[],unlinked=[],seen=new Set();
for(const g of boxes){
 const key=g.year+':'+g.round;assert.ok(!seen.has(key));seen.add(key);
 assert.equal(g.starters.length,9);
 assert.equal(g.starters.reduce((s,p)=>s+cents(p.points),0),cents(g.score));
 assert.ok(g.score>g.opponentScore);
 const matches=ledger.games.filter(x=>x.year===g.year&&x.week===g.week&&x.stage!=='regular'&&[[x.home,x.homeScore,x.awayScore],[x.away,x.awayScore,x.homeScore]].some(([m,p,o])=>norm(m)===norm(g.champion)&&cents(p)===cents(g.score)&&cents(o)===cents(g.opponentScore)));
 assert.equal(matches.length,1,key);
 for(const p of g.starters){
  const candidates=names.get(p.name.toLowerCase().trim()+'|'+p.position);
  const id=candidates?.size===1?[...candidates][0]:null;
  const row={id,name:p.name,position:p.position,manager:norm(g.champion),year:g.year,week:g.week,round:g.round,cents:cents(p.points),margin:cents(g.score)-cents(g.opponentScore)};
  if(!id)unlinked.push(row);
  rows.push(row);
 }
}
assert.equal(rows.length,108);
const eligible=rows.filter(r=>r.id!==null),records=[];
const group=(a,key)=>{const m=new Map();for(const r of a){const k=key(r);if(!m.has(k))m.set(k,[]);m.get(k).push(r);}return [...m.values()].map(v=>({id:v[0].id,name:v[0].name,manager:v.every(r=>r.manager===v[0].manager)?v[0].manager:null,year:v.every(r=>r.year===v[0].year)?v[0].year:null,points:v.reduce((s,r)=>s+r.cents,0),starts:v.length,titles:new Set(v.filter(r=>r.round==='championship').map(r=>r.year)).size,evidence:v}));};
const scope='2020–2025 Sleeper championship-winning teams only; semifinals and finals; exact unambiguous name-position player-ID links';
const add=(id,label,a,key,dir,unit,qualification)=>{
 if(!a.length)return;
 assert.ok(a.every(r=>Number.isFinite(r[key])));
 const mark=Math[dir](...a.map(r=>r[key])),evidence=a.filter(r=>r[key]===mark);
 records.push({id,label,ownerType:'player',value:unit==='pts'?mark/100:mark,unit,scope,qualification,holders:[...new Set(evidence.map(r=>r.id))].sort().map(id=>({playerId:id,name:index.players.find(p=>p.id===id).name,evidence:evidence.filter(r=>r.id===id)}))});
};
const q='Observed champion-side starter production only; unlinked players excluded, not proof of title causation';
for(const round of ['semifinal','championship']){
 const a=eligible.filter(r=>r.round===round);
 for(const dir of ['max','min'])add('player-champion-'+round+'-score-'+dir,(dir==='max'?'Highest':'Lowest')+' linked player score in a champion '+round,a,'cents',dir,'pts',q);
 for(const pos of ['QB','RB','WR','TE','DEF'])add('player-champion-'+round+'-'+pos.toLowerCase()+'-max','Highest linked '+pos+' score in a champion '+round,a.filter(r=>r.position===pos),'cents','max','pts',q);
}
const career=group(eligible,r=>r.id);
add('player-champion-run-career-points','Most observed champion semifinal and final career points',career,'points','max','pts',q);
add('player-champion-run-career-starts','Most observed champion semifinal and final career starts',career,'starts','max','starts',q);
add('player-champion-title-starts','Most distinct championship-winning finals started',career,'titles','max','titles',q);
add('player-champion-single-run-points','Most observed points in one championship run',group(eligible,r=>r.id+':'+r.year),'points','max','pts',q);
add('player-champion-close-final-max','Highest linked individual score in a championship win by five points or fewer',eligible.filter(r=>r.round==='championship'&&r.margin<=500),'cents','max','pts',q);
assert.equal(new Set(records.map(r=>r.id)).size,records.length);
fs.writeFileSync('data-integrity/player-championship-records-v56.json',JSON.stringify({schemaVersion:1,status:'scoped-candidates-identity-review-required',scope,categoryCount:records.length,starterPerformances:rows.length,linkedPerformances:eligible.length,unlinked,records},null,2)+'\n');
console.log('Player championship records: '+records.length+' candidates; '+eligible.length+'/'+rows.length+' unambiguous player-ID links.');
