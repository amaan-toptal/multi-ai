// Screenshots for the Screening Copilot story. Run: npm run story:screening   (writes the PNGs next to this file)
// Needs Playwright with a Chromium build; set PLAYWRIGHT_MODULE to its index.mjs if it is not resolvable.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const HERE = path.dirname(fileURLToPath(import.meta.url));
async function loadPlaywright() {
  try { return await import('playwright'); } catch {}
  return import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs').href);
}
const { chromium } = await loadPlaywright();
const OUT = process.argv[2] || HERE;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.addInitScript(() => { try { const f = JSON.parse(localStorage.getItem('mai-flags') || '{}'); f.seed = 'screening'; localStorage.setItem('mai-flags', JSON.stringify(f)); } catch (e) {} });
await p.goto(pathToFileURL(path.join(HERE, '..', '..', 'mockup', 'index.html')).href);
await p.waitForTimeout(2000);
const shot = (n) => p.screenshot({ path: `${OUT}/${n}.png` });
await shot('01-canvas-three-skills-and-release-review');
// verify project, artifacts per step
await p.evaluate(() => window.maiShell.maximize('scr-verify')); await p.waitForTimeout(500);
const f = p.frame({ name: 'proj-scr-verify' });
await shot('02-verify-project-timeline');
const arts = async (run, name) => {
  await f.evaluate((r) => { const b2 = document.querySelector('#artsBtn'); if (!document.querySelector('[data-dbg="artifacts-window"]') || document.querySelector('[data-dbg="artifacts-window"]').hidden) b2.click(); }, run);
  await p.waitForTimeout(300);
  await f.evaluate((r) => { const w = document.querySelector('[data-dbg="artifacts-window"]'); Object.assign(w.style, { left: '8px', top: '8px', width: (innerWidth - 16) + 'px', height: (innerHeight - 16) + 'px' }); const s = w.querySelector('#awRun'); s.value = String(r); s.dispatchEvent(new Event('change')); }, run);
  await p.waitForTimeout(700); await shot(name);
};
await arts(1, '03-step1-dana-one-run-three-models');
await arts(2, '04-step2-pass-at-5-vs-pass-hat-5');
await arts(3, '05-step3-triage-what-the-agent-needs');
await arts(4, '06-step4-before-after-fixes');
await f.evaluate(() => document.querySelector('#artsBtn').click());
await p.evaluate(() => window.maiShell.maximize('scr-verify')); await p.waitForTimeout(400);
for (const [k, n] of [['score', '07-release-scorecard'], ['report', '08-screeners-report'], ['delta', '09-before-after']]) {
  await p.evaluate(() => window.maiShell.maximize('release')); await p.waitForTimeout(300);
  await p.click(`[data-dbg="release-tab:${k}"]`); await p.waitForTimeout(250); await shot(n);
  await p.evaluate(() => window.maiShell.maximize('release')); await p.waitForTimeout(250);
}
console.log('errors', errs);
await b.close();
