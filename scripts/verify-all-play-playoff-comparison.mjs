// Source audit: node scripts/verify-all-play-playoff-comparison.mjs
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const allPlay=read('data/all_play_schedule_variance_2016_2026w8_v1.json');
const bracket=[...read('data/verified_espn_playoff_brackets_2016_2019.json').seasons,
...read('data/verified_sleeper_playoff_brackets_2020_2025.json').seasons];
const result=read('data/all_play_vs_playoff_qualification_2016_2025_v1.json');
if(result.rows.length!==98||bracket.length!==10)throw Error('Missing complete championship-year comparisons');
const missed=[],outside=[];
for(const b of bracket){
 const members=b.seeds||b.participants;
 const season=allPlay.allManagerSeasons.filter(x=>x.year===b.year);
 for(const score of season){
  const rank=1+season.filter(x=>x.expectedWins>score.expectedWins+.0005).length;
  const tied=season.filter(x=>Math.abs(x.expectedWins-score.expectedWins)<.0005).length;
  const actual=members.includes(score.manager);
  const record=result.rows.find(x=>x.year===b.year&&x.manager===score.manager);
  if(!record||record.allPlayCompetitionRank!==rank||record.rankTieCount!==tied||
     record.qualified!==actual||record.seed!==(b.seedByManager[score.manager]??null)||
     record.expectedWins!==score.expectedWins||record.championshipFieldSize!==members.length)
    throw Error('Playoff and all-play source mismatch '+b.year+'/'+score.manager);
  if(!actual&&rank<=members.length)missed.push(record);
  if(actual&&rank>members.length)outside.push(record);
 }
}
if(missed.length!==10||outside.length!==10||
  !missed.some(x=>x.year===2018&&x.manager==='Evans'&&x.allPlayCompetitionRank===3&&x.rankTieCount===2)||
  !outside.some(x=>x.year===2018&&x.manager==='Stover'&&x.allPlayCompetitionRank===8&&x.seed===2))
 throw Error('2018 contrast or playoff-field counts changed');
console.log('ALL-PLAY / PLAYOFF QUALIFICATION VERIFIED: 98 season rows, 10 within-field misses and 10 below-cutoff qualifiers.');
