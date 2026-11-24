// Fast offline source checks; complements, never replaces browser/data tests.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
const root='data-integrity';
const pages=['front-office-preview.html','trading-floor-preview.html','acquisition-hall-preview.html','player-encyclopedia-preview.html','manager-acquisition-resume-preview.html','draft-room-preview.html'];
for(const page of pages){
 const html=fs.readFileSync(path.join(root,page),'utf8');
 assert(/<meta[^>]+name="robots"[^>]+content="noindex,nofollow"/.test(html),page+' missing noindex');
 assert(/<meta[^>]+name="viewport"/.test(html),page+' missing viewport');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,page+' duplicate static IDs');
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert(scripts.length,page+' missing inline program');
 for(const [i,s] of scripts.entries())new vm.Script(s[1],{filename:page+':script'+i});
 for(const link of html.matchAll(/\bhref="([^"]+\.html)"/g))assert(fs.existsSync(path.join(root,link[1])),page+' broken link '+link[1]);
 assert(!/<script[^>]+src=|<link[^>]+href="https?:/i.test(html),page+' external dependency');
 console.log('FRONT OFFICE STATIC PASS '+page+' '+ids.length+' static IDs');
}
