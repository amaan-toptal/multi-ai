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
];
