// Anthropic (Claude) provider. One call to runVariant() = one fully isolated
// conversation: nothing is shared between variants except the prompt text.
import Anthropic from "@anthropic-ai/sdk";

// Prices are USD per 1M tokens (input, output). Used only for the cost estimate
// shown in the UI; the Anthropic Console is the source of truth for billing.
export const MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", input: 4, output: 20, thinking: "adaptive", effort: true, webSearch: "web_search_20260209", fallbacks: true, defaultEffort: "high" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", input: 2, output: 10, thinking: "adaptive", effort: true, webSearch: "web_search_20260209", fallbacks: true, defaultEffort: "high" },
  { id: "claude-fable-5-1", label: "Claude Fable 5.1", input: 10, output: 50, thinking: "adaptive", effort: true, webSearch: "web_search_20250305", fallbacks: true, defaultEffort: "high" },
  { id: "claude-opus-5", label: "Claude Opus 5", input: 5, output: 25, thinking: "adaptive", effort: true, webSearch: "web_search_20260209", fallbacks: true, defaultEffort: "high" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", input: 1, output: 5, thinking: "budget", effort: false, webSearch: "web_search_20250305", fallbacks: false },
];

export const EFFORTS = ["low", "medium", "high", "xhigh", "max"];

const MAX_CONTINUATIONS = 5; // pause_turn resumes for long server-tool turns

export function modelInfo(id) {
  return MODELS.find((m) => m.id === id);
}

export function estimateCost(modelId, usage) {
  const m = modelInfo(modelId);
  if (!m || !usage) return null;
  const inTok = (usage.input_tokens || 0) + (usage.cache_creation_input_tokens || 0) + (usage.cache_read_input_tokens || 0);
  return (inTok * m.input + (usage.output_tokens || 0) * m.output) / 1e6;
}

function buildRequest(variant, messages, useFallbacks) {
  const m = modelInfo(variant.model);
  const req = {
    model: variant.model,
    max_tokens: 64000,
    messages,
  };
  if (m.thinking === "adaptive") {
    // display: "summarized" so the UI can actually show the thought process;
    // the default ("omitted") streams empty thinking blocks.
    req.thinking = { type: "adaptive", display: "summarized" };
  } else {
    req.thinking = { type: "enabled", budget_tokens: 16000 };
  }
  if (m.effort) req.output_config = { effort: variant.effort || m.defaultEffort };
  if (variant.system && variant.system.trim()) req.system = variant.system;
  if (variant.webSearch) req.tools = [{ type: m.webSearch, name: "web_search", max_uses: 8 }];
  const betas = [];
  if (useFallbacks && m.fallbacks) {
    // Server-side fallback: if a safety classifier declines, Anthropic re-runs
    // the request on its recommended fallback model instead of returning a refusal.
    betas.push("server-side-fallback-2026-07-01");
    req.fallbacks = "default";
  }
  if (betas.length) req.betas = betas;
  return req;
}

/**
 * Stream one variant. `emit(event)` receives small JSON-able events:
 *   {type:"status", status}               running | done | error
 *   {type:"block_start", index, kind, ...} thinking | text | tool_use | tool_result
 *   {type:"thinking", text} / {type:"text", text}  deltas
 *   {type:"tool", name, input} / {type:"tool_result", summary}
 *   {type:"usage", usage, cost}
 *   {type:"error", message}
 * Returns the final {thinking, text, stopReason, usage, cost, servedModel}.
 */
export async function runVariant({ apiKey, variant, prompt, emit, signal }) {
  const client = new Anthropic({ apiKey, maxRetries: 2 });
  const messages = [{ role: "user", content: prompt }];
  const result = { thinking: "", text: "", stopReason: null, usage: {}, cost: 0, servedModel: null, tools: [] };
  let useFallbacks = true;

  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    let final;
    try {
      final = await streamOnce(client, buildRequest(variant, messages, useFallbacks), emit, result, signal);
    } catch (err) {
      // If this account/workspace can't use the fallback beta, retry without it once.
      if (useFallbacks && err instanceof Anthropic.BadRequestError && /fallback/i.test(err.message)) {
        useFallbacks = false;
        emit({ type: "notice", message: "Server-side fallback unavailable for this key; retrying without it." });
        turn--;
        continue;
      }
      throw err;
    }
    for (const k of ["input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"]) {
      result.usage[k] = (result.usage[k] || 0) + (final.usage?.[k] || 0);
    }
    result.cost += estimateCost(variant.model, final.usage) || 0;
    result.servedModel = final.model;
    result.stopReason = final.stop_reason;
    emit({ type: "usage", usage: result.usage, cost: result.cost, servedModel: final.model, stopReason: final.stop_reason });

    if (final.stop_reason === "pause_turn") {
      // Long server-tool turn: send the partial assistant turn back to continue it.
      messages.push({ role: "assistant", content: final.content });
      continue;
    }
    if (final.stop_reason === "refusal") {
      const cat = final.stop_details?.category ? ` (${final.stop_details.category})` : "";
      emit({ type: "notice", message: `Model declined this request${cat}.` });
    }
    break;
  }
  return result;
}

async function streamOnce(client, req, emit, result, signal) {
  const stream = client.beta.messages.stream(req, { signal });
  for await (const ev of stream) {
    if (ev.type === "content_block_start") {
      const b = ev.content_block;
      if (b.type === "thinking" || b.type === "redacted_thinking") {
        emit({ type: "block_start", kind: "thinking" });
        if (result.thinking) result.thinking += "\n\n";
      } else if (b.type === "text") {
        emit({ type: "block_start", kind: "text" });
      } else if (b.type === "server_tool_use") {
        emit({ type: "block_start", kind: "tool_use", name: b.name });
      } else if (b.type === "web_search_tool_result") {
        const summary = summarizeSearch(b.content);
        result.tools.push({ type: "web_search_result", summary });
        emit({ type: "tool_result", name: "web_search", summary });
      }
    } else if (ev.type === "content_block_delta") {
      const d = ev.delta;
      if (d.type === "thinking_delta") {
        result.thinking += d.thinking;
        emit({ type: "thinking", text: d.thinking });
      } else if (d.type === "text_delta") {
        result.text += d.text;
        emit({ type: "text", text: d.text });
      }
    } else if (ev.type === "content_block_stop") {
      // Emit the finished tool input (query) once it is complete.
      const block = stream.currentMessage?.content?.[ev.index];
      if (block?.type === "server_tool_use") {
        result.tools.push({ type: "tool_use", name: block.name, input: block.input });
        emit({ type: "tool", name: block.name, input: block.input });
      }
    }
  }
  return stream.finalMessage();
}

function summarizeSearch(content) {
  // Success: array of web_search_result. Error: a single error object.
  if (Array.isArray(content)) {
    return content.slice(0, 8).map((r) => ({ title: r.title, url: r.url }));
  }
  return { error: content?.error_code || "unknown_error" };
}

/** Cheap credential check used by the "Connect" button. */
export async function verifyKey(apiKey) {
  const client = new Anthropic({ apiKey, maxRetries: 0 });
  const page = await client.models.list({ limit: 50 });
  return page.data.map((m) => m.id);
}
