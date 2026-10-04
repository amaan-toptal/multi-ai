# Working on multi-ai (instructions for AI agents and humans)

## Append-only files — never delete or rewrite existing content
`HANDOFF.md`, `spec.md`, `evals.md` and everything under `prompts/` are
append-only. Add new dated sections at the end. To correct something, append a
correction that references the earlier entry; do not edit it in place.

## Every session
1. Record the user's prompt verbatim as `prompts/NNNN-YYYY-MM-DD-<slug>.md`
   (next number, include date, channel, model if known, session link).
2. Append to `HANDOFF.md`: what changed, current state, how to verify, next steps.
3. If the plan changed, append a new version section to `spec.md`.
4. Append every evaluation, bug, loophole, and decision you took on your own to `evals.md`.

## Dev
- `npm install && npm test && npm start` → http://localhost:8080
- Tests use a local mock of the Messages API; no key needed.
- Never commit API keys. Keys live only in the browser or server env.
