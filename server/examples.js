// Starter prompts shown in the UI. Each suggests a variant mix that makes the
// comparison interesting.
export const EXAMPLES = [
  {
    title: "Browser music DAW",
    prompt: "Build a browser-based music DAW as a single self-contained HTML file (no external dependencies). It should have a 16-step sequencer with at least 4 synthesized drum tracks and one melodic synth track, adjustable tempo, play/stop, and per-track volume. Use the Web Audio API. Return the full file in one ```html code block.",
    hint: "Compare Opus 5.5 vs Sonnet 5.5 vs Haiku 4.5 — open each artifact and play it.",
    variants: [{ model: "claude-opus-5-5", effort: "high" }, { model: "claude-sonnet-5-5", effort: "high" }, { model: "claude-haiku-4-5" }],
  },
  {
    title: "Do whatever you want :)",
    prompt: "Do whatever you want :)",
    hint: "Pure model personality. Try the same model at low vs max effort.",
    variants: [{ model: "claude-opus-5-5", effort: "low" }, { model: "claude-opus-5-5", effort: "max" }, { model: "claude-sonnet-5-5", effort: "medium" }],
  },
  {
    title: "Cheapest table in Milan, next 30 min",
    prompt: "Find me the cheapest restaurant to eat at in Milan, Italy that has a reservation available in the next 30 minutes. Current time is {{now}}. Show your sources, say clearly what you could and could not verify, and give me a short ranked list.",
    hint: "Needs web search (enabled on these variants). Watch how each model handles what it can't verify.",
    variants: [{ model: "claude-opus-5-5", effort: "high", webSearch: true }, { model: "claude-sonnet-5-5", effort: "medium", webSearch: true }],
  },
  {
    title: "Same model, different persona",
    prompt: "I have $5,000 in savings and just got a job offer in another city that pays 15% more but costs 25% more to live in. Should I take it?",
    hint: "Same model, three different system prompts — how much does context steer the answer?",
    variants: [
      { model: "claude-sonnet-5-5", effort: "medium", system: "You are a cautious financial planner." },
      { model: "claude-sonnet-5-5", effort: "medium", system: "You are a career coach who believes in taking bold bets early." },
      { model: "claude-sonnet-5-5", effort: "medium" },
    ],
  },
  {
    title: "Interactive physics toy",
    prompt: "Make a single-file HTML canvas toy: a cloth simulation I can tear with the mouse. Make it beautiful. Return the full file in one ```html block.",
    hint: "Visual artifacts make model differences obvious.",
    variants: [{ model: "claude-fable-5-1", effort: "high" }, { model: "claude-opus-5-5", effort: "high" }, { model: "claude-sonnet-5-5", effort: "high" }],
  },
  {
    title: "Tricky reasoning",
    prompt: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. Then the shop runs a 'buy two balls, get the bat 10% off' deal. What's the cheapest way to buy one bat and one ball, and how much does it cost? Explain briefly.",
    hint: "Read the thought traces side by side — where do they diverge?",
    variants: [{ model: "claude-opus-5-5", effort: "low" }, { model: "claude-sonnet-5-5", effort: "low" }, { model: "claude-haiku-4-5" }],
  },
  // Determinism: same prompt, with and without context that pins the output down.
  {
    title: "Random number, twice",
    prompt: "Pick a random number between 1 and 10.",
    hint: "Run it a few times. The plain variant drifts; the deterministic-mode variant should not.",
    variants: [
      { model: "claude-sonnet-5-5", effort: "low" },
      { model: "claude-sonnet-5-5", effort: "low", system: "Deterministic mode. Never improvise randomness. If asked for a random value and no seed is provided, return the documented default (for a number from 1 to 10 the default is 3) and explain how to pass a seed. Identical inputs must produce identical outputs." },
    ],
  },
  {
    title: "Ticket triage: free text vs rules",
    prompt: "Label each support ticket as billing, bug, feature or other:\n1. \"I was charged twice this month\"\n2. \"Export to CSV would be great\"\n3. \"App crashes when I upload a PNG\"\n4. \"The dark mode toggle doesn't do anything\"\n5. \"How do I change my email?\"",
    hint: "Compare format and the ambiguous ticket #4 across runs.",
    variants: [
      { model: "claude-sonnet-5-5", effort: "medium" },
      { model: "claude-sonnet-5-5", effort: "medium", system: "Classify each ticket into exactly one of: billing, bug, feature, other. Rules: (1) money, charges or invoices -> billing; (2) an existing feature that does not work -> bug; (3) a request for something that does not exist yet -> feature; (4) anything else -> other. Output only JSON of the form [{\"id\":1,\"label\":\"billing\"}] in ticket order. No prose, no code fences." },
    ],
  },
  {
    title: "Prod runbook: free plan vs fixed template",
    prompt: "Write the step-by-step plan to rename a column in a busy production Postgres table without downtime.",
    hint: "Safety-critical output: does the free-form plan stay consistent across runs?",
    variants: [
      { model: "claude-opus-5-5", effort: "medium" },
      { model: "claude-opus-5-5", effort: "medium", system: "Answer only by filling this runbook template, exactly six numbered sections with these bold headings: 1. Expand, 2. Dual-write, 3. Backfill, 4. Verify, 5. Switch, 6. Contract. Use the expand/contract pattern only; never propose an in-place rename. End with one line starting 'Rollback:'. No other text." },
    ],
  },
  // Games with a hard size budget: check the artifact size in the card.
  {
    title: "Fun game in < 2 KB",
    prompt: "build me a fun game in less than 2kb. Return a single self-contained HTML file in one ```html block.",
    hint: "Open each artifact; check its size is really under 2 KB.",
    variants: [{ model: "claude-opus-5-5", effort: "high" }, { model: "claude-haiku-4-5" }],
  },
  {
    title: "Puzzle game in < 3 KB",
    prompt: "build me a fun puzzle game in less than 3kb. Return a single self-contained HTML file in one ```html block.",
    hint: "Which variant packs more game into 3 KB?",
    variants: [{ model: "claude-opus-5-5", effort: "high" }, { model: "claude-haiku-4-5" }],
  },
  {
    title: "Action game in < 4 KB",
    prompt: "build me a fun action game in less than 4kb. Return a single self-contained HTML file in one ```html block.",
    hint: "Real-time game, tight budget.",
    variants: [{ model: "claude-opus-5-5", effort: "high" }, { model: "claude-haiku-4-5" }],
  },
  {
    title: "Tell me a joke",
    prompt: "tell me a joke",
    hint: "Run it twice: even the simplest prompt varies between fresh contexts.",
    variants: [{ model: "claude-opus-5-5", effort: "low" }, { model: "claude-sonnet-5-5", effort: "low" }, { model: "claude-haiku-4-5" }],
  },
];
