import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync('hall/shame.html','utf8');
const groups=['shame-trades','shame-lineups','shame-scores','shame-faab'];
for(const id of groups){
 assert.match(html,new RegExp('id="'+id+'" aria-labelledby="'+id+'-heading"'),'missing named section: '+id);
 assert.match(html,new RegExp('href="#'+id+'"'),'missing jump link: '+id);
}
assert.equal((html.match(/class="card shame-card"/g)||[]).length,11,'all eleven archive cards must remain readable');
assert.equal((html.match(/class="shame-category"/g)||[]).length,4,'must have four editorial groups');
assert.match(html,/Shitter of the Year/,'league terminology must be explicit');
assert.match(html,/record-holders\.html#shitter-year-history/,'verified Shitter evidence link missing');
assert.match(html,/\.shame-cards\{grid-template-columns:1fr/,'mobile cards must stack');
assert.match(html,/\.shame-jump\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/,'mobile jump links must fit two columns');
assert.doesNotMatch(html,/Week 6 snapshot/,'archived page must not claim a current live week');
assert.doesNotMatch(html,/href="\.\.\/managers\/stilly\.html">(?:👤 |<span>♟<\/span>)?Managers/,'Managers navigation must reach directory, not Stilly');
console.log('PASS: Hall of Shame editorial navigation, eleven cards, responsive layout, and terminology.');
