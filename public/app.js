// multi-ai front end: plain JS, no build step.
const $ = (sel) => document.querySelector(sel);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

let config = null;
let apiKey = store.get("anthropicKey") || sessionStorage.getItem("anthropicKey") || "";
let currentRun = null; // { id, cards: Map(variantId -> card), es }

// ---------- boot ----------------------------------------------------------

async function boot() {
  config = await (await fetch("/api/config")).json();
  $("#version").textContent = "v" + config.version;
  $("#workspace").value = store.get("workspace") || "default";
  $("#workspace").addEventListener("change", () => {
    store.set("workspace", workspace());
    refreshHistory();
  });
  renderExamples();
  addVariant({ model: "claude-opus-5-5", effort: "high" });
  addVariant({ model: "claude-sonnet-5-5", effort: "medium" });
  updateConnectButton();
  refreshHistory();

  $("#connectBtn").onclick = openConnect;
  $("#verifyKeyBtn").onclick = verifyAndSaveKey;
  $("#forgetKeyBtn").onclick = forgetKey;
  $("#addVariantBtn").onclick = () => addVariant({ model: "claude-sonnet-5-5", effort: "medium" });
  $("#runBtn").onclick = startRun;
  $("#stopBtn").onclick = stopRun;
  $("#newRunBtn").onclick = () => { $("#composer").hidden = false; $("#runView").hidden = true; $("#prompt").focus(); };
  $("#artifactCloseBtn").onclick = () => $("#artifactDialog").close();
  if (!apiKey && !config.serverKey) openConnect();
}

function workspace() {
  return ($("#workspace").value || "default").trim();
}

function headers() {
  const h = { "Content-Type": "application/json" };
  if (apiKey) h["x-anthropic-key"] = apiKey;
  return h;
}

// ---------- connect -------------------------------------------------------

function updateConnectButton() {
  const btn = $("#connectBtn");
  if (apiKey) { btn.textContent = "Claude: connected"; btn.classList.add("ok"); }
  else if (config.serverKey) { btn.textContent = "Claude: server key"; btn.classList.add("ok"); }
  else { btn.textContent = "Connect Claude"; btn.classList.remove("ok"); }
}

function openConnect() {
  $("#keyInput").value = "";
  $("#keyStatus").textContent = apiKey ? "A key is currently saved for this browser." : "";
  $("#rememberKey").checked = Boolean(store.get("anthropicKey"));
  $("#serverKeyNote").hidden = !config.serverKey;
  $("#connectDialog").showModal();
}

async function verifyAndSaveKey() {
  const key = $("#keyInput").value.trim();
  const status = $("#keyStatus");
  if (!key) { status.textContent = "Paste a key first."; return; }
  status.textContent = "Checking…";
  const res = await fetch("/api/verify-key", { method: "POST", headers: { "x-anthropic-key": key } });
  const body = await res.json();
  if (!body.ok) { status.textContent = "✗ " + (body.error || "Key rejected"); return; }
  apiKey = key;
  if ($("#rememberKey").checked) store.set("anthropicKey", key);
  else { store.del("anthropicKey"); sessionStorage.setItem("anthropicKey", key); }
  status.textContent = `✓ Connected — ${body.models.length} models available.`;
  updateConnectButton();
  setTimeout(() => $("#connectDialog").close(), 700);
}

function forgetKey() {
  apiKey = "";
  store.del("anthropicKey");
  sessionStorage.removeItem("anthropicKey");
  $("#keyStatus").textContent = "Key forgotten.";
  updateConnectButton();
}

// ---------- composer ------------------------------------------------------

function renderExamples() {
  const box = $("#examples");
  for (const ex of config.examples) {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = ex.title;
    b.onclick = () => {
      $("#prompt").value = ex.prompt;
      $("#exampleHint").textContent = ex.hint || "";
      $("#variants").innerHTML = "";
      ex.variants.forEach(addVariant);
    };
    box.appendChild(b);
  }
}

function addVariant(v = {}) {
  if ($("#variants").children.length >= config.maxVariants) return;
  const row = $("#variantRowTpl").content.firstElementChild.cloneNode(true);
  const modelSel = row.querySelector(".v-model");
  const effortSel = row.querySelector(".v-effort");
  for (const m of config.models) modelSel.add(new Option(`${m.label}  ($${m.input}/$${m.output} per Mtok)`, m.id));
  for (const e of config.efforts) effortSel.add(new Option(`effort: ${e}`, e));
  modelSel.value = v.model || config.models[0].id;
  const syncEffort = () => {
    const m = config.models.find((x) => x.id === modelSel.value);
    effortSel.disabled = !m.effort;
    if (!m.effort) effortSel.title = "This model uses a fixed thinking budget instead of effort";
    if (m.effort && !v.effort) effortSel.value = m.defaultEffort;
  };
  effortSel.value = v.effort || "high";
  syncEffort();
  modelSel.onchange = syncEffort;
  row.querySelector(".v-web").checked = Boolean(v.webSearch);
  const sys = row.querySelector(".v-system");
  sys.value = v.system || "";
  sys.hidden = !v.system;
  row.querySelector(".v-sys-toggle").onclick = () => { sys.hidden = !sys.hidden; if (!sys.hidden) sys.focus(); };
  row.querySelector(".v-remove").onclick = () => row.remove();
  $("#variants").appendChild(row);
}

function readVariants() {
  return [...$("#variants").children].map((row) => ({
    model: row.querySelector(".v-model").value,
    effort: row.querySelector(".v-effort").disabled ? undefined : row.querySelector(".v-effort").value,
    webSearch: row.querySelector(".v-web").checked,
    system: row.querySelector(".v-system").value,
  }));
}

// ---------- running -------------------------------------------------------

async function startRun() {
  if (!apiKey && !config.serverKey) return openConnect();
  // Fill {{now}} with the user's local time (incl. UTC offset), not the server's.
  const prompt = $("#prompt").value.replaceAll("{{now}}", new Date().toString());
  const variants = readVariants();
  $("#runStatus").textContent = "Starting…";
  const res = await fetch("/api/runs", {
    method: "POST", headers: headers(),
    body: JSON.stringify({ prompt, variants, workspace: workspace() }),
  });
  const body = await res.json();
  if (!res.ok) { $("#runStatus").textContent = "✗ " + body.error; return; }
  $("#runStatus").textContent = "";
  showRun(body.run, prompt);
  $("#stopBtn").hidden = false;
  $("#runBtn").disabled = true;

  const es = new EventSource(`/api/runs/${body.runId}/events`);
  currentRun.es = es;
  es.onmessage = (msg) => handleEvent(JSON.parse(msg.data));
  es.onerror = () => { es.close(); finishRun(); };
  refreshHistory();
}

async function stopRun() {
  if (currentRun) await fetch(`/api/runs/${currentRun.id}/stop`, { method: "POST", headers: headers() });
}

function finishRun() {
  $("#stopBtn").hidden = true;
  $("#runBtn").disabled = false;
  refreshHistory();
}

function showRun(run, promptText) {
  if (currentRun?.es) currentRun.es.close();
  currentRun = { id: run.id, cards: new Map() };
  $("#runView").hidden = false;
  $("#runIdLabel").textContent = `${run.id} · workspace ${run.workspace || workspace()}`;
  $("#runPrompt").textContent = promptText ?? run.prompt ?? "";
  $("#timeline").innerHTML = "";
  const grid = $("#grid");
  grid.innerHTML = "";
  for (const v of run.variants) {
    const card = makeCard(v);
    currentRun.cards.set(v.id, card);
    grid.appendChild(card.el);
  }
  $("#runView").scrollIntoView({ behavior: "smooth", block: "start" });
}

function makeCard(v) {
  const el = document.createElement("article");
  el.className = "card";
  el.innerHTML = `
    <header class="card-head">
      <div class="card-title"></div>
      <span class="badge">queued</span>
    </header>
    <div class="card-sub muted small"></div>
    <details class="thinking" open><summary>Thinking</summary><div class="thinking-body"></div></details>
    <div class="tools"></div>
    <div class="response md"></div>
    <div class="artifacts"></div>
    <footer class="card-foot muted small"></footer>`;
  el.querySelector(".card-title").textContent = v.label;
  if (v.system) el.querySelector(".card-sub").textContent = "context: " + v.system;
  const card = {
    el, v, thinking: "", text: "", renderPending: false,
    badge: el.querySelector(".badge"),
    thinkingEl: el.querySelector(".thinking-body"),
    responseEl: el.querySelector(".response"),
    toolsEl: el.querySelector(".tools"),
    artifactsEl: el.querySelector(".artifacts"),
    footEl: el.querySelector(".card-foot"),
  };
  return card;
}

function setStatus(card, status) {
  card.badge.textContent = status;
  card.badge.className = "badge " + status;
  if (status === "done" || status === "error") {
    const det = card.el.querySelector(".thinking");
    if (card.text) det.open = false;
    if (!card.thinking) det.hidden = true;
  }
}

function scheduleRender(card) {
  if (card.renderPending) return;
  card.renderPending = true;
  requestAnimationFrame(() => {
    card.renderPending = false;
    card.thinkingEl.textContent = card.thinking;
    renderMarkdown(card.responseEl, card.text);
  });
}

function renderMarkdown(el, text) {
  if (window.marked && window.DOMPurify) el.innerHTML = DOMPurify.sanitize(marked.parse(text));
  else el.textContent = text;
}

function handleEvent(ev) {
  if (ev.type === "run_done") { currentRun.es?.close(); finishRun(); return; }
  const card = currentRun?.cards.get(ev.variant);
  if (!card) return;
  switch (ev.type) {
    case "status": setStatus(card, ev.status); break;
    case "thinking": card.thinking += ev.text; scheduleRender(card); break;
    case "block_start":
      if (ev.kind === "thinking" && card.thinking) card.thinking += "\n\n";
      break;
    case "text": card.text += ev.text; scheduleRender(card); break;
    case "tool": addTool(card, `🔎 ${ev.name}: ${ev.input?.query ?? JSON.stringify(ev.input)}`); break;
    case "tool_result": addToolResult(card, ev.summary); break;
    case "usage": card.footEl.textContent = usageLine(ev.usage, ev.cost, ev.servedModel, ev.stopReason); break;
    case "artifacts": renderArtifacts(card, ev.artifacts); break;
    case "notice": addTool(card, "ℹ️ " + ev.message); break;
    case "error": addTool(card, "⚠️ " + ev.message, "err"); break;
    case "committed": card.footEl.textContent += ` · saved ${ev.sha.slice(0, 7)}`; break;
  }
}

function addTool(card, text, cls = "") {
  const d = document.createElement("div");
  d.className = "tool " + cls;
  d.textContent = text;
  card.toolsEl.appendChild(d);
}

function addToolResult(card, summary) {
  if (!Array.isArray(summary)) return addTool(card, `search error: ${summary?.error}`, "err");
  const d = document.createElement("div");
  d.className = "tool results";
  for (const r of summary) {
    const a = document.createElement("a");
    a.href = r.url; a.target = "_blank"; a.rel = "noopener noreferrer";
    a.textContent = r.title || r.url;
    d.appendChild(a);
  }
  card.toolsEl.appendChild(d);
}

function usageLine(u, cost, served, stop) {
  if (!u) return "";
  const parts = [`in ${u.input_tokens ?? 0} · out ${u.output_tokens ?? 0} tok`];
  if (cost != null) parts.push(`≈ $${Number(cost).toFixed(4)}`);
  if (served) parts.push(served);
  if (stop && stop !== "end_turn") parts.push(`stop: ${stop}`);
  return parts.join(" · ");
}

function renderArtifacts(card, artifacts) {
  card.artifactsEl.innerHTML = "";
  if (!artifacts.length) return;
  const label = document.createElement("div");
  label.className = "muted small";
  label.textContent = "Artifacts";
  card.artifactsEl.appendChild(label);
  for (const a of artifacts) {
    const b = document.createElement("button");
    b.className = "btn small artifact-btn";
    b.textContent = (a.previewable ? "▶ " : "📄 ") + a.name;
    b.onclick = () => openArtifact(a, card.v.label);
    card.artifactsEl.appendChild(b);
  }
}

function openArtifact(a, label) {
  $("#artifactTitle").textContent = `${label} — ${a.name}`;
  const frame = $("#artifactFrame");
  const src = $("#artifactSource");
  src.textContent = a.content;
  const showSource = !a.previewable;
  frame.hidden = showSource;
  src.hidden = !showSource;
  frame.srcdoc = a.previewable ? a.content : "";
  $("#artifactSourceBtn").onclick = () => { frame.hidden = !frame.hidden; src.hidden = !src.hidden; };
  $("#artifactDownloadBtn").onclick = () => {
    const url = URL.createObjectURL(new Blob([a.content], { type: "text/plain" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: a.name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("#artifactDialog").showModal();
}

// ---------- history / time travel -----------------------------------------

async function refreshHistory() {
  const res = await fetch(`/api/workspaces/${encodeURIComponent(workspace())}/runs`);
  const runs = res.ok ? await res.json() : [];
  const ul = $("#history");
  ul.innerHTML = "";
  if (!runs.length) ul.innerHTML = `<li class="muted small">No runs yet in this workspace.</li>`;
  for (const r of runs) {
    const li = document.createElement("li");
    li.innerHTML = `<div class="h-prompt"></div><div class="muted small h-meta"></div>`;
    li.querySelector(".h-prompt").textContent = r.promptPreview;
    li.querySelector(".h-meta").textContent = `${new Date(r.createdAt).toLocaleString()} · ${r.variants.length} variant(s)`;
    li.onclick = () => openStoredRun(r.id);
    ul.appendChild(li);
  }
}

async function openStoredRun(id, rev) {
  const q = rev ? `?rev=${rev}` : "";
  const res = await fetch(`/api/workspaces/${encodeURIComponent(workspace())}/runs/${id}${q}`);
  if (!res.ok) return;
  const run = await res.json();
  showRun(run);
  for (const v of run.variants) {
    const card = currentRun.cards.get(v.id);
    card.thinking = v.thinking.trim();
    card.text = v.text.trim();
    card.thinkingEl.textContent = card.thinking;
    renderMarkdown(card.responseEl, card.text);
    for (const t of v.meta?.tools || []) {
      if (t.type === "tool_use") addTool(card, `🔎 ${t.name}: ${t.input?.query ?? JSON.stringify(t.input)}`);
      else addToolResult(card, t.summary);
    }
    if (v.meta?.error) addTool(card, "⚠️ " + v.meta.error, "err");
    setStatus(card, v.meta ? v.meta.status : (rev ? "not yet" : "incomplete"));
    card.el.querySelector(".thinking").hidden = !card.thinking;
    if (v.meta) card.footEl.textContent = usageLine(v.meta.usage, v.meta.estimatedCostUsd, v.meta.servedModel, v.meta.stopReason);
    renderArtifacts(card, v.artifacts);
  }
  // Timeline: every commit that touched this run; click to view the run as of that commit.
  const tl = $("#timeline");
  tl.innerHTML = `<div class="muted small">Timeline (git) — click to time-travel</div>`;
  for (const c of [...run.history].reverse()) {
    const b = document.createElement("button");
    b.className = "chip small" + (rev && c.sha.startsWith(rev) ? " active" : "");
    b.textContent = `${c.sha.slice(0, 7)} ${c.subject.split(" (")[0]}`;
    b.title = new Date(c.date).toLocaleString();
    b.onclick = () => openStoredRun(id, c.sha);
    tl.appendChild(b);
  }
  if (rev) {
    const latest = document.createElement("button");
    latest.className = "chip small";
    latest.textContent = "latest →";
    latest.onclick = () => openStoredRun(id);
    tl.appendChild(latest);
  }
}

boot();
