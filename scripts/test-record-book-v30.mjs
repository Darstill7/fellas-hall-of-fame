import assert from 'node:assert/strict';
import fs from 'node:fs';
import {indexPublishedCategories,managerArchivePortfolio,searchCategories,categoryHref,archivedRanking,archivedStory} from '../assets/record-book-v30.mjs';
import {fellasLeague,normalizeManager} from '../assets/league-config.mjs';
const archive=JSON.parse(fs.readFileSync('data/expanded_records_verified_v1.json','utf8'));
const index=indexPublishedCategories(archive);
assert.equal(index.length,44);assert.equal(new Set(index.map(r=>r.key)).size,44);
assert.deepEqual(searchCategories(index,'  '),index);
assert.equal(searchCategories(index,'zzzznotarecord').length,0);
assert(searchCategories(index,'WINNING STREAK').some(c=>c.key==='winning-streak'));
for(const group of new Set(index.map(c=>c.group)))assert.deepEqual(searchCategories(index,'',group),index.filter(c=>c.group===group));
const expected={Stilly:[7,14],Stew:[5,11],Thommy:[8,14],Mitch:[21,27],JMid:[1,3],Scott:[1,2],Stover:[5,19],Kuhl:[1,4],Tony:[8,20],Birch:[5,21]};
for(const name of fellasLeague.managers){
 const p=managerArchivePortfolio(archive,name);
 const own=archive.categories.filter(c=>c.leaders.some(r=>normalizeManager(r.manager)===name&&r.rank===1));
 const podium=archive.categories.filter(c=>c.leaders.some(r=>normalizeManager(r.manager)===name&&r.rank<=3));
 assert.deepEqual(p.owned.map(c=>c.key),own.map(c=>c.key));
 assert.deepEqual(p.podium.map(c=>c.key),podium.map(c=>c.key));
 if(archive.scope.includes('Week 9'))assert.deepEqual([p.owned.length,p.podium.length],expected[name]);
 for(const c of archive.categories){
  const d=archivedRanking(archive,c.key,name),mine=c.leaders.filter(r=>normalizeManager(r.manager)===name);
  assert.equal(d.personalRank,mine.length?Math.min(...mine.map(r=>r.rank)):null);
  assert.equal(d.rows.length,c.leaders.length);
  assert.deepEqual(d.holders,[...new Set(c.leaders.filter(r=>r.rank===1).map(r=>normalizeManager(r.manager)))]);
  const url=new URL(categoryHref(c,name),'https://example.test/analytics/');
  assert.equal(url.searchParams.get('manager'),name);assert.equal(url.searchParams.get('category'),c.key);assert.equal(url.searchParams.get('group'),c.group);
  for(const row of d.first){const story=archivedStory(row,c);assert(story===null||typeof story==='string'&&!story.includes('undefined'));}
 }
}
assert.deepEqual(managerArchivePortfolio(archive,'Tom'),managerArchivePortfolio(archive,'Thommy'));
assert.equal(managerArchivePortfolio(archive,'Unknown'),null);
assert.throws(()=>indexPublishedCategories({...archive,categoryCount:0}));
assert.throws(()=>indexPublishedCategories({...archive,categories:[archive.categories[0],archive.categories[0]],categoryCount:2}));
const shared=archivedRanking(archive,'most-games','Stilly');
assert(shared.holders.includes('Thommy'));assert.equal(shared.personalRank,1);
const streak=archivedRanking(archive,'winning-streak','Mitch');
assert.match(archivedStory(streak.first[0],streak.category),/Postseason results are excluded/);
const narrow=archivedRanking(archive,'narrowest-win','Thommy');
assert.match(archivedStory(narrow.first[0],narrow.category),/0\.16 points/);
console.log('PASS: 44 categories, 440 manager/category comparisons, shared ownership, search, deep links, and story evidence');
