import CDP from 'chrome-remote-interface';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const url = process.argv[2];
const out = process.argv[3];
const port = 9334;
const proc = spawn('chromium', [
  '--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars',
  `--remote-debugging-port=${port}`,
  '--window-size=1200,900','about:blank'
], { stdio: 'inherit' });

await new Promise(r => setTimeout(r, 2500));
const client = await CDP({ port });
const { Page, Runtime, Emulation } = client;
await Page.enable(); await Runtime.enable();
await Emulation.setDeviceMetricsOverride({ width:1200, height:900, deviceScaleFactor:1, mobile:false });
await Page.navigate({ url });
await Page.loadEventFired();
await new Promise(r => setTimeout(r, 6000));
for (let i=0;i<20;i++){
  const { result } = await Runtime.evaluate({ expression: `(/\\$[\\d,]+/.test(document.body.innerText))` });
  if (result.value) break;
  await new Promise(r => setTimeout(r, 1000));
}
// Click accept on cookie banner if present
await Runtime.evaluate({ expression: `
  (function(){
    const btns = [...document.querySelectorAll('button')];
    const accept = btns.find(b => /accept/i.test(b.textContent||''));
    if (accept) accept.click();
  })();
` });
await new Promise(r => setTimeout(r, 1500));
await Runtime.evaluate({ expression: 'window.scrollBy(0, 220)' });
await new Promise(r => setTimeout(r, 1500));
const { data } = await Page.captureScreenshot({ format: 'png' });
fs.writeFileSync(out, Buffer.from(data, 'base64'));
await client.close(); proc.kill();
console.log('SHOT', out, fs.statSync(out).size);
