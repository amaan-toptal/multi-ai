// Exercises the streaming parser against a local mock of the Messages API,
// so the core loop is tested without an API key or network access.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

let server, lastBody, requests = 0;

function sse(events) {
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join("");
}

const message = (stop, content = []) => ({ id: "msg_1", type: "message", role: "assistant", model: "claude-opus-5-5", content, stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } });

before(async () => {
  server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      requests++;
      lastBody = JSON.parse(body);
      res.writeHead(200, { "content-type": "text/event-stream" });
      const first = requests === 1;
      res.end(sse([
        { type: "message_start", message: message() },
        { type: "content_block_start", index: 0, content_block: { type: "thinking", thinking: "", signature: "" } },
        { type: "content_block_delta", index: 0, delta: { type: "thinking_delta", thinking: "Let me think." } },
        { type: "content_block_stop", index: 0 },
        { type: "content_block_start", index: 1, content_block: { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: {} } },
        { type: "content_block_delta", index: 1, delta: { type: "input_json_delta", partial_json: '{"query":"milan cheap"}' } },
        { type: "content_block_stop", index: 1 },
        { type: "content_block_start", index: 2, content_block: { type: "web_search_tool_result", tool_use_id: "srvtoolu_1", content: [{ type: "web_search_result", title: "Trattoria", url: "https://example.com", encrypted_content: "x" }] } },
        { type: "content_block_stop", index: 2 },
        { type: "content_block_start", index: 3, content_block: { type: "text", text: "" } },
        { type: "content_block_delta", index: 3, delta: { type: "text_delta", text: first ? "Part one. " : "Here:\n```html\n<html>\n<body>hi</body>\n</html>\n```" } },
        { type: "content_block_stop", index: 3 },
        { type: "message_delta", delta: { stop_reason: first ? "pause_turn" : "end_turn", stop_sequence: null }, usage: { output_tokens: 50 } },
        { type: "message_stop" },
      ]));
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test("runVariant streams thinking, tools and text, and resumes pause_turn", async () => {
  const { runVariant } = await import("../server/providers/anthropic.js");
  const { extractArtifacts } = await import("../server/artifacts.js");
  const events = [];
  const result = await runVariant({
    apiKey: "sk-ant-test",
    variant: { model: "claude-opus-5-5", effort: "low", webSearch: true, system: "be brief" },
    prompt: "hello",
    emit: (e) => events.push(e),
  });
  assert.equal(requests, 2, "pause_turn should trigger one continuation");
  assert.equal(lastBody.messages.length, 2, "continuation re-sends user + the paused assistant turn");
  assert.equal(lastBody.messages[1].role, "assistant");
  assert.deepEqual(lastBody.thinking, { type: "adaptive", display: "summarized" });
  assert.deepEqual(lastBody.output_config, { effort: "low" });
  assert.equal(lastBody.fallbacks, "default");
  assert.equal(lastBody.tools[0].type, "web_search_20260209");
  assert.equal(lastBody.system, "be brief");
  assert.match(result.thinking, /Let me think\./);
  assert.match(result.text, /^Part one\. Here:/);
  assert.equal(result.stopReason, "end_turn");
  assert.equal(result.usage.output_tokens, 100);
  assert.ok(events.some((e) => e.type === "tool" && e.input.query === "milan cheap"));
  assert.ok(events.some((e) => e.type === "tool_result" && e.summary[0].title === "Trattoria"));
  const arts = extractArtifacts(result.text);
  assert.equal(arts.length, 1);
  assert.equal(arts[0].previewable, true);
});

test("haiku uses a thinking budget and no effort/fallbacks", async () => {
  const { runVariant } = await import("../server/providers/anthropic.js");
  requests = 1; // make the mock answer end_turn immediately
  await runVariant({ apiKey: "k", variant: { model: "claude-haiku-4-5" }, prompt: "x", emit: () => {} });
  assert.equal(lastBody.thinking.type, "enabled");
  assert.equal(lastBody.output_config, undefined);
  assert.equal(lastBody.fallbacks, undefined);
});
