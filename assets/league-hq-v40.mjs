// League HQ briefing: interpret verified completed games, never replace Sleeper.
import {fellasLeague,normalizeManager,managerSlug} from './league-config.mjs';
const format=n=>n.toLocaleString('en-US',{maximumFractionDigits:2,minimumFractionDigits:2});
export function buildHQBriefing(d,personal){
 if(!d||!Number.isInteger(d.week)||d.week<1||d.week>fellasLeague.regularSeasonWeeks||d.standings?.length!==10)return [];
 const remaining=fellasLeague.regularSeasonWeeks-d.week,items=[];
 const add=(id,kicker,title,detail,href)=>items.push({id,kicker,title,detail,href});
 if(remaining>0)add('playoff','THE PLAYOFF PUSH',remaining===1?'One regular-season week left':remaining+' regular-season weeks remaining','Six playoff spots · two first-round byes. Explore the scenarios, not just the standings.','analytics/playoff-race.html');
 else add('playoff','POSTSEASON','The regular-season archive is complete','Explore the playoff center for verified scenarios and results.','analytics/playoff-race.html');
 if(personal?.opponent&&remaining>0)add('rivalry','YOUR NEXT CHAPTER',personal.team.name+' vs '+personal.opponent.name,'Week '+personal.week+' · explore the history between these franchises.','analytics/rivalry-war-room.html?a='+encodeURIComponent(personal.team.name)+'&b='+encodeURIComponent(personal.opponent.name));
 const runs=d.standings.filter(r=>r.streak?.startsWith('W')).sort((a,b)=>Number(b.streak.slice(1))-Number(a.streak.slice(1)));
 const best=Number(runs[0]?.streak.slice(1));
 if(best>=3){const leaders=runs.filter(r=>Number(r.streak.slice(1))===best);add('run','LEAGUE TALKING POINT',leaders.map(r=>r.name).join(' & ')+' · '+best+' straight wins','Current regular-season streak through Week '+d.week+'. Not an all-game streak.',leaders.length===1?'managers/'+managerSlug(leaders[0].name)+'/':'#league')}
 if(d.leaders?.length&&Number.isFinite(d.leaders[0].latest))add('score','WEEK '+d.week+' SCORING LEAD',d.leaders.map(r=>r.name).join(' & ')+' · '+format(d.leaders[0].latest),'Completed matchup scoring leader'+(d.leaders.length>1?'s':'')+'.','analytics/sportscenter.html');
 return items.slice(0,3);
}
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n};
export function renderHQBriefing(d,personal){
 const host=document.getElementById('hq40-briefing');if(!host)return;
 host.replaceChildren();
 for(const item of buildHQBriefing(d,personal)){
  const a=el('a',null,'hq40-briefing-item');a.href=item.href;a.dataset.briefingId=item.id;
  const copy=el('div');copy.append(el('small',item.kicker),el('strong',item.title),el('p',item.detail));a.append(copy,el('span','›','hq40-arrow'));host.append(a);
 }
}
export function enhanceHQFranchise(card,p,d){
 if(!card||!p)return;
 card.classList.add('hq40-franchise-card');
 const header=el('div',null,'hq40-franchise-kicker');header.append(el('span','YOUR FRANCHISE'),el('span','THROUGH WEEK '+d.week));card.prepend(header);
 const form=card.querySelector('.team-form');
 if(form){const code=p.team.streak?.[0],run=Number(p.team.streak?.slice(1));if(run>=1&&['W','L','T'].includes(code))form.append(el('small',run+' consecutive '+(code==='W'?'wins':code==='L'?'losses':'ties')+' · regular season','hq40-form-context'))}
 const links=el('div',null,'hq40-franchise-actions');
 for(const [label,href,detail] of [['Franchise HQ','#my-team-section','Season & outlook'],['My records','analytics/records.html?manager='+encodeURIComponent(p.team.name)+'&app=1','Legacy & milestones'],['Playoff race','analytics/playoff-race.html','Scenarios & seeding']]){
  const a=el('a');a.href=href;a.append(el('strong',label),el('small',detail));links.append(a);
 }
 card.querySelector('.personal-home-cta')?.replaceWith(links);
}
