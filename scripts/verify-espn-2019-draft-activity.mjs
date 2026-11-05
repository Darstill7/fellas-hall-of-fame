import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const data=read('data/espn_2019_draft_activity_verified.json');
const original=read('data/espn_history_2016_2019.json').seasons.find(x=>x.year===2019);
const fail=[];const ok=(v,msg)=>{if(!v)fail.push(msg)};
ok(data.season===2019&&data.leagueId==='1313090','wrong 2019 league');
ok(data.draft.totalPicks===150&&data.teams.length===10,'draft size');
ok(data.draft.keeperCount===0&&data.draft.providerDraftType==='OFFLINE','keeper/draft rules');
ok(data.settings.acquisitionBudget===100&&data.settings.receptionPoints===0.5,'scoring/FAAB settings');
ok(original.games.length===81,'schedule games');
const picks=[];
for(const team of data.teams){
 const prior=original.teams.find(x=>x.id===team.espnTeamId);
 ok(prior&&prior.manager===team.manager&&prior.name===team.teamName,'team identity '+team.manager);
 ok(prior&&prior.finalRank===team.finalRank&&prior.record[0]===team.regularSeason.wins&&
  prior.record[1]===team.regularSeason.losses&&
  Math.abs(prior.pf-team.regularSeason.pointsFor)<0.001,'team result '+team.manager);
 ok(team.draftPlayerIdsByRound.length===15,'missing draft rounds '+team.manager);
 ok(team.draftPlayerIdsByRound.every(Number.isInteger),'invalid player id '+team.manager);
 picks.push(...team.draftPlayerIdsByRound);
}
ok(picks.length===150&&new Set(picks).size===150,'150 unique draft player IDs');
const order=data.draft.round1PickOrder;
ok(order.join(',')==='5,9,12,3,11,1,7,10,6,4','first round draft order');
const first=order.map(id=>data.teams.find(t=>t.espnTeamId===id).draftPlayerIdsByRound[0]);
ok(first.join(',')==='3929630,3117251,3054850,16800,15795,3051392,2508176,2976316,13982,3045147','first ten picks');
ok(data.teams.find(t=>t.manager==='Evans')?.espnTeamId===5&&
 data.teams.find(t=>t.manager==='Stew')?.espnTeamId===3&&
 data.teams.find(t=>t.manager==='Thommy')?.espnTeamId===7,'historical 2019 identities');
if(fail.length){for(const msg of fail)console.error(msg);process.exitCode=1}
else console.log('2019 ESPN draft audit passed: 150 picks, 10 managers, settings and season records');
