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
