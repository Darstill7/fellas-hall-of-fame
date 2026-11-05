// Validate that every ESPN-era selection is preserved and names are mapped
// only from exact ESPN IDs, never from fuzzy similarity or a wrong draft slot.
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const old=read('data/espn_2016_2018_drafts_activity_verified.json');
const recent=read('data/espn_2019_draft_activity_verified.json');
const identity=read('data/espn_draft_player_identity_2016_2019.json');
const board=read('data/espn_draft_boards_named_2016_2019.json');
const errors=[];const check=(ok,msg)=>{if(!ok)errors.push(msg)};
const expected={2016:128,2017:160,2018:160,2019:150};
const all=[],known=new Set(),unresolved=new Set();
for(const [yearText,n] of Object.entries(expected)){
 const year=Number(yearText),s=board.seasons[yearText];
 check(!!s&&s.playerPicks.length===n,year+' selection count incorrect');
 if(!s)continue;
 const source=year===2019?null:old.years[yearText];
 const sourceIds=source?.draft.playerIdsByOverallPick;
 for(let i=0;i<s.playerPicks.length;i++){
  const p=s.playerPicks[i];
  check(Number.isInteger(p.espnPlayerId)&&p.manager&&p.year===undefined,year+' corrupted selection row '+i);
  const info=identity.players[p.espnPlayerId];
  check(!!info&&info.espnId===p.espnPlayerId,year+' missing or mismatched identity record '+p.espnPlayerId);
  check(p.player===(info?.name||null)&&p.position===(info?.position||null),year+' draft name/position deviates from verified ID crosswalk');
  if(year!==2019)check(p.espnPlayerId===sourceIds[i],year+' original ESPN draft sequence changed at row '+i);
  else{
   const j=Math.floor(i/recent.draft.teams),col=i%recent.draft.teams;
   const first=recent.draft.round1PickOrder;
   const teamId=(j%2===0?first:[...first].reverse())[col];
   const owner=recent.teams.find(t=>t.espnTeamId===teamId);
   check(p.espnTeamId===teamId&&p.espnPlayerId===owner?.draftPlayerIdsByRound[j],year+' original ESPN draft mismatch at row '+i);
  }
  if(year===2018)check(p.pickOrderVerified===false&&p.overall===null&&p.round===null&&p.roundPick===null,
   'Untrustworthy 2018 position-grouped offline order must not generate draft selection rankings');
  else check(p.pickOrderVerified===true&&p.overall===i+1&&p.round>=1&&p.roundPick>=1,
   year+' confirmed draft sequence rank missing at row '+i);
  if(!p.player)unresolved.add(p.espnPlayerId);else known.add(p.espnPlayerId);
  all.push(p);
 }
}
const sourceUnique=new Set([...Object.values(old.years).flatMap(x=>x.draft.playerIdsByOverallPick),...recent.teams.flatMap(x=>x.draftPlayerIdsByRound)]);
check(sourceUnique.size===296&&Object.keys(identity.players).length===sourceUnique.size,
 'Player identity catalog does not cover all 296 unique original ESPN IDs');
check(Object.values(identity.players).filter(x=>x.position==='D/ST').length===23,
 'All 23 distinct drafted defenses must be decoded with ESPN proTeam IDs');
check(Object.values(identity.players).filter(x=>x.position!=='D/ST'&&x.name).length===272,
 'Exact individual-athlete crosswalk must identify 272 unique ESPN player IDs');
check(all.length===598&&known.size===295&&unresolved.size===1&&unresolved.has(2977698),
 'Selection identity coverage must be 597/598, with only ESPN player ID 2977698 unresolved');
check(all.filter(p=>!p.player).length===1&&all.find(p=>!p.player)?.manager==='Tony'&&
 board.seasons['2017'].playerPicks.find(p=>p.espnPlayerId===2977698)?.overall===28,
 'Unknown 2017 Tony selection must not be silently assigned a guessed player');
check(board.coverage.namedSelections===597&&board.coverage.verifiedSelectionOrderPicks===438,
 'Named-selection and reliable-position-order counters must remain separate');
const positionRounds=Array.from({length:6},(_,i)=>board.seasons['2018'].playerPicks.slice(i*10,i*10+10)
 .map(p=>p.position));
check(positionRounds.every((positions,i)=>positions.every(p=>p===['QB','RB','RB','WR','WR','TE'][i])),
 '2018 position-grouped ESPN import evidence changed; re-evaluate draft-order confidence');
const website=fs.readFileSync('seasons/espn-draft-history.html','utf8');
const archive=fs.readFileSync('seasons/espn-origins.html','utf8');
check(website.includes('espn_draft_boards_named_2016_2019.json')&&
 website.includes("offline?'—':String(item.overall)")&&website.includes("item.player||'Name not verified'"),
 'Draft browser must use canonical names, and never show false 2018 pick numbers');
check(archive.includes('espn-draft-history.html'),'ESPN Origins must link to complete searchable draft history');
if(errors.length){console.error('ESPN player identity validation FAILED ('+errors.length+')');errors.forEach(e=>console.error(' - '+e));process.exitCode=1}
else console.log('ESPN player identity validation PASS: 597/598 selections named, 23 defense IDs decoded, one unknown ID, 2018 draft-order safeguards.');
