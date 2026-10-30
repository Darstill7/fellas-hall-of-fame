// Postseason success supplement: certified finishes only.
export const SUCCESS_WEIGHTS={championships:20,finals:8,playoffs:12};
export function postseasonReport(name,endings){
 const rows=(endings.managers[name]||[]).filter(x=>x.year<=2025);
 const titles=rows.filter(x=>x.ending==='Champion').length;
 const runners=rows.filter(x=>x.ending==='Runner-up').length;
 const minimumPlayoffs=titles+runners;
 const f=n=>Math.round(1000*(1-Math.exp(-n)))/10;
 return {titles,runners,minimumPlayoffs,scores:{championships:f(titles/1.8),finals:f(runners/1.5),playoffs:minimumPlayoffs?f(minimumPlayoffs/3):null},limited:true};
}
