// Phase 2: static, data-neutral checks for the current manager chapter UI.
// Browser/visual signoff remains a separate mandatory release gate.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read=file=>fs.readFileSync(file,'utf8');
const slugs=['birch','jmid','kuhl','mitch','scott','stew','stilly','stover','tom','tony'];
const css=read('assets/manager-profile-mobile-v3.css');
const script=read('assets/manager-profile-tabs.mjs');

assert.match(css,/Phase 2 — chapter hierarchy/);
assert.match(css,/counter-reset:fellas-profile-chapter/);
assert.match(css,/counter-increment:fellas-profile-chapter/);
assert.match(css,/counter\(fellas-profile-chapter,decimal-leading-zero\)/);
assert.match(css,/:focus-visible/);
assert.match(css,/@media\(max-width:380px\)/);

const groups=['Career & Results','Rivals & Matchups','Drafts, Trades & Pickups','Ratings & Legacy','Lineups & Keepers'];
for(const title of groups){
 assert.ok(script.includes("title:'"+title+"'"),'Missing existing research group: '+title);
}
assert.match(script,/const disclosure=document\.createElement\('details'\);disclosure\.className='profile-feature-group'/);
assert.match(script,/legacyNav\.replaceWith\(nav\)/);
for(const slug of slugs){
 const html=read('managers/'+slug+'/index.html');
 assert.ok(html.includes('../../assets/manager-profile-mobile-v3.css'),slug+' missing chapter styling');
 assert.ok(html.includes('../../assets/manager-profile-tabs.mjs'),slug+' missing existing tab navigator');
 assert.ok(html.includes('profile-chapters'),slug+' missing no-JavaScript chapter links');
}
console.log('PASS: 10 manager profiles share existing five chapter groups, accessible fallback and numbered styling.');
