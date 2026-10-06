// Smoke test for docs/mockup/index.html. Run: npm run check:mockup
// Needs Playwright with a Chromium build. Set PLAYWRIGHT_MODULE to its index.mjs if it is not resolvable.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  const fallback = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
  return import(pathToFileURL(fallback).href);
}

const { chromium } = await loadPlaywright();
const page = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'index.html')).href;
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) failures.push(msg); };

const browser = await chromium.launch();
const errs = [];
const p = await browser.newPage({ viewport: { width: 1500, height: 940 } });
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(page);
await p.waitForTimeout(600);

check((await p.$$('.vtab')).length === 4, 'opens with 4 variant tabs');
check((await p.$eval('#prompt', (e) => e.value)).startsWith('Explain pass@k'), 'prompt bar holds the latest prompt');
check(await p.$eval('#suggest', (e) => !e.hidden), 'orchestrator suggestion is shown');
check(+(await p.$eval('#artsCount', (e) => e.textContent)) === 4, '4 artifacts in the opening state');
const opening = +(await p.$eval('#repoCount', (e) => e.textContent));
check(opening >= 20, `repo has the opening history (${opening} commits)`);

await p.click('#suggestUse');
await p.focus('#prompt');
await p.keyboard.press('Control+Enter');
await p.waitForTimeout(13000);
const top = await p.$$eval('#commits > li', (ls) => ls.slice(0, 4).map((l) => l.innerText));
check(/Run 4/.test(top[0]), 'run 4 appears as a group');
check(top.slice(1).every((t) => t.includes('Orchestrator')), 'three orchestrator steps follow the replies');

await p.click('#artsBtn');
await p.waitForTimeout(500);
check((await p.$$('.aw-cell iframe')).length === 4, 'artifacts window shows 4 artifacts side by side');
await p.click('#artsBtn');

await p.click('.dockbtn');
await p.waitForTimeout(200);
check((await p.$eval('.browser', (e) => parseInt(getComputedStyle(e).right, 10))) > 300, 'docking the repo shrinks the browser');
await p.click('.dockbtn');

await p.click('#ttPrev');
await p.waitForTimeout(200);
check(await p.$eval('#ttBanner', (e) => !e.hidden), 'one step back shows the playback banner');
check(await p.$eval('#prompt', (e) => e.readOnly), 'prompt is read only during playback');
await p.click('#ttBack');

await p.evaluate(() => window.mai.setFlag('changesView', 'detailed'));
check(await p.$eval('#commits', (e) => !e.classList.contains('compact')), 'flag changesView=detailed restores the v4 list');
await p.evaluate(() => window.mai.setFlag('changesView', 'compact'));

const m = await browser.newPage({ viewport: { width: 400, height: 860 }, colorScheme: 'dark' });
m.on('pageerror', (e) => errs.push(e.message));
await m.goto(page);
await m.waitForTimeout(400);
const [sw, iw] = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
check(sw === iw, `no horizontal scroll at 400 px (${sw} vs ${iw})`);

check(errs.length === 0, `no page errors${errs.length ? ': ' + errs.join(' | ') : ''}`);
await browser.close();
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall mockup checks passed');
