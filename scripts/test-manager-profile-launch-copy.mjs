import fs from 'node:fs';
const managers=['stilly','jmid','tom','stew','scott','mitch','tony','stover','kuhl','birch'];
const obsolete=/The Fellas OS v5|static-first pre-publish build|Franchise encyclopedia · v9\\.15|Players, Waivers & Trade Receipts/;
for(const slug of managers){
 const path='managers/'+slug+'.html';
 const html=fs.readFileSync(path,'utf8');
 if(obsolete.test(html))throw Error('Outdated public build label remains on '+path);
 if(!html.includes('Career records and player histories are drawn from documented league results. Coverage varies by season.'))throw Error('Manager history disclaimer missing on '+path);
 if(!html.includes('manager-profile-tabs.mjs'))throw Error('Manager profile navigation disconnected on '+path);
}
console.log('All ten manager profiles have launch-ready public copy and preserve feature navigation.');
