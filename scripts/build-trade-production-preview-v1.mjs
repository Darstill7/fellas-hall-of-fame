// Reproducible research artifact; not an approved public grade feed.
import fs from 'node:fs';
import {buildProductionPreview} from '../assets/trade-production-preview-v1.mjs';
const html=fs.readFileSync('analytics/trade-museum.html','utf8');
const match=html.match(/<script[^>]*id="archive-data"[^>]*>([\s\S]*?)<\/script>/);
if(!match)throw Error('Trade archive missing');
const report=buildProductionPreview(JSON.parse(match[1]));
process.stdout.write(JSON.stringify(report,null,2)+'\n');
