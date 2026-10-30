import {maddenOvr,MADDEN_SCALE} from '../assets/manager-madden-scale.mjs';
import fs from 'node:fs';
if(maddenOvr(0)!==65||maddenOvr(40)!==85||maddenOvr(50)!==90||maddenOvr(60)!==95||maddenOvr(100)!==99)throw Error('Madden scale calibration changed');
for(let raw=0;raw<=100;raw+=.1){
 const v=maddenOvr(raw);
 if(!Number.isFinite(v)||v<65||v>99||Math.abs(v*10-Math.round(v*10))>0.0001)throw Error('Invalid Madden presentation value');
 if(raw&&v<maddenOvr(raw-.1))throw Error('Madden ratings must be monotonic');
}
const homepage=fs.readFileSync('assets/home-manager-cards.mjs','utf8'),profile=fs.readFileSync('assets/manager-profile-madden.mjs','utf8'),cards=fs.readFileSync('assets/manager-madden-cards.mjs','utf8'),page=fs.readFileSync('analytics/manager-madden-cards.html','utf8');
if(!homepage.includes('maddenOvr(r.score)')||!profile.includes('maddenOvr(manager.score)')||!profile.includes('maddenOvr(s.row.ovr)')||!cards.includes('maddenOvr(historical?.ovr??r.score)')||!cards.includes('maddenOvr(score(a))')||!page.includes('underlying score'))throw Error('A Madden display surface is still using the raw success index');
console.log('MADDEN SCALE PASS: stable 65–99 rating, monotonic and consistent across history and current display');
