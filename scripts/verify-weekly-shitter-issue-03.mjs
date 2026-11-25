import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const article=read('weekly-shitter/issue-03.html');
const original=read('weekly-shitter/issue-02.html');
const ledger=JSON.parse(read('data/unified_record_book_2016_2026.json'));
const rows=[
 ['Stilly','Thommy',104.16,84.56,'Stilly',10.5,219.5,'Over'],
 ['JMid','Stew',97.8,142.26,'JMid',1.5,228.5,'Over'],
 ['Scott','Tony',98.76,142.3,'Tony',12.5,207.5,'Under'],
 ['Mitch','Birch',83.96,127.06,'Birch',1.5,235.5,'Over'],
 ['Stover','Kuhl',91.74,76.4,'Stover',25.5,202.5,'Under']
];
const games=ledger.games.filter(g=>+g.year===2026&&+g.week===11&&g.stage==='regular');
assert.equal(games.length,5);
let su=0,ats=0,totals=0;
for(const [a,b,pa,pb,fav,spread,total,side] of rows){
 const g=games.find(g=>[g.home,g.away].includes(a)&&[g.home,g.away].includes(b));
 assert.ok(g,a+' matchup missing');
 assert.equal(g.home===a?g.homeScore:g.awayScore,pa);
 assert.equal(g.home===b?g.homeScore:g.awayScore,pb);
 assert.ok(original.includes(fav+' -'+spread+' and '+side+' '+total),'Original pick missing');
 const margin=fav===a?pa-pb:pb-pa;
 su+=+(margin>0);ats+=+(margin>spread);totals+=+(side==='Over'?pa+pb>total:pa+pb<total);
 // The detailed retrospective now lives in the separate Tuesday Hangover; the receipt ledger is verified against the original picks.
}
assert.deepEqual([su,ats,totals],[4,3,2]);
const stew=ledger.games.filter(g=>+g.year===2026&&+g.week<=11&&g.stage==='regular'&&(g.home==='Stew'||g.away==='Stew')).sort((a,b)=>a.week-b.week);
assert.deepEqual(stew.map(g=>g.week),Array.from({length:11},(_,i)=>i+1));
const outcomes=stew.map(g=>g.home==='Stew'?g.winner==='HOME':g.winner==='AWAY');let streak=0;for(let i=outcomes.length-1;i>=0&&outcomes[i];i--)streak++;
assert.equal(streak,7);assert.ok(article.includes('seven consecutive victories')&&!/five straight|fifth straight/i.test(article));
assert.ok(article.includes('../tuesday-hangover/2026-week-11.html'));
const ids=[...article.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate IDs');
for(const m of article.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'Broken anchor '+m[1]);
for(const token of ['mast-editorial','mast-ticker','editorial-cover','Brother Bowl','Colts Misery Bowl','August 30, 2021','10–3 regular-season record','The Median Scandal','16–6','1–21','55.52','95.91','View all 90 current Sleeper starting slots','Walker is reported out','4–1','3–2','2–3','9–1','7–3','id="closing"','Fictional parody sponsor'])assert.ok(article.includes(token),'Missing '+token);
// Recompute median records from the same canonical games, rather than requiring retired forecast or unverified trade-point copy.
const weeks=Array.from({length:11},(_,i)=>ledger.games.filter(g=>+g.year===2026&&+g.week===i+1&&g.stage==='regular'));
const stats=new Map();
for(const week of weeks){
 assert.equal(week.length,5);
 const scores=week.flatMap(g=>[[g.home,g.homeScore],[g.away,g.awayScore]]);
 assert.equal(new Set(scores.map(x=>x[0])).size,10);
 const sorted=scores.map(x=>x[1]).sort((a,b)=>a-b);
 const median=(sorted[4]+sorted[5])/2;
 for(const g of week){for(const [name,score,opp] of [[g.home,g.homeScore,g.awayScore],[g.away,g.awayScore,g.homeScore]]){
 const t=stats.get(name)||{w:0,mw:0,pf:0};
 t.w+=+(score>opp);t.mw+=+(score>median);t.pf+=score;stats.set(name,t);
 }}
}
const ranked=[...stats].sort((a,b)=>(b[1].w+b[1].mw)-(a[1].w+a[1].mw)||b[1].pf-a[1].pf);
for(const [name,t] of ranked){
 const record=t.w+'–'+(11-t.w), median=t.mw+'–'+(11-t.mw), combined=(t.w+t.mw)+'–'+(22-t.w-t.mw);
 const row=article.match(/<tr><th scope="row" style="text-align:left;padding:8px">[^<]+<\/th>[\s\S]*?<\/tr>/g)?.find(r=>r.includes('>'+name+'<'));
 assert.ok(row&&[record,median,combined].every(x=>row.includes('>'+x+'<')),'Median row mismatch '+name);
}
assert.ok(!article.includes('issue-02-social.jpg'),'Do not reuse previous social cover');
console.log('PASS Issue 03: five canonical scores, original published predictions, independently calculated results, required editorial sections, anchors and masthead');
