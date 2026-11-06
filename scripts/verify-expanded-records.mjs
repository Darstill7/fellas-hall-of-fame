// Check source links and every published extra record before deployment.
import fs from "node:fs";
import assert from "node:assert/strict";
const read=file=>JSON.parse(fs.readFileSync(file,"utf8"));
const data=read("data/expanded_records_verified_v1.json");
const unified=read("data/unified_record_book_2016_2026.json");
const placements=read("data/fellas_final_placements_2016_2025_verified.json");
const current=["Stilly","Stew","Tom","Stover","Birch","Tony","Mitch","Kuhl","JMid","Scott"];
const norm=n=>n==="Thommy"?"Tom":n;
const regular=unified.games.filter(g=>g.stage==="regular"&&Number.isFinite(g.homeScore)&&Number.isFinite(g.awayScore)&&g.home!==g.away);
assert.equal(data.version,1);
assert.equal(data.recoveredRegularGames,regular.length);
assert.equal(data.gameContributions,regular.length*2);
assert.equal(data.categoryCount,data.categories.length);
assert.ok(data.categoryCount>=40,"At least 40 documented categories expected");
assert.deepEqual([...data.currentManagers].sort(),[...current].sort());
assert.ok(data.rules.some(x=>x.includes("not necessarily consecutive NFL weeks")));
assert.ok(data.rules.some(x=>x.includes("ESPN scoring")));
assert.ok(data.rules.some(x=>x.toLowerCase().includes("personal best")));
const keys=new Set();
const allNames=new Set(regular.flatMap(g=>[norm(g.home),norm(g.away)]));
for(const category of data.categories){
 assert.ok(category.key&&!keys.has(category.key),"Unique record-category IDs");
 keys.add(category.key);
 assert.ok(category.label&&category.group&&category.description&&category.unit);
 assert.ok(category.entries>=category.leaders.length&&category.leaders.length>0);
 assert.ok(category.leaders.length<=20);
 for(const [i,row] of category.leaders.entries()){
  assert.equal(row.rank,i+1,"Leaderboard ranks must be explicit display-order positions");
  assert.ok(allNames.has(row.manager),"Manager identity must appear in recovered games: "+row.manager);
  assert.ok(Number.isFinite(row.value),"Record marks must be finite numbers");
  assert.ok(row.evidence&&typeof row.evidence==="object");
  if(row.year)assert.ok(row.year>=2016&&row.year<=2026,"Year in archived scope");
  if(row.week)assert.ok(row.week>=1&&row.week<=18,"Week in NFL year");
  if(category.group==="Season")assert.ok(row.year<=2025&&row.evidence.games>=12,"No partial-season record allowed");
 }
}
for(const name of current){
 const sig=data.signatures[name];
 assert.ok(sig&&sig.manager===name,"Missing nickname spotlight "+name);
 assert.ok(sig.highlights.length>=3,"Every manager deserves three sourced personal record examples "+name);
 assert.ok(sig.categoriesWithEvidence>=35,"Every manager must have broad record coverage "+name);
 for(const row of sig.highlights){
  assert.ok(keys.has(row.key),"Spotlight must reference a real record category");
  assert.ok(Number.isFinite(row.value));
  assert.ok(["League top-three","Personal best"].includes(row.scope),"Distinguish actual records from personal bests");
 }
}
const high=data.categories.find(x=>x.key==="highest-score"),low=data.categories.find(x=>x.key==="lowest-score");
const scores=regular.flatMap(g=>[g.homeScore,g.awayScore]);
assert.equal(high.leaders[0].value,Math.max(...scores),"Highest recovered score must match source ledger");
assert.equal(low.leaders[0].value,Math.min(...scores),"Lowest recovered score must match source ledger");
const seasons=data.categories.filter(x=>x.group==="Season");
assert.ok(seasons.length>=5);
const finalNames=new Set(placements.managers.map(x=>norm(x.manager)));
for(const category of data.categories.filter(x=>x.group==="Final standings"))
 for(const r of category.leaders)assert.ok(finalNames.has(r.manager),"Finishing records must use official placement receipts");
const main=fs.readFileSync("analytics/records.html","utf8");
const manager=fs.readFileSync("managers/record-books.html","utf8");
const explorer=fs.readFileSync("analytics/expanded-records.html","utf8");
assert.ok(main.includes('id="expanded-records-teaser"'));
assert.ok(manager.includes('id="expanded-manager-records"'));
assert.ok(explorer.includes('id="expanded-records-explorer"'));
for(const name of current){
 const slug=name.toLowerCase(),page=fs.readFileSync("managers/"+slug+"/index.html","utf8");
 assert.ok(page.includes('data-expanded-records-profile="'+name+'"'),"Manager profile missing sourced signature "+name);
 assert.ok(page.includes("expanded-records.mjs"),"Manager profile missing record renderer "+name);
}
console.log("EXPANDED RECORDS VERIFIED: "+data.categoryCount+" categories, "+current.length+" manager profiles, "+regular.length+" recovered regular-season matchups");
