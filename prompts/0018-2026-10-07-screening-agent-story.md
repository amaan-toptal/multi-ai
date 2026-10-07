# Prompt 0018 — spinoff branch with a Screening Agent story (pass@k vs pass^k)

- Date: 2026-10-07
- Channel: Claude Code on the web (cloud session)
- Model: Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branch: `prototype/d071026-story-screening-agent` (from `prototype/v0.3-wip-eval-story` at 9191432)
- Note: the owner asked for six short questions; they were asked in two rounds (4 + 2) with options. The questions,
  options picked and free-text answers are recorded below verbatim.

## Verbatim

### Sent 2026-10-07T14:45:56.521Z

New spinoff branch: `prototype/d071026-story-screening-agent`

Go back and forth with me quickly in 10 words or less, ask 6 questions about the "Screening Agent" for Toptal (an agent that supports the screening team that interviews incoming talent - it transcribes text, suggests questions, notes things the screener needs to verify after the call, etc.)

The purpose of these questions and this request is to build a 4 timeline story on this screening agent, including sample screenshots and how this multi-ai project adds much more value to testing and verifying an agent's capabilities and reliabilities through the pass@k and pass^k metrics objectively. Add in or suggest whatever is needed conceptually to make this work and be a meaningful story of the product

### Answers to the questions (round 1)

- "What must the agent's first version do best?" = It would be really cool to explore how 3 different "project windows" explore each of these threads in parallel and identify where the agent needs more pretraining, midtraining, postraining, data sources, tool access, configuration changes, more context on the task or project, etc. as it makes sense and feels appropriate. These are just thoughts, choose what sounds most logical and impactful and succinct to tell the story impactfully over a call as a hardcoded demo/flow of the product
- "Which interview does the story screen?" = Senior dev technical screen (Recommended)
- "What failure should pass^k expose most?" = 1 and 4 and confidence scores and cited sources and instructions for the humans on how to verify perhaps?
  (option 1 was "Missed red flags", option 4 was "Biased or unfair notes")
- "Transcripts: synthetic or anonymized real?" = Mix of both

### Answers to the questions (round 2)

- "Real snippets: you supply them, or I mark placeholders?" = Write realistic ones
- "What closes the demo on the call?" = All three, in that order
  (scorecard, then the screener's verified report, then the before/after fix comparison)
