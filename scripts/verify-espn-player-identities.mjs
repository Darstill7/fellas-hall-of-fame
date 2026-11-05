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
check(Object.values(identity.players).filter(x=>x.position!=='D/ST'&&x.name).length===273,
 'Expected 272 independent ESPN player ID matches plus one user-attested player');
const original=identity.players[2977698];
const tonyPick=board.seasons['2017'].playerPicks.find(p=>p.espnPlayerId===2977698);
check(original?.name==='Glenn Gronkowski'&&original?.position==='RB'&&
 original?.verification==='user_confirmed_original_draft_selection'&&
 original?.independentEspnIdCrosswalkVerified===false,
 'Glenn Gronkowski must retain user-confirmed (not independently matched) identity provenance');
check(original?.postDraftCorrection?.intendedPlayer==='Rob Gronkowski'&&
 original?.postDraftCorrection?.intendedEspnId===13229&&
 identity.players[13229]?.name==='Rob Gronkowski',
 'Post-draft correction must point to Rob Gronkowski, a different ESPN player ID');
check(tonyPick?.manager==='Tony'&&tonyPick?.overall===28&&
 tonyPick?.player==='Glenn Gronkowski'&&tonyPick?.postDraftCorrection?.correctedTo==='Rob Gronkowski',
 'Original 2017 draft selection must be Glenn, with Rob documented as the correction');
check(all.length===598&&known.size===296&&unresolved.size===0&&
 all.every(p=>!!p.player)&&board.coverage.namedSelections===598&&
 board.coverage.unresolvedSelections===0&&board.coverage.verifiedSelectionOrderPicks===438&&
 board.coverage.identityProvenance?.userConfirmedOriginalPlayerIds===1,
 '598/598 names must be complete without implying all were independently ID-matched');
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
check(website.includes("requested.get('manager')")&&website.includes("requested.get('year')")&&website.includes("manager.value=canonical"),
 'Draft archive must support manager and season deep links');
check(website.includes('id="manager-resume"')&&website.includes('owned.length')&&website.includes('Recorded first-round pick:')&&website.includes('Round and early-pick rankings are deliberately withheld.'),
 'Manager draft résumé must show sourced counts and withhold 2018 draft rankings');
check(website.includes('The league subsequently replaced him with Rob Gronkowski')&&website.includes('not an additional draft selection'),
 'Manager résumé must preserve Tony original-pick vs correction distinction');
const activeLegacyManagers=['stilly','stew','tom','stover','birch','tony','mitch','kuhl'];
for(const slug of activeLegacyManagers){
 const profile=fs.readFileSync('managers/'+slug+'/index.html','utf8');
 const name=slug==='tom'?'Thommy':slug[0].toUpperCase()+slug.slice(1);
 check(profile.includes('espn-draft-history.html?manager='+encodeURIComponent(name))&&profile.includes('Original ESPN drafts'),
  'Missing manager deep link to the historical ESPN draft archive: '+slug);
}

const careerView=fs.readFileSync('assets/manager-draft-trade-career-page.mjs','utf8');
const seasonView=fs.readFileSync('assets/manager-season-evidence.mjs','utf8');
check(careerView.includes("fetchJSON('data/espn_draft_boards_named_2016_2019.json')")&&
 careerView.includes("year===2018")&&careerView.includes('original round and overall pick order not verified')&&
 careerView.includes("season.platform==='Sleeper'")&&
 careerView.includes("Original pick: Glenn Gronkowski; manually replaced after the draft with Rob Gronkowski"),
 'Career draft intelligence must use canonical ESPN identities and never promote offline 2018 order');
check(seasonView.includes("year===2018?'Offline ESPN draft")&&
 seasonView.includes("espn-draft-history.html?manager="),
 'Manager season evidence must withhold 2018 early-pick order and link recovered originals');
if(errors.length){console.error('ESPN player identity validation FAILED ('+errors.length+')');errors.forEach(e=>console.error(' - '+e));process.exitCode=1}
else console.log('ESPN player identity validation PASS: 598/598 picks identified, documented Glenn-to-Rob correction, and 2018 offline order safeguards.');
