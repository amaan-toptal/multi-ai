# Prompt 0016 — no release; v0.2 stub branch; v0.3 branch with project windows, canvas, Land-or-Water story

- Date: 2026-10-06
- Channel: Claude Code on the web (cloud session)
- Model: Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branches: `prototype/v0.2-multi-ai-frontend-stub` (copy of 33920dc), work on `prototype/v0.3-wip-eval-story`
  (mirrored to `claude/cool-hawking-d5q52e`)
- Note: x.com is blocked by this environment's egress policy, so the tweet was read through web search results, which
  quote it as: "Cool eval. Simply ask an LLM “Land or Water?” and give it a latitude and longitude coordinate as text.
  Ask 16,200 times, plot as image. The models know. From compressing the internet."

## Verbatim

### Sent 2026-10-06T07:41:18.507Z

no need to release. duplicate this branch to `prototype/v0.2-multi-ai-frontend-stub` please

then create a new branch `prototype/v0.3-wip-eval-story` for the following work

feedback:
- add a new project window (master prompt, artifact view, variant view, central repo view) feature
- seed another example story based on this tweet
https://x.com/karpathy/status/2105909609487872075
 - make it so that the timeline easily shows us step by step by step (3 steps total from the user's end, all guided by basically following the orchestrator's suggestions) lead us to recreating this eval easily, visually
- add the ability for the project windows to float in an infinite space canvas with zoom in/out and drag so it's easy to multi-task on many projects as they complete long-horizon tasks and need human input
- if it makes sense to you, add a menu bar on the top with the usual "File", "Edit", "View" dropdowns and whichever options make sense
- auto-scroll all variant windows to the bottom so the latest responses are visible by default when timetravel is being used

Answering questions from earlier:
1 yes
2 yes, add just one p2f check and one rubric check that is very logical and relevant to these example projects
3 yes, keep right
