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
