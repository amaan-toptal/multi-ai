// Smoke test for docs/mockup/index.html. Run: npm run check:mockup
// Needs Playwright with a Chromium build. Set PLAYWRIGHT_MODULE to its index.mjs if it is not resolvable.
// The page is a workspace shell; each project runs in an iframe named proj-<id> (landwater, passk, replay).
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
const trap = () => { window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(e.message)); };
const frameErrors = async (pg) => (await Promise.all(pg.frames().map((f) => f.evaluate(() => window.__errs || []).catch(() => [])))).flat();

const browser = await chromium.launch();
const errs = [];
const p = await browser.newPage({ viewport: { width: 1500, height: 940 } });
p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(trap);
await p.goto(page);
await p.waitForTimeout(1500);

// workspace shell
check((await p.$$('.pw')).length === 3, 'canvas opens with 3 project windows');
check((await p.$$('.mtop')).length === 6, 'menu bar has File, Edit, View, Project, Window, Help');
check(/3 need you/.test(await p.textContent('#needsBtn')), 'menu bar counts 3 projects that need you');
const z0 = await p.evaluate(() => window.maiShell.view.z);
await p.click('#zIn'); await p.waitForTimeout(450);
check((await p.evaluate(() => window.maiShell.view.z)) > z0, 'zoom in enlarges the canvas');
await p.click('#zFit'); await p.waitForTimeout(450);
await p.click('.mtop[data-m="file"]');
check((await p.$$('.mpop button')).length >= 6, 'File menu opens with its items');
await p.keyboard.press('Escape');

// Land or Water? story: three steps, the last two from the orchestrator
const lw = p.frame({ name: 'proj-landwater' });
check((await lw.$$('.tl-card:not(.next)')).length === 3, 'Land or Water? timeline shows 3 steps');
check((await lw.$$('.tl-src.orch')).length >= 2, 'steps 2 and 3 are orchestrator suggestions');
check((await lw.$$('.tl-thumbs img')).length === 12, 'timeline shows 12 map thumbnails (4 models x 3 steps)');
const lwChips = await lw.$$eval('.checks', (cs) => cs.map((c) => c.textContent));
check(lwChips.some((t) => /F2P ✗/.test(t)) && lwChips.some((t) => /F2P ✓/.test(t)), 'F2P scorer passes the good maps and fails the one below always-Water');
check(lwChips.some((t) => /rubric \d\/5/.test(t)), 'rubric grades appear on the replies');
await lw.click('[data-dbg="timeline-step:1"]'); await p.waitForTimeout(400);
check(await lw.$eval('#ttBanner', (e) => !e.hidden), 'clicking step 1 starts playback');
const gaps = await lw.$$eval('.pane .thread', (ts) => ts.filter((t) => t.offsetParent).map((t) => t.scrollHeight - t.clientHeight - t.scrollTop));
check(gaps.length > 0 && gaps.every((g) => g < 2), 'in playback every pane is scrolled to its latest reply');
await lw.click('#ttBack');

// pass@k story: the v5 checks, now inside its project window
const f = p.frame({ name: 'proj-passk' });
await p.evaluate(() => window.maiShell.focus('passk')); await p.waitForTimeout(300);
check((await f.$$('.vtab')).length === 4, 'pass@k project opens with 4 variant tabs');
check((await f.$eval('#prompt', (e) => e.value)).startsWith('Explain pass@k'), 'prompt bar holds the latest prompt');
check(await f.$eval('#suggest', (e) => !e.hidden), 'orchestrator suggestion is shown');
check(+(await f.$eval('#artsCount', (e) => e.textContent)) === 4, '4 artifacts in the opening state');
const opening = +(await f.$eval('#repoCount', (e) => e.textContent));
check(opening >= 20, `repo has the opening history (${opening} commits)`);
await f.click('#suggestUse');
await f.focus('#prompt');
await p.keyboard.press('Control+Enter');
await p.waitForTimeout(13000);
await f.click('#repoBtn'); await p.waitForTimeout(200);
const top = await f.$$eval('#commits > li', (ls) => ls.slice(0, 4).map((l) => l.innerText));
check(/Run 4/.test(top[0]), 'run 4 appears as a group');
check(top.slice(1).every((t) => t.includes('Orchestrator')), 'three orchestrator steps follow the replies');
const qwen = await f.$$eval('.checks', (cs) => cs.map((c) => c.textContent).pop());
check(/F2P ✗/.test(qwen), "F2P probe catches qwen3's wrong pass@k formula in run 4");
await f.click('#artsBtn'); await p.waitForTimeout(500);
check((await f.$$('.aw-cell iframe')).length === 4, 'artifacts window shows 4 artifacts side by side');
await f.click('#artsBtn');
await f.click('.dockbtn'); await p.waitForTimeout(200);
check((await f.$eval('.browser', (e) => parseInt(getComputedStyle(e).right, 10))) > 300, 'docking the repo shrinks the browser');
await f.click('.dockbtn');
await f.click('#ttPrev'); await p.waitForTimeout(200);
check(await f.$eval('#ttBanner', (e) => !e.hidden), 'one step back shows the playback banner');
check(await f.$eval('#prompt', (e) => e.readOnly), 'prompt is read only during playback');
await f.click('#ttBack');
await f.evaluate(() => window.mai.setFlag('changesView', 'detailed'));
check(await f.$eval('#commits', (e) => !e.classList.contains('compact')), 'flag changesView=detailed restores the v4 list');
await f.evaluate(() => window.mai.setFlag('changesView', 'compact'));

// v5 layout behind flags
await p.evaluate(() => { window.maiShell.setFlag('workspace', 'single'); window.maiShell.setFlag('menuBar', 'plain'); });
await p.waitForTimeout(300);
const single = await p.evaluate(() => [...document.querySelectorAll('.pw')].filter((w) => getComputedStyle(w).display !== 'none').map((w) => w.getBoundingClientRect().width));
check(single.length === 1 && single[0] === 1500, 'workspace=single + menuBar=plain shows one project full screen (v5)');
check(await f.$eval('.menubar .app-name', (e) => getComputedStyle(e).display !== 'none'), 'the v5 project menu bar comes back');
await p.evaluate(() => { window.maiShell.setFlag('workspace', 'canvas'); window.maiShell.setFlag('menuBar', 'menus'); });

const m = await browser.newPage({ viewport: { width: 400, height: 860 }, colorScheme: 'dark' });
m.on('pageerror', (e) => errs.push(e.message));
await m.addInitScript(trap);
await m.goto(page);
await m.waitForTimeout(1200);
const [sw, iw] = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
check(sw === iw, `no horizontal scroll at 400 px (${sw} vs ${iw})`);

const all = errs.concat(await frameErrors(p), await frameErrors(m));
check(all.length === 0, `no page errors${all.length ? ': ' + all.join(' | ') : ''}`);
await browser.close();
if (failures.length) { console.error(`\n${failures.length} check(s) failed`); process.exit(1); }
console.log('\nall mockup checks passed');
