# Prompt 0011 — variant tabs only, git-diff repo view, use provider APIs, key setup

- Date: 2026-10-04 (sent 2026-10-04T20:22:17.155Z)
- Channel: Claude Code on the web (cloud session)
- Model: Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branch: claude/cool-hawking-d5q52e (mirrored to poc/variant-windows)

## Verbatim

This is good. Updates:

1. combine the windows and tabs into just variant tabs so it's easier to navigate
2. The Git viewer needs to be easier to understand and use. I want it to look like a git diff of what we did as the user - changed the prompt, or model/effort config, or connected a tool, or added an MCP server that can support us with context, etc.

Decision you asked for:
Yes, let's use provider APIs/SDKs (and help me decide and understand in the chat here before implementing things what the web UI vs. API vs. CLI harnesses may entail, especially for agentic RL development, integration into enterprises with context, tools, MCP, etc.).

Include setup instructions for me which would let me test this with minimal spending to acquire usable API tokens for the poc, and include the open source models too
