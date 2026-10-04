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
