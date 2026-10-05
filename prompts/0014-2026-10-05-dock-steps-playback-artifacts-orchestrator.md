# Prompt 0014 — docked repo, step-by-step changes, playback look, artifacts window, prompt history and suggestions, flags and element names

- Date: 2026-10-05 (sent 2026-10-05T09:43:20.798Z)
- Channel: Claude Code on the web (cloud session)
- Model: Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branch: claude/cool-hawking-d5q52e (mirrored to poc/variant-windows)

## Verbatim

More feedback:

* The "experiment repo" window is great as-is, but also please give it a space where it's readable and usable "docked" too
* The changes view feels too noisy/unreadable right now - I want this detail when I click on it, but until I do I just want to understand step by step what is happening / being committed (prompt changed, model replied generating X artifacts in Y time and Z cost for example, orchestrator summarizing current state/documenting spec/generating verifiers or evals/suggesting next prompt or step
* During timetravel (when clicking on a commit in the experiment repo) the colours being red/pink makes it feel like something is wrong - instead make it feel and look like you're stepping through a frozen/read-only snapshot or playback of events
* Make it easy to watch and compare the artifacts of all models - like an expand-all artifacts option. Give this artifact viewer it's own window that's moveable+scaleable with its own variant-tabs
* The master prompt should always be filled in with the latest prompt and pressing up/down arrow keys should scroll through their history
* The master prompt should have a "suggested prompt" as well from the orchestrator agent
* Master prompt should send on ctrl+enter, enter should add a newline


Please ask questions as needed and make it so any of these specifics can easily be swapped/reverted to previous state (and tell me how to tell you to do that, I'm struggling to know what to call specific elements - maybe add debug IDs to the bigger elements and make it easier for me to find them through devtools and guide you too)
