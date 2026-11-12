// Schedule Luck: regular-season opponent-draw differential, completed seasons only.
// Source: Hall of Fortune registry, itself derived from fully paired all-play weeks.
export async function mountManagerScheduleLuck(profileName,hero){
 if(!hero||!profileName||hero.querySelector('[data-schedule-luck]'))return;
 const name=profileName==='Tom'?'Thommy':profileName;
 try{
  const response=await fetch('../../data/hall_of_fortune_2016_2026w9_v1.json',{cache:'no-store'});
  if(!response.ok)throw Error('Schedule Luck data unavailable');
  const registry=await response.json();
  const rows=registry.careerScheduleSurplusNormalized;
  if(!Array.isArray(rows))return;
  const item=rows.find(row=>row.manager===name);
  if(!item||!Number.isFinite(item.winSurplus)||!Number.isFinite(item.surplusPerWeek))return;
  const signed=(number,places=2)=>(number>0?'+':'')+number.toFixed(places);
  const block=document.createElement('section');
  block.className='profile-schedule-luck';
  block.dataset.scheduleLuck=name;
  block.setAttribute('aria-label','Career schedule luck');
  block.style.cssText='margin:18px 0;padding:16px 20px;border:1px solid #8b7750;border-radius:12px;background:#152834;color:#f5f1e7';
  const eyebrow=document.createElement('div');
  eyebrow.textContent='SCHEDULE LUCK · COMPLETED SEASONS 2016–2025';
  eyebrow.style.cssText='font-size:11px;letter-spacing:.09em;font-weight:800;color:#e6cb91';
  const stat=document.createElement('strong');
  stat.textContent=signed(item.winSurplus)+' wins vs. expectation';
  stat.style.cssText='display:block;font-size:clamp(22px,3.5vw,33px);line-height:1.2;margin:6px 0';
  const detail=document.createElement('p');
  detail.textContent=item.actualWinCredits.toLocaleString('en-US')+' actual win credits − '+item.expectedWins.toFixed(2)+' expected wins · '+item.seasons+' seasons · '+item.pairedWeeks+' comparable weeks.';
  detail.style.cssText='margin:4px 0 8px;font-size:13px;line-height:1.5;color:#d3dce2';
  const normalized=document.createElement('p');
  normalized.textContent='Per-week advantage: '+signed(item.surplusPerWeek,4)+'. This measures opponent draw—not manager skill. Incomplete and 2026 weeks are excluded from this career record.';
  normalized.style.cssText='margin:0 0 8px;font-size:12px;line-height:1.5;color:#c4d1d9';
  const link=document.createElement('a');
  link.href='../../analytics/record-holders.html#schedule-luck-leaderboard';
  link.textContent='Compare every manager’s Schedule Luck →';
  link.style.cssText='display:inline-block;min-height:44px;padding-top:10px;color:#f2d28d;font-weight:750;font-size:13px';
  block.append(eyebrow,stat,detail,normalized,link);
  // Current year is provisional and never changes the completed-season career record.
  try{
   const latestResponse=await fetch('../../data/schedule_luck_current_v1.json',{cache:'no-store'});
   if(latestResponse.ok){
    const latest=await latestResponse.json();
    const row=latest.currentSeasonProvisional?.find(x=>x.manager===name);
    if(row&&latest.currentThroughWeek!==null){
     const live=document.createElement('p');
     live.textContent='2026 through approved Week '+latest.currentThroughWeek+': '+signed(row.scheduleLuckWins)+' wins vs expectation (provisional, '+row.pairedWeeks+' paired weeks).';
     live.style.cssText='font-size:13px;line-height:1.5;margin:8px 0;color:#efd69c';
     block.insertBefore(live,link);
    }
   }
  }catch{ /* Current-year display is optional; completed career score remains authoritative. */ }
  if(name==='Birch'){
   const holder=document.createElement('small');
   holder.textContent='ALL-TIME RECORD HOLDER · Most favorable cumulative schedule draw';
   holder.style.cssText='display:block;color:#efd38c;font-weight:800;letter-spacing:.03em';
   block.insertBefore(holder,link);
  }
  const snapshot=hero.querySelector('[data-profile-career-snapshot]');
  (snapshot||hero.querySelector(':scope > .lead')||hero.querySelector('h1'))?.after(block);
 }catch(error){
  // Do not show an invented default score when the registry is unavailable.
  console.warn('Schedule Luck temporarily unavailable',error);
 }
}
