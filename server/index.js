import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODELS, EFFORTS, modelInfo, runVariant, verifyKey } from "./providers/anthropic.js";
import { extractArtifacts } from "./artifacts.js";
import { commitFiles, ensureRepo, listRuns, loadRun, sanitizeWorkspace, workspaceLog } from "./gitstore.js";
import { EXAMPLES } from "./examples.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);
const APP_PASSWORD = process.env.APP_PASSWORD || "";
const SERVER_KEY = process.env.ANTHROPIC_API_KEY || "";
const MAX_VARIANTS = Number(process.env.MAX_VARIANTS || 8);
const VERSION = "0.1.0";

if (SERVER_KEY && !APP_PASSWORD && process.env.ALLOW_OPEN !== "1") {
  console.error("Refusing to start: ANTHROPIC_API_KEY is set but APP_PASSWORD is not, so anyone reaching this port could spend your credits. Set APP_PASSWORD (or ALLOW_OPEN=1 for local-only use).");
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: "1mb" }));

// Optional shared-password gate (HTTP Basic auth) so a hosted instance isn't open to the world.
if (APP_PASSWORD) {
  app.use((req, res, next) => {
    const [, b64] = (req.headers.authorization || "").split(" ");
    const pass = b64 ? Buffer.from(b64, "base64").toString().split(":").slice(1).join(":") : "";
    const ok = pass.length === APP_PASSWORD.length && crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(APP_PASSWORD));
    if (ok) return next();
    res.set("WWW-Authenticate", 'Basic realm="multi-ai"').status(401).send("Authentication required");
  });
}

app.use(express.static(path.join(__dirname, "..", "public")));
// Front-end libraries served from node_modules so the UI works without a CDN.
const nm = path.join(__dirname, "..", "node_modules");
app.get("/vendor/marked.min.js", (req, res) => res.sendFile(path.join(nm, "marked", "marked.min.js")));
app.get("/vendor/purify.min.js", (req, res) => res.sendFile(path.join(nm, "dompurify", "dist", "purify.min.js")));

// The user's API key travels per request in a header and is only held in memory
// for the duration of a run. It is never written to disk or the git repo.
function apiKeyFrom(req) {
  return req.get("x-anthropic-key") || SERVER_KEY;
}

app.get("/api/config", (req, res) => {
  res.json({ version: VERSION, models: MODELS, efforts: EFFORTS, examples: EXAMPLES, serverKey: Boolean(SERVER_KEY), maxVariants: MAX_VARIANTS });
});

app.post("/api/verify-key", async (req, res) => {
  const key = apiKeyFrom(req);
  if (!key) return res.status(400).json({ error: "No API key provided" });
  try {
    res.json({ ok: true, models: await verifyKey(key) });
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message });
  }
});

// ---- runs ----------------------------------------------------------------

const live = new Map(); // runId -> { events: [], clients: Set<res>, done }

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "prompt";
}

function stamp(d = new Date()) {
  return d.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
}

app.post("/api/runs", async (req, res) => {
  const key = apiKeyFrom(req);
  if (!key) return res.status(400).json({ error: "Connect a Claude API key first." });
  const ws = sanitizeWorkspace(req.body.workspace);
  const prompt = String(req.body.prompt || "").replace("{{now}}", new Date().toString());
  const raw = Array.isArray(req.body.variants) ? req.body.variants : [];
  if (!prompt.trim()) return res.status(400).json({ error: "Prompt is empty." });
  if (!raw.length) return res.status(400).json({ error: "Select at least one variant." });
  if (raw.length > MAX_VARIANTS) return res.status(400).json({ error: `At most ${MAX_VARIANTS} variants per run.` });

  const variants = [];
  for (const [i, v] of raw.entries()) {
    const m = modelInfo(v.model);
    if (!m) return res.status(400).json({ error: `Unknown model ${v.model}` });
    const effort = m.effort ? (EFFORTS.includes(v.effort) ? v.effort : m.defaultEffort) : null;
    const id = `v${i + 1}`;
    const label = [m.label, effort && `effort ${effort}`, v.webSearch && "web", v.system && "custom system"].filter(Boolean).join(" · ");
    variants.push({
      id, label, model: m.id, provider: "anthropic", effort,
      webSearch: Boolean(v.webSearch), system: String(v.system || ""),
      dir: `${id}-${m.id}${effort ? "-" + effort : ""}`,
    });
  }

  const createdAt = new Date().toISOString();
  const runId = `${stamp()}-${slugify(prompt)}-${crypto.randomBytes(2).toString("hex")}`;
  const run = {
    id: runId, createdAt, workspace: ws, promptPreview: prompt.slice(0, 200),
    orchestrator: { app: "multi-ai", version: VERSION },
    variants: variants.map(({ id, label, model, provider, effort, webSearch, system, dir }) => ({ id, label, model, provider, effort, webSearch, system, dir })),
  };

  try {
    await ensureRepo(ws);
    await commitFiles(ws, {
      [`runs/${runId}/prompt.md`]: prompt + "\n",
      [`runs/${runId}/run.json`]: JSON.stringify(run, null, 2) + "\n",
    }, `Prompt ${runId}\n\n${prompt.slice(0, 500)}`);
  } catch (err) {
    return res.status(500).json({ error: `Could not record run: ${err.message}` });
  }

  const state = { events: [], clients: new Set(), done: false, controllers: [] };
  live.set(runId, state);
  res.json({ runId, run });

  const broadcast = (ev) => {
    const line = `data: ${JSON.stringify(ev)}\n\n`;
    state.events.push(line);
    for (const c of state.clients) c.write(line);
  };

  await Promise.all(variants.map((v) => executeVariant({ ws, runId, v, prompt, key, broadcast, state })));
  broadcast({ type: "run_done" });
  state.done = true;
  for (const c of state.clients) c.end();
  setTimeout(() => live.delete(runId), 10 * 60 * 1000); // keep replay buffer briefly
});

async function executeVariant({ ws, runId, v, prompt, key, broadcast, state }) {
  const startedAt = new Date().toISOString();
  const events = [];
  const emit = (ev) => {
    const stamped = { ...ev, t: Date.now() };
    if (ev.type !== "thinking" && ev.type !== "text") events.push(stamped);
    broadcast({ variant: v.id, ...stamped });
  };
  const controller = new AbortController();
  state.controllers.push(controller);
  emit({ type: "status", status: "running" });
  let result, error;
  try {
    result = await runVariant({ apiKey: key, variant: v, prompt, emit, signal: controller.signal });
  } catch (err) {
    // SDK API errors carry the API's own message under err.error.error.message.
    error = err?.error?.error?.message ? `${err.status}: ${err.error.error.message}` : (err.message || String(err));
    if (err?.name === "APIUserAbortError") error = "Stopped by user";
    emit({ type: "error", message: error });
  }
  const text = result?.text || "";
  const artifacts = extractArtifacts(text);
  if (artifacts.length) emit({ type: "artifacts", artifacts });
  const meta = {
    ...v, startedAt, finishedAt: new Date().toISOString(),
    status: error ? "error" : "done", error: error || null,
    servedModel: result?.servedModel || null, stopReason: result?.stopReason || null,
    usage: result?.usage || null, estimatedCostUsd: result ? Number(result.cost.toFixed(6)) : null,
    tools: result?.tools || [],
    artifacts: artifacts.map(({ name, lang, previewable }) => ({ name, lang, previewable })),
  };
  const base = `runs/${runId}/variants/${v.dir}`;
  const files = {
    [`${base}/meta.json`]: JSON.stringify(meta, null, 2) + "\n",
    [`${base}/thinking.md`]: (result?.thinking || "") + "\n",
    [`${base}/response.md`]: text + "\n",
    [`${base}/events.jsonl`]: events.map((e) => JSON.stringify(e)).join("\n") + "\n",
  };
  for (const a of artifacts) files[`${base}/artifacts/${a.name}`] = a.content;
  try {
    const sha = await commitFiles(ws, files, `${v.label}: ${meta.status} (${runId})`);
    emit({ type: "committed", sha });
  } catch (err) {
    emit({ type: "error", message: `Git commit failed: ${err.message}` });
  }
  emit({ type: "status", status: meta.status });
}

app.get("/api/runs/:id/events", (req, res) => {
  const state = live.get(req.params.id);
  if (!state) return res.status(404).json({ error: "Run is not live (open it from history instead)." });
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  for (const line of state.events) res.write(line);
  if (state.done) return res.end();
  state.clients.add(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 15000);
  req.on("close", () => { clearInterval(ping); state.clients.delete(res); });
});

app.post("/api/runs/:id/stop", (req, res) => {
  const state = live.get(req.params.id);
  if (!state) return res.status(404).json({ error: "Run is not live." });
  for (const c of state.controllers) c.abort();
  res.json({ ok: true });
});

app.get("/api/workspaces/:ws/runs", async (req, res) => {
  try { res.json(await listRuns(req.params.ws)); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/workspaces/:ws/runs/:id", async (req, res) => {
  try {
    const run = await loadRun(req.params.ws, req.params.id, req.query.rev);
    if (!run) return res.status(404).json({ error: "Not found" });
    res.json(run);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.get("/api/workspaces/:ws/log", async (req, res) => {
  try { res.json(await workspaceLog(req.params.ws)); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Scripted, no-key playground (the same page published as the chat artifact).
app.get("/demo", (req, res) => res.sendFile(path.join(__dirname, "..", "docs", "demo", "index.html")));

app.get("/healthz", (req, res) => res.send("ok"));

app.listen(PORT, () => {
  console.log(`multi-ai listening on http://localhost:${PORT}`);
  if (!SERVER_KEY) console.log("No ANTHROPIC_API_KEY set: users connect their own key in the browser.");
  if (!APP_PASSWORD) console.log("APP_PASSWORD not set: anyone who can reach this port can use it.");
});
