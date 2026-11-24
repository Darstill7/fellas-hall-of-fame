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
 assert.ok(article.includes(pa.toFixed(2))&&article.includes(pb.toFixed(2)),'Score missing');
}
assert.deepEqual([su,ats,totals],[4,3,2]);
const ids=[...article.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate IDs');
for(const m of article.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'Broken anchor '+m[1]);
for(const token of ['mast-editorial','mast-ticker','editorial-cover','Brother Bowl','Colts Misery Bowl','414.5','333.1','August 30, 2021','59.7%','40.7%','4–1','3–2','2–3','9–1','7–3','id="closing"','Fictional parody sponsor'])assert.ok(article.includes(token),'Missing '+token);
assert.ok(!article.includes('issue-02-social.jpg'),'Do not reuse previous social cover');
console.log('PASS Issue 03: five canonical scores, original published predictions, independently calculated results, required editorial sections, anchors and masthead');
