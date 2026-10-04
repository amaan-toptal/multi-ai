// ---------- Time travel simulator ----------
// A scripted hour in one workspace: prompts evolving, configuration and model changes, MCP
// tools arriving, and three agents debating prompt / configuration / outcome through the
// platform. The slider replays the master ledger (timestamp, prompt, models, output files).
(() => {
  const T0 = Date.UTC(2026, 9, 4, 9, 0, 0) / 1000; // 2026-10-04 09:00:00 UTC
  const at = (m, s = 0) => T0 + m * 60 + s;
  const KINDS = {
    prompt: { label: "Prompt", glyph: "P" },
    run: { label: "Run / outputs", glyph: "R" },
    config: { label: "Configuration", glyph: "C" },
    model: { label: "Model change", glyph: "M" },
    tool: { label: "MCP tool", glyph: "T" },
    debate: { label: "Agent debate", glyph: "D" },
  };
  const AGENTS = {
    planner: { name: "Planner", model: "Claude Opus 5.5", initial: "P" },
    critic: { name: "Critic", model: "Claude Sonnet 5.5", initial: "C" },
    builder: { name: "Builder", model: "Claude Haiku 4.5", initial: "B" },
  };
  const P1 = "tell me a joke";
  const P2 = "build me a fun game in less than 2kb";
  const P3 = "build me a fun puzzle game in less than 3kb with undo and a par score";
  const P4 = "build me a fun action game in less than 4kb with undo and a par score. It must pass a 10 second Playwright smoke test.";
  const P5 = "build me a fun action game in less than 4kb with particles and power-ups. It must pass a 10 second Playwright smoke test and keep the best score in localStorage.";

  const EVENTS = [
    { t: at(0), kind: "run", title: "Workspace created", outputs: [{ name: "README.md", bytes: 412, by: "orchestrator" }] },
    { t: at(2, 10), kind: "prompt", title: "Prompt v1", prompt: P1, models: ["Claude Haiku 4.5"] },
    { t: at(2, 24), kind: "run", title: "Run v1 finished", outputs: [{ name: "v1/response.md", bytes: 61, by: "Claude Haiku 4.5" }] },
    { t: at(5, 2), kind: "prompt", title: "Prompt v2", prompt: P2, models: ["Claude Opus 5.5", "Claude Haiku 4.5"] },
    { t: at(5, 48), kind: "run", title: "Run v2 finished", outputs: [{ name: "v2/opus/orbit.html", bytes: 1408, by: "Claude Opus 5.5" }, { name: "v2/haiku/dodge.html", bytes: 1112, by: "Claude Haiku 4.5" }] },
    { t: at(11, 5), kind: "config", title: "Web access on for Opus", web: true, note: "Opus may search the web (Web Audio and canvas quirks)." },
    { t: at(14, 0), kind: "debate", title: "Debate 1 · what should the prompt be?", topic: "prompt",
      turns: [
        { who: "planner", text: "2 KB keeps the games trivial. Propose a puzzle at 3 KB so there is room for undo and a par score.", proposal: { prompt: P3 } },
        { who: "critic", text: "Changing budget and genre at once hides what caused the difference. Keep 2 KB, change only the genre." },
        { who: "builder", text: "At 2 KB I can ship a puzzle, but not undo. Undo plus par is about 600 bytes." },
        { who: "critic", text: "Fair. 3 KB then, but the ledger must record the budget change as its own prompt version so it stays traceable." },
        { who: "planner", text: "Agreed. Prompt v3 at 3 KB, undo and par required." },
      ],
      resolution: { prompt: P3, models: ["Claude Opus 5.5", "Claude Haiku 4.5"] }, outputs: [{ name: "debates/round-1.md", bytes: 1980, by: "orchestrator" }] },
    { t: at(14, 20), kind: "prompt", title: "Prompt v3 (from debate 1)", prompt: P3 },
    { t: at(16, 30), kind: "run", title: "Run v3 finished", outputs: [{ name: "v3/opus/lights.html", bytes: 2126, by: "Claude Opus 5.5" }, { name: "v3/haiku/memory.html", bytes: 1336, by: "Claude Haiku 4.5" }] },
    { t: at(25, 0), kind: "tool", title: "MCP tools added: filesystem, playwright", mcp: ["filesystem", "playwright"], note: "Variants can write artifacts directly and run a headless browser against them." },
    { t: at(28, 0), kind: "debate", title: "Debate 2 · which configuration?", topic: "configuration",
      turns: [
        { who: "critic", text: "Now that Playwright is available, every variant should have to pass a smoke test before its output counts." },
        { who: "planner", text: "A browser run per variant roughly doubles cost on Haiku runs that are cheap to begin with." },
        { who: "builder", text: "I can run the test once per take; it is about 3 seconds. Cost is dominated by the model, not the test." },
        { who: "critic", text: "Then give the playwright tool to the Opus variant only, and let Haiku stay cheap as the control." },
        { who: "planner", text: "Accepted: Opus gets filesystem + playwright, Haiku gets filesystem only. The prompt states the test so both know the bar.", proposal: { prompt: P4 } },
      ],
      resolution: { prompt: P4, mcpByModel: { "Claude Opus 5.5": ["filesystem", "playwright"], "Claude Haiku 4.5": ["filesystem"] } }, outputs: [{ name: "debates/round-2.md", bytes: 2210, by: "orchestrator" }] },
    { t: at(31, 0), kind: "prompt", title: "Prompt v4 (from debate 2)", prompt: P4 },
    { t: at(33, 40), kind: "run", title: "Run v4 finished", outputs: [{ name: "v4/opus/asteroids.html", bytes: 3746, by: "Claude Opus 5.5" }, { name: "v4/opus/test-report.json", bytes: 530, by: "playwright" }, { name: "v4/haiku/runner.html", bytes: 1330, by: "Claude Haiku 4.5" }] },
    { t: at(40, 0), kind: "model", title: "Model switch: Opus 5.5 → Fable 5.1", models: ["Claude Fable 5.1", "Claude Haiku 4.5"], note: "Same prompt and tools, stronger model on the action variant." },
    { t: at(44, 15), kind: "run", title: "Reprompt (fresh context) finished", outputs: [{ name: "v4/fable/breakout.html", bytes: 3717, by: "Claude Fable 5.1" }, { name: "v4/fable/test-report.json", bytes: 544, by: "playwright" }] },
    { t: at(50, 0), kind: "debate", title: "Debate 3 · which outcome ships?", topic: "outcome",
      turns: [
        { who: "critic", text: "Two candidates passed the smoke test: asteroids.html (3,746 B) and breakout.html (3,717 B). Both under 4 KB." },
        { who: "builder", text: "breakout has power-ups and particle effects; asteroids has more systems but no progression." },
        { who: "planner", text: "Pick breakout as the release candidate. Keep asteroids in the ledger as the Opus take so the comparison stays reproducible." },
        { who: "critic", text: "Agreed, with one more prompt revision: name the features we are actually judging, and persist the best score." , proposal: { prompt: P5 } },
      ],
      resolution: { prompt: P5, release: "v4/fable/breakout.html" }, outputs: [{ name: "debates/round-3.md", bytes: 1740, by: "orchestrator" }, { name: "RELEASE.md", bytes: 220, by: "orchestrator" }] },
    { t: at(52, 0), kind: "config", title: "Web access off (judging policy)", web: false, note: "No network while outputs are being judged." },
    { t: at(55, 0), kind: "prompt", title: "Prompt v5 (from debate 3)", prompt: P5 },
    { t: at(58, 30), kind: "run", title: "Run v5 finished", outputs: [{ name: "v5/fable/breakout.html", bytes: 3902, by: "Claude Fable 5.1" }, { name: "v5/fable/test-report.json", bytes: 548, by: "playwright" }, { name: "v5/haiku/shooter.html", bytes: 2029, by: "Claude Haiku 4.5" }] },
  ];
  const T_END = EVENTS[EVENTS.length - 1].t + 60;

  // ----- state fold -----
  function stateAt(T) {
    const s = { prompt: "", prevPrompt: "", version: 0, models: ["—"], web: false, mcp: {}, outputs: [], debates: [], events: [], release: null };
    for (const e of EVENTS) {
      if (e.t > T) break;
      s.events.push(e);
      if (e.prompt) { s.prevPrompt = s.prompt; s.prompt = e.prompt; s.version++; }
      if (e.models) s.models = e.models;
      if (e.web !== undefined) s.web = e.web;
      if (e.mcp) for (const m of s.models) s.mcp[m] = [...new Set([...(s.mcp[m] || []), ...e.mcp])];
      if (e.resolution?.mcpByModel) s.mcp = { ...e.resolution.mcpByModel };
      if (e.resolution?.release) s.release = e.resolution.release;
      if (e.kind === "model" && e.models) { // tools follow the slot: the new model inherits the replaced model's tools
        const prev = Object.keys(s.mcp).find((m) => !e.models.includes(m));
        if (prev && !s.mcp[e.models[0]]) { s.mcp[e.models[0]] = s.mcp[prev]; delete s.mcp[prev]; }
      }
      if (e.outputs) s.outputs.push(...e.outputs.map((o) => ({ ...o, t: e.t })));
      if (e.kind === "debate") s.debates.push(e);
    }
    return s;
  }

  // ----- helpers -----
  const $ = (q) => document.querySelector(q);
  const pad = (n) => String(n).padStart(2, "0");
  const hhmmss = (t) => { const d = new Date(t * 1000); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
  const human = (t) => new Date(t * 1000).toUTCString().replace(/ GMT$/, " UTC");
  const kb = (b) => b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`;
  const modelClass = (m) => m.includes("Opus") ? "m-opus" : m.includes("Sonnet") ? "m-sonnet" : m.includes("Fable") ? "m-fable" : m.includes("Haiku") ? "m-haiku" : "m-other";

  // Word-level diff (LCS) so a prompt revision reads as what was added and removed.
  function wordDiff(a, b) {
    const A = a ? a.split(/\s+/) : [], B = b ? b.split(/\s+/) : [];
    const n = A.length, m = B.length, L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < n && j < m) {
      if (A[i] === B[j]) { out.push(["=", A[i]]); i++; j++; }
      else if (L[i + 1][j] >= L[i][j + 1]) { out.push(["-", A[i]]); i++; }
      else { out.push(["+", B[j]]); j++; }
    }
    while (i < n) out.push(["-", A[i++]]);
    while (j < m) out.push(["+", B[j++]]);
    return out;
  }
  function diffHtml(a, b) {
    const frag = document.createDocumentFragment();
    for (const [op, w] of wordDiff(a, b)) {
      const el = document.createElement(op === "=" ? "span" : op === "+" ? "ins" : "del");
      el.textContent = w + " ";
      frag.appendChild(el);
    }
    return frag;
  }

  // ----- timeline (SVG) -----
  const svg = $("#ttSvg");
  const slider = $("#ttSlider");
  slider.min = T0; slider.max = T_END; slider.step = 1; slider.value = EVENTS[1].t;
  let T = Number(slider.value), playing = false, raf = null, lastTick = 0;

  function layoutTimeline() {
    const W = svg.clientWidth || 800, H = 92, padX = 18;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const X = (t) => padX + (t - T0) / (T_END - T0) * (W - padX * 2);
    let g = `<line class="tt-axis" x1="${padX}" y1="46" x2="${W - padX}" y2="46"/>`;
    for (let m = 0; m <= 60; m += 10) {
      const x = X(T0 + m * 60);
      g += `<line class="tt-tick" x1="${x}" y1="46" x2="${x}" y2="54"/><text class="tt-ticklabel" x="${x}" y="70" text-anchor="middle">${hhmmss(T0 + m * 60).slice(0, 5)}</text>`;
    }
    // Rows alternate so close events do not overlap.
    EVENTS.forEach((e, i) => {
      const x = X(e.t), y = i % 2 ? 24 : 46 - 0, up = i % 2;
      const past = e.t <= T;
      g += `<g class="tt-node k-${e.kind} ${past ? "past" : "future"}" data-i="${i}" tabindex="0" role="button" aria-label="${e.title} at ${hhmmss(e.t)}">
        ${up ? `<line class="tt-stem" x1="${x}" y1="${y + 9}" x2="${x}" y2="46"/>` : ""}
        <circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y + 3.5}" text-anchor="middle">${KINDS[e.kind].glyph}</text></g>`;
    });
    const cx = X(T);
    g += `<line class="tt-cursor" x1="${cx}" y1="6" x2="${cx}" y2="60"/><text class="tt-cursorlabel" x="${cx}" y="88" text-anchor="middle">${hhmmss(T)}</text>`;
    svg.innerHTML = g;
    svg.querySelectorAll(".tt-node").forEach((n) => {
      const go = () => { setT(EVENTS[+n.dataset.i].t); };
      n.addEventListener("click", go);
      n.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); go(); } });
      n.addEventListener("mouseenter", () => showTip(EVENTS[+n.dataset.i], n));
      n.addEventListener("mouseleave", hideTip);
    });
  }
  function showTip(e, node) {
    const tip = $("#ttTip"); const r = node.getBoundingClientRect(), host = svg.getBoundingClientRect();
    tip.innerHTML = `<b></b><br><span class="small muted"></span>`;
    tip.querySelector("b").textContent = e.title;
    tip.querySelector("span").textContent = `${human(e.t)} · ${e.t}`;
    tip.style.left = Math.max(0, Math.min(r.left - host.left - 80, host.width - 240)) + "px";
    tip.style.top = (r.bottom - host.top + 6) + "px";
    tip.hidden = false;
  }
  function hideTip() { $("#ttTip").hidden = true; }

  // ----- panels -----
  function render() {
    const s = stateAt(T);
    const cur = s.events[s.events.length - 1];
    $("#ttHuman").textContent = human(T);
    $("#ttUnix").textContent = T;
    $("#ttIso").textContent = new Date(T * 1000).toISOString();
    $("#ttEventTitle").textContent = cur ? cur.title : "Before the workspace existed";
    $("#ttEventTitle").className = "tt-event k-" + (cur ? cur.kind : "run");
    $("#ttEventNote").textContent = cur?.note || (cur?.kind === "debate" ? "Three agents negotiate through the platform; the resolution is committed like any other output." : "");

    // Prompt
    const pv = $("#ttPromptVersion"); pv.textContent = s.version ? `v${s.version}` : "none yet";
    const pb = $("#ttPrompt"); pb.innerHTML = "";
    if (s.version) pb.appendChild(diffHtml(s.prevPrompt, s.prompt)); else pb.textContent = "No prompt sent yet.";
    $("#ttPromptLegend").hidden = !s.prevPrompt;

    // Configuration
    const ms = $("#ttModels"); ms.innerHTML = "";
    for (const m of s.models) {
      const chip = document.createElement("div"); chip.className = "tt-model " + modelClass(m);
      chip.innerHTML = `<span class="avatar"></span><span class="name"></span><span class="tools"></span>`;
      chip.querySelector(".avatar").textContent = m === "—" ? "·" : m.replace("Claude ", "")[0];
      chip.querySelector(".name").textContent = m;
      const tools = s.mcp[m] || [];
      chip.querySelector(".tools").innerHTML = tools.map(() => `<span class="tool-chip"></span>`).join("");
      chip.querySelectorAll(".tool-chip").forEach((el, i) => (el.textContent = "⌁ " + tools[i]));
      ms.appendChild(chip);
    }
    const web = $("#ttWeb"); web.className = "tt-toggle " + (s.web ? "on" : "off"); web.querySelector("span").textContent = s.web ? "on" : "off";
    const allTools = [...new Set(Object.values(s.mcp).flat())];
    $("#ttMcpCount").textContent = allTools.length ? allTools.join(", ") : "none";

    // Outputs
    const fo = $("#ttFiles"); fo.innerHTML = "";
    $("#ttFileCount").textContent = `${s.outputs.length} file${s.outputs.length === 1 ? "" : "s"} · ${kb(s.outputs.reduce((a, o) => a + o.bytes, 0))}`;
    for (const o of s.outputs) {
      const tile = document.createElement("div");
      const ext = o.name.split(".").pop();
      tile.className = "tt-file " + modelClass(o.by) + (cur && o.t === cur.t ? " fresh" : "") + (s.release === o.name ? " release" : "");
      tile.innerHTML = `<span class="ext"></span><span class="fname"></span><span class="meta small"></span>`;
      tile.querySelector(".ext").textContent = ext;
      tile.querySelector(".fname").textContent = o.name;
      tile.querySelector(".meta").textContent = `${kb(o.bytes)} · ${o.by}${s.release === o.name ? " · release" : ""}`;
      tile.title = `${o.name} · ${human(o.t)} · ${o.t}`;
      fo.appendChild(tile);
    }

    // Debate
    const dp = $("#ttDebate");
    const debate = cur?.kind === "debate" ? cur : null;
    dp.hidden = !debate;
    if (debate) renderDebate(debate, s);

    // Ledger (master repo: timestamp, prompt, models, outputs only)
    const lg = $("#ttLedger"); lg.innerHTML = "";
    let prevPrompt = "";
    [...s.events].reverse().forEach((e, idx) => {
      const li = document.createElement("li");
      li.className = "tt-row k-" + e.kind + (idx === 0 ? " current" : "");
      li.innerHTML = `<span class="dot"><i></i></span><div class="body"><div class="head"><span class="when"></span><span class="unix mono"></span></div><div class="title"></div><div class="pdiff"></div><div class="chips"></div></div>`;
      li.querySelector(".when").textContent = hhmmss(e.t);
      li.querySelector(".unix").textContent = e.t;
      li.querySelector(".dot i").textContent = KINDS[e.kind].glyph;
      li.querySelector(".title").textContent = e.title;
      li.onclick = () => setT(e.t);
      lg.appendChild(li);
    });
    // Prompt diffs must read forward in time, so compute them in order and fill in.
    const rows = [...lg.children].reverse();
    s.events.forEach((e, i) => {
      const row = rows[i];
      if (e.prompt) { row.querySelector(".pdiff").appendChild(diffHtml(prevPrompt, e.prompt)); prevPrompt = e.prompt; }
      else row.querySelector(".pdiff").remove();
      const chips = row.querySelector(".chips");
      const st = stateAt(e.t);
      if (e.prompt || e.kind === "model") for (const m of st.models) { const c = document.createElement("span"); c.className = "mini " + modelClass(m); c.textContent = m.replace("Claude ", ""); chips.appendChild(c); }
      for (const o of e.outputs || []) { const c = document.createElement("span"); c.className = "mini file"; c.textContent = o.name.split("/").pop(); chips.appendChild(c); }
      if (!chips.children.length) chips.remove();
    });
    layoutTimeline();
  }

  function renderDebate(d, s) {
    const dp = $("#ttDebate");
    $("#ttDebateTitle").textContent = d.title;
    $("#ttDebateTopic").textContent = `topic: ${d.topic}`;
    const lanes = $("#ttLanes"); lanes.innerHTML = "";
    for (const [key, a] of Object.entries(AGENTS)) {
      const lane = document.createElement("div"); lane.className = "tt-lane " + modelClass(a.model);
      lane.innerHTML = `<div class="agent"><span class="avatar"></span><div><b></b><div class="small muted"></div></div></div>`;
      lane.querySelector(".avatar").textContent = a.initial;
      lane.querySelector("b").textContent = a.name;
      lane.querySelector(".small").textContent = a.model;
      lanes.appendChild(lane);
    }
    const thread = $("#ttThread"); thread.innerHTML = "";
    d.turns.forEach((turn, i) => {
      const a = AGENTS[turn.who];
      const b = document.createElement("div");
      b.className = `tt-bubble ${modelClass(a.model)} from-${turn.who}`;
      b.style.animationDelay = `${i * 60}ms`;
      b.innerHTML = `<div class="who"><span class="avatar"></span><b></b><span class="small muted step"></span></div><p></p>`;
      b.querySelector(".avatar").textContent = a.initial;
      b.querySelector("b").textContent = a.name;
      b.querySelector(".step").textContent = `turn ${i + 1} · ${hhmmss(d.t + i * 7)}`;
      b.querySelector("p").textContent = turn.text;
      if (turn.proposal?.prompt) {
        const prop = document.createElement("div"); prop.className = "tt-proposal";
        prop.innerHTML = `<span class="small muted">proposes prompt</span><div class="pdiff"></div>`;
        const before = s.events.filter((e) => e.prompt && e.t < d.t).pop()?.prompt || "";
        prop.querySelector(".pdiff").appendChild(diffHtml(before, turn.proposal.prompt));
        b.appendChild(prop);
      }
      thread.appendChild(b);
    });
    const res = $("#ttResolution");
    const parts = [];
    if (d.resolution.prompt) parts.push("prompt revised");
    if (d.resolution.mcpByModel) parts.push("tools assigned per model");
    if (d.resolution.models) parts.push("models kept");
    if (d.resolution.release) parts.push(`release: ${d.resolution.release}`);
    res.textContent = `Resolution → ${parts.join(" · ")} · committed as ${d.outputs.map((o) => o.name).join(", ")}`;
  }

  // ----- control -----
  function setT(t) { T = Math.round(Math.max(T0, Math.min(T_END, t))); slider.value = T; render(); }
  slider.addEventListener("input", () => setT(Number(slider.value)));
  $("#ttPrev").onclick = () => { const prev = [...EVENTS].reverse().find((e) => e.t < T); if (prev) setT(prev.t); };
  $("#ttNext").onclick = () => { const next = EVENTS.find((e) => e.t > T); if (next) setT(next.t); };
  function tick(now) {
    if (!playing) return;
    if (!lastTick) lastTick = now;
    const dt = (now - lastTick) / 1000; lastTick = now;
    const speed = Number($("#ttSpeed").value);
    if (T >= T_END) { stop(); return; }
    setT(T + dt * speed);
    raf = requestAnimationFrame(tick);
  }
  function play() { playing = true; lastTick = 0; $("#ttPlay").textContent = "❚❚ Pause"; if (T >= T_END) setT(T0); raf = requestAnimationFrame(tick); }
  function stop() { playing = false; cancelAnimationFrame(raf); $("#ttPlay").textContent = "▶ Play"; }
  $("#ttPlay").onclick = () => (playing ? stop() : play());
  window.addEventListener("resize", layoutTimeline);
  document.addEventListener("keydown", (e) => {
    if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if ($("#viewTime").hidden) return;
    if (e.key === "ArrowLeft") $("#ttPrev").click();
    if (e.key === "ArrowRight") $("#ttNext").click();
  });
  // Legend
  const leg = $("#ttLegend");
  for (const [k, v] of Object.entries(KINDS)) {
    const el = document.createElement("span"); el.className = "tt-leg k-" + k;
    el.innerHTML = `<i></i><span></span>`; el.querySelector("i").textContent = v.glyph; el.querySelector("span").textContent = v.label; leg.appendChild(el);
  }
  window.ttRender = render;
  render();
})();
