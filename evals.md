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

---

## 2026-10-04 — session 1, part 3 (prompt 0003)

### Decisions taken without asking
- **D-18 "Reprompt" = rerun the same variant in a fresh context, kept as a numbered take** (never overwriting). Seeded
  2–3 takes for every scripted variant. When a card has used all its seeded takes the button says so instead of
  looping, because looping would show repeated outputs and fake determinism.
- **D-19 The three determinism prompts** (picked to show different levers): (1) random number, plain vs a
  "deterministic mode" system prompt with a documented default; (2) ticket triage, free text vs decision rules + JSON
  schema; (3) production column-rename runbook, free-form vs a fixed six-step template. Hints say why: current Claude
  models reject `temperature`/`top_p`, so consistency has to come from context, schemas and caller-supplied seeds.
- **D-20 Size budgets:** "fun game < 2 KB" as asked; **puzzle < 3 KB** and **action < 4 KB** (below the 4 KB / 10 KB
  the owner suggested) because the hand-written games fit comfortably and a tighter budget is more impressive.
- **D-21 The 12 games are real, hand-written, standalone files** in `docs/demo/games/` (2 takes × 2 models × 3 prompts),
  not mock-ups. `node docs/demo/build.mjs` inlines them into the playground. Byte sizes are measured in the page
  (UTF-8 `Blob` size), never typed into the reply text.
- **D-22 Joke takes** use well-known public-domain puns plus one original line; scripted, labelled as such.
- **D-23 The free-form runbook take 3 deliberately proposes an in-place `RENAME COLUMN`** with a lock warning, to show how
  variance matters most in safety-critical answers. The template-bound variant always gives expand/contract.
- **D-24 The real app got the same prompts** (`server/examples.js`) with real system prompts for the determinism
  variants, plus a byte-size readout on artifact buttons. Real per-variant reprompt is planned (spec v0.1.1), not built.

### Evaluations performed
- **E-06 All 12 games** loaded in headless Chromium with keyboard and mouse input: no page errors, all render (contact
  sheet reviewed). Sizes in bytes: orbit 1,408 · snake 1,806 · dodge 1,112 · whack 1,099 (all < 2,048);
  lights 2,126 · slide 2,188 · memory 1,336 · mini2048 2,004 (all < 3,072); asteroids 3,746 · breakout 3,717 ·
  runner 1,330 · shooter 2,029 (all < 4,096).
- **E-07 Playground flows:** run → reprompt all ×2 on the random-number prompt gives "≠ takes differ" for the plain
  variant and "✓ 3 takes identical" for the deterministic one; reprompt-all disables when takes run out; take tabs
  switch content; size badges are correct on every game prompt; triage shows differ vs identical; the joke prompt
  differs on all three models. Mobile 400px dark: no horizontal scroll. Zero page errors.
- **E-08 Not done:** real-API runs of the new prompts (still no key in the build environment).

### Bugs found (fixed)
- **B-06** Shooter: holding one movement key produced `NaN` (`1 - undefined`) and froze the player. Fixed with bitwise OR on key state.
- **B-07** Breakout: the HUD text inherited a dark fill after `ctx.restore()` and was invisible. Fixed.
- **B-08** A draft "take 2" thinking trace referred to an earlier take, which a fresh context cannot know about. Rewritten.

### Loopholes / risks
- **L-11 Seeded takes are finite and hand-picked,** so the playground illustrates variance but does not measure it.
  The real reprompt feature is what will produce honest variance data.
- **L-12 The determinism variants in the real app rely on system prompts only.** Without schema-enforced structured
  output they can still drift; E-08 should check this.
- **L-13 Games in the iframe need focus** for keyboard input; the viewer focuses the frame on open, but a click inside may
  still be needed in some browsers.

---

## 2026-10-04 — session 1, part 4 (prompt 0004) — model: Fable 5.1

### Decisions taken without asking
- **D-25 Three timestamp forms on every record** (unix seconds, ISO 8601, RFC 1123 human, all UTC) rather than two, so logs
  are greppable by unix, sortable by ISO and readable by people without conversion. UTC everywhere; local time is a
  display concern.
- **D-26 `ledger.jsonl` as the master index** inside the workspace repo (not a separate repo yet). One append-only line per
  event, limited to the four fields the owner listed plus ids to join on. Appending is done inside the same commit as the
  run files, so the ledger and the tree never disagree.
- **D-27 Time travel is a separate view** ("Playground" / "Time travel" switch in the top bar, `#time` deep link) rather
  than mixed into the run grid, so the playground stays uncluttered.
- **D-28 Event colours come from the dataviz skill's validated categorical palette** in fixed slot order (prompt blue,
  config orange, model aqua, tool yellow, debate magenta, run green), always paired with a glyph letter and a legend so
  identity is never colour-alone. Model identity uses the same palette on avatars, file tiles and ledger chips.
- **D-29 The scripted hour** uses the owner's X/Y prompts (joke → game < 2 KB → puzzle < 3 KB → action < 4 KB) and adds
  the events asked for: web access on, MCP tools (filesystem, playwright) added, a model switch Opus 5.5 → Fable 5.1,
  web access off, and three debates (prompt / configuration / outcome). Outputs reuse the real games with their measured
  byte sizes.
- **D-30 Debate agents are Planner (Opus 5.5), Critic (Sonnet 5.5), Builder (Haiku 4.5)**, on purpose on different models,
  and each debate ends in a resolution that is itself committed. Turn timestamps are spaced 7 s apart for display.

### Evaluations performed
- **E-09 Real app with a fake key:** `ledger.jsonl` gets a `prompt` line and a `variant` line with unix/iso/human; both
  commits carry the `Timestamp:` trailer; `/api/workspaces/default/log` returns `unix` per commit. Tests pass.
- **E-10 Time travel view in headless Chromium:** view switch works (Playground is `display: none` when hidden); 19 ledger
  rows at the end; 18 output files · 28.3 KB; MCP tools and web-off state correct at the end; release star on
  `breakout.html`; debate panel shows all 5 bubbles; play advances ~142 simulated seconds in 1.2 s at 120×; prompt diff
  marks 7 inserted words at v3; 400 px dark mode has no horizontal scroll; zero page errors.

### Bugs found (fixed)
- **B-09** The Playground stayed visible underneath the Time travel view: `.shell { display: grid }` outranked the
  `hidden` attribute in the local file (the artifact wrapper would have hidden it). Added `[hidden] { display: none
  !important }` to the page itself.
- **B-10** Debate bubbles staggered in over ~0.7 s, so a quick screenshot or thumbnail missed most of them. Delay cut to
  60 ms per turn.

### Loopholes / risks
- **L-14 The ledger is append-only by convention,** not by tooling. Same gap as L-07; the CI verifier should cover
  `ledger.jsonl` in workspace repos too.
- **L-15 The time-travel hour is scripted,** including the debates. The real app records timestamps and a ledger today
  but has no debate runs and no replay UI yet (spec v0.1.2 lists both).
- **L-16 Prompt diffs are word-level LCS,** good for short prompts; long prompts will need a line-aware diff.

---

## 2026-10-04 — session 1, part 5 (prompts 0005–0010) — variant windows mockup

### Decisions taken without asking
- **D-31 Branch names:** `prototype/v0.1-scripted-playground` (frozen v0.1 at `0564016`) and `poc/variant-windows`. The poc branch
  points at the same commits as the designated `claude/cool-hawking-d5q52e`, so both stay in sync.
- **D-32 Seeded examples are not stripped from the poc branch yet.** The owner asked for no backend work until the mockup is
  right (prompt 0010); removing `server/examples.js` seeds belongs with the backend change.
- **D-33 The mockup lives at `docs/mockup/index.html`** and is published to the same artifact link as the previous desktop mockup
  (https://claude.ai/artifact/7ggi9Tv2SPFmKTY33V8tgx).
- **D-34 Provider pages are approximations, not copies:** layout conventions (where the model picker sits, composer shape,
  greeting, "Thought for Ns" line) without logos or brand assets, and a footer saying they aren't affiliated. No sign-in
  forms; each window shows "Profile NN · isolated" instead, because a page that collects credentials under a provider's look
  is off limits.
- **D-35 Model lists and non-Anthropic prices in the mockup are placeholders.** Claude prices match `server/providers/anthropic.js`.
- **D-36 Spend cap defaults to $0.30 in the mockup** so a few turns trip it and the stop behaviour is visible.
- **D-37 Export layout:** every human-readable file is `.md` (owner rule); `manifest.json`, `ledger.jsonl`, `trace.jsonl` stay
  machine formats; one `screenshot.png` per window.
- **D-38 Narrow screens (< 720 px) show one window at a time**, switched from the window strip; wide screens tile up to 5.
- **D-39 Recommended route B (provider APIs in provider-styled windows) over route A (driving real sites with Playwright)**;
  recorded in spec v0.2 as an open decision for the owner.

### Bugs found
- **B-11** Replies earlier in this session (served by Haiku 4.5) named outdated models (Claude 3.5 Opus/Sonnet/Haiku, GPT-4o,
  o1-preview, Gemini 2.0, Grok 3) and wrong thinking options. Corrected in the mockup and in spec v0.2's table.
- **B-12** The previous desktop mockup hid its model sidebar below 900 px and squeezed the prompt into the top bar, so in the chat
  side panel the owner saw no prompt box, sidebar or run button. It also used `alert()`, which the artifact viewer blocks.
  Replaced: the prompt bar is a full-width row that is always visible; windows are added from the strip or a window's `+`.
- **B-13** The "turn complete" commit fired after the first window of the instant opening turn, because the running counter was
  incremented per window as it started. Now set once per turn before any window starts.
- **B-14** Redrawing the window strip on every streaming tick could swallow a click on a chip. Ticks now repaint only the
  window's status bar.
- **B-15** At 400 px the menu bar overflowed (page 512 px wide), and a default form margin left a gap under the prompt bar in the
  local file. Fixed.

### Evaluations performed
- **E-11 Headless Chromium run of `docs/mockup/index.html`:** opens with 3 finished (green) windows and 6 commits; adding Grok and
  sending a prompt turns all 4 chips and windows yellow within 2.6 s and green after about 11 s; repo window shows pending then
  committed rows with file paths; export sheet lists the package tree and `prompt.md`; 400 px dark mode has no horizontal
  scroll; no page errors (only Google Fonts blocked by the sandbox). Screenshots reviewed.

### Loopholes / risks
- **L-17 Route A (automating consumer chat sites)** is likely against those sites' terms, can get accounts flagged, breaks when
  their pages change, and runs into logins, 2FA and captchas.
- **L-18 Thinking is not comparable across providers:** some return summaries, open-weight models return raw text, Grok 4 returns
  none. Exports must label which kind each window has.
- **L-19 The spend cap only works where usage is metered** (APIs). Subscription web UIs expose no token counts.

---

## 2026-10-04 — session 1, part 6 (prompt 0011) — variant tabs, diff-style repo, API decision

### Decisions taken without asking
- **D-40 Harness state is two files, `prompt.md` and `harness.yaml`,** so "what the user did" is an ordinary git diff. Tabs are
  keyed by id in the YAML so a change to one tab produces a small hunk.
- **D-41 Changes are staged, not committed one by one.** The repo panel shows "Not sent yet" with a live diff; Send commits
  all pending changes as one commit before the runs. One commit per run keeps history readable while each change is still
  listed in plain words. A Send with no change is an empty "take" commit.
- **D-42 Each Send is a fresh-context run, not a chat continuation**, labelled "Run N · prompt vN · fresh context" in every
  pane. Prompt-engineering comparisons need each version answered from scratch.
- **D-43 MCP servers are shared by every tab** and run by the harness, which offers their tools to each provider as function
  tools. Provider-hosted MCP (Anthropic's connector, OpenAI's remote MCP) differs per provider, so it would make tabs unequal.
- **D-44 The repo panel is docked on the right (overlay below 1100 px)** instead of a floating window, because the floating
  window covered a pane in the previous version.
- **D-45 Per-tab controls are now API settings,** not web UI toggles: model, effort / thinking budget / reasoning level as each
  API names it, web search; models whose thinking can't be changed show it as fixed.
- **D-46 Open models are one tab type with several hosts** (Ollama local, Groq, OpenRouter) because they all speak the OpenAI-
  compatible API; raw thinking is labelled "Thinking, raw text".
- **D-47 Opening state shows each commit kind:** init, prompt v1 and its runs, then prompt v2 + Claude effort medium → high +
  MCP filesystem in one commit and its runs.

### Evaluations performed
- **E-12 Claude API facts checked against the bundled claude-api reference (cached 2026-09-25):** model ids and prices
  (Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Fable 5.1 $10/$50, Haiku 4.5 $1/$5), Opus 5.5 effort default `medium` with thinking
  always on, Haiku 4.5 uses `budget_tokens`, MCP connector beta needs `mcp_servers` plus an `mcp_toolset` tool.
  Non-Anthropic model names, prices and thinking controls are from memory and marked as placeholders.
- **E-13 Headless Chromium run:** opens with 3 green tabs and 9 commits; editing the prompt, Claude effort and adding MCP github
  shows 3 pending changes with word-level prompt diff and YAML hunks; Send turns tabs yellow, commits the change set, adds
  pending R rows, and all tabs end green; 400 px dark has no horizontal scroll; no page errors.

### Bugs found (fixed)
- **B-16** Reply paragraphs rendered in two columns because the reply container's class `body` collided with the browser
  body's flex rule. Renamed the layout class to `bbody`.
- **B-17** The MCP "Called …" line wrapped into a broken block in narrow panes; now one line with ellipsis.
- **B-18** The desktop-style switch was cut off at phone width; hidden below 720 px.

### Loopholes / risks
- **L-20 Gemini free tier** may use prompts to improve Google's products; fine for public test prompts, not for private context.
- **L-21 Fresh-context runs mean MCP tool results can differ between tabs** (same server, different calls). The trace records
  each call so differences are visible, but tool output is part of the variance.
- **L-22 Comparing vendor CLIs compares products** (system prompt, tools, loop), not models; the agent-tab plan needs one
  shared loop for model comparisons.

---

## 2026-10-04 — session 1, part 7 (prompt 0012) — free models, floating repo window, artifacts, export

### Decisions taken without asking
- **D-48 "Free" is a property of the model, not the provider:** $0 input and output price. Ollama models are free; Groq
  gpt-oss-120b is marked free tier; OpenRouter models stay paid. The answer to the owner's question is yes for local models,
  and only on free tiers for hosted open models (which are rate-limited).
- **D-49 A $0 cap means "paid tabs never run"**, not an error. Paid tabs show "paused by spend cap"; free tabs show
  "$0 · not limited by the cap".
- **D-50 Skipped paid tabs still get a commit** ("skipped run N · spend cap reached · nothing sent") so the repo shows which
  variants were left out of a run.
- **D-51 Restore loads a past state as unsent changes** instead of rewriting history; Branch does the same on a new branch
  label. History stays append-only either way. Tabs missing from the current session are reopened with new ids.
- **D-52 A third opening run (prompt v3) adds a tab (Open models · qwen3:8b) and asks for a small HTML calculator**, so the
  opening state has four real, working artifacts to preview inline. Each computes pass@k and pass^k.
- **D-53 Downloads are shown as a listing** of what the .zip or bundle would contain, because the artifact viewer blocks
  downloads. Push and restore controls are present but marked as arriving with the backend.

### Evaluations performed
- **E-14 Headless Chromium run:** opening state has 4 green tabs, 14 commits, 4 artifacts; the Claude artifact runs in the
  repo window's sandboxed frame and shows pass@k = 0.992, pass^k = 0.512 for p 0.8, k 3; setting the cap to $0 changes Send
  to "Send to 1 free tab", the three paid tabs are skipped (red) and the Open models tab runs to green; minimize puts the
  window in the dock and restores it; export view renders; 400 px dark has no horizontal scroll; no page errors.

### Bugs found (fixed)
- **B-19** The repo window opened over the toolbar's Repo and Export buttons; it now opens below the toolbar.
- **B-20** The "not sent" note printed a $0 cap as "$0.0000"; now "$0.00".

### Loopholes / risks
- **L-23 Free tiers have rate limits and may change**; a tab marked free can start failing with 429s or begin charging. The
  backend should read prices from config and show the provider's error, not assume $0 forever.
- **L-24 Inline artifacts run model-written scripts.** The frame has `allow-scripts` without same-origin, so it can't touch
  the harness's storage or keys, but it can still make network requests; the backend should serve artifacts from a separate
  origin with a strict CSP.

---

## 2026-10-04 — session 1, part 8 (prompt 0013) — time travel, reset, movable windows

### Decisions taken without asking
- **D-54 One generic window manager** for the repo window and any number of file windows: drag by the title bar, clamp so at
  least 80 px stays on screen, CSS resize, maximize, minimize to the dock, focus brings to front. Dragging now works at every
  width (it was disabled under 720 px, which is likely why the owner could not move it in a narrow panel).
- **D-55 Each commit stores a full snapshot** (settings, prompt, every file). Fine for a mockup; the backend reads these from
  git instead (`git show <sha>:path`).
- **D-56 Clicking a commit both previews and expands it**; clicking the selected one again only collapses it. The slider,
  ‹ › and arrow keys step one commit at a time and keep the selected commit scrolled into view.
- **D-57 Tabs closed later are kept, not destroyed**, so time travel can show them (dashed) and a restore revives the same
  tab with its full thread instead of creating a new one.
- **D-58 Restore stages, then Commit or Send records.** The owner asked for "checkout plus adding its diff"; staging first
  lets you review the diff, and the resulting commit is labelled ↶ restore. Commit without running records it with no API
  calls.
- **D-59 Reset is an empty commit** (⟲) with the discarded changes listed, rather than a silent discard, to keep the
  activity log append-only as asked.
- **D-60 In-flight replies are no longer commits.** They appear in a "running" list and become a commit when the reply ends,
  so history order equals completion order.
- **D-61 File windows don't reload when stepping through time** unless their content changes; only the "@ sha" label updates,
  so artifacts keep their state while you scrub.

### Evaluations performed
- **E-15 Headless Chromium run:** dragging the repo window moves it (to the top edge of the screen on desktop, 300 px down
  on a 400 px phone); two artifact windows open beside the repo window; moving the slider to commit 6 of 14 hides tab 04,
  shows tabs 01–03 yellow (their replies to prompt v2 were still in flight), puts prompt v2 in the read-only prompt bar and
  shows "doesn't exist yet" in all artifact views; Restore stages 3 changes (restore, prompt edit, closing tab 04) with word
  diffs; Reset returns tab 04 and adds "You reset 3 unsent changes back to <sha>"; 400 px dark has no horizontal scroll;
  no page errors.

### Loopholes / risks
- **L-25 Snapshots per commit grow with history** (every file copied). Fine for a demo, not for real experiments; the backend
  must read past states from git objects.
- **L-26 A restore that reopens a tab revives its old thread** (useful for comparison) but the restored tab's next run is still
  a fresh context; the UI says "fresh context" on every run to avoid confusion.

---

## 2026-10-05 — session 1, part 9 (prompt 0014) — orchestrator, steps, playback, artifacts window, flags

### Decisions taken without asking
- **D-62 Every change from this round is behind a flag** whose other option is the v4 behaviour, persisted per browser.
  Owner asked for easy swap/revert; flags beat git reverts for single elements.
- **D-63 Element names are `data-dbg` attributes** (not ids), so they never collide with code ids, are easy to search in
  devtools, and can be drawn by one CSS rule for the overlay.
- **D-64 Mockup versions v1–v5 are named after their commits** (312e3a8, 296579c, 3e60f4f, 55d3ace, this one) so the owner
  can say "like v4".
- **D-65 Orchestrator runs automatically after each run, on Opus 5.5**, with small charged costs, and is skipped when its
  flag is off. Three commits per run: summary + spec, verifiers + results, next prompt.
- **D-66 Verifiers are deterministic checks** (regex/size/sentence count) derived from the prompt wording, so results are
  objective and repeatable (RLVR-style); an LLM-judge rubric is a later addition.
- **D-67 Opening state uses the orchestrator's suggestions**: run 2 and run 3 prompts are its suggestions, and its suggestion
  after run 3 has scripted chart replies, so "Use" then Ctrl+Enter shows a coherent run 4 (16 of 20 checks; qwen3 fails the
  definitions and the two-sentence rule).
- **D-68 ↑ / ↓ only switch prompts from the first / last line**, so multi-line editing still works.
- **D-69 Docking keeps the window in the same element** (class `docked`, browser right inset follows `--dock-w`) instead of
  moving it in the DOM, so state and scroll positions survive.
- **D-70 Playback colour is slate blue** ("frozen"), red stays reserved for stopped/failed.

### Evaluations performed
- **E-16 Headless Chromium run:** prompt bar opens with prompt v3 and an orchestrator suggestion; ↑ shows v2, ↓↓ shows the
  suggestion; Enter adds a newline and Ctrl+Enter sends; run 4 commits 4 replies then 3 orchestrator steps (16/20 checks)
  and a new suggestion; Artifacts window shows 4 working charts side by side in tab order; Dock shrinks the browser
  (right inset 468 px); three steps back shows the slate "Playback · read only" banner; element-name overlay and flags
  window render; switching changesView to detailed and ttTheme to pink restores v4 behaviour; 400 px dark has no
  horizontal scroll; no page errors.

### Bugs found (fixed)
- **B-21** Accepting the orchestrator's suggestion produced generic simulated replies that failed every check (0/16).
  Added scripted chart replies and a size criterion for that prompt.
- **B-22** Artifacts window listed tabs in reply-completion order; now sorted by tab number.
- **B-23** Element-name labels for a pane and its header overlapped; pane and status labels now sit at the bottom right.

### Loopholes / risks
- **L-27 Verifiers derived from prompt wording are shallow** (keywords, sentence counts). They make the loop visible but are
  not proof of correctness; real verifiers should execute artifacts and compare numbers.
- **L-28 Orchestrator cost is charged even for free-only runs**; with the cap at $0 it should run on a free local model.
