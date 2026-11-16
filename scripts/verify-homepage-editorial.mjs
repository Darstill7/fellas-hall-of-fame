import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('index.html');
const css=read('assets/homepage-editorial-frontpage.css');
assert(html.includes('homepage-editorial-frontpage.css')&&html.includes('home-adventure-v1.css'),'Homepage editorial and mobile adventure stylesheets must load');
assert(html.includes('class="hero home-editorial-hero"'),'Editorial hero missing');
assert(html.includes('id="homepage-editorial-title"'),'Homepage first-screen heading anchor missing');
assert(html.includes('class="home-editorial-lead"'),'Featured championship lead missing');
assert(html.includes('href="hall/championship-stories.html?year=2025"'),'Featured story must lead to correct championship');
assert(html.includes('href="analytics/record-holders.html"'),'Manager-first Record Book destination missing');
assert(html.includes('href="#home-manager-title"'),'Manager discovery shortcut missing');
assert(html.includes('id="home-manager-title"'),'Manager search destination missing');
assert(html.includes('id="home-season-snapshot"'),'Live season ledger surface missing');
assert(html.includes('id="home-manager-mobile"'),'Mobile manager finder missing');
// The homepage now keeps both featured destinations in the compact editorial
// story rail, while the six-way discovery hub handles general navigation.
assert.equal((html.match(/class="discovery-card adventure-/g)||[]).length,6,'Six essential destinations must remain');
assert(html.includes('What brings you to The Fellas?'),'Homepage must explain the first adventure decision');
assert(html.includes('Choose your adventure'),'Homepage must include a clear hero launch action');
assert.equal((html.match(/class="discovery-card adventure-/g)||[]).length,6,'All six adventure choices must have distinct categories');
const directLinks=html.match(/class="home-franchise-links"[\\s\\S]*?<\\/div>/)?.[0]||'';
for(const slug of ['stilly','stew','tom','mitch','jmid','scott','stover','kuhl','tony','birch'])
 assert(directLinks.includes('href="managers/'+slug+'/"'),'Missing one-tap manager route: '+slug);
assert(html.indexOf('id="explore-the-league"')<html.indexOf('id="home-now-heading"'),'First-time exploration must precede standings');

const storyRailStart=html.indexOf('<section class="section shell home-featured-editorial"');
const storyRailEnd=html.indexOf('</section>',storyRailStart);
const storyRail=storyRailStart>=0&&storyRailEnd>storyRailStart?html.slice(storyRailStart,storyRailEnd):'';
assert(storyRail.includes('href="hall/championship-stories.html"'),'Championship anthology link missing from story rail');
assert(storyRail.includes('href="analytics/record-stories.html?record=highest"'),'Historic matchup story missing from story rail');
const sequence=['id="explore-the-league"','id="home-now-heading"','aria-label="Latest Weekly Shitter issue"','id="home-manager-title"','id="home-featured-heading"','id="season-records-home"'].map(marker=>html.indexOf(marker));
assert(sequence.every((position,index)=>position>=0&&(index===0||position>sequence[index-1])),'Homepage must introduce adventure choices before current-season stats, then editorial issue, managers, stories and research');
assert(html.includes('class="home-advanced-managers"'),'Full manager ratings explorer must remain opt-in');
assert(html.includes('id="home-manager-search"'),'Advanced manager search must remain functional');
assert.equal(html.split('<h1').length-1,1,'Homepage must have one h1');
assert.equal(html.split('<section').length-1,html.split('</section>').length-1,'Homepage sections must be balanced');
assert(css.includes('@media(max-width:650px)'),'First-screen manager-first mobile layout missing');
assert(css.includes('prefers-reduced-motion'),'Reduced-motion fallback missing');
console.log('PASS: editorial homepage cover, story and Record Book links, manager finder, canonical season snapshot');
