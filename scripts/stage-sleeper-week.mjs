// Fetch a complete, finalized Sleeper regular-season week as a REVIEW CANDIDATE.
// Never mutate canonical history directly; a pull request and full CI must approve updates.
import fs from 'node:fs';
const league='1340027406009761792';
const canonical='data/unified_record_book_2016_2026.json';
const ledger=JSON.parse(fs.readFileSync(canonical,'utf8'));
const rosterNames=new Map([[1,'Stilly'],[2,'JMid'],[3,'Thommy'],[4,'Stew'],[5,'Scott'],[6,'Mitch'],[7,'Tony'],[8,'Stover'],[9,'Kuhl'],[10,'Birch']]);
const handleNames=new Map([['darstill','Stilly'],['jmidd','JMid'],['thommy','Thommy'],['dsylvester9','Stew'],['sheffla','Scott'],['huppdawg80','Mitch'],['tsteg','Tony'],['dillionpanthers15','Stover'],['ckuhl5','Kuhl'],['birchhh','Birch']]);
const api=async(path)=>{const resp=await fetch('https://api.sleeper.app/v1/'+path,{signal:AbortSignal.timeout(25000)});if(!resp.ok)throw Error(path+' returned HTTP '+resp.status);return resp.json()};
const season=2026;
const [state,rosters,users]=await Promise.all([api('state/nfl'),api('league/'+league+'/rosters'),api('league/'+league+'/users')]);
if(String(state.season)!==String(season))throw Error('Not the 2026 NFL season; manual rollover review required');
const userById=new Map(users.map(u=>[u.user_id,String(u.display_name||u.username||'').toLowerCase()]));
for(const roster of rosters){
 const expected=rosterNames.get(roster.roster_id),actual=handleNames.get(userById.get(roster.owner_id));
 if(!expected||!actual||actual!==expected)throw Error('Sleeper roster owner identity changed: '+roster.roster_id+'; manual review required');
}
if(rosters.length!==10||rosterNames.size!==10)throw Error('Expected ten verified roster owners');
const existing=ledger.games.filter(g=>g.year===season&&g.stage==='regular');
const lastWeek=Math.max(0,...existing.map(g=>g.week));
const week=Number(process.env.SLEEPER_WEEK||lastWeek+1);
if(!Number.isInteger(week)||week!==lastWeek+1||week>14)throw Error('Only the next contiguous regular-season week may be staged');
if(Number(state.week)<=week)throw Error('Week '+week+' has not been superseded by the next NFL week; scores may be provisional');
const matchups=await api('league/'+league+'/matchups/'+week);
if(matchups.length!==10)throw Error('Missing lineup scores in week '+week);
const groups=new Map(),seen=new Set();
for(const row of matchups){
 if(!rosterNames.has(row.roster_id)||seen.has(row.roster_id)||!Number.isFinite(row.points)||row.points<0||row.matchup_id==null)throw Error('Incomplete or duplicate matchup roster in week '+week);
 seen.add(row.roster_id);const pair=groups.get(row.matchup_id)||[];pair.push(row);groups.set(row.matchup_id,pair);
}
if(groups.size!==5||[...groups.values()].some(g=>g.length!==2))throw Error('Expected five complete paired matchups');
const round=n=>Math.round(n*100)/100;
const games=[...groups.values()].map(pair=>{
 const [a,b]=pair.sort((x,y)=>x.roster_id-y.roster_id);
 const home=rosterNames.get(a.roster_id),away=rosterNames.get(b.roster_id),homeScore=round(a.points),awayScore=round(b.points);
 return {year:season,week,home,away,homeScore,awayScore,winner:homeScore>awayScore?'HOME':awayScore>homeScore?'AWAY':'TIE',margin:round(Math.abs(homeScore-awayScore)),stage:'regular',era:'Sleeper',source:'sleeper_api_staged_week_'+week};
});
const staged={status:'REVIEW_REQUIRED',league,year:season,week,source:'Sleeper public API',matchupCount:games.length,reason:'Automated source fetch does not itself certify stat corrections or downstream projection parity',games};
fs.mkdirSync('data-integrity/sleeper-sync-candidates',{recursive:true});
const path='data-integrity/sleeper-sync-candidates/2026-week'+week+'.json';
fs.writeFileSync(path,JSON.stringify(staged,null,2)+'\n');
console.log('Staged '+path+'; canonical ledger unchanged. Review and run full projection generators before merging.');
