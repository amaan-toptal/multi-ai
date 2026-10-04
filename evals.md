# multi-ai — evals, bugs, loopholes, decisions

> Append-only. New entries go at the bottom. To revise an entry, append a new one that references it.
> IDs: `D-` decision taken autonomously, `B-` bug found, `L-` loophole / risk, `E-` evaluation / test performed.

---

## 2026-10-04 — session 1 (prompt 0001), v0.1 build

### Decisions taken without asking
- **D-01 Stack: Node 22 + Express 5 + vanilla JS front end, no build step.** Smallest thing that streams well,
  fits one Docker image, and uses the official `@anthropic-ai/sdk`. Trade-off: no component framework; fine for a POC.
- **D-02 Isolation for v0.1 = one independent API conversation per variant.** The owner offered VMs / browser
  sessions / Playwright and said to feel free to ask first. For chat-style variants, separate API calls already give
  full context isolation, so I built that and deferred sandboxed execution (needed for agentic prompts) to roadmap v0.4.
  Open question for the owner in HANDOFF.
- **D-03 Claude access via Console API keys only, not Claude.ai/Claude Code subscription login.** Subscription OAuth
  tokens (e.g. from `claude setup-token`) are for Anthropic's own clients; using them in a third-party web app isn't
  allowed by Anthropic's terms and could get the account flagged. README documents how to get a key from *another*
  account safely (workspace + spend limit + invite).
- **D-04 Keys never touch disk on the server.** Sent per request in a header, held in memory for the run.
  Browser keeps it in sessionStorage by default, localStorage only if "remember" is ticked.
- **D-05 Server refuses to start if `ANTHROPIC_API_KEY` is set without `APP_PASSWORD`** (override `ALLOW_OPEN=1`),
  to prevent an open credit-spending endpoint.
- **D-06 One git repo per workspace; one commit for the prompt and one per finished variant.** Gives a natural
  timeline and cheap time travel via `git show <sha>:<path>`. Per-variant repos deferred (roadmap v0.5).
- **D-07 Thinking shown is the API's summarized thinking** (`display: "summarized"`); current models never return raw
  chain of thought. Labelled "Thinking" in the UI; documented in spec.
- **D-08 Default models/effort**: Opus 5.5 (effort high) + Sonnet 5.5 (medium) as the default pair. Opus 5.5's API
  default effort is `medium`, so effort is always sent explicitly.
- **D-09 Server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`) enabled** on
  models that support it; if the key's org rejects the beta (400 mentioning fallback), the variant retries once
  without it and shows a notice. `meta.json` records `servedModel` so a fallback is visible.
- **D-10 Web search** uses `web_search_20260209` on Opus/Sonnet 5.x and `web_search_20250305` on Fable 5.1 and Haiku 4.5
  (conservative: the dynamic-filtering variant isn't documented for Fable/Haiku). `pause_turn` is resumed up to 5 times.
- **D-11 Artifacts = fenced code blocks ≥ 3 lines.** Simple and model-agnostic. Misses artifacts described in prose or
  split across blocks (see L-04).
- **D-12 marked + DOMPurify served from `node_modules`** instead of a CDN, after the CDN was unreachable in the build
  sandbox (B-02). Removes a third-party runtime dependency too.
- **D-13 Haiku 4.5 uses `thinking: {type: "enabled", budget_tokens: 16000}`** and no `effort` (unsupported there).
- **D-14 Prices hard-coded in `server/providers/anthropic.js`** for the cost estimate only (cached 2026-09-25 table).
  Will drift; Console is the source of truth.

### Evaluations performed
- **E-01 Unit test with a mock Messages API** (`test/provider.test.js`): thinking/text/server-tool streaming,
  web-search result summarisation, `pause_turn` continuation (2 requests, assistant turn re-sent), request shape
  (adaptive+summarized thinking, effort, fallbacks, tool type, system), artifact extraction, Haiku request shape. Passing.
- **E-02 Real API smoke test with an invalid key**: request reached api.anthropic.com, 401 surfaced per variant,
  both variants still committed with `status: error` (failures are recorded, not lost).
- **E-03 End-to-end UI test with Playwright + mock API**: example chip → 3 variants → live streaming cards → done badges,
  usage/cost footer, git sha shown; artifact opens in sandboxed iframe; history reload; timeline time-travel shows
  "not yet" for variants not finished at that commit. Screenshots reviewed.
- **E-04 Not yet done: a run against the real API with a valid key** (none available in the build environment).
  First thing to try. Also not done: `docker build` (no Docker daemon in the build sandbox).

### Bugs found (and fixed in this session)
- **B-01** Test assumed a `pause_turn` continuation sends 3 messages; correct is 2 (user + paused assistant turn). Test fixed.
- **B-02** Markdown rendered as plain text when the CDN was blocked → vendored libs (D-12).
- **B-03** API errors displayed as raw JSON blobs → now `status: message` from the SDK error object.
- **B-04** Time-travel view showed empty "Thinking" panels for unfinished variants → hidden when empty.

### Loopholes / risks (open)
- **L-01 No real user accounts.** Anyone past `APP_PASSWORD` can read/write any workspace by typing its name.
  Fine for a single owner; must be fixed before sharing (roadmap v0.6).
- **L-02 Live runs live in process memory.** Restarting the server mid-run loses the live stream (the partial variant is
  not committed). Requires a single instance (Cloud Run `--max-instances 1`).
- **L-03 Artifact sandbox**: iframe has `allow-scripts` but no same-origin, so artifacts can't read the app's storage or
  cookies — but they *can* make network requests (e.g. beacon out) and play audio. Acceptable for previews of
  model-written code; a stricter CSP inside the srcdoc is a possible hardening.
- **L-04 Artifact extraction heuristic** misses non-fenced output and may treat illustrative snippets as artifacts.
- **L-05 Cost runaway**: `max_tokens` 64k × up to 8 variants × `max` effort can be expensive (Fable 5.1 at $50/Mtok out).
  Mitigation today: workspace spend limits in the Console (README). Future: per-run budget cap in the app.
- **L-06 Workspace git repos are only on the server disk.** Disk loss = history loss until remote sync (roadmap v0.5).
  Backup instructions are in deploy/README.md.
- **L-07 Append-only rule for HANDOFF/spec/evals/prompts is not enforced by tooling yet** — only by CLAUDE.md.
  Owner asked to be reminded to build a CI verifier + disable force pushes (see HANDOFF TODO).
- **B-05 (was a loophole)** Prompt `{{now}}` placeholder was substituted with the *server's* clock/timezone.
  Fixed: the browser fills it with the user's local time + UTC offset before sending.

---

## 2026-10-04 — session 1, part 2 (prompt 0002)

### Decisions taken without asking
- **D-15 What "previewable artifact" means:** a claude.ai Artifact page published (or updated) in each reply, showing
  the current state of the work. When a reply has no new UI to show, update the existing playground or publish a
  small page for that reply's result. Recorded as a standing rule in CLAUDE.md, which is not an append-only file.
- **D-16 The first artifact is a scripted playground, not a live client.** The artifact sandbox blocks network calls
  (CSP), so it can't call the Claude API. Replies are pre-written and labelled "scripted replies"; the Milan example
  uses obviously invented restaurant names marked "(sample)" so nothing reads as real data.
- **D-17 One source file for the playground** (`docs/demo/index.html`), written in the artifact page format (no doctype
  wrapper). The app also serves it at `/demo`; browsers render it fine without the wrapper.

### Evaluations performed
- **E-05 Playwright run of the playground** at 1300px light and 400px dark: all 3 variants finish, no page errors,
  no horizontal page scroll (scrollWidth equals viewport), git log and file tree update per commit, DAW artifact
  renders in the sandboxed iframe. Markdown showed as raw text locally because the CDN is blocked in the build
  sandbox; the published page loads marked/DOMPurify from cdnjs, which the artifact CSP allows.

### Loopholes / risks
- **L-09 Playground drift:** the scripted playground can fall out of sync with the real app. Mitigation: CLAUDE.md step 5
  says to update it whenever the UI or behaviour changes.
- **L-10 The artifact link is private** to the owner's claude.ai account; others can't open it until shared from the page's Share menu.
