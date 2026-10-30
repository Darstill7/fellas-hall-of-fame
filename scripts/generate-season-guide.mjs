import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const seasonYears=[...new Set(ledger.games.map(g=>g.year))].sort((a,b)=>a-b);
const latest2026Week=Math.max(0,...ledger.games.filter(g=>g.year===2026&&g.stage==='regular').map(g=>g.week));
function seasonFromLedger(year){
 const games=ledger.games.filter(g=>g.year===year&&g.stage==='regular');
 const rows=new Map();
 for(const g of games)for(const [manager,points,against] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
  const r=rows.get(manager)||{manager,w:0,l:0,t:0,pf:0,pa:0,games:0};
  r.games++;r.pf+=points;r.pa+=against;
  if(points>against)r.w++;else if(points<against)r.l++;else r.t++;
  rows.set(manager,r);
 }
 const standings=[...rows.values()].map(r=>({...r,pf:Math.round(r.pf*100)/100,pa:Math.round(r.pa*100)/100}))
  .sort((a,b)=>(b.w+b.t/2)/b.games-(a.w+a.t/2)/a.games||b.pf-a.pf);
 return {year,regularGames:games.length,standings,games};
}
const champions={
  "2016": "Thommy",
  "2017": "Thommy",
  "2018": "Thommy",
  "2019": "Birch",
  "2020": "Koble",
  "2021": "Tony",
  "2022": "Stover",
  "2023": "Stilly",
  "2024": "Thommy",
  "2025": "Scott",
  "2026": null
};
// Championship outcomes are manually verified evidence, not inferred from the regular-season table.
// Update this mapping only when historical championship provenance has been checked.
function generate(){
 const result={};
 for(const year of seasonYears){
  const season=seasonFromLedger(year),champ=champions[year]??null;
  const regular=season.games.filter(g=>g.stage==='regular');
  if(regular.length!==season.regularGames)throw Error('Regular game mismatch '+year);
  const standings=season.standings.map(r=>({name:r.manager,w:r.w,l:r.l,t:r.t,pf:r.pf,pa:r.pa,games:r.games}));
  const scored=regular.flatMap(g=>[
   {year,week:g.week,team:g.home,points:g.homeScore,opponent:g.away,margin:Math.round((g.homeScore-g.awayScore)*100)/100,phase:'Regular'},
   {year,week:g.week,team:g.away,points:g.awayScore,opponent:g.home,margin:Math.round((g.awayScore-g.homeScore)*100)/100,phase:'Regular'}
  ]);
  const wins=scored.filter(x=>x.margin>0);
  const high=scored.slice().sort((a,b)=>b.points-a.points)[0]??null;
  const big=wins.slice().sort((a,b)=>b.margin-a.margin)[0]??null;
  const close=wins.slice().sort((a,b)=>a.margin-b.margin)[0]??null;
  const leader=standings[0];
  const current=year===2026;
  result[year]={year,champion:champ,standings,coverage:`${year} archived regular-season results; ${season.regularGames} games. Reconstructed standings, not official tiebreaker seed order.${current?' 2026 currently through Week ${latest2026Week}.':''}`,games:season.regularGames,summary:current?`${year} season results are archived through Week ${latest2026Week}. ${leader.name} leads the reconstructed standings at ${leader.w}–${leader.l}; the championship is not yet decided.`:`${year} reconstructed regular-season leader: ${leader.name} (${leader.w}–${leader.l}${leader.t?'–'+leader.t:''}). ${champ??'Champion not yet verified'} ${champ?'won the championship.':''} Scores and regular-season records come from archived ESPN/Sleeper matchups; postseason outcomes are separate.`,seasonHigh:high,biggestWin:big,closestWin:close};
 }
 // Public-facing season labels must not expose historical legal names.
 const aliases={'Devon Halderman':'Halderman','Trent Koble':'Koble','Brandon Evans':'Evans','Darren Stillson':'Stilly','Drew Sylvester':'Stew','Zach Prescott':'Thommy','Landon Stover':'Stover','Tom Schermerhorn':'Schermerhorn'};
 return JSON.parse(JSON.stringify(result).replace(/Devon Halderman|Trent Koble|Brandon Evans|Darren Stillson|Drew Sylvester|Zach Prescott|Landon Stover|Tom Schermerhorn/g,name=>aliases[name]));
}
const expected=generate();
const serialized=JSON.stringify(expected,null,2)+'\n';
const guidePath='data/season_guide.json',pagePath='seasons/index.html';
const page=read(pagePath);
const block=/<script\s+type="application\/json"\s+id="seasons-data">[\s\S]*?<\/script>/;
if(!block.test(page))throw Error('Missing seasons-data embedded block');
const html=page.replace(block,'<script type="application/json" id="seasons-data">'+JSON.stringify(expected)+'</script>');
if(process.argv.includes('--check')){
 const errors=[];
 if(read(guidePath)!==serialized)errors.push('Season guide is not regenerated');
 if(page!==html)errors.push('Seasons page embedded data differs from generated guide');
 if(errors.length){console.error(errors.join('\n'));process.exit(1)}
 console.log('Season guide and embedded seasons page PASS; '+Object.keys(expected).length+' years');
}else{
 fs.writeFileSync(guidePath,serialized);
 fs.writeFileSync(pagePath,html);
 console.log('Regenerated season guide and seasons page through 2026 Week '+latest2026Week);
}
