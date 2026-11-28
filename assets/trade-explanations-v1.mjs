// Evidence-grounded descriptions; no grade or ownership inference from raw points.
const name=n=>({Tom:'Thommy',EvansBrandon:'Evans'})[n]??n;
const fmt=n=>Number.isFinite(n)?n.toFixed(2):'unverified';
export function explainTrade(t){
 const complete=!t.flags.includes('incomplete-receipt');
 const active=t.year===2026;
 const sides=t.sides.map(s=>{
 const parts=[name(s.manager)+' received '+s.assets+'.'];
 if(Number.isFinite(s.points)&&Number.isInteger(s.starts)&&s.starts>=0){
 parts.push(s.starts===0?'The archive records '+fmt(s.points)+' starter points and no starts; points per start is undefined, and absence of starts does not establish zero remaining asset value.':'The archive records '+fmt(s.points)+' starter points across '+s.starts+' player-start'+(s.starts===1?'':'s')+' ('+fmt(s.pointsPerStart)+' points per player-start).');
 if(s.starts>0&&s.starts<=3)parts.push('The sample is small and should not support a decisive quality grade by itself.');
 if(s.flags.includes('low-raw-efficiency-screen-not-position-adjusted'))parts.push('Raw scoring efficiency is below five points per player-start; verify the position and eligible lineup alternatives before assessing the magnitude of the shortfall.');
 }else parts.push('Production or starts are not fully verified.');
 if(s.flags.includes('non-player-asset'))parts.push('The non-player asset must be valued separately from starter points.');
 if(complete){
 const others=t.sides.filter(o=>o.manager!==s.manager);
 const comparisons=others.map(o=>{const d=s.points-o.points;return name(o.manager)+': '+(d>0?'+' :'')+fmt(d)+' recorded points'});
 parts.push('Raw production differential versus '+comparisons.join('; ')+'.');
 }
 parts.push('Replacement-adjusted lineup improvement, retained asset value and applicable keeper benefits are not yet verified.');
 return {manager:name(s.manager),explanation:parts.join(' '),grade:null};
 });
 const parts=[];
 if(!complete)parts.push('Incomplete transaction receipt: no competitive verdict can be established.');
 else if(t.rawLeaders.length>1)parts.push('Recorded starter production is tied between '+t.rawLeaders.map(name).join(' and ')+'.');
 else if(t.rawLeaders.length===1)parts.push(name(t.rawLeaders[0])+' leads in recorded starter points, not necessarily overall trade value.');
 if(t.flags.includes('raw-and-efficiency-leaders-differ'))parts.push('The total production and displayed efficiency leaders differ or tie; assess availability and positional benchmarks separately.');
 if(t.sides.length>2)parts.push('This is one multi-team transaction; pairwise comparisons must not create additional career trades.');
 if(active)parts.push('Active-season snapshot through Week '+(t.scoringThroughWeek??'unverified')+'; further outcomes and current asset ownership require review.');
 else parts.push('Historical production and positional evaluation windows require reconciliation.');
 if(t.flags.includes('position-adjusted-evidence-incomplete'))parts.push('The positional research does not establish complete comparable evidence.');
 else if(active)parts.push('Existing positional research has an older cutoff and is not current.');
 else parts.push('Matched positional research exists, but its window is not yet reconciled with this receipt.');
 parts.push('No final grade or overall winner is established.');
 return {id:t.id,year:t.year,week:t.week,status:'evidence-explanation-only',verdict:parts.join(' '),sides};
}
