# multi-ai — spec

> Append-only. Each plan change adds a new version section at the bottom.
> Earlier sections are history and are never edited.

---

## v0.1 — 2026-10-04 — proof of concept (prompt 0001)

### Vision (from the owner)
A web app where a person connects their AI accounts (Claude, ChatGPT, Grok, Llama, …), sends the
**same prompt to many variants**, and watches them in real time: thought process, tool use, artifacts.
Every prompt, thought trace and artifact is preserved in a higher-level metadata **git** repo per user,
with easy access, rollback and time travel. Variants run in **isolated contexts**. Run metadata
(e.g. which model actually answered) is captured automatically, never typed by hand.
Host easily on GCP / AWS / DigitalOcean.

### Scope of v0.1 (built)
| Area | v0.1 behaviour |
|---|---|
| Providers | Anthropic only: Opus 5.5, Sonnet 5.5, Fable 5.1, Opus 5, Haiku 4.5 |
| Auth to provider | Console API key pasted in the browser (localStorage opt-in, else sessionStorage), sent per request in `x-anthropic-key`; optional server-side `ANTHROPIC_API_KEY` |
| Auth to app | Optional `APP_PASSWORD` (HTTP Basic). Mandatory when a server key is configured |
| Variant | `{model, effort, webSearch, system}`; up to `MAX_VARIANTS` (8) per run |
| Isolation | Each variant is an independent Messages API conversation: no shared history, no shared tools state. Artifacts preview in a sandboxed iframe (`allow-scripts`, no same-origin) |
| Live view | Server fans out SSE per run; cards stream summarized thinking, web searches + sources, text, usage, cost |
| Thinking | Adaptive thinking with `display: "summarized"` (Haiku: budget 16k). Raw chain of thought is never available from the API — what is shown is Anthropic's summary |
| Artifacts | Fenced code blocks ≥3 lines → `artifacts/artifact-NN.<ext>`; HTML/SVG previewable |
| Persistence | `DATA_DIR/workspaces/<ws>/` git repo. Commit 1: prompt + run.json. Then 1 commit per variant (meta, thinking, response, events, artifacts) |
| Time travel | `GET /api/workspaces/:ws/runs/:id?rev=<sha>` reads files via `git show <sha>:path`; UI timeline per run |
| Workspaces | Free-text name in the header (no user accounts yet); each name = one repo |
| Deploy | Dockerfile + docker-compose + Caddy; guide for DO / AWS / GCP VMs; caveats for Cloud Run / App Platform |

### Architecture
```
browser ──POST /api/runs──▶ server ──(N parallel streams)──▶ Anthropic Messages API
   ▲                          │
   └──── SSE /events ◀────────┤ per-variant events (thinking/text/tool/usage)
                              └──▶ gitstore: commit per variant → DATA_DIR/workspaces/<ws>.git
```

### Explicitly out of scope for v0.1
User accounts / multi-tenant auth; other providers; per-variant sandboxes that *execute* code or browse
(beyond Anthropic's server-side web search); multi-turn conversations; pushing workspace repos to remotes;
branching/rollback UI beyond read-only time travel; per-variant git repos.

### Roadmap (proposed, not committed)
1. **v0.2 — follow-ups & rollback**: multi-turn per variant (continue any card), "fork from here",
   rollback = new commit restoring a past state (history stays append-only).
2. **v0.3 — providers**: OpenAI (reasoning summaries), xAI Grok, Llama via an OpenAI-compatible endpoint
   (Together/Groq/Ollama). Provider interface already isolates this in `server/providers/`.
3. **v0.4 — real isolation for agentic variants**: each variant gets its own sandbox where it can run
   code / a browser (options: Claude Managed Agents sessions per variant, or one container per variant
   with Playwright). Needed for prompts like "book me a table" to go beyond search.
4. **v0.5 — repos per variant + remote sync**: each variant (or each agentic sandbox) writes to its own git
   repo, linked from the workspace repo as submodules; workspace repo pushes to a private GitHub/GitLab
   remote with branch protection (no force-push) and a CI append-only verifier.
5. **v0.6 — accounts**: real sign-in (OAuth/email), per-user encrypted key vault, per-user repos.
6. Comparisons/evals: side-by-side diff of responses, human voting, LLM-judge scoring stored with the run.

---

## v0.1.1 — 2026-10-04 — reprompt / takes (prompt 0003)

### Change to the plan
- **New concept: a *take*.** A take is one fresh, isolated run of a variant. Rerunning a variant ("reprompt") adds a
  take; it never overwrites earlier ones. Takes are how the app shows run-to-run variance (stochasticity) next to
  variant-to-variant differences.
- **Playground (built):** every scripted variant has 2–3 seeded takes. Each card has *↻ Reprompt in a fresh context*,
  take tabs, and a verdict badge (*✓ N takes identical* / *≠ takes differ*). *↻ Reprompt all* reruns every card.
  Takes commit to `variants/<v>/takes/<n>/`.
- **Size-budget prompts:** when an example sets a byte limit, each artifact shows its measured size and a pass/fail check.
- **Real app (planned, roadmap v0.2):** `POST /api/runs/:id/variants/:v/reprompt` runs the same variant config
  again with no shared history, writes `variants/<v>/takes/<n>/`, and the UI gets the same tabs and verdict.
  For exact-match checks the verdict should compare normalised text (and later, structured output).
- **Determinism examples (real app):** pinned via context only (system prompts with rules, templates, fixed defaults).
  Real JSON-schema structured output (`output_config.format`) per variant is a follow-up.

### Prompt set added
Determinism: random number with/without deterministic mode; ticket triage free text vs rules/JSON; production runbook
free-form vs fixed template. Games: fun game < 2 KB, puzzle game < 3 KB, action game < 4 KB. Fun: tell me a joke.

---

## v0.1.2 — 2026-10-04 — timestamps, master ledger, time travel, debates (prompt 0004)

### Change to the plan
- **Every record carries one instant in three forms:** `unix` (seconds), `iso`, `human` (RFC 1123 UTC). Applied to
  `run.json`, `meta.json` (start and finish), every line of `events.jsonl` (`t` ms + `iso`), and a git trailer
  `Timestamp: <unix> (<iso>)` on every commit message. The playground log shows the same pair.
- **Master ledger.** The workspace repo gains `ledger.jsonl`: one line per event with only timestamp, prompt, models,
  output files (plus run/variant ids to join on). This is the "master repo" view; thinking, events and artifacts stay in
  the per-run / per-variant trees (and later, per-variant repos). `GET /api/workspaces/:ws/ledger` serves it.
- **Time travel simulator (playground):** a second view replays a scripted hour of one workspace from its ledger with a
  continuous slider, play/pause at 30×/120×/600×, an SVG timeline of typed events (prompt, run, configuration, model
  change, MCP tool, agent debate), and three live panels: prompt as a word diff against the previous version,
  configuration (models with per-model MCP tools, web access toggle), and output-file tiles. The ledger rail shows every
  event with human + unix time and the prompt diff.
- **Multi-agent debates as first-class events.** Three agents (Planner / Critic / Builder on different models) negotiate
  the prompt, the configuration and the outcome; each debate is an event with turns, proposals (shown as prompt diffs) and
  a resolution committed as `debates/round-N.md`. Planned for the real app: a `debate` run type whose turns are ordinary
  variant calls with the transcript as shared context, resolution written to the ledger.

### Ledger line format
```json
{"unix":1791127835,"iso":"2026-10-04T15:30:35.128Z","human":"Sun, 04 Oct 2026 15:30:35 UTC",
 "event":"prompt|variant|debate|config","run":"<run-id>","variant":"v1","prompt":"...","models":["claude-opus-5-5"],"outputs":["runs/.../response.md"]}
```

---

## v0.2 — 2026-10-04 — PoC direction: the variant windows harness (prompts 0005–0010)

### Change to the plan
The v0.1 scripted playground is frozen on branch `prototype/v0.1-scripted-playground`. Work continues on `poc/variant-windows`
(same commits as `claude/cool-hawking-d5q52e`), starting from a front-end mockup only; the owner asked for no backend work yet.

### What the PoC should be (from the owner, mocked in `docs/mockup/index.html`)
- **A remote-desktop view** (macOS or Ubuntu look) with **1–5 variant windows** side by side. Each window looks like a browser
  showing one provider's chat page: Claude, ChatGPT, Gemini, Grok, or an open-source model behind a local UI. Any mix is
  allowed (e.g. Haiku + Opus + Fable, or Fable + ChatGPT + Gemini). Browser chrome opens (+) and closes (×) windows,
  minimises them, or shows one window alone.
- **One prompt bar above all windows.** Typing mirrors into every window's composer; Enter sends to all at once.
- **Status colour per window:** yellow while processing, green when finished, red when stopped.
- **Each window's own options are visible as that site shows them** (model picker, thinking/search/research toggles).
- **Thinking is shown the way each site shows it:** a collapsed "Thought for Ns" line that expands. Everything is captured.
- **Trace drawer per window:** every event and token count, searchable.
- **Project spend cap** in the menu bar. Reaching it stops running windows; partial output is committed.
- **Experiment repo window** (floating, draggable) that updates live: one commit for the prompt, one per window as it
  finishes, one when the turn is complete.
- **Export package** per experiment, timestamped, readable by hand, and itself an append-only git repo that can later be
  forked, branched or restored into the harness:
  ```
  experiments/<YYYYMMDDTHHMMSSZ>-<slug>/
    README.md  prompt.md  manifest.json  ledger.jsonl  git-log.md
    variants/NN-<provider>-<model>/
      response.md  thinking.md  trace.jsonl  screenshot.png  artifacts/…
    turns/NN/…                      (later turns)
  ```
  Every human-readable text file is Markdown (owner, prompt 0010); machine files stay JSON / JSON Lines.

### Open decision: how a window gets its content (owner to choose before the backend starts)
| Route | How | For | Against |
|---|---|---|---|
| A. Real provider web UIs | Playwright opens one isolated browser profile per window, the owner signs in, the harness types the prompt and streams the screen (noVNC or CDP screencast) | Looks and behaves exactly like the sites; uses existing subscriptions | Automating consumer chat sites is likely against their terms and can get accounts flagged; breaks when the sites change; logins, 2FA and captchas; no token counts, so the spend cap can't work |
| B. Provider APIs in provider-styled windows | Each window calls the provider's API with the owner's key and renders the reply in a page styled like that provider; Playwright only takes the screenshot | Reliable, metered (cap works), every reasoning control exposed, allowed by the API terms | Looks like the sites, isn't them; needs an API key per provider |

Recommendation: **B**, with A kept as an experiment for a provider whose terms allow it.

### Reasoning ("thinking") controls by provider, API side (verify against each provider's docs at build time)
| Provider / models | Control | What the UI can show |
|---|---|---|
| Anthropic Opus 5.5, Sonnet 5.5, Fable 5.1, Opus 5 | Adaptive thinking + `effort` low · medium · high · xhigh · max | Summarized thinking |
| Anthropic Haiku 4.5 | `budget_tokens` | Summarized thinking |
| OpenAI GPT-5 family | `reasoning.effort` minimal · low · medium · high | Optional reasoning summary; raw reasoning hidden; reasoning tokens billed as output |
| Google Gemini 2.5 Flash / Pro | `thinkingBudget` in tokens (Flash 0–24,576, Pro 128–32,768, −1 = dynamic) | Thought summaries when requested |
| Google Gemini 3 | `thinking_level` low · high | Thought summaries when requested |
| xAI Grok 4 | Always reasons, not configurable | Reasoning not returned |
| xAI grok-3-mini | `reasoning_effort` low · high | Reasoning content returned |
| DeepSeek-R1 (open weights) | Always thinks | Raw thinking text |
| Qwen3 (open weights) | Thinking on/off | Raw thinking text |
| gpt-oss (open weights) | Reasoning low · medium · high | Raw reasoning text |
| Llama 4, Kimi K2 (open weights) | No thinking mode | — |

Summaries and raw thinking are not comparable one to one; the export labels which kind each window produced.

### Later (kept in mind, not built)
- Meta-agent that reads all windows and summarises what each did.
- Criteria checks: objective tests (RLVR-style pass/fail), subjective scores (RLHF-style), or both; a critic model that
  refines answers toward stated or implied criteria.
- pass@k and pass^k per window across k takes (pass@k = any of k passes; pass^k = all k pass).

---

## v0.3 — 2026-10-04 — decision: provider APIs; variant tabs; repo as a diff of user changes (prompt 0011)

### Decisions from the owner
- **Route B: tabs call provider APIs / SDKs** (closes the open decision in v0.2). Pages stay styled after each provider's chat
  layout; the pane header shows the real endpoint.
- **Windows and tabs merge into one concept, the variant tab.** One browser, one tab strip; tabs show side by side or one at a
  time; × closes, + New tab opens (max 5). Tab colour = status (yellow processing, green finished, red stopped).
- **The repo view is a git diff of what the user did.** The harness state is two files, `prompt.md` and `harness.yaml`
  (tabs → api, model, effort/thinking setting, web search; `mcp_servers`; `spend_cap_usd`). Every user change shows first as
  "Not sent yet" with a live diff; Send commits it as one commit, typed and coloured by kind (P prompt, C model/effort/tabs,
  T tool, M MCP server). Each tab's reply is then its own commit (R) adding `runs/NN/<tab>/response.md`, `thinking.md`,
  `trace.jsonl`, `screenshot.png`, `artifacts/`. Re-sending with no change is an empty "take" commit (input for pass@k).
- **Each Send is a fresh-context run** of every tab (not a chat continuation), so runs compare prompt and config versions.

### Harness surfaces compared (why API first)
| | Web UI (claude.ai, chatgpt.com, …) | API / SDK (this PoC) | CLI / agent harness (Claude Code, Codex CLI, Gemini CLI, Agent SDK) |
|---|---|---|---|
| What you control | Almost nothing: hidden system prompt, product features, model updates without notice | System prompt, model version, effort/thinking, tools, output schema, sampling count | The whole agent loop: files, shell, MCP, hooks, sub-agents; headless JSON output (`claude -p`, `codex exec`, `gemini -p`) |
| Reproducibility | Low; no run record beyond the chat | High: exact request + response + usage logged per run | Medium: the trajectory varies run to run, but every step can be logged |
| Automation allowed | Generally not by the sites' terms | Yes, it is what the API is for | Yes; headless modes are designed for it |
| Context / tools / MCP | Product connectors, set up per account | Harness-run MCP client shared by all tabs; provider-hosted MCP where offered (Anthropic MCP connector beta, OpenAI Responses remote MCP) | Native MCP config per CLI; each CLI has its own system prompt and tools |
| Agentic RL | Not usable | Single-turn and tool-use evals; RLVR-style graders on outputs; pass@k / pass^k by repeated sampling | Multi-step trajectories with verifiable rewards (tests pass, task done) inside sandboxes; best for agentic tasks |
| Enterprise fit | Seats, SSO, data controls per product | Org keys, workspaces, spend limits, ZDR options; also Bedrock / Vertex / Foundry for data residency | Runs in your containers / CI with your MCP servers and secrets |
| Fair model comparison | No | Yes, if every tab gets the same prompt, tools and MCP servers | Only within one harness; comparing CLIs compares products, not models |

Plan: API tabs now (v0.3). Next, an **agent tab** type that runs one headless agent loop per tab in its own container with
the same tools and MCP servers for every model (own loop over the APIs for fairness; vendor CLIs as an optional "product"
comparison). Graders (objective tests, rubric judges, critic model) and pass@k / pass^k come after.

### Keys and minimum spend for the PoC (verify current prices on each provider's page)
| Provider | Get a key | Minimum to start | Cheapest useful model |
|---|---|---|---|
| Anthropic | Console → Billing (buy credits) → Workspaces (spend limit) → API keys | Small prepaid credit (about $5) | Haiku 4.5 ($1 / $5 per Mtok); Opus 5.5 $4 / $20; Fable 5.1 $10 / $50 |
| OpenAI | platform.openai.com → Billing (prepaid credits) → Project with budget → API keys | Small prepaid credit (about $5) | A mini or nano model |
| Google Gemini | aistudio.google.com → Get API key | $0 on the free tier (rate-limited; free-tier prompts may be used to improve Google products, so don't send private data) | 2.5 Flash |
| xAI | console.x.ai → buy the smallest credit amount → API keys | Small prepaid credit | grok-3-mini |
| Open models, local | Install Ollama, `ollama pull qwen3:8b` (also `gpt-oss:20b`, `deepseek-r1:8b`) | $0; needs about 16 GB RAM | OpenAI-compatible at `http://localhost:11434/v1` |
| Open models, hosted | Groq console (free tier) or OpenRouter (one key, many models, some free variants) | $0 to start | gpt-oss-120b on Groq; Llama 4 / Kimi K2 / Qwen on OpenRouter |

Keys go in the server's `.env` (never committed): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`,
`GROQ_API_KEY`, `OPENROUTER_API_KEY`, `OLLAMA_BASE_URL`. Set a spend limit in every console in addition to the harness cap.
