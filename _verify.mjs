import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2];
const port = 9337;
const proc = spawn('chromium', [
  '--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',
  `--remote-debugging-port=${port}`,'--window-size=1400,1000','about:blank'
], { stdio: 'pipe' });
await new Promise(r => setTimeout(r, 2500));
const client = await CDP({ port });
const { Page, Runtime, Console } = client;
const errs = [];
await Page.enable(); await Runtime.enable();
Runtime.exceptionThrown(e => errs.push('EX:' + (e.exceptionDetails?.exception?.description || e.exceptionDetails?.text)));
Runtime.consoleAPICalled(e => { if (e.type === 'error') errs.push('CON:' + e.args.map(a=>a.value||a.description).join(' ')); });
await Page.navigate({ url });
await Page.loadEventFired();
await new Promise(r => setTimeout(r, 4000));
const root = await Runtime.evaluate({ expression: 'document.getElementById("root")?.children.length || 0' });
const stepImgs = await Runtime.evaluate({ expression: `JSON.stringify([...document.querySelectorAll('img')].map(i=>i.currentSrc||i.src).filter(s=>s.includes('home-step')))` });
const probe = await Runtime.evaluate({ expression: `(async () => {
  const urls = ['/lovable-uploads/home-step1-mercury-proxs-lineup.jpg','/lovable-uploads/home-step2-real-quote-builder.jpg','/lovable-uploads/home-step3-rice-lake-water-test.jpg'];
  const out = {};
  for (const u of urls) { try { const r = await fetch(u + '?p=1', {method:'HEAD'}); out[u] = r.status; } catch(e){ out[u]='ERR'; } }
  return JSON.stringify(out);
})()`, awaitPromise: true });
const shot = await Page.captureScreenshot({ format: 'png' });
fs.writeFileSync('/mnt/documents/home-verify.png', Buffer.from(shot.data, 'base64'));
console.log('rootChildren:', root.result.value);
console.log('stepImgs:', stepImgs.result.value);
console.log('probe:', probe.result.value);
console.log('errors:', errs.length, JSON.stringify(errs.slice(0,5)));
await client.close(); proc.kill();
