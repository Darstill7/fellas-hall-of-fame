// Editorial framing is fixed; all factual season comparisons are reconciled before rendering.
const themes={
 Birch:['From the basement to the banner',2017,2019,'The most compelling arc in this franchise is how quickly a last-place finish became a championship. The intervening trip to the final makes the rise a three-season story rather than a one-year surprise.'],
 JMid:['A franchise still finding its identity',2024,2025,'The opening chapters establish a contrast between an encouraging debut and a more difficult sophomore campaign. With a short archive, the appropriate question is what comes next, not whether a permanent reputation has already been earned.'],
 Kuhl:['The search for a breakthrough',2022,2024,'A podium finish and a subsequent last-place season illustrate the distance between being competitive and building lasting success. The story is not simply about one poor year; it is about converting opportunities into a first championship.'],
 Mitch:['The regular season is not the trophy',2024,2025,'A spectacular improvement in regular-season results did not deliver the final prize. That gap between weekly dominance and the championship is the central tension in this franchise history.'],
 Scott:['A champion before the story was finished',2024,2025,'The championship arrived early in the archived career. The interesting question is whether that breakthrough becomes a foundation for sustained success, rather than a single defining peak.'],
 Stew:['The long road to the final prize',2021,2022,'The dramatic rebound from a difficult season produced another championship-game opportunity. The result underscores why regular-season improvement and postseason conversion deserve separate chapters.'],
 Stilly:['From the toilet bowl to the title',2021,2023,'The path from last place to a championship captures the difference between a franchise’s worst moment and its ultimate potential. A subsequent championship-game appearance adds a second chapter to the recovery.'],
 Stover:['The rise, the ring and the reset',2021,2022,'The championship followed a strong regular-season campaign. Later fluctuations are a reminder that a title is an achievement, not immunity from the bottom of the standings.'],
 Thommy:['A dynasty interrupted, not erased',2018,2019,'The early championship run established the benchmark. The abrupt reversal that followed, and the eventual return to the title, make this a story of both dominance and recovery.'],
 Tony:['The shortest route out of the basement',2020,2021,'A last-place finish followed by a championship gives this franchise one of the clearest contrasts between consecutive completed seasons. The turnaround is measurable without guessing what caused it.']
};
const rec=r=>r.w+'–'+r.l+(r.t?'–'+r.t:'');
const pct=n=>(100*n).toFixed(1)+'%';
const signed=n=>(n>0?'+':'')+n.toFixed(1);
export function buildFranchiseAnthology(name,timeline){
 const theme=themes[name];if(!theme)throw Error('Unknown editorial profile');
 const complete=timeline.filter(r=>!r.active).sort((a,b)=>a.year-b.year);
 if(!complete.length)throw Error('No completed seasons');
 const [headline,from,to,commentary]=theme,a=complete.find(r=>r.year===from),b=complete.find(r=>r.year===to);
 if(!a||!b||a.finish==null||b.finish==null)throw Error('Editorial anchor unavailable');
 const evidence=[a,b].map(r=>({year:r.year,record:rec(r),finish:r.finish,source:r.source}));
 const best=complete.slice().sort((a,b)=>b.winPct-a.winPct||a.year-b.year)[0],worst=complete.slice().sort((a,b)=>a.winPct-b.winPct||a.year-b.year)[0];
 const shifts=complete.slice(1).flatMap((r,i)=>r.year===complete[i].year+1?[{from:complete[i],to:r,delta:r.winPct-complete[i].winPct}]:[]);
 const turning=shifts.slice().sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||a.to.year-b.to.year)[0]??null;
 const finals=complete.filter(r=>r.finish===1||r.finish===2),titles=finals.filter(r=>r.finish===1);
 const windows=[];
 for(const length of [3,5]){
  const candidates=[];
  for(let i=0;i<=complete.length-length;i++){const rows=complete.slice(i,i+length);if(rows.at(-1).year-rows[0].year!==length-1)continue;
   const games=rows.reduce((n,r)=>n+r.games,0),wins=rows.reduce((n,r)=>n+r.w,0),ties=rows.reduce((n,r)=>n+r.t,0);
   candidates.push({from:rows[0].year,to:rows.at(-1).year,games,wins,ties,rate:(wins+ties/2)/games,titles:rows.filter(r=>r.finish===1).length});
  }const top=candidates.sort((a,b)=>b.rate-a.rate||a.from-b.from)[0];if(top)windows.push(top)
 }
 return {headline,commentary,evidence,opening:name+' went '+rec(a)+' in '+a.year+' (final place '+a.finish+'), then '+rec(b)+' in '+b.year+' (final place '+b.finish+').',
 best,worst,turning,windows,finals:finals.length,titles:titles.length,runnerUps:finals.length-titles.length,completeSeasons:complete.length,format:{pct,signed}};
}
