// Research-only provider collection. Explicitly approved completed week required.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const id='1340027406009761792',year=2026;
const cutoff=Number(process.env.FELLAS_COMPLETED_WEEK);
assert(Number.isInteger(cutoff)&&cutoff>=1&&cutoff<=14,'Explicit completed regular week required');
const get=async p=>{const r=await fetch('https://api.sleeper.app/v1/'+p,{signal:AbortSignal.timeout(30000)});assert(r.ok,p+' '+r.status);return r.json()};
const league=await get('league/'+id);assert.equal(Number(league.season),year);assert(cutoff<Number(league.settings.playoff_week_start));
const state=await get('state/nfl');assert.equal(Number(state.season),year);assert(Number(state.week)>cutoff,'NFL state has not advanced beyond approved week');
const names={1:'Stilly',2:'JMid',3:'Thommy',4:'Stew',5:'Scott',6:'Mitch',7:'Tony',8:'Stover',9:'Kuhl',10:'Birch'};
const games=[];
for(let week=1;week<=cutoff;week++){
 const rows=await get('league/'+id+'/matchups/'+week);assert.equal(rows.length,10);assert.equal(new Set(rows.map(r=>r.roster_id)).size,10);
 const groups=new Map();
 for(const r of rows){assert(names[r.roster_id]);assert(Number.isFinite(r.points));assert(r.matchup_id!=null);if(!groups.has(r.matchup_id))groups.set(r.matchup_id,[]);groups.get(r.matchup_id).push(r);}
 assert.equal(groups.size,5);
 for(const [key,rs] of [...groups].sort((a,b)=>a[0]-b[0])){assert.equal(rs.length,2);const [a,b]=rs.sort((a,b)=>a.roster_id-b.roster_id);games.push({week,home:names[a.roster_id],away:names[b.roster_id],home_cents:Math.round(a.points*100),away_cents:Math.round(b.points*100)});}
}
const output={schema:'fellas-live-completed-regular-v1',year,regular_weeks:cutoff,source:{provider:'Sleeper',league_id:id,completion_basis:'Explicit approved cutoff and advanced NFL state; no automatic completion certification'},games};
fs.mkdirSync('data-integrity/historical-trade-draft-audits',{recursive:true});
fs.writeFileSync('data-integrity/historical-trade-draft-audits/live-completed-regular-2026.json',JSON.stringify(output,null,2)+'\n');
console.log('LIVE COMPLETED INPUT '+JSON.stringify({year,cutoff,fixtures:games.length,team_scores:games.length*2}));
