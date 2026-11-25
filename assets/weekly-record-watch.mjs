import {fellasLeague,normalizeManager} from './league-config.mjs';

export const weeklyOwnershipVerbs = Object.freeze({
  BROKEN:'New record',EXTENDED:'Record extended',TIED:'Record tied',OWNERSHIP_CHANGED:'Holders changed'
});

// The slim homepage projection and the full ledger encode the same approved games.
export function recordWatchScoreInput(games,year) {
  const rows = games.filter(game=>game.year===year&&game.stage==='regular').map(game=>[
    game.week,normalizeManager(game.home),normalizeManager(game.away),game.homeScore,game.awayScore
  ]);
  return JSON.stringify(rows.sort((a,b)=>a[0]-b[0]||(a[1]<b[1]?-1:a[1]>b[1]?1:0)));
}

export async function matchesRecordWatchScores(ledger,year,expected) {
  if(typeof expected!=='string'||!Array.isArray(ledger?.games))return false;
  const digest=await globalThis.crypto?.subtle?.digest('SHA-256',
    new TextEncoder().encode(recordWatchScoreInput(ledger.games,year)));
  if(!digest)return false;
  const fingerprint=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  return fingerprint===expected;
}

export async function matchWeeklyRecordWatch(report,ledger,week) {
  const year = fellasLeague.season;
  if(report?.schemaVersion!==1||report.year!==year||report.week!==week||report.previousWeek!==week-1||
    report.current?.week!==week||report.current?.year!==year||!Array.isArray(report.current.marks)||
    !Array.isArray(report.changes)||!Array.isArray(ledger?.games))return null;
  if(!await matchesRecordWatchScores(ledger,year,report.current.seasonScoreHash))return null;

  const marks = new Map(report.current.marks.map(mark=>[mark?.id,mark]));
  const valid = report.changes.every(change=>{
    const mark = marks.get(change?.id);
    return mark&&/^established-record-[a-z0-9-]+$/.test(change.id)&&Object.hasOwn(weeklyOwnershipVerbs,change.type)&&
      change.label===mark.label&&change.value===mark.value&&Number.isFinite(change.value)&&change.unit===mark.unit&&
      Array.isArray(change.holders)&&change.holders.length>0&&Array.isArray(mark.holders)&&
      change.holders.join('|')===mark.holders.join('|')&&Array.isArray(change.left);
  });
  return valid?report:null;
}

export function renderWeeklyRecordWatch(host,report,manager) {
  if(!host)return;
  const changes = (report?.changes??[]).filter(change=>manager===undefined||
    change.holders.includes(manager)||change.left.includes(manager));
  host.replaceChildren();
  host.hidden = changes.length===0;
  if(host.hidden)return;

  const el = (tag,text)=>{
    const node=document.createElement(tag);
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const heading = el(manager===undefined?'h2':'h3','Record Watch · Week '+report.week);
  heading.id = host.getAttribute('aria-labelledby');
  const list = el('ul');
  for(const change of changes){
    const item = el('li');
    const detail = manager!==undefined&&change.left.includes(manager)
      ? 'Now held by '+change.holders.join(', ')
      : weeklyOwnershipVerbs[change.type]+' · '+change.holders.join(', ');
    const link = el('a',change.label+' · '+change.value+(change.unit==='%'?'%':' '+change.unit));
    link.href='analytics/record-holders.html?app=1#'+change.id;
    item.append(el('small',detail),link);
    list.append(item);
  }
  host.append(heading,list);
}
