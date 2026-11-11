// Current-season Advanced Metrics: derive all-play from the same verified weekly team scores as the season hub.
// No historical claims are inferred from incomplete weeks or older editorial snapshots.
const rows = document.getElementById('current-metrics-rows');
const status = document.getElementById('current-metrics-status');
const weekBadge = document.getElementById('current-metrics-week');
const names = ['Stilly','Stew','Thommy','Stover','Birch','Tony','Mitch','Kuhl','JMid','Scott'];
const slug = name => name === 'Thommy' ? 'tom' : name.toLowerCase();
const fmt = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const percent = n => (n>=0?'+':'')+fmt(n);
try {
  const response = await fetch('../data/season_weekly_matchups_2016_2026_v1.json', {cache:'no-store'});
  if (!response.ok) throw Error('Approved season results could not be downloaded');
  const data = await response.json();
  const season = data.bySeason?.['2026'];
  if (!season) throw Error('Verified 2026 season dataset is missing');
  const games = season.games.filter(g => g.stage === 'regular');
  const lastWeek = Math.max(...games.map(g=>g.week));
  if (!Number.isInteger(lastWeek) || lastWeek<1) throw Error('No verified regular-season week');
  const totals = new Map(names.map(name => [name,{name,w:0,l:0,t:0,pf:0,pa:0,allWins:0,allTies:0,games:0}]));
  for (let week=1;week<=lastWeek;week++) {
    const matches = games.filter(g => g.week===week);
    if (matches.length!==5) throw Error('Incomplete Week '+week+' matchups');
    const entries = [];
    for (const g of matches) {
      if (!totals.has(g.home)||!totals.has(g.away)) throw Error('Unrecognized manager in Week '+week);
      entries.push([g.home,Number(g.homeScore),Number(g.awayScore)]);
      entries.push([g.away,Number(g.awayScore),Number(g.homeScore)]);
    }
    if (entries.length!==10 || new Set(entries.map(x=>x[0])).size!==10 || entries.some(x=>!Number.isFinite(x[1])||!Number.isFinite(x[2]))) {
      throw Error('Missing scores for Week '+week);
    }
    for (const [name, score, conceded] of entries) {
      const row = totals.get(name);
      row.games++;row.pf+=score;row.pa+=conceded;
      if (score>conceded) row.w++; else if(score<conceded) row.l++; else row.t++;
      for(const [other, against] of entries) {
        if(other===name)continue;
        if(score>against)row.allWins++;else if(score===against)row.allTies++;
      }
    }
  }
  if (season.regularGames!==games.length) throw Error('Regular-season game count disagrees with verified ledger');
  const ranked = [...totals.values()].sort((a,b)=>(b.w+b.t/2)-(a.w+a.t/2)||b.pf-a.pf);
  rows.replaceChildren();
  for(const r of ranked) {
    const expected=(r.allWins + r.allTies/2)/9;
    const fortune=r.w+r.t/2-expected;
    const tr=document.createElement('tr');
    tr.innerHTML='<td><a href="../managers/'+slug(r.name)+'/">'+esc(r.name)+'</a></td>'+
      '<td>'+r.w+'–'+r.l+(r.t?'–'+r.t:'')+'</td>'+
      '<td>'+fmt(r.pf)+'</td>'+
      '<td>'+r.allWins+'–'+(r.games*9-r.allWins-r.allTies)+(r.allTies?' ('+r.allTies+' ties)':'')+'</td>'+
      '<td>'+fmt(expected)+'</td>'+
      '<td class="'+(fortune>=0?'pos':'neg')+'">'+percent(fortune)+'</td>';
    rows.append(tr);
  }
  weekBadge.textContent='Verified through Week '+lastWeek;
  status.textContent='Latest approved 2026 dataset: '+lastWeek+' completed weeks, '+games.length+' final matchups, 10 managers. Historical Week 6 analysis appears only in the collapsed archive below.';
} catch (error) {
  rows.innerHTML='<tr><td colspan="6">Current metrics are temporarily unavailable. <a href="../seasons/2026.html">Open the verified 2026 Season Hub</a>.</td></tr>';
  weekBadge.textContent='Verification unavailable';
  status.textContent='Current metrics could not be verified; archived figures are not substituted as current.';
  console.error('Current Advanced Metrics:',error);
}
