// Per-workspace metadata git repository. Every prompt, thought trace, response
// and artifact is written as plain files and committed, so the full history can
// be browsed, diffed, rolled back or pushed to any git remote.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const exec = promisify(execFile);
const DATA_DIR = path.resolve(process.env.DATA_DIR || "./data");
const queues = new Map(); // serialize git ops per repo

export function sanitizeWorkspace(name) {
  const s = String(name || "default").toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s || "default";
}

export function workspaceDir(ws) {
  return path.join(DATA_DIR, "workspaces", sanitizeWorkspace(ws));
}

function git(dir, args) {
  return exec("git", ["-C", dir, ...args], { maxBuffer: 32 * 1024 * 1024 });
}

function serialized(dir, fn) {
  const prev = queues.get(dir) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  queues.set(dir, next);
  return next;
}

export async function ensureRepo(ws) {
  const dir = workspaceDir(ws);
  return serialized(dir, async () => {
    try {
      await fs.access(path.join(dir, ".git"));
      return dir;
    } catch {}
    await fs.mkdir(dir, { recursive: true });
    await git(dir, ["init", "-q", "-b", "main"]);
    await git(dir, ["config", "user.name", "multi-ai orchestrator"]);
    await git(dir, ["config", "user.email", "orchestrator@multi-ai.local"]);
    await fs.writeFile(path.join(dir, "README.md"),
      `# multi-ai workspace: ${sanitizeWorkspace(ws)}\n\n` +
      "Append-only record of every prompt sent through multi-ai.\n\n" +
      "- `runs/<run-id>/prompt.md` — the exact prompt\n" +
      "- `runs/<run-id>/run.json` — which variants were selected\n" +
      "- `runs/<run-id>/variants/<variant>/` — `thinking.md`, `response.md`, `artifacts/`, `events.jsonl`, `meta.json`\n\n" +
      "Each variant's completion is its own commit, so `git log` is a timeline of the run.\n");
    await git(dir, ["add", "-A"]);
    await git(dir, ["commit", "-q", "-m", "Initialize workspace"]);
    return dir;
  });
}

/** Write files (relative path -> string|Buffer) and commit them in one commit. */
export async function commitFiles(ws, files, message) {
  const dir = await ensureRepo(ws);
  return serialized(dir, async () => {
    for (const [rel, content] of Object.entries(files)) {
      const abs = path.join(dir, rel);
      if (!abs.startsWith(dir + path.sep)) throw new Error(`refusing to write outside repo: ${rel}`);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, content);
    }
    await git(dir, ["add", "-A"]);
    await git(dir, ["commit", "-q", "--allow-empty", "-m", message]);
    const { stdout } = await git(dir, ["rev-parse", "HEAD"]);
    return stdout.trim();
  });
}

export async function listRuns(ws) {
  const dir = await ensureRepo(ws);
  const runsDir = path.join(dir, "runs");
  let ids = [];
  try { ids = await fs.readdir(runsDir); } catch { return []; }
  const runs = [];
  for (const id of ids.sort().reverse()) {
    try {
      const run = JSON.parse(await fs.readFile(path.join(runsDir, id, "run.json"), "utf8"));
      runs.push({ id, createdAt: run.createdAt, promptPreview: run.promptPreview, variants: run.variants.map((v) => v.label) });
    } catch {}
  }
  return runs;
}

/** Load a stored run. `rev` (optional commit) reads the run as it was at that commit. */
export async function loadRun(ws, runId, rev) {
  if (!/^[\w-]+$/.test(runId)) throw new Error("bad run id");
  const dir = await ensureRepo(ws);
  const base = `runs/${runId}`;
  const read = async (rel) => {
    if (rev) {
      if (!/^[0-9a-f]{7,40}$/.test(rev)) throw new Error("bad rev");
      try { return (await git(dir, ["show", `${rev}:${rel}`])).stdout; } catch { return null; }
    }
    try { return await fs.readFile(path.join(dir, rel), "utf8"); } catch { return null; }
  };
  const runJson = await read(`${base}/run.json`);
  if (!runJson) return null;
  const run = JSON.parse(runJson);
  run.prompt = await read(`${base}/prompt.md`);
  for (const v of run.variants) {
    const vb = `${base}/variants/${v.dir}`;
    const meta = await read(`${vb}/meta.json`);
    v.meta = meta ? JSON.parse(meta) : null;
    v.thinking = (await read(`${vb}/thinking.md`)) || "";
    v.text = (await read(`${vb}/response.md`)) || "";
    v.artifacts = [];
    for (const a of v.meta?.artifacts || []) {
      v.artifacts.push({ ...a, content: (await read(`${vb}/artifacts/${a.name}`)) || "" });
    }
  }
  const { stdout } = await git(dir, ["log", "--format=%H%x09%cI%x09%s", "--", base]);
  run.history = stdout.trim().split("\n").filter(Boolean).map((l) => {
    const [sha, date, subject] = l.split("\t");
    return { sha, date, subject };
  });
  return run;
}

export async function workspaceLog(ws, limit = 100) {
  const dir = await ensureRepo(ws);
  const { stdout } = await git(dir, ["log", `-n${limit}`, "--format=%H%x09%cI%x09%s"]);
  return stdout.trim().split("\n").filter(Boolean).map((l) => {
    const [sha, date, subject] = l.split("\t");
    return { sha, date, subject };
  });
}
