// Compatible personal record books derived from verified fixtures; postseason archives remain explicitly scoped.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root='data-integrity/historical-trade-draft-audits/';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const book=read(root+'unified-record-book-preview.json'),core=read(root+'career-core-preview.json'),stats=read(root+'full-era-career-statistics.json');
const old=read('data/manager_record_books_2016_2026.json');
const fields=r=>({games:r.games,w:r.w,l:r.l,t:r.t});
const perspective=(g,m)=>{const home=g.home===m,points=home?g.homeScore:g.awayScore,opponentPoints=home?g.awayScore:g.homeScore,margin=Math.round((points-opponentPoints)*100)/100;return {...g,points,opponentPoints,opponent:home?g.away:g.home,margin,outcome:margin>0?'W':margin<0?'L':'T'}};
const pick=(rows,cmp)=>rows.slice().sort((a,b)=>cmp(a,b)||a.year-b.year||a.week-b.week||a.opponent.localeCompare(b.opponent))[0]??null;
const tally=rows=>({games:rows.length,w:rows.filter(r=>r.outcome==='W').length,l:rows.filter(r=>r.outcome==='L').length,t:rows.filter(r=>r.outcome==='T').length});
const managers=[];
for(const [manager,r] of Object.entries(core.managers)){
 const games=book.games.filter(g=>g.home===manager||g.away===manager).map(g=>perspective(g,manager));
 const regular=games.filter(g=>g.stage==='regular'),post=games.filter(g=>g.stage!=='regular'),wins=regular.filter(g=>g.outcome==='W'),losses=regular.filter(g=>g.outcome==='L');
 assert.deepEqual(tally(regular),fields(r));
 assert.equal(regular.reduce((n,g)=>n+Math.round(g.points*100),0),stats.career[manager].pf_cents);
 const annual=Object.entries(r.annual).map(([year,a])=>({year:Number(year),w:a.w,l:a.l,t:a.t}));
 const headToHead=Object.entries(r.h2h).map(([opponent,a])=>({opponent,...fields(a)})).sort((a,b)=>b.games-a.games||a.opponent.localeCompare(b.opponent));
 const eligible=post.filter(g=>!g.twoWeekAggregate&&!(g.year===2019&&g.week>=15&&g.stage==='consolation'));
 managers.push({manager,firstSeason:annual[0].year,lastSeason:annual.at(-1).year,regular:fields(r),bestWeek:pick(regular,(a,b)=>b.points-a.points),worstWeek:pick(regular,(a,b)=>a.points-b.points),biggestWin:pick(wins,(a,b)=>b.margin-a.margin),closestWin:pick(wins,(a,b)=>a.margin-b.margin),closestLoss:pick(losses,(a,b)=>b.margin-a.margin),biggestLoss:pick(losses,(a,b)=>a.margin-b.margin),postseason:{...tally(post),bestScoringMatchup:pick(eligible,(a,b)=>b.points-a.points),important:'Archived postseason matchups, including consolation; cumulative and two-week scores excluded from bestScoringMatchup. This is not a complete single-week playoff leaderboard.'},headToHead,annual});
}
assert.equal(managers.length,14);
const output={...old,asOf:null,source:'Verified unified regular-season engine and archived postseason',scope:'2016–2026 through completed Week '+book.completedThrough.week,caveats:['Regular and archived postseason matchups remain separate. Postseason coverage and classifications are not fully certified.'],managers,completedThrough:book.completedThrough,status:'RESEARCH_ONLY'};
fs.writeFileSync(root+'manager-record-books-preview.json',JSON.stringify(output,null,2)+'\n');
console.log('MANAGER RECORD BOOK PROJECTION PASS '+JSON.stringify({managers:managers.length,regular_team_games:managers.reduce((n,m)=>n+m.regular.games,0),completedThrough:book.completedThrough}));
