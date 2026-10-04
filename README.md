# multi-ai

Send one prompt to many AI "variants" at once, watch them stream side by side
(thought process, tool calls, answer, artifacts), and keep **everything** in a
per-workspace git repository you can browse, diff, roll back and time-travel.

**Status: v0.1 proof of concept.** Claude models only for now; the provider
layer is designed so ChatGPT, Grok, Llama etc. can be added next.

## What you can do today

- Connect with an Anthropic API key (kept in your browser, sent per request, never stored on the server).
- Build a list of variants. Each variant = model + effort + optional web search + optional system prompt ("context").
  Same model twice with different settings is fine; that's half the fun.
- Hit **Run all variants**: each variant is its own independent API conversation, streamed live into its own card,
  with the model's (summarized) thinking, web searches and sources, the answer, token usage and estimated cost.
- Code blocks become **artifacts**. HTML/SVG artifacts open in a sandboxed preview, so "build me a DAW" gives you
  playable apps to compare.
- Every run is committed to `DATA_DIR/workspaces/<workspace>/` — a plain git repo. The History sidebar reloads past runs;
  the **Timeline** shows each commit for a run and lets you view the run as it was at any commit.
- Starter examples: browser music DAW, "do whatever you want :)", cheapest table in Milan in the next 30 min (web search),
  same model with different personas, a tearable cloth simulation, a tricky reasoning puzzle.

## Run it locally (2 minutes)

Requires Node 20+ and git.

```bash
git clone https://github.com/amaan-toptal/multi-ai.git
cd multi-ai
npm install
npm start            # http://localhost:8080
```

Open the page, click **Connect Claude**, paste your key, pick an example, run.

Run the tests (no key needed; they use a mock API): `npm test`.

## Getting Claude access — including from another account

multi-ai talks to the **Claude API** (Anthropic Console), which is billed separately from
Claude.ai Pro/Max subscriptions.

**Your own account**
1. Sign in at <https://console.anthropic.com> and add billing/credits.
2. Settings → API keys → **Create key**. Copy the `sk-ant-…` value.
3. In multi-ai, **Connect Claude** → paste → *Verify & save*.

**Using someone else's account / org (e.g. a company or a friend paying)**
Best practice is to *not* pass around their master key:
1. The account owner opens Console → Settings → **Workspaces** and creates a workspace, e.g. `multi-ai`,
   and sets a **spend limit** on it (and optionally rate limits).
2. Either:
   - **Invite you**: Settings → Members → *Invite* with your email, role *Developer*, access to that workspace.
     You accept, switch to their org in the Console (org switcher, top-left), and create your own key **inside that workspace**; or
   - **They create the key** in that workspace and share it with you through a password manager (not chat/email).
3. Paste that key into multi-ai. Usage shows up in their Console under the workspace, capped by the limit.
4. To revoke: they delete the key (or remove you from the org). Nothing in multi-ai needs changing.

**Why not "log in with Claude.ai / Claude Code"?** A Pro/Max subscription login (the OAuth token
`claude setup-token` produces for Claude Code) is meant for Anthropic's own apps; using it inside a third-party
web app isn't something Anthropic's terms allow, so multi-ai uses Console API keys. See `evals.md` (D-03).

**Running it for yourself only?** You can set `ANTHROPIC_API_KEY` on the server instead of pasting it in the browser.
The server then **requires** `APP_PASSWORD` so strangers can't spend your credits.

## Hosting (GCP / AWS / DigitalOcean)

Short version, on any Ubuntu VM:

```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/amaan-toptal/multi-ai.git && cd multi-ai
cp .env.example .env    # set APP_PASSWORD
docker compose up -d --build
```

Full guide with HTTPS, backups, and per-cloud notes (and why serverless platforms need care): [deploy/README.md](deploy/README.md).

## What gets stored

```
data/workspaces/<workspace>/            ← one git repo per workspace
  runs/<run-id>/
    prompt.md                          ← exact prompt sent
    run.json                           ← variants chosen, app version, timestamps
    variants/v1-claude-opus-5-5-high/
      meta.json                        ← model asked for vs. model that served, usage, cost, stop reason
      thinking.md                      ← summarized thinking
      response.md                      ← final answer
      events.jsonl                     ← tool calls, search results, statuses (timeline)
      artifacts/artifact-01.html       ← extracted code blocks
```

Commit sequence per run: `Prompt <id>` → one commit per variant as it finishes. API keys are never written.

## Project docs

- [spec.md](spec.md) — the plan (append-only, versioned)
- [HANDOFF.md](HANDOFF.md) — session-by-session state and next steps (append-only)
- [evals.md](evals.md) — evaluations, bugs, loopholes, autonomous decisions (append-only)
- [prompts/](prompts/) — every prompt the owner gave, verbatim
- [CLAUDE.md](CLAUDE.md) — rules for agents working on this repo

## Layout

```
server/index.js               HTTP API, live run fan-out (SSE), auth gate
server/providers/anthropic.js Claude streaming: thinking, effort, web search, pause_turn, fallbacks
server/gitstore.js            per-workspace git repos, commits, history, time travel
server/artifacts.js           code-block → artifact extraction
server/examples.js            starter prompts
public/                       no-build front end (HTML/CSS/JS)
test/                         node:test suite with a mock Messages API
deploy/                       hosting guide, Caddyfile
```
