# prototype/multi-ai-frontend

Frontend prototype of the multi-ai harness: one prompt sent to up to five variant tabs (Claude, OpenAI, Gemini, Grok,
open models), an orchestrator that summarizes, verifies and suggests after every run, and an append-only experiment repo
you can play back step by step. Every reply is simulated; nothing calls a provider yet.

- Live mockup: https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx (private to the owner until shared)
- Source: `docs/mockup/index.html` (single file, no build step)
- Smoke test: `npm run check:mockup` (14 checks, headless Chromium via Playwright)
- Agent handoff: HANDOFF.md, section "Release: prototype/multi-ai-frontend"
- Plan: spec.md v0.2–v0.6 · decisions and findings: evals.md D-31…D-70

## What it shows
- Variant tabs side by side or one at a time; status colours (yellow processing, green done, red stopped); per-tab API
  settings (model, effort / thinking budget, web search) styled after each provider.
- Master prompt typed into every tab; keeps the latest prompt; ↑ ↓ history; Ctrl/⌘+Enter sends; orchestrator suggestion.
- Spend cap that limits paid tabs only; free local models (Ollama) keep running at $0.
- Shared MCP servers for all tabs.
- Experiment repo window (floating or docked): step-by-step history grouped by run, diffs on click, Restore / Branch /
  Reset as new commits, files with inline artifact previews, export (zip / git bundle), push and restore controls.
- Time travel as read-only playback over every commit: tabs, threads, settings, files and open windows follow it.
- Artifacts window comparing every tab's artifacts side by side.
- Orchestrator after each run: summary + living `spec.md`, verifiers + results, next prompt.
- Flags window: every recent change can be switched back; `data-dbg` element names for asking for changes.

## Mockup versions
v1 312e3a8 · v2 296579c · v3 3e60f4f · v4 55d3ace · v5 f64f0a7 (this release, plus the smoke test and a banner fix)

## Not in this release
No backend for the new UI: the `server/` app is still the v0.1 Claude-only runner. Downloads, push and restore are listed
but not performed (the artifact viewer blocks downloads). Model names and non-Anthropic prices are placeholders.
