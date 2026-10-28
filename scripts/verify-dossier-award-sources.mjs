// Cross-check the published dossier waiver/trade award cards against their archived model data.
// Verifies published measurements, NOT underlying transaction/source completeness.
import fs from 'node:fs';
const slugs=['stilly','stew','tom','stover','birch','tony','mitch','kuhl','jmid','scott'];
const trades=JSON.parse(fs.readFileSync('data/v9_trade_engine.json','utf8')).sides;
const waivers=JSON.parse(fs.readFileSync('data/waiver_award_candidates.json','utf8')).managers;
const failures=[];
const clean=s=>s.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').trim();
for(const slug of slugs){
 const manager=slug==='tom'?'Tom':slug==='jmid'?'JMid':slug[0].toUpperCase()+slug.slice(1);
 const html=fs.readFileSync('managers/'+slug+'.html','utf8');
 const award=html.match(/Best verified waiver \/ add candidate<\/div><h2>([^<]+)<\/h2><p><b>(\d{4}) · Week (\d+) (waiver|add)<\/b><\/p><p class="muted">(\d+) credited starts after acquisition · ([\d.]+) starter points · <b>\+([\d.]+)<\/b>/);
 const expectedWaiver=waivers[manager]?.[0];
 if(!award||!expectedWaiver){failures.push(manager+' waiver award missing or source absent');continue}
 const [,player,year,week,type,starts,points,par]=award;
 for(const [k,a,b] of [['player',clean(player),expectedWaiver.player],['year',+year,expectedWaiver.year],['week',+week,expectedWaiver.acquisitionWeek],['type',type,expectedWaiver.acquisitionType],['starts',+starts,expectedWaiver.starts],['points',+points,expectedWaiver.points],['par',+par,expectedWaiver.par]]){
  if(typeof a==='number'?Math.abs(a-b)>0.011:a!==b)failures.push(manager+' waiver '+k+': dossier='+a+', source='+b);
 }
 const outcomes=trades.filter(x=>x.manager===manager&&Number.isFinite(x.direct_edge));
 const verify=(heading,top)=>{
  const pattern=new RegExp(heading+'<\\/div><h2>([^<]+)<\\/h2>(?:<p><b>([^<]+)<\\/b><\\/p>)?<p class="muted">Measured direct starter-point edge: <b[^>]*>([+-]?[\\d.]+)<\\/b>');
  const m=html.match(pattern);
  const sorted=[...outcomes].sort((x,y)=>top?y.direct_edge-x.direct_edge:x.direct_edge-y.direct_edge);
  const eligible=sorted.find(x=>top?x.direct_edge>0:x.direct_edge<0);
  if(!eligible){if(!top&&!html.includes('Worst measured trade outcome candidate</div><h2>Not enough evidence'))failures.push(manager+' must label no supported negative trade');return}
  if(!m){failures.push(manager+' '+heading+' card missing');return}
  const [,displayYear,displayAssets,edge]=m;
  if(+displayYear!==eligible.year||Math.abs(+edge-eligible.direct_edge)>0.11)failures.push(manager+' '+heading+' year or edge not model-backed');
  const cardCopy=html.slice(m.index,m.index+450);
  if(!cardCopy.includes('Confidence: '+eligible.confidence+'.'))failures.push(manager+' '+heading+' confidence does not match source');
  if(eligible.provisional&&!cardCopy.includes('Provisional 2026 in-season snapshot'))failures.push(manager+' '+heading+' omits provisional in-season warning');
  if(displayAssets){
   const displayed=clean(displayAssets).split(' + ').map(x=>x.trim()).sort();
   const expected=[...eligible.assets].sort();
   if(JSON.stringify(displayed)!==JSON.stringify(expected))failures.push(manager+' '+heading+' players differ from trade model');
  }
 };
 verify('Best measured trade outcome candidate',true);
 verify('Worst measured trade outcome candidate',false);
}
if(failures.length){console.error('Dossier source parity FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Dossier source parity PASS: 10 published waiver awards and trade direct-edge cards checked against archived source-model records; source completeness/positional WAR unverified.');
