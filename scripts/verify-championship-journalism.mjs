// Independent fact check: championship features against historical score, player, and trade receipts.
import fs from 'node:fs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const anthology=read('data/championship_season_stories_2016_2025_v1.json');
const players=read('data/championship_player_boxscores_2020_2025_v1.json');
const ledger=read('data/season_weekly_matchups_2016_2026_v1.json');
const guide=read('data/season_guide.json');
const espn=read('data/verified_espn_playoff_brackets_2016_2019.json');
const sleeper=read('data/verified_sleeper_playoff_brackets_2020_2025.json');
const trades=read('data/v9_trade_engine.json');
const legends=read('data/franchise_player_legends.json');
const brackets=[...espn.seasons,...sleeper.seasons];
const fail=message=>{throw Error('Championship journalism integrity: '+message)};
const assert=(condition,message)=>{if(!condition)fail(message)};
assert(anthology.seasons.length===10,'must cover ten title seasons');
assert(players.version===1&&players.games.length===12,'must contain exactly twelve 2020–2025 semifinal/final box scores');
assert(new Set(players.games.map(g=>g.year+':'+g.round)).size===12,'duplicate playoff box score');
const ids=new Set();
for(const story of anthology.seasons){
 const {year}=story,champion=guide[year]?.champion,bracket=brackets.find(b=>b.year===year);
 assert(champion&&bracket?.champion===champion,'champion mismatch '+year);
 assert(story.sections.length===4,'four narrative acts required '+year);
 const full=story.sections.map(s=>s.text).join(' '),count=full.trim().split(/\s+/).length;
 assert(count>=360&&count<=650,'long-form story length out of range '+year+' '+count);
 assert(story.sections.every(s=>s.text.trim().split(/\s+/).length>=75),'underdeveloped chapter '+year);
 assert(!/\b(?:TBD|lorem ipsum|undefined|NaN)\b/.test(full),'placeholder '+year);
 const roundGames=ledger.bySeason[String(year)].games.filter(g=>g.stage!=='regular'&&(g.home===champion||g.away===champion));
 const final=roundGames.at(-1);
 assert(final?.winner===(final.home===champion?'HOME':'AWAY'),'title game result mismatch '+year);
 const own=final.home===champion?final.homeScore:final.awayScore,other=final.home===champion?final.awayScore:final.homeScore;
 const hasNumber=n=>[String(n),n.toFixed(2)].some(t=>full.includes(t));
 assert(hasNumber(own)&&hasNumber(other),'story omits actual title score '+year);
 assert((story.verifiedTradeReceipts||[]).every(t=>{
  if(ids.has(year+':'+t.id))return false;
  ids.add(year+':'+t.id);
  return !!t.why&&trades.sides.some(s=>s.trade_id===t.id&&s.year===year&&s.manager===(champion==='Thommy'?'Tom':champion));
 }),'unverified trade in '+year);
 if(year<2020){
  assert(!players.games.some(g=>g.year===year),'ESPN title years cannot invent a player box score');
  continue;
 }
 const yearsGames=players.games.filter(g=>g.year===year);
 assert(yearsGames.length===2,'missing semifinal or final '+year);
 for(const game of yearsGames){
  const match=roundGames.find(g=>g.week===game.week);
  assert(match&&game.champion===champion,'lineup game not in verified playoff ledger '+year+' W'+game.week);
  const a=match.home===champion?match.homeScore:match.awayScore;
  const b=match.home===champion?match.awayScore:match.homeScore;
  const computed=game.starters.reduce((sum,p)=>sum+p.points,0);
  assert(game.starters.length===9,'not nine scored starters '+year+' W'+game.week);
  assert(Math.abs(computed-game.score)<.03,'player points do not sum to team total '+year+' W'+game.week);
  assert(Math.abs(game.score-a)<.03&&Math.abs(game.opponentScore-b)<.03,'game score mismatch '+year+' W'+game.week);
  assert(game.starters.every(p=>p.name&&p.position&&Number.isFinite(p.points)),'incomplete starter receipt '+year+' W'+game.week);
 }
 const titleGame=yearsGames.find(g=>g.round==='championship');
 const semi=yearsGames.find(g=>g.round==='semifinal');
 assert(titleGame&&semi,'missing paired rounds '+year);
 const top=[...titleGame.starters].sort((a,b)=>b.points-a.points).slice(0,2);
 assert(top.every(p=>full.includes(p.name)||p.name==='Tampa Bay Buccaneers'&&full.includes('Tampa Bay')),'title MVP absent from narration '+year);
 assert(top.every(p=>hasNumber(p.points)),'title MVP points omitted from narration '+year);
}
// Explicit claim inventory: regular-season lineup totals in the championship anthology.
const regularClaims=[
  [
    2021,
    "Tony",
    "Jonathan Taylor",
    292.4,
    13
  ],
  [
    2021,
    "Tony",
    "Matthew Stafford",
    251.84,
    12
  ],
  [
    2021,
    "Tony",
    "Davante Adams",
    211.4,
    12
  ],
  [
    2022,
    "Stover",
    "Patrick Mahomes",
    316.4,
    13
  ],
  [
    2022,
    "Stover",
    "Tyreek Hill",
    246,
    13
  ],
  [
    2022,
    "Stover",
    "Derrick Henry",
    234.06,
    13
  ],
  [
    2022,
    "Stover",
    "Travis Kelce",
    217.9,
    13
  ],
  [
    2023,
    "Stilly",
    "Josh Allen",
    306.28,
    13
  ],
  [
    2023,
    "Stilly",
    "Michael Pittman Jr.",
    155.2,
    12
  ],
  [
    2023,
    "Stilly",
    "Rachaad White",
    127.2,
    10
  ],
  [
    2024,
    "Tom",
    "Derrick Henry",
    248.7,
    13
  ],
  [
    2024,
    "Tom",
    "Bijan Robinson",
    220.3,
    13
  ],
  [
    2025,
    "Scott",
    "Bijan Robinson",
    239.3,
    13
  ],
  [
    2025,
    "Scott",
    "James Cook III",
    221,
    13
  ],
  [
    2025,
    "Scott",
    "George Pickens",
    206.9,
    13
  ],
  [
    2025,
    "Scott",
    "Trey McBride",
    188.2,
    13
  ]
];
for(const [year,manager,player,points,starts] of regularClaims){
 const entry=legends.managers[manager]?.find(p=>p.name===player)?.seasons?.[year];
 assert(entry&&entry.points===points&&entry.starts===starts,'regular-season source mismatch '+year+' '+player);
 const prose=anthology.seasons.find(s=>s.year===year).sections.map(s=>s.text).join(' ');
 // Check the player and number occur near one another, not merely somewhere in the article.
 const nameIndex=prose.indexOf(player);
 assert(nameIndex>=0,'missing season player '+year+' '+player);
 const matching=prose.split(player).slice(1).some(t=>t.slice(0,150).includes(points.toFixed(2)));
 assert(matching,'season production claim omitted or mismatched '+year+' '+player);
}
const page=fs.readFileSync('hall/championship-stories.html','utf8');
for(const marker of ['championship_player_boxscores_2020_2025_v1.json','mvp-showcase','mvp-scores','verifiedTradeReceipts','story-trade-receipts','story-section'])
 assert(page.includes(marker),'article renderer lacks '+marker);
const named=players.games.filter(g=>g.round==='championship').map(g=>{
 const best=[...g.starters].sort((a,b)=>b.points-a.points)[0];
 return g.year+': '+best.name+' '+best.points.toFixed(2);
});
console.log('CHAMPIONSHIP JOURNALISM PASS: 10 long-form features, all original winners and finals, 12 exact playoff starting lineups, source-backed trade receipts, 16 regular-season production anchors and 6 title-week leading scorers.');
console.log(named.join(' | '));
