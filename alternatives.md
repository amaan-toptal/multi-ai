# Alternatives and related projects

Researched 2026-10-06; verify before relying on it. Star counts, license fields and "last push" dates come from the GitHub repository search API on 2026-10-06. "Last push" is GitHub's `pushed_at`, which counts a push to any branch. Licenses marked NOASSERTION by GitHub were checked by reading the repo's LICENSE file. Facts that come only from third-party search snippets are marked "(reported)". Facts I could not confirm are marked "unverified".

**What is unique about multi-ai:** Sending one prompt to many models side by side is now common. ChatHub, ChatALL, big-AGI Beam, Open WebUI, LibreChat, TypingMind, Msty, Cherry Studio, OpenRouter, Google AI Studio and the OpenAI Playground all do it. Several of them can also merge the answers (Beam, the Open WebUI "Merge", TypingMind Finalize, llm-council's chairman). Eval tools such as promptfoo, ChainForge, Braintrust, LangSmith, Opik and Phoenix add assertions and LLM rubrics over a prompt-by-model matrix. None of the tools reviewed combines these three things:
1. An **append-only git repo** as the record of every pane, with time travel across all panes at once. LangSmith's immutable prompt commits and Braintrust's experiment snapshots version prompts or runs, not the whole multi-pane session.
2. An **orchestrator agent** that writes the spec, writes the verifiers itself (pattern, fail-to-pass in the SWE-bench sense, rubric) and suggests the next prompt. Other tools leave the tests to a human, or generate only test inputs (Anthropic Console).
3. **Side-by-side rendered HTML artifacts plus a zoomable canvas of many projects.** WebDev Arena renders two apps for voting and tldraw "Make Real" puts generated HTML on a canvas, but neither is a multi-project harness.

---

## 1. Side-by-side multi-model chat

| Name | GitHub | Demo / hosted | License | Open source? | Maintained? (last push) | Stars | Relevant to multi-ai |
|---|---|---|---|---|---|---|---|
| ChatHub | [chathub-dev/chathub](https://github.com/chathub-dev/chathub) | https://chathub.gg (web, extension, desktop, mobile; reported) | GPL-3.0 | Yes (browser extension repo). Whether the chathub.gg apps are open: unverified | 2026-02-27 | ~10.7k | The closest consumer analogue: one prompt to up to 6 bots side by side (reported). Copyleft, so do not copy code. Borrow the "N columns, one input" layout only. |
| ChatALL | [ai-shifu/ChatALL](https://github.com/ai-shifu/ChatALL) | https://chatall.ai | Apache-2.0 | Yes | 2026-10-02 | ~16.5k | Electron client that sends one prompt to many bots, by web login or API. It has 1/2/3-column views, a highlight/delete control per answer and local history. Its "quick-prompt" mode (send the next prompt without waiting) is worth borrowing. |
| GodMode (smol-ai) | [smol-ai/GodMode](https://github.com/smol-ai/GodMode) | none (desktop app) | MIT | Yes | 2024-07-29 (looks unmaintained) | ~6.0k | Embeds the providers' own web apps side by side and broadcasts the input to all of them. That gives the "provider-styled panes" idea for free, but it has no API, no recording and no evals. |
| big-AGI (Beam) | [enricoros/big-AGI](https://github.com/enricoros/big-AGI) | https://big-agi.com | MIT | Yes (a paid "Pro" tier adds sync; reported via README fetch) | 2026-10-05 | ~7.1k | Beam sends one prompt to N models, then you **fuse or merge** the answers. This is the best reference for a "merge panes" action. The license is MIT, so code can be reused with attribution. |
| Open WebUI (multi-model chats) | [open-webui/open-webui](https://github.com/open-webui/open-webui) | https://openwebui.com (self-host) | Open WebUI License (BSD-3-Clause-style plus a **branding clause**; not OSI) | Source-available with restrictions | 2026-10-06 | ~154k | Use "+" to add models; replies show in parallel columns, and "Merge" (Mixture of Agents) sends them to a synthesizer model. Strong Ollama support. The branding clause limits reuse (see Licensing notes). |
| LibreChat | [LibreChat-AI/LibreChat](https://github.com/LibreChat-AI/LibreChat) (moved from danny-avila/LibreChat) | https://librechat.ai | MIT | Yes | 2026-10-06 (latest release seen: v0.8.8) | ~45.3k | Its "+" next to the model picker starts a dual conversation (2 models in parallel). It also has artifacts, MCP, agents and multi-user auth. A good MIT source for provider adapters. |
| LobeHub (formerly LobeChat) | [lobehub/lobehub](https://github.com/lobehub/lobehub) | https://app.lobehub.com | LobeHub Community License (Apache-2.0 plus conditions) | Source-available. A derivative work you distribute needs a commercial license | 2026-10-06 | ~83k | Now positioned as an agent workspace ("Agent Groups", "Pages"). I could not confirm a side-by-side compare mode in its docs (unverified). Do not borrow code (see Licensing notes). |
| Cherry Studio | [CherryHQ/cherry-studio](https://github.com/CherryHQ/cherry-studio) | https://cherryai.com | AGPL-3.0 | Yes | 2026-10-06 | ~52.4k | Desktop client that answers from several models at once for comparison and supports Ollama/LM Studio (reported). AGPL, so ideas only. |
| openplayground (nat) | [nat/openplayground](https://github.com/nat/openplayground) | nat.dev (README link; current status unverified, the site was blocked from here) | MIT | Yes | 2026-02-06 | ~6.3k | Local playground that compares models side by side with per-model parameters. Small MIT codebase, useful for the per-pane parameter UI. |
| LMArena / Arena + FastChat | [lm-sys/FastChat](https://github.com/lm-sys/FastChat); [lmarena/arena-hard-auto](https://github.com/lmarena/arena-hard-auto) | https://arena.ai (renamed from LMArena on 2026-01-28; lmarena.ai redirects) | FastChat Apache-2.0; arena-hard-auto Apache-2.0; arena.ai service proprietary | FastChat yes; the current site no | FastChat 2026-05-01; arena-hard-auto 2025-06-21 | FastChat ~39.6k | Blind A/B voting between 2 anonymous models plus Elo leaderboards. Arena raised a $150M Series A in Jan 2026 (reported). **WebDev Arena** renders two generated web apps in iframes (E2B sandboxes) for voting, the closest public analogue of multi-ai's side-by-side HTML artifacts. Borrow the "blind mode / hide model names" toggle. |
| OpenRouter Chatroom | none | https://openrouter.ai/chat ("Compare AI Models Side by Side"); Fusion at openrouter.ai/labs/fusion (reported) | proprietary | No | live service | n/a | Multi-model chatroom over one gateway. Useful as a single backend for the many open and closed models multi-ai routes to. |
| Karpathy llm-council | [karpathy/llm-council](https://github.com/karpathy/llm-council) | none (local) | **No LICENSE file** (all rights reserved by default) | Code is public but not licensed | 2025-11-22 (README: "not going to support it") | ~25.2k | Three stages: every model answers; models rank each other's anonymised answers; a "Chairman" model synthesises. Close to multi-ai's orchestrator idea. Copy the concept, not the code. |
| TypingMind | none | https://typingmind.com | proprietary | No | live product | n/a | "Multi-model responses" show columns side by side, each model keeps its own thread for follow-ups, you can pick a primary response, and "Finalize Mode" merges them. |
| Msty (Msty Studio) | none | https://msty.ai | proprietary (free plan exists) | No | live product | n/a | "Split chats" mix local (Ollama-style) and online models with **synced inputs**. You can also run the same model with different settings, which matches multi-ai's "variants" idea. |
| Google AI Studio Compare Mode | none | https://aistudio.google.com ("Compare" button) | proprietary | No | live | n/a | Compares Gemini/Gemma outputs and latency side by side, including system-instruction variants. Gemini only. |
| OpenAI Playground compare | none | https://platform.openai.com/playground | proprietary | No | live | n/a | A "Compare" button runs the same prompt against two configurations (confirmed only by a third-party explainer, loopingly.com; no OpenAI page reachable). OpenAI models only. |
| Vercel AI SDK Playground | none | https://ai-sdk.dev/playground | proprietary (hosted) | No | live | n/a | Multi-provider compare playground (reported; the feature details in the snippets may describe openplayground, so treat as unverified). |

## 2. Prompt/variant comparison and evals with a UI

| Name | GitHub | Demo / hosted | License | Open source? | Maintained? (last push) | Stars | Relevant to multi-ai |
|---|---|---|---|---|---|---|---|
| ChainForge | [ianarawjo/ChainForge](https://github.com/ianarawjo/ChainForge) | https://chainforge.ai/play/ (limited web version) | MIT | Yes | 2026-10-03 | ~3.0k | Node canvas: prompt templates × models × variables, a response inspector (side-by-side and table grid), Python/LLM evaluators and plots. Its combinatorial "multiverse of outputs" is the closest research analogue (arXiv 2309.09128). Borrow the table layout. |
| promptfoo | [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | https://promptfoo.dev | MIT | Yes | 2026-10-06 | ~25.7k | **Now owned by OpenAI**: announced 2026-03-09, and the README says "Promptfoo is now part of OpenAI. Promptfoo remains open source and MIT licensed." Declarative prompt × provider matrix, a web viewer, deterministic assertions plus `llm-rubric`, and a red-team suite. The best model for multi-ai's verifier config format. The neutrality risk is now that a model vendor owns it. Deal value of $86M is reported only. |
| Agenta | [Agenta-AI/agenta](https://github.com/Agenta-AI/agenta) | https://cloud.agenta.ai | MIT outside `ee/` (ee under its own license) | Open core | 2026-10-06 | ~4.8k | **Pivoted.** The README now describes "the open-source workspace for your agents and your team", and the old playground/eval positioning is gone from it. No longer a direct comparable. |
| Langfuse | [langfuse/langfuse](https://github.com/langfuse/langfuse) | https://langfuse.com | MIT core; `ee/` dirs under a commercial license | Open core | 2026-10-06 | ~35.4k | **Acquired by ClickHouse** (announced 2026-01-16; "No licensing changes planned"). Tracing, prompt management with versions, a playground that compares variants, datasets/experiments and LLM-as-judge. A good model for trace storage. |
| Opik (Comet) | [comet-ml/opik](https://github.com/comet-ml/opik) | https://www.comet.com/docs/opik/ | Apache-2.0 | Yes | 2026-10-06 | ~22.4k | The playground runs independent variants (model, messages, params) side by side against a test suite with pass/fail. It also has prompt optimizers (MetaPrompt, Evolutionary, etc.). The most permissive full-featured option; borrow the pass/fail-per-variant display. |
| Arize Phoenix | [Arize-ai/phoenix](https://github.com/Arize-ai/phoenix) | https://arize.com/docs/phoenix | **Elastic-2.0** (source-available, not OSI) | Source-available | 2026-10-06 | ~11.7k | The playground compares up to 3 prompts, or one prompt across models, then runs over datasets with LLM or code evaluators. ELv2 forbids offering it as a hosted service. |
| Helicone | [Helicone/helicone](https://github.com/Helicone/helicone) | https://www.helicone.ai | Apache-2.0 | Yes | 2026-09-16 | ~6.2k | **Acquired by Mintlify on 2026-03-03.** Reported to be in maintenance mode (security and bug fixes only); the README does not say so. Gateway plus observability plus playground. Do not depend on it. |
| W&B Weave | [wandb/weave](https://github.com/wandb/weave) | https://wandb.ai (W&B; owned by CoreWeave since 2025-05-05) | Apache-2.0 (SDK); hosted W&B proprietary | SDK yes | 2026-10-06 | ~1.1k | The playground tries the same prompt across models, runs several trials for a consistency check and replays production traces. The "N trials per variant" idea is worth borrowing. |
| Braintrust | none (core is closed; open-source pieces not checked) | https://www.braintrust.dev | proprietary | No | live | n/a | Playgrounds put tasks × scorers × dataset side by side, and **diff mode** highlights output and score changes between variants. "+ Experiment" freezes an immutable snapshot. The closest commercial match for multi-ai's diff and history features. |
| LangSmith | none | https://smith.langchain.com | proprietary | No | live | n/a | Playground "Compare" for prompts and models, an experiment comparison view, and a Prompt Hub where every push is an **immutable commit** with movable tags, "exactly like git branches". This is git-like versioning of prompts only. |
| PromptLayer | none | https://promptlayer.com | proprietary | No | live | n/a | Prompt registry with versions, production A/B traffic splits, an eval playground with side-by-side compare and regression tests on prompt updates. |
| Anthropic Console Workbench / Evaluate | none | https://console.anthropic.com (docs now at platform.claude.com) | proprietary | No | live | n/a | The Evaluate tab needs `{{variables}}`, can **auto-generate test cases** with Claude, compares two or more prompt versions side by side and grades on a 5-point scale. Generating test cases is close to multi-ai's orchestrator, which goes further and writes the verifiers. |
| Latitude | [latitude-dev/latitude-llm](https://github.com/latitude-dev/latitude-llm) | https://latitude.so | MIT | Yes | 2026-10-06 | ~4.7k | Was a prompt-engineering platform; now "observability for AI agents… verify the fix against real traces". Of interest for its fix-then-verify loop. |
| Rivet (Ironclad) | [Ironclad/rivet](https://github.com/Ironclad/rivet) | https://rivet.ironcladapp.com | MIT | Yes | 2026-08-26 | ~4.7k | Visual node-graph IDE for LLM chains. A reference for an MIT canvas UI for graphs; less about comparison. |

## 3. Eval harnesses (code-first; mostly CLI plus a log viewer)

| Name | GitHub | Demo / hosted | License | Open source? | Maintained? (last push) | Stars | Relevant to multi-ai |
|---|---|---|---|---|---|---|---|
| Inspect AI (UK AISI) | [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) | https://inspect.aisi.org.uk | MIT | Yes | 2026-10-06 | ~2.9k | Task → solver → scorer. Includes `model_graded_qa`, Docker/K8s sandboxes for untrusted code, and `inspect view`, a per-sample transcript log viewer. Best fit for running multi-ai's fail-to-pass verifiers in a sandbox. Its log format could be an export target. |
| OpenAI Evals | [openai/evals](https://github.com/openai/evals) | Evals in the OpenAI Dashboard (README banner) | MIT (LICENSE.md; some datasets carry their own licenses) | Yes | 2026-04-14 | ~19.6k | A registry of YAML/JSONL evals. OpenAI now points users to hosted Dashboard evals, so the repo is slowing. |
| EleutherAI lm-evaluation-harness | [EleutherAI/lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) | none | MIT | Yes | 2026-09-14 | ~14.1k | Few-shot academic benchmarks for model weights. Not about interactive prompts; relevant only if multi-ai adds benchmark runs for open models. |
| Stanford HELM | [stanford-crfm/helm](https://github.com/stanford-crfm/helm) | https://crfm.stanford.edu/helm | Apache-2.0 | Yes | 2026-09-01. README: **"HELM entered maintenance mode on June 1, 2026."** | ~2.9k | Many-scenario × many-metric leaderboards, with a web UI for inspecting individual prompts and responses. Volunteer-maintained now. |
| SWE-bench | [SWE-bench/SWE-bench](https://github.com/SWE-bench/SWE-bench) | https://www.swebench.com | MIT | Yes | 2026-09-18 | ~6.0k | Where the term comes from: FAIL_TO_PASS tests fail before the fix and pass after it; PASS_TO_PASS tests guard against regressions. Use the same definitions, and the PASS_TO_PASS pair, in multi-ai's verifiers. |

## 4. Versioned experiments

| Name | GitHub | Demo / hosted | License | Open source? | Maintained? (last push) | Stars | Relevant to multi-ai |
|---|---|---|---|---|---|---|---|
| MLflow (Prompt Engineering UI / GenAI eval / Prompt Registry) | [mlflow/mlflow](https://github.com/mlflow/mlflow) | https://mlflow.org | Apache-2.0 | Yes | 2026-10-06 | ~28.3k | No-code prompt engineering UI (since 2.7) that compares several LLMs and prompts on a set of inputs and logs runs to experiments. The Prompt Registry versions prompts and scorers evaluate them. Uses a tracking server rather than git. |
| DVC | [treeverse/dvc](https://github.com/treeverse/dvc) (formerly iterative/dvc) | https://dvc.org | Apache-2.0 | Yes | 2026-10-05 | ~15.9k | **lakeFS (Treeverse) acquired DVC from Iterative on 2025-11-18.** Git-native experiment and data versioning (`dvc exp`). The closest prior art for "git as the experiment record". Borrow the idea of keeping large outputs outside git, referenced by hash. |

## 5. Canvas and HTML-artifact neighbours

| Name | GitHub | Demo / hosted | License | Open source? | Maintained? (last push) | Stars | Relevant to multi-ai |
|---|---|---|---|---|---|---|---|
| tldraw (SDK) + Make Real | [tldraw/tldraw](https://github.com/tldraw/tldraw); [tldraw/make-real-starter](https://github.com/tldraw/make-real-starter) | https://tldraw.dev, https://makereal.tldraw.com (unverified) | tldraw SDK: **custom "tldraw license"** (production use needs a license key); make-real-starter: AGPL-3.0 | SDK source-available; starter AGPL | SDK 2026-10-06; starter 2026-05-05 | SDK ~50.8k; starter ~1.5k | Make Real turns a canvas selection into generated HTML in an iframe next to the sketch. It is the nearest thing to "artifacts on a zoomable canvas". The license rules out using the SDK in a production multi-ai unless one is bought. |
| React Flow / xyflow | [xyflow/xyflow](https://github.com/xyflow/xyflow) | https://xyflow.com | MIT | Yes | 2026-09-29 | ~38.6k | A permissive building block for a pan/zoom canvas of project nodes. |
| Excalidraw | [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | https://excalidraw.com | MIT | Yes | 2026-10-06 | ~134k | A permissive infinite-canvas alternative to tldraw. |

---

## Licensing notes

- **Branding clause (Open WebUI).** The LICENSE (read 2026-10-06) is BSD-3-style plus clause 4. It forbids "altering, removing, obscuring, or replacing any 'Open WebUI' branding" unless the deployment has 50 or fewer end users in any rolling 30 days, or you have written permission or an enterprise license. Contributors must sign a CLA. Older code keeps its earlier licenses (LICENSE_HISTORY). Copying Open WebUI UI code into multi-ai could pull in the branding duty, so take ideas only.
- **Source-available or non-OSI licenses:**
  - **Arize Phoenix: Elastic-2.0.** Cannot be offered as a hosted or managed service, and license-key features must not be bypassed.
  - **LobeHub Community License.** Apache-2.0 plus conditions: distributing a derivative work needs a commercial license, and the maintainers may change the license.
  - **tldraw license.** Production use needs a license key.
  - **Langfuse and Agenta.** MIT core, but `ee/` directories are under commercial licenses. Avoid copying from `ee/`.
- **Copyleft:**
  - **ChatHub: GPL-3.0.** Copying its code into multi-ai would require multi-ai to be GPL-3.0 when distributed.
  - **Cherry Studio and tldraw/make-real-starter: AGPL-3.0.** Network use also triggers the source-sharing duty, which matters because multi-ai is a web harness.
- **No license:**
  - **karpathy/llm-council** has no LICENSE file, so default copyright applies. Reimplement the 3-stage council idea without copying code.
  - **OpenAI Evals** is MIT for code, but some registry datasets have their own licenses.
- **Permissive and safe to borrow with attribution:**
  - MIT: big-AGI, LibreChat, GodMode, openplayground, ChainForge, promptfoo, Inspect AI, lm-eval-harness, SWE-bench, Latitude, Rivet, xyflow, Excalidraw.
  - Apache-2.0: ChatALL, FastChat, Opik, Helicone, Weave SDK, MLflow, DVC, HELM. Apache-2.0 requires keeping NOTICE files and stating changes.
- **Ownership changes that affect neutrality:**
  - promptfoo is now OpenAI (2026-03).
  - Langfuse is now ClickHouse (2026-01).
  - Helicone is now Mintlify (2026-03), reportedly in maintenance mode.
  - DVC is now lakeFS (2025-11).
  - W&B is now CoreWeave (2025-05).
  - LMArena was renamed Arena (2026-01).
  - HELM went into maintenance mode (2026-06).
  - Agenta pivoted to an agent workspace.

## Unverified or partial

- Whether the chathub.gg web, desktop and mobile apps are closed source. The open repo is the extension.
- Whether nat.dev still hosts openplayground (the site was blocked from here).
- LobeHub side-by-side compare mode.
- Vercel AI SDK Playground feature details.
- The makereal.tldraw.com URL.
- The OpenAI Playground "Compare" button (third-party source only).
- OpenRouter Fusion (tutorial only).
- Helicone maintenance mode (Dealroom and HackerNoon snippets only).
- promptfoo deal value.
- Arena funding figures.
- big-AGI Pro pricing.
- Braintrust open-source components.

## Sources

GitHub repositories (metadata from the GitHub search API on 2026-10-06; LICENSE files from raw.githubusercontent.com):
- https://github.com/chathub-dev/chathub
- https://github.com/ai-shifu/ChatALL
- https://github.com/smol-ai/GodMode
- https://github.com/enricoros/big-AGI
- https://github.com/open-webui/open-webui (LICENSE)
- https://github.com/LibreChat-AI/LibreChat
- https://github.com/lobehub/lobehub (LICENSE)
- https://github.com/CherryHQ/cherry-studio
- https://github.com/nat/openplayground
- https://github.com/lm-sys/FastChat
- https://github.com/lmarena/arena-hard-auto
- https://github.com/karpathy/llm-council
- https://github.com/ianarawjo/ChainForge
- https://github.com/promptfoo/promptfoo
- https://github.com/Agenta-AI/agenta (LICENSE)
- https://github.com/langfuse/langfuse (LICENSE, ee/LICENSE)
- https://github.com/orgs/langfuse/discussions/11593
- https://github.com/comet-ml/opik
- https://github.com/Arize-ai/phoenix (LICENSE)
- https://github.com/Helicone/helicone
- https://github.com/wandb/weave
- https://github.com/latitude-dev/latitude-llm
- https://github.com/Ironclad/rivet
- https://github.com/UKGovernmentBEIS/inspect_ai
- https://github.com/openai/evals (LICENSE.md)
- https://github.com/EleutherAI/lm-evaluation-harness
- https://github.com/stanford-crfm/helm
- https://github.com/SWE-bench/SWE-bench
- https://github.com/mlflow/mlflow
- https://github.com/treeverse/dvc
- https://github.com/tldraw/tldraw (LICENSE.md)
- https://github.com/tldraw/make-real-starter
- https://github.com/xyflow/xyflow
- https://github.com/excalidraw/excalidraw

Web (via search results; most vendor sites were blocked from direct fetch here):
- https://finance.yahoo.com/news/openai-acquires-promptfoo-secure-ai-174904138.html
- https://gigazine.net/gsc_news/en/20260310-openai-to-acquire-promptfoo
- https://emelia.io/hub/promptfoo-test-securite-ia
- https://langfuse.com/blog/announcing-acquisition
- https://clickhouse.com/blog/clickhouse-acquires-langfuse-open-source-llm-observability
- https://lakefs.io/blog/lakefs-acquires-dvc/
- https://dvc.org/blog/dvc-joins-lakefs-your-questions-answered/
- https://queensland.dealroom.co/news/feed/mintlify-acquires-open-source-ai-observability-platform-helicone
- https://helicone.ai/blog/joining-mintlify
- https://coreweave.com/news/coreweave-completes-acquisition-of-weights-biases-2
- https://arena.ai/blog/lmarena-is-now-arena/
- https://en.wikipedia.org/wiki/Arena_(AI_platform)
- https://www.revenuememo.com/p/lmarena-funding
- https://arena.ai/blog/webdev-arena
- https://simonwillison.net/2024/Dec/16/webdev-arena/
- https://docs.openwebui.com/features/chat-conversations/chat-features/multi-model-chats
- https://docs.ccv.brown.edu/ai-tools/services/librechat/advanced-usage
- https://docs.typingmind.com/manage-and-connect-ai-models/activate-multi-model-responses
- https://msty.ai/blog/multiverse-split-chats-conversations
- https://developers.googleblog.com/en/compare-mode-in-google-ai-studio/
- https://www.loopingly.com/explorables/playground-controls
- https://openrouter.ai/chat
- https://aichief.com/ai-tutorials/compare-ai-models-faster-using-openrouter-fusion/
- https://ai-sdk.dev/playground
- https://www.toolsforhumans.ai/ai-tools/chathub
- https://docs.cherry-ai.com/cherry-studio-wen-dang/en-us/cherry-studio
- https://www.promptquorum.com/local-llms/big-agi-review
- https://arxiv.org/abs/2309.09128v2
- https://www.braintrust.dev/docs/evaluate/playgrounds
- https://changelog.langchain.com/announcements/ann_aYzaXKcQSmY19
- https://docs.langchain.com/langsmith/compare-experiment-results
- https://pub.towardsai.net/llm-observability-with-langsmith-part-2-eval-gates-prompt-versioning-choosing-your-stack-e607473320b5
- https://www.promptlayer.com/glossary/eval-playground
- https://docs.wandb.ai/weave/guides/tools/playground.md
- https://www.comet.com/docs/opik/development/prompt-playground
- https://arize.com/docs/ax/prompts/prompt-playground
- https://docs.anthropic.com/en/docs/test-and-evaluate/eval-tool
- https://www.anthropic.com/news/evaluate-prompts
- https://inspect.aisi.org.uk
- https://mlflow.org/docs/latest/genai/prompt-registry/prompt-engineering/
- https://crfm-helm.readthedocs.io/
- https://openai.com/index/introducing-swe-bench-verified/
- https://tldraw.dev/blog/make-real-the-story-so-far
