# multi-ai — HANDOFF

> Append-only. One section per session, newest at the bottom. Never edit or delete earlier sections.

---

## Session 1 — 2026-10-04 — v0.1 proof of concept

**Prompt:** [prompts/0001-2026-10-04-initial-planning.md](prompts/0001-2026-10-04-initial-planning.md)
**Branch:** `claude/cool-hawking-d5q52e` · **Session:** https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn

### State
- Working v0.1: Claude-only multi-variant runner with live streaming, summarized thinking, web search,
  artifacts with sandboxed preview, per-workspace git history with a time-travel timeline.
- Deployable via Docker / docker-compose (+ Caddy for HTTPS). Guide in `deploy/README.md`.
- Docs created: README, spec (v0.1), evals (D-01…D-14, E-01…E-04, B-01…B-05, L-01…L-07), CLAUDE.md (agent rules).

### How to verify
```bash
npm install && npm test        # mock-API tests, no key needed
npm start                      # http://localhost:8080 → Connect Claude → pick an example → Run
```
Then check `data/workspaces/default/` with `git log --stat`.

### Not verified yet
- A run against the real API with a valid key (E-04). Most likely failure points if any: the fallback beta
  (auto-retries without it), and web search tool types per model.
- `docker build` (no Docker daemon in the build sandbox).

### Open questions for the owner
1. **Isolation for agentic prompts** (e.g. "book a table in Milan"): per-variant sandboxes via Claude Managed Agents
   sessions (Anthropic hosts the container) vs. our own container-per-variant with Playwright. Recommendation:
   Managed Agents for Claude variants first (least infra), own containers when non-Claude providers need it.
2. Where should workspace git repos sync to (private GitHub org? one repo per user?), so the server isn't the only copy.
3. Next provider to add: OpenAI, Grok, or Llama (via which host)?

### Next steps (suggested order)
1. Owner runs one real example; record results in evals.md.
2. Multi-turn follow-ups per variant + "fork from here" (spec roadmap v0.2).
3. Second provider (spec roadmap v0.3).
4. Remote sync of workspace repos + per-variant repos (v0.5).

### TODO — reminder requested by the owner
- [ ] **Build a CI verifier for the append-only rule** on every pushed commit: fail if any commit deletes or modifies
      existing lines in `HANDOFF.md`, `spec.md`, `evals.md`, or any file under `prompts/` (only additions at the end
      allowed). Sketch: `git diff --numstat <base>..<head> -- HANDOFF.md spec.md evals.md prompts/` must show 0 deletions,
      plus a check that new content only appears after the old content.
- [ ] **Make force pushes impossible**: GitHub → Settings → Rules → Rulesets for `main` (and `claude/*`): block force
      pushes, block deletions, require the verifier status check. These must be set manually by the repo owner.

---

## Session 1, part 2 — 2026-10-04 — previewable artifact in every reply

**Prompt:** [prompts/0002-2026-10-04-always-show-artifact.md](prompts/0002-2026-10-04-always-show-artifact.md)

### What changed
- New standing rule (CLAUDE.md, every-session step 5): every reply to the owner includes a previewable artifact.
- Added `docs/demo/index.html`, a playground for multi-ai that needs no API key. It runs 4 scripted examples
  (DAW, "do whatever you want", Milan, personas), streams variants side by side, opens working artifacts (two playable
  drum machines, a generative garden), and shows a simulated workspace git log + file tree with per-commit time travel.
- Published as a private claude.ai artifact: https://claude.ai/artifact/TUUVzNgDhvxyg9xHC97riE
  (republish from `docs/demo/index.html` to keep the same URL). Also served by the app at `/demo`.

### How to verify
Open the artifact link, click **Run all variants**, then open each `artifact-01.html` and press Play.
Locally: `npm start` → http://localhost:8080/demo.

### Next steps
Unchanged from part 1. Keep the playground in sync with real UI changes.

---

## Session 1, part 3 — 2026-10-04 — reprompt takes, determinism prompts, size-limited games

**Prompt:** [prompts/0003-2026-10-04-reprompts-games-determinism.md](prompts/0003-2026-10-04-reprompts-games-determinism.md)

### What changed
- Playground (`docs/demo/index.html`, same artifact URL): every variant has 2–3 seeded takes; per-card
  **↻ Reprompt in a fresh context**, take tabs, an identical/differ verdict, and **↻ Reprompt all**. Prompts are grouped
  into Starters / Determinism / Games / Fun.
- New prompts: 3 determinism (random number, ticket triage, prod runbook), fun game < 2 KB, puzzle < 3 KB,
  action < 4 KB, tell me a joke. Game artifacts show measured bytes with a pass/fail check.
- 12 real games in `docs/demo/games/`; `node docs/demo/build.mjs` inlines them into the playground (idempotent).
- Real app: same new prompts in `server/examples.js` (with real system prompts for determinism variants) and byte sizes
  on artifact buttons.
- spec.md v0.1.1 records the take/reprompt concept and plans the real endpoint.

### How to verify
Artifact: https://claude.ai/artifact/TUUVzNgDhvxyg9xHC97riE → Determinism → *Random number, twice* → Run →
*Reprompt all* twice: left card "≠ takes differ", right card "✓ 3 takes identical". Games → open artifacts, check size badges.
Repo: `node docs/demo/build.mjs` after editing any file in `docs/demo/games/`.

### Next steps
1. Real reprompt endpoint + take tabs in the app (spec v0.1.1).
2. Optional per-variant JSON schema (structured output) so the triage example is enforced, not just requested.
3. Still open: real-API smoke test (E-04/E-08), append-only CI verifier, block force pushes (owner TODO).

---

## Session 1, part 4 — 2026-10-04 — timestamps, master ledger, time travel, debates (model: Fable 5.1)

**Prompt:** [prompts/0004-2026-10-04-timestamps-time-travel-debates.md](prompts/0004-2026-10-04-timestamps-time-travel-debates.md)

### What changed
- Real app: `server/timestamps.js` (`stamp()` → unix/iso/human, `stampTrailer()`); run.json, meta.json and events carry
  all three; every commit message ends with `Timestamp: <unix> (<iso>)`; `ledger.jsonl` master index appended in the
  same commit as each prompt/variant; `GET /api/workspaces/:ws/ledger`; `/log` returns unix per commit.
- Playground: new **Time travel** view (top bar switch, `#time` link) with slider, play/pause, SVG event timeline,
  prompt-diff / configuration / output-file panels, debate panel with three agents, and a master-ledger rail showing the
  prompt evolving. Playground git log rows now show `YYYY-MM-DD HH:MM:SS UTC · unix`.
- Sources: `docs/demo/src/timetravel.{js,css}`, inlined by `node docs/demo/build.mjs` (same as the games).
- Artifact republished at the same URL: https://claude.ai/artifact/TUUVzNgDhvxyg9xHC97riE (open, click **Time travel**).

### How to verify
Artifact → Time travel → press ▶ Play, or step with ◀ ▶ (arrow keys work). Stop on a magenta **D** node to see a
debate. Drag to the end: 18 files, web off, tools per model, ★ on the release file.
Repo: `npm test`; `npm start`, run anything, then `cat data/workspaces/default/ledger.jsonl` and `git log -1` in it.

### Next steps
1. Real debate runs (spec v0.1.2) and a real replay view over `ledger.jsonl` + git history.
2. Extend the append-only CI verifier (still TODO) to cover `ledger.jsonl`.
3. Unchanged: real-API smoke test, per-variant repos, block force pushes (owner TODO).

---

## Session 1, part 5 — 2026-10-04 — prototype branch, poc branch, variant windows mockup (model: Opus 5.5 for prompt 0010)

**Prompts:** [0005](prompts/0005-2026-10-04-prototype-and-poc-branches.md) ·
[0006](prompts/0006-2026-10-04-variant-tabs-ui.md) · [0007](prompts/0007-2026-10-04-variant-tabs-answers.md) ·
[0008](prompts/0008-2026-10-04-desktop-browser-windows.md) · [0009](prompts/0009-2026-10-04-path-a-mockup.md) ·
[0010](prompts/0010-2026-10-04-mockup-feedback.md)

### What changed
- `prototype/v0.1-scripted-playground` holds v0.1 exactly as it was (commit `0564016`).
- `poc/variant-windows` created from this session's commit; it is where the PoC continues.
- New `docs/mockup/index.html`: remote-desktop mockup (macOS / Ubuntu switch) with 1–5 browser windows for Claude, ChatGPT,
  Gemini, Grok and open-source models (Open WebUI); one prompt bar that types into every window; yellow / green / red status;
  per-window model and option controls; collapsed "Thought for Ns"; searchable Trace drawer; spend cap; floating live repo
  window; export sheet showing the package layout (Markdown files). Replies are simulated.
- Artifact (same link as the last mockup): https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx
- spec v0.2 (PoC plan, route A vs B, reasoning controls by provider), evals D-31…D-39, B-11…B-15, E-11, L-17…L-19.

### How to verify
Open the artifact. Type in the prompt bar and watch the text appear in every window's composer; press Enter. Use `+ New window`
or a window's `+` to add Grok or Open WebUI, `×` to close, the strip chips to show one window, `Trace` to search events,
`Export package` to see the zip layout. Set the cap to 0.15 and send twice to see the stop. Locally: open
`docs/mockup/index.html` in a browser.

### Next steps
1. Owner reviews the mockup and decides route A or B (spec v0.2).
2. Then backend on `poc/variant-windows`: strip seeded examples, real windows (one provider first), export zip, repo per experiment.
3. Unchanged: real-API smoke test, append-only CI verifier, block force pushes (owner TODO).

---

## Session 1, part 6 — 2026-10-04 — variant tabs, diff-style repo, API decision (model: Opus 5.5)

**Prompt:** [0011](prompts/0011-2026-10-04-variant-tabs-git-diff-api-decision.md)

### What changed
- Owner chose provider APIs (spec v0.3). Mockup rebuilt (`docs/mockup/index.html`, same artifact link
  https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx):
  - one browser whose tabs are the variants (status-coloured, × to close, + New tab, side by side or one tab);
  - per-tab API controls (model, effort / thinking setting, web search), endpoint in each pane header;
  - **MCP & tools** menu: example servers shared by every tab;
  - **Repo panel** docked right: "Not sent yet" live diff of `prompt.md` and `harness.yaml`, then typed commits
    (P/C/T/M/R) that expand to diffs; reply commits add the run files.
- spec v0.3: decision, web UI vs API vs CLI comparison for agentic RL and enterprise, key setup and minimum spend.
- README: new "API keys for the PoC" section.
- evals D-40…D-47, E-12…E-13, B-16…B-18, L-20…L-22.

### How to verify
Artifact: type a prompt, change a tab's effort, connect an MCP server, and watch "Not sent yet" fill with the diff; press
Enter; tabs turn yellow then green and commits appear; click any commit to expand its diff. Locally: open the file.

### Next steps
1. Owner reviews the mockup; then build the backend on `poc/variant-windows`: provider adapters (Anthropic first, then
   OpenAI-compatible for OpenAI / Groq / OpenRouter / Ollama, Gemini, xAI), `harness.yaml` + git per experiment, export zip.
2. Strip seeded examples from the server at the same time (D-32).
3. Later: agent tabs in containers, graders, pass@k / pass^k.

---

## Session 1, part 7 — 2026-10-04 — free models past the cap, floating repo window, artifacts, export (model: Opus 5.5)

**Prompt:** [0012](prompts/0012-2026-10-04-free-models-floating-repo-artifacts.md)

### What changed
- Mockup (`docs/mockup/index.html`, same link https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx):
  - spend cap applies to paid tabs only; free tabs (Ollama local, free tiers) run even at $0; paid tabs are skipped or
    stopped with a note and a commit;
  - macOS look only;
  - repo is a floating window (drag, resize, maximize, minimize to dock, close, reopen) with Changes / Files & artifacts /
    Export & restore views; HTML artifacts run inline; restore and branch from any user commit; .zip, git bundle, push,
    restore and analyse controls.
- spec v0.4, evals D-48…D-53, E-14, B-19…B-20, L-23…L-24.

### How to verify
Artifact → repo window → Files & artifacts → click an artifact and move its sliders. Set the cap to 0 in the menu bar, type a
prompt, Enter: only the Open models tab runs. Expand a P/C/M commit → Restore this state or Branch from here. Minimize the
repo window (yellow light) and bring it back from the dock.

### Next steps
1. Owner reviews; then backend on `poc/variant-windows` (provider adapters, harness.yaml + git per experiment, real zip and
   bundle export, restore from bundle).
2. Unchanged: agent tabs, graders, pass@k / pass^k; CI append-only verifier; block force pushes (owner TODO).

---

## Session 1, part 8 — 2026-10-04 — time travel across tabs and windows, reset, movable windows (model: Opus 5.5)

**Prompt:** [0013](prompts/0013-2026-10-04-time-travel-reset-movable-windows.md)

### What changed
- Mockup (`docs/mockup/index.html`, same link https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx):
  - prompt bar above the tab list;
  - repo window and any number of file/artifact windows move anywhere on the screen (all widths), resize, maximize,
    minimize to the dock, close;
  - time travel bar (slider, ‹ ›, arrow keys, or click a commit): tabs, threads, settings, prompt, Files view and every open
    window show the state right after that commit; banner with Restore / Branch / Back to latest;
  - Restore stages the earlier state; Commit without running or Send records it as a ↶ commit; Reset undoes staged changes
    and records a ⟲ commit.
- spec v0.5, evals D-54…D-61, E-15, L-25…L-26.

### How to verify
Artifact → drag the repo window by its title bar → Files & artifacts → "Open in window" on two artifacts → drag the time
travel slider left: tab 04 disappears, earlier runs only, artifact windows say "doesn't exist yet" → Restore this state →
Changes shows the staged diff → Reset → a ⟲ commit appears and tab 04 is back.

### Next steps
Unchanged: owner review, then the backend on `poc/variant-windows` (provider adapters, git per experiment read with
`git show <sha>:path`, real zip/bundle export and restore).

---

## Session 1, part 9 — 2026-10-05 — orchestrator, step-by-step history, playback, artifacts window, flags (model: Opus 5.5)

**Prompt:** [0014](prompts/0014-2026-10-05-dock-steps-playback-artifacts-orchestrator.md)

### What changed
- Mockup v5 (`docs/mockup/index.html`, same link https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx): dockable repo window;
  step-by-step Changes view grouped by run; slate "playback · read only" time travel with a Play button; Artifacts window
  with variant tabs and all-side-by-side; prompt bar keeps the latest prompt, ↑ ↓ history, orchestrator suggestion,
  Ctrl/⌘+Enter to send; orchestrator commits summary + spec, verifiers + results, next prompt after every run;
  Flags window (every change switchable back) and element names (`data-dbg`, overlay flag).
- spec v0.6, evals D-62…D-70, E-16, B-21…B-23, L-27…L-28. CLAUDE.md: new rule for flags and element names.

### How to verify
Artifact → press **Use** on the suggestion → Ctrl/⌘+Enter → watch run 4 and the three ◆ orchestrator steps → **Artifacts**
→ compare the four charts → **Dock** in the repo title bar → ‹ or ▶ in Time travel → **Flags** → turn on Element names.

### Next steps
Owner review. Open questions are in the reply (orchestrator model and trigger, verifier depth, dock side, suggestion
behaviour). Backend unchanged as next big step.

---

## Release: prototype/multi-ai-frontend — 2026-10-06 (model: Opus 5.5)

**Prompt:** [0015](prompts/0015-2026-10-06-tag-prototype-frontend-release.md) · **Tag:** `prototype/multi-ai-frontend`
(annotated) · **Release notes:** [docs/releases/prototype-multi-ai-frontend.md](docs/releases/prototype-multi-ai-frontend.md)

This section is written for any agent (or person) who builds on top of this tag. Read it, then CLAUDE.md, then spec.md
v0.6 (the newest plan) before changing anything.

### What the tag contains
- `docs/mockup/index.html`: the frontend prototype (mockup v5). One self-contained file in claude.ai Artifact page format
  (no `<!doctype>`/`<html>`/`<body>`; the artifact host adds them; browsers render it fine as is). All replies are
  simulated. Published at https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx.
- `docs/mockup/check.mjs`: smoke test, `npm run check:mockup`.
- `server/`, `public/`, `test/`: the v0.1 app (Claude-only multi-variant runner with SSE, git per workspace, ledger). It does
  not implement the mockup's UI yet. `npm test` covers it with a mock Messages API.
- `docs/demo/`: the older scripted playground (v0.1 era), kept for history. Frozen copy of v0.1: branch
  `prototype/v0.1-scripted-playground`.
- Records: `prompts/` (every owner prompt, verbatim), `spec.md` (plan versions), `evals.md` (decisions D-, evaluations E-,
  bugs B-, risks L-), this file. All four are append-only.

### How to start
```bash
git fetch origin --tags
git checkout -b <your-branch> prototype/multi-ai-frontend
npm install && npm test              # v0.1 server tests, no key needed
npm run check:mockup                 # 14 UI checks; needs Playwright + Chromium
# if playwright is not resolvable: PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs npm run check:mockup
```
Open `docs/mockup/index.html` directly in a browser to use it. To update the owner's preview, republish the same file to
the same artifact URL (Artifact tool, `url` = the link above) so the link never changes.

### Map of docs/mockup/index.html
| Part | Where to look | Notes |
|---|---|---|
| Design tokens | `:root` and the two dark blocks at the top of `<style>` | every colour is a token; light + dark; `--tt*` = playback colour, `--ttp*` = old pink |
| v5 styles | block starting `/* v5 additions` | flags, docking, steps, playback, artifacts window, element-name overlay |
| Markup | `<div class="app" id="app">` | menu bar, browser (prompt bar → tab strip → banners → panes), dock, footer, export sheet |
| Provider data | `PROVIDERS`, `MCP_CATALOG` | models, prices ($/Mtok), reasoning controls, endpoints. Non-Anthropic values are placeholders |
| Scripted content | `V1`–`V4`, `ART`, `chartArt`, `SAMPLE`, `SUGGEST` | the opening runs and the suggested-prompt run; other prompts get generic simulated replies |
| Flags | `FLAG_DEFS`, `F`, `setFlag`, `applyFlags`, Flags window | each flag's other option is the previous behaviour; stored in localStorage `mai-flags` |
| Element names | `ELEMENTS` + `data-dbg` attributes | the owner refers to parts of the UI by these names |
| Versions | `HISTORY` | mockup versions with commits; add a row whenever you publish |
| State | `st` | tabs, commits, files (Map path → {content, kind, label}), head, time-travel cursor `tt`, history, suggestion |
| Windows | `makeWin`, `setWinState`, `paintDock` | movable/resizable/minimizable windows: repo, artifacts, file windows, flags |
| Repo as files | `snapshot`, `toYaml`, `promptMd`, `changesSince`, `workingFiles` | harness state is `prompt.md` + `harness.yaml`; unsent changes are diffs against `st.head` |
| Commits | `addCommit`, `renderCommits`, `paintCommit`, `groupKey` | every commit stores a full snapshot in `c.state`; compact list grouped by run |
| Time travel | `setTT`, `applyPreview`, `applyThread`, `statusAt`, `viewTabs` | thread elements carry `data-seq` = the commit that created them; anything newer is hidden |
| Restore / reset | `restoreSnap`, `restore`, `resetWorking`, `commitWorking` | never rewrite history: restore stages, reset is an empty commit |
| Runs | `send`, `startRun`, `stream`, `finishRun`, `stopRun`, `skipRun`, `endOne` | reply commits are created when a reply finishes; spend cap stops paid tabs only (`isFree`) |
| Orchestrator | `orchestrate`, `orchSummary`, `orchVerify`, `orchSuggest`, `criteriaFor` | three commits after each run; verifiers are deterministic checks derived from the prompt |
| Artifacts window | `openArtsWin`, `renderArts`, `artsByRun` | follows time travel; iframes only re-render when content changes |
| Opening state | bottom of the script | three runs (plus orchestrator steps) built with `send(…, true)` |

### Rules that keep it working
- Append-only everywhere: HANDOFF/spec/evals/prompts files, and the mockup's own commit log (restore, reset and branch add
  commits). Log every owner prompt verbatim in `prompts/`.
- New UI behaviour goes behind a flag with the old behaviour as an option; new major elements get a `data-dbg` name in
  `ELEMENTS`; each publish adds a `HISTORY` row (CLAUDE.md, "Mockup conventions").
- Any element added to a pane thread must get `data-seq` (the commit number that makes it exist) or time travel will show it
  too early.
- Strings that contain HTML for artifacts must write `<\/script>`, not `</script>`.
- Keep `npm run check:mockup` green and extend it when you add a flow.
- End every reply to the owner with the published mockup (or another artifact) linked.

### Where the backend picks up (spec v0.3–v0.6)
1. Provider adapters behind the tab model: Anthropic first (`@anthropic-ai/sdk`, adaptive thinking + effort), then one
   OpenAI-compatible adapter for OpenAI, Groq, OpenRouter and Ollama, then Gemini and xAI.
2. One git repo per experiment with the exact layout the mockup shows (`prompt.md`, `harness.yaml`, `spec.md`,
   `ledger.jsonl`, `runs/NN/<tab>/…`, `orchestrator/`, `verifiers/`, `evals/`); read past states with `git show <sha>:path`
   instead of the mockup's in-memory snapshots.
3. Harness-run MCP client shared by all tabs; per-tab web search.
4. Orchestrator and verifiers as real calls; export as zip and `git bundle create --all`; restore from either.
5. Remove the v0.1 seeded examples from `server/examples.js` when the new UI replaces `public/`.

### Open questions waiting for the owner
The four questions at the end of the session 1 part 9 reply (orchestrator model and trigger, verifier depth, dock side,
suggestion behaviour). The owner said they will answer on the next branch; do not decide them silently.

---

## Session 2, part 1 — 2026-10-06 — v0.3 WIP: project windows on a canvas, menu bar, Land-or-Water story (model: Opus 5.5)

**Prompt:** [0016](prompts/0016-2026-10-06-project-windows-canvas-land-or-water.md) · **Branch:** `prototype/v0.3-wip-eval-story`
(mirrored to `claude/cool-hawking-d5q52e`) · **Frozen v5:** `prototype/v0.2-multi-ai-frontend-stub` (33920dc)

**Correction to the release section above:** the owner decided no release is needed (D-75). Read "the tag" there as the
branch `prototype/v0.2-multi-ai-frontend-stub`. The remote branch `prototype/multi-ai-frontend` still exists and points
at the same content; the owner may delete it.

### What changed (mockup v6, `docs/mockup/index.html`)
- **The file is now a workspace shell plus a project template.**
  - The shell sits at the top and bottom of the file: the menu bar, the canvas, project windows, menus, and `window.maiShell`.
  - The v5 app sits in the middle inside `<template id="projectTemplate">`. Each project window is an iframe named
    `proj-<id>`, built from it with `srcdoc` plus `window.MAI_PROJECT = { id, story, start, embedded, repo }`.
- **Stories** are a registry, `STORIES`, in the app script: `passk`, `landwater` and `blank`. A story supplies its
  scripted replies, suggestions with reasons, criteria, extra F2P and rubric criteria, notes, leaderboard, timeline
  thumbnails and opening sequence. Add a story there; see the Land-or-Water block (`LW_*`, `lwField`, `lwScore`,
  `lwArt`) for the data-driven pattern.
- **Timeline ribbon** (`renderTimeline`), **orchestrator model choice** (`orchPick`), **F2P and rubric verifiers**
  (`extraCriteria`, `probePassK`, `F2P_SELFTEST`, `rubricGrade`), and the **shell link** (`report`, `CMDS`, message
  listener).
- **Owner answers applied**: the orchestrator runs automatically on Opus 5.5 at low effort (free local model at a $0
  cap); one F2P and one rubric check per project; the dock stays on the right. Question 4 is still open.
- **New flags** (v5 behaviour as the other value): `workspace`, `menuBar`, `timeline`, `ttScroll`, `orchModel`,
  `checkKinds`. New `data-dbg` names are listed in `ELEMENTS`, and `HISTORY` has a v6 row.

### Current state
- The canvas opens with three projects:
  - Land or Water?, complete in 3 steps;
  - pass@k vs pass^k, as in v5;
  - Land or Water? · guided from step 1, waiting for the owner to accept suggestions.
- The menu bar shows "3 need you".
- `npm test` passes and `npm run check:mockup` passes 29 of 29.
- The mockup is republished at the same Artifact URL.

### How to verify
1. Run `npm install && npm test && npm run check:mockup`.
2. Open `docs/mockup/index.html`, or the Artifact.
3. Double-click the "Land or Water? · guided from step 1" title bar, then press **Use and send** on the timeline's ghost
   card twice. The status pill goes Running → Needs you, and the menu bar shows a toast.
4. Click the timeline's Step 1 card. Playback starts and every pane is scrolled to its latest reply.
5. In the Land or Water? project, open **Artifacts** for run 3 to see four shaded and error maps side by side.
6. View › "One project fills the screen", then Help › Flags › Menu bar = plain, gives back the v5 layout.

### Next steps
1. Owner review of v6; answer question 4 (suggestion behaviour); confirm "p2f" means fail-to-pass (D-78).
2. Backend for projects: one state store per project, and a workspace endpoint listing project status so the canvas
   stays light (L-29).
3. Real verifiers: run artifacts headless for F2P, and add a rubric grader call with the threshold in `harness.yaml`.
4. A real Land-or-Water runner: batch asks, logprobs where available, a k-sample fallback, cost estimate before sending
   (L-31, L-32).

---

## Session 2, part 2 — 2026-10-06 — v7: snappier canvas, Space panning, maximize, API keys, alternatives (model: Opus 5.5)

**Prompt:** [0017](prompts/0017-2026-10-06-snappy-canvas-space-pan-api-keys-alternatives.md) · **Branch:** `prototype/v0.3-wip-eval-story`
(mirrored to `claude/cool-hawking-d5q52e`)

### What changed
- **Canvas** (shell script, "canvas: pan and zoom" block):
  - `applyView` paints at most once per frame through `requestAnimationFrame`, and the dot grid is its own layer
    (`#grid`);
  - Space + drag and Space + scroll pan through `#panShield`, and projects forward Space key presses;
  - the middle mouse button pans;
  - drags clear the selection and the canvas is `user-select:none`;
  - `toggleMax` maximizes or restores a project on double-click, the green light, View › Maximize, or Esc to restore.
- **API keys**:
  - **Shell**: `KEY_PROVIDERS`, `openKeys`, `testKey`, the `#keysBtn` button in the menu bar, and a new ◆ multi-ai app
    menu.
  - **Project**: `KEYS`, `liveFor`, `callAnthropic` (official SDK), `callOpenAI`, `callGemini`, `callChat` (xAI, Groq,
    OpenRouter, Ollama) and `runLive`.
  - `startRun` routes keyed tabs to `runLive`; `stopRun` aborts the request and reports API errors.
  - Pane headers show "● live" for keyed tabs.
- New flags (v6 behaviour kept as the other value): `titleDblClick`, `spacePan`, `liveCalls`. New `data-dbg` names:
  `pan-shield`, `api-keys-button`, `api-keys-window`, `app-menu`.
- `server/index.js` serves the mockup at `/mockup`.
- `alternatives.md` (repo root) lists similar projects with licenses and what to borrow.

### Current state
- `npm test` passes, and `npm run check:mockup` passes 41 of 41.
- Live calls are verified only against a mocked OpenAI endpoint and a mocked SDK `fetch`. No real provider call has been
  made from this environment (E-23).

### How to verify (owner)
1. `npm install && npm start`, then open http://localhost:8080/mockup. Opening `docs/mockup/index.html` directly also
   works.
2. Click **API keys** in the menu bar, paste a key (e.g. Anthropic), then press **Test** and **Save**.
3. The matching pane header turns green ("● live").
4. In the pass@k project, type a prompt and press Ctrl/⌘+Enter. The keyed tab streams the real reply; the others stay
   simulated.
5. Hold Space and drag or scroll over a project. Double-click a title bar, then press Esc.

### Next steps
1. Owner tests real calls and canvas feel; fix model ids that 404 (L-36).
2. Orchestrator as a real call when an Anthropic key exists (Opus 5.5 at low effort), writing real spec and verifiers.
3. Backend: keys in the server env, the same provider adapters server-side, a per-project state store.
4. Verifier format modelled on promptfoo/Inspect, with SWE-bench's FAIL_TO_PASS and PASS_TO_PASS naming
   (see `alternatives.md`).

---

## Session 2, part 3 — 2026-10-07 — Screening Copilot story (model: Opus 5.5)

**Prompt:** [0018](prompts/0018-2026-10-07-screening-agent-story.md) · **Branch:** `prototype/d071026-story-screening-agent`
(spun off `prototype/v0.3-wip-eval-story` at 9191432) · **Story doc:** [docs/stories/screening-agent/README.md](docs/stories/screening-agent/README.md)

### What changed (mockup v8)
- **Story module**, in the app script before `STORIES` is resolved:
  - data: `SCR_CASES`, `SCR_RAW` (Dana's call), `SCR_RUNS` (scripted passes out of 5 per call, before/after), `SCR_KIND`,
    `SCR_REMEDY`, `SCR_THREADS`, `SCR_PROMPTS`, `SCR_HERO`;
  - functions: `scrTriage` (the triage rule), `scrArt` (the four artifacts), `scrStory(thread)`.
  - Three stories are registered: `scr_notes`, `scr_questions`, `scr_verify`.
- **New story hooks:**
  - `beforeSend(text)`: harness changes applied as part of a step;
  - `metrics()`: results sent to the shell with each status message.
- **Shell:**
  - `SEEDS` by flag `seed`;
  - `addDash` / `renderDash`: the release review window (no iframe; it reads `p.s.metrics` of the skill projects);
  - File menu entries for guided replays of each skill.
- **Docs and tests:**
  - `docs/stories/screening-agent/`: README (concept, 4 steps, close, talk track), 9 screenshots, and `shots.mjs`
    (`npm run story:screening`);
  - `check.mjs`: seeds pinned per section, plus 8 screening checks.

### How to verify
1. Run `npm test && npm run check:mockup` (49 of 49).
2. Open `docs/mockup/index.html`. The canvas shows three skill projects and the release review.
3. In the verify project, open Artifacts and step through runs 1–4.
4. In the release review, click through Scorecard → Screener's report → Before → after.
5. To replay a skill live, use File → Screening Copilot → (skill), then press "Use and send" three times.

### Next steps
1. Owner review of the story and talk track; adjust ship bars, verdicts or calls to taste.
2. Make it real: a batch runner for k × cases × builds, then case files with labelled red flags and traps, then the
   rubric calibrated on screener labels.
3. Decide whether this story merges back into the v0.3 line or stays a spinoff.
