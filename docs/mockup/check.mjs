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
check((await p.$$('.mtop')).length === 7, 'menu bar has the app menu plus File, Edit, View, Project, Window, Help');
check(/3 need you/.test(await p.textContent('#needsBtn')), 'menu bar counts 3 projects that need you');
const z0 = await p.evaluate(() => window.maiShell.view.z);
await p.click('#zIn'); await p.waitForTimeout(450);
check((await p.evaluate(() => window.maiShell.view.z)) > z0, 'zoom in enlarges the canvas');
await p.click('#zFit'); await p.waitForTimeout(450);
await p.click('.mtop[data-m="file"]');
check((await p.$$('.mpop button')).length >= 6, 'File menu opens with its items');
await p.keyboard.press('Escape');

// v7: panning without selecting, Space + drag / scroll, maximize
const sel = () => p.evaluate(() => getSelection().rangeCount === 0 || getSelection().isCollapsed);
const vx = () => p.evaluate(() => ({ ...window.maiShell.view }));
const box = await p.$eval('#canvas', (c) => { const r = c.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
let v0 = await vx();
await p.mouse.move(box.x + 8, box.y + 8); await p.mouse.down(); await p.mouse.move(box.x + 400, box.y + 300, { steps: 8 }); await p.mouse.up();
await p.waitForTimeout(100);
let v1 = await vx();
check(v1.x - v0.x > 350 && v1.y - v0.y > 250, 'dragging empty canvas pans 1:1 with the pointer');
check(await sel(), 'dragging across projects selects nothing');
const pr = await p.$eval('[data-dbg="project-window:landwater"] .pw-body', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await p.mouse.move(pr.x, pr.y); await p.keyboard.down('Space'); await p.waitForTimeout(50);
check(await p.$eval('#panShield', (e) => getComputedStyle(e).display === 'block'), 'holding Space shows the pan shield over the projects');
v0 = await vx();
await p.mouse.down(); await p.mouse.move(pr.x - 200, pr.y - 120, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(80);
v1 = await vx();
check(Math.abs(v1.x - v0.x + 200) < 3 && Math.abs(v1.y - v0.y + 120) < 3, 'Space + drag over a project pans the canvas');
v0 = v1; await p.mouse.wheel(0, 150); await p.waitForTimeout(80); v1 = await vx();
check(Math.abs(v1.y - v0.y + 150) < 3, 'Space + scroll pans the canvas instead of the project');
await p.keyboard.up('Space'); await p.waitForTimeout(50);
check(await p.$eval('#panShield', (e) => getComputedStyle(e).display === 'none'), 'releasing Space hides the shield');
check(await sel(), 'Space + drag selects nothing');
await p.dblclick('[data-dbg="project-window:passk"] .pw-title'); await p.waitForTimeout(350);
const mx = await p.evaluate(() => { const w = document.querySelector('[data-dbg="project-window:passk"]').getBoundingClientRect(), c = document.querySelector('#canvas').getBoundingClientRect(); return [Math.round(w.width), Math.round(c.width), Math.round(w.left - c.left), Math.round(w.top - c.top)]; });
check(mx[0] === mx[1] && Math.abs(mx[2]) <= 1 && Math.abs(mx[3]) <= 1, `double-clicking a title bar maximizes the project (${mx.join(', ')})`);
await p.dblclick('[data-dbg="project-window:passk"] .pw-title'); await p.waitForTimeout(350);
check(await p.$eval('[data-dbg="project-window:passk"]', (e) => !e.classList.contains('maxed') && e.style.width === '1180px'), 'double-clicking again restores its size');
await p.evaluate(() => window.maiShell.fitAll(false));

// v7: API keys window
await p.click('#keysBtn');
check((await p.$$('.kcard')).length === 7, 'API keys window lists 7 providers with instructions');
await p.click('.kfoot .primary');

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
await p.route('https://api.openai.com/v1/responses', (route) => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
  body: JSON.stringify({ output: [{ type: 'reasoning', summary: [{ text: 'mock reasoning' }] }, { type: 'message', content: [{ type: 'output_text', text: 'LIVE-TEST pass@k counts at least one success; pass^k needs all k to succeed.\n```html\n<canvas></canvas><script>const f=(p,k)=>1-(1-p)**k, g=(p,k)=>p**k<\/script>\n```' }] }], usage: { input_tokens: 120, output_tokens: 300, output_tokens_details: { reasoning_tokens: 40 } } }) }));
await p.evaluate(() => window.maiShell.setKeys({ openai: 'sk-test' }));
await p.waitForTimeout(150);
check(/live/.test(await f.$eval('[data-dbg="pane-header:02"] .ep', (e) => e.textContent)), 'a tab with a key is marked live');
await f.click('#suggestUse');
await f.focus('#prompt');
await p.keyboard.press('Control+Enter');
await p.waitForTimeout(13000);
await f.click('#repoBtn'); await p.waitForTimeout(200);
const top = await f.$$eval('#commits > li', (ls) => ls.slice(0, 4).map((l) => l.innerText));
check(/Run 4/.test(top[0]), 'run 4 appears as a group');
check(top.slice(1).every((t) => t.includes('Orchestrator')), 'three orchestrator steps follow the replies');
check(/LIVE-TEST/.test(await f.$eval('[data-dbg="pane-thread:02"]', (e) => e.textContent)), 'the keyed tab shows the real (mocked) API reply');
await p.evaluate(() => window.maiShell.setKeys({}));
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
