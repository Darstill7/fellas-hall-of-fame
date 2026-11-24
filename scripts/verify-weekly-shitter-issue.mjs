import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('shitter/2026-week-10/index.html');
const archive=read('shitter/index.html');
const home=read('index.html');
const cover=readFileSync(new URL('../shitter/cover-week10-approved.avif',import.meta.url));
const socialCover=readFileSync(new URL('../shitter/cover-week10-approved.jpg',import.meta.url));
const data=JSON.parse(read('shitter/2026-week-10/projection-receipts.json'));
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
assert.equal(data.week,10);
assert.equal(data.season,2026);
assert.equal(Object.keys(data.lineupProjections).length,10);
const starters=Object.values(data.lineupProjections).flatMap(v=>v.players);
assert.equal(starters.length,90,'Ten complete 9-slot fantasy lineups must be archived');
for(const [name,v] of Object.entries(data.lineupProjections)){
 assert.equal(v.players.length,9, name+' must show all starting slots');
 const value=Math.round(v.players.reduce((s,x)=>s+x.halfPprProjection,0)*10)/10;
 assert.ok(Math.abs(value-v.totalHalfPpr)<0.01,name+' projections must add exactly');
}
assert.equal(data.lineupProjections.Stover.players.at(-1).player,'EMPTY DEF');
assert.equal(data.lineupProjections.Stover.players.at(-1).halfPprProjection,0);
assert.equal(data.revisedMatchup.updatedSnapshot.stover,115.3,'Gurt updated projection');
assert.equal(data.revisedMatchup.updatedSnapshot.birch,118.7,'Birch projection unchanged');
assert.equal(data.revisedMatchup.updatedSnapshot.stoverCurrentStarters.length,9,'All nine current Gurt slots recorded');
assert.equal(Math.round(data.revisedMatchup.updatedSnapshot.stoverCurrentStarters.reduce((sum,p)=>sum+p.halfPprProjection,0)*10)/10,115.3,'Revised total checks');
assert.equal(data.revisedMatchup.updatedSnapshot.stoverCurrentStarters.at(-1).player,'Los Angeles Rams','Gurt actually starts Rams D');
assert.equal(data.revisedMatchup.originalSnapshot.stover,104.4,'Original receipt remains untouched');
assert.ok(html.includes('UPDATED: BIRCH -3.5')&&html.includes('O/U 234.0'),'Updated game board');
assert.ok(html.includes('UPDATED PICK: BIRCH 119, STOVER 115'),'Updated prediction');
assert.ok(html.includes('ORIGINAL PRE-UPDATE PICK: BIRCH 119, STOVER 104'),'Original article receipt preserved');
const played=ledger.games.filter(x=>x.stage==='regular');
const history=played.find(x=>Number(x.year)===2025 && Number(x.week)===10 && [x.home,x.away].sort().join('|')==='Mitch|Stew');
assert.ok(history,'2025 Week 10 Mitch/Stew receipt');
assert.equal(history.homeScore+history.awayScore,332.62);
// Issue 01 was published before Week 10 of 2026 was completed. Preserve its as-published historical claim.
const publicationHistory=played.filter(x=>Number(x.year)<2026 || (Number(x.year)===2026 && Number(x.week)<10));
const top=Math.max(...publicationHistory.map(x=>+(Number(x.homeScore)+Number(x.awayScore)).toFixed(2)));
assert.equal(top,332.62,'Historical lead was highest recovered regular-season combined total at publication');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
for(const anchor of [...html.matchAll(/href="#([^"]+)"/g)].map(x=>x[1]))assert.ok(ids.includes(anchor),'Broken jump link: '+anchor);
for(const name of ['mitch-stew','stilly-scott','jmid-thommy','tony-kuhl','birch-stover','shit-list','final-flush'])assert.ok(ids.includes(name),'Missing section '+name);
for(const txt of ['STEW -1.5','STILLY -19.5','JMID -16.5','TONY -29.5','BIRCH -3.5'])assert.ok(html.includes(txt),'Missing projection-derived line '+txt);
assert.ok(html.includes('The football ends Monday night. The bullshit never does.'),'Final Flush sign-off');
assert.ok(html.includes('published half-PPR player projections'),'Model methodology disclosed');
assert.ok(html.includes('provisional'),'Uncertified streaks must be labeled');
assert.ok(html.includes('og:image')&&html.includes('background-image:url("../cover-week10-approved.avif")'),'Cover and social preview');
assert.ok(html.includes('aspect-ratio:1731/909')&&html.includes('class="cover-art" role="img"'),'iPhone cover uses constrained responsive frame');
assert.ok(!html.includes('<img class="cover-art"'),'Avoid image intrinsic-sizing overflow in mobile Safari');
assert.ok(cover.subarray(0,32).toString('ascii').includes('ftypavif'),'Approved image is valid AVIF');
assert.equal(socialCover.subarray(0,2).toString('hex'),'ffd8','Valid JPEG opening marker');
assert.equal(socialCover.subarray(-2).toString('hex'),'ffd9','Valid JPEG closing marker');
assert.ok(socialCover.length>10000,'Approved cover preview has real image data');
assert.ok(html.includes('shitter/cover-week10-approved.jpg'),'Standard PNG social preview URL');
assert.ok(archive.includes('background:url("cover-week10-approved.avif") center/contain no-repeat'),'Archive shows safely constrained cover');
const currentIssue=read('weekly-shitter/issue-02.html');
const currentArchive=read('weekly-shitter/index.html');
if(home.includes('id="my-manager"')){
 assert.ok(home.includes('data-news="shitter"')&&home.includes('assets/home-app-v3.mjs'),'Production homepage has dynamic publication card');
 const loader=read('assets/home-app-v3.mjs');
 assert.ok(loader.includes("archive:'weekly-shitter/'")&&loader.includes("selector:'main a.story'")&&loader.includes('pattern:/^issue-'),'Publication card must derive from published archive');
 assert.ok(read('home-classic.html').includes('href="weekly-shitter/issue-02.html"'),'Classic homepage retains Issue 02 link');
}else assert.ok(home.includes('href="weekly-shitter/issue-02.html"'),'Homepage promotes current Issue 02');
assert.ok(home.includes('href="weekly-shitter/"'),'Homepage links to current issue archive');
assert.ok(currentArchive.includes('href="issue-02.html"'),'Archive features current issue');
assert.ok(currentArchive.includes('href="../shitter/2026-week-10/"'),'Archive retains previous issue');
assert.ok(currentIssue.includes("<h1>Everybody's a Genius <em>Until Sunday.</em></h1>"),'Current issue preserves approved headline in magazine styling');
assert.ok(currentIssue.includes('class="mast-editorial"') && currentIssue.includes('class="mast-ticker"'),'Premium publication nameplate and deadline ticker present');
assert.ok(currentIssue.includes('class="feature-line"') && currentIssue.includes('class="editorial-cover"') && !currentIssue.includes('issue-02-newsroom.svg'),'Article has headline-first visual hierarchy');
assert.ok(currentIssue.includes('id="closing"')&&currentIssue.includes('The Final Flush'),'Final Flush remains closing section');
const gradedPicks=JSON.parse(read('weekly-shitter/issue-01-verified-picks.json'));
assert.equal(gradedPicks.games.length,5,'Exactly five published Week 10 predictions');
assert.equal(gradedPicks.record.straightUp.wins,5);
assert.equal(gradedPicks.record.againstSpread.wins,4);
assert.equal(gradedPicks.record.againstSpread.losses,1);
const archivedScores=['THE PICK: STEW 122, MITCH 121','THE PICK: STILLY 124, SCOTT 105','THE PICK: JMID 116, THOMMY 100','THE PICK: TONY 119, KUHL 89','UPDATED PICK: BIRCH 119, STOVER 115'];
for(const pick of archivedScores)assert.ok(html.includes(pick),'Missing original issue pick: '+pick);
let su=0,ats=0;
for(const entry of gradedPicks.games){
 const names=Object.keys(entry.actual),opponent=names.find(x=>x!==entry.favorite);
 assert.ok(opponent,'Missing opponent '+entry.matchup);
 const margin=+(entry.actual[entry.favorite]-entry.actual[opponent]).toFixed(2);
 const total=+(entry.actual[names[0]]+entry.actual[names[1]]).toFixed(2);
 assert.equal(entry.actualMargin,margin,'Point margin must reconcile with final scores');
 assert.equal(entry.actualTotal,total,'Total must reconcile with final scores');
 assert.equal(entry.winnerCorrect,margin>0,'Winner grading must reconcile');
 assert.equal(entry.favoriteCovered,margin>-entry.line,'Spread must reconcile');
 assert.equal(entry.totalPick,'not explicitly published','Do not invent over/under wagers');
 su+=Number(margin>0);ats+=Number(margin>-entry.line);
}
assert.equal(su,5,'All five original winner picks were correct');
assert.equal(ats,4,'Four original published favorites covered');
assert.equal((currentIssue.match(/class="receipt-game"/g)||[]).length,5,'Show all five graded Week 10 games');
assert.equal((currentIssue.match(/class="receipt-win"/g)||[]).length,4,'Four covering teams shown');
assert.equal((currentIssue.match(/class="receipt-loss"/g)||[]).length,1,'One non-cover shown');
assert.ok(currentIssue.includes('THE WEEK 10 RECEIPTS'),'On-page archival receipts visible');

for(const marker of ['5–0','4–1','Stew 122, Mitch 121','119–115','119–89','issue-01-verified-picks.json'])
 assert.ok(currentIssue.includes(marker),'Issue 02 writer receipts missing '+marker);
assert.ok(!currentIssue.includes('picked Mitch over Stew'),'Remove false writer-prediction retrospective');
assert.ok(!currentIssue.includes('Pending audit'),'No unaudited ledger after completion');

const week11Lines=[
 {match:'Stilly',fav:'Stilly',spread:-10.5,total:219.5,predicted:{Stilly:118,Thommy:105},totalPick:'Over'},
 {match:'Stew',fav:'JMid',spread:-1.5,total:228.5,predicted:{JMid:118,Stew:114},totalPick:'Over'},
 {match:'Tony',fav:'Tony',spread:-12.5,total:207.5,predicted:{Tony:110,Sheffla:94},totalPick:'Under'},
 {match:'Mitch',fav:'Birch',spread:-1.5,total:235.5,predicted:{Birch:121,Mitch:118},totalPick:'Over'},
 {match:'Stover',fav:'Stover',spread:-25.5,total:202.5,predicted:{Stover:115,Kuhl:86},totalPick:'Under'}
];
for(const line of week11Lines){
 const entries=Object.entries(line.predicted),other=entries.find(([n])=>n!==line.fav)[0];
 const scoreTotal=entries.reduce((total,[,pts])=>total+pts,0);
 const margin=line.predicted[line.fav]-line.predicted[other];
 assert.ok(margin+line.spread>0,'Week 11 forecast must support the published favorite: '+line.match);
 assert.ok(line.totalPick==='Over'?scoreTotal>line.total:scoreTotal<line.total,'Week 11 forecast must support published total selection: '+line.match);
 assert.ok(currentIssue.includes(line.fav+' '+line.spread+' / '+line.total),'Original line missing: '+line.match);
}
assert.ok(currentIssue.includes('THURSDAY NIGHT · FIRST LINEUP LOCK'),'Thursday kickoff audit must be included');
assert.ok(currentIssue.includes('Josh Jacobs is on Green Bay'), 'Bye week made explicit for Jacobs');
assert.ok(currentIssue.includes('THE WEEK 10 RECEIPTS'),'Verified issue one receipts preserved');


assert.ok(!html.includes('Schermerhorn'),'No current Thommy/Schermerhorn confusion');
console.log('PASS: Weekly Shitter Week 10 issue, historical feature, projections and mobile links');