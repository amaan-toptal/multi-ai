# Prompt 0001 — initial planning

- Date: 2026-10-04
- Channel: Claude Code on the web (cloud session)
- Model (as stated by the user): Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branch: claude/cool-hawking-d5q52e

## Verbatim

Hello world (this is an empty repo, skip checking).
The project is called `multi-ai`.

The idea is to build a web interface where a person can login through their
Claude, ChatGPT, Grok, Llama etc. accounts (through API tokens or however it makes sense).

Then they can send the same exact prompt to as many variants as they choose and watch them in real-time - including their thought-processes, their artifacts.

Every prompt, thought-trace, artifact must be preserved to a higher level metadata `git` repo for the user.

Build the most basic version where I can do this, starting with a Claude Code API/login (including telling me how to set it up from another account).

I expect you to set this Git repo up to something that I can host on GCP / AWS / DigitalOcean easily.

The UI I expect:

as if I have a way to select variants in the web browser as I usually do on the official websites / harnesses as appropriate - each of them run in an isolated context (whether that means separate cloud instances entirely eventually, or browser sessions in a local VM for the prototype (and feel free to ask before you go off and build the thing)), or playwright, or whatever.

The goal is for there to be simple examples, like "build a browser based music daw app" or "do whatever you want :)" or "find me the cheapest restaurant to eat at in Milan with reservations available in the next 30 mins" or whatever other interested prompt variants you think would be interesting for someone to play with - within Claude's models initially, and then across models, across account types with different contexts setup, etc.

This is a lot of work eventually, so for now, give me the most proof-of-concept human usable thing, and then we can iterate.

For this project, please maintain the Git repo with all of my prompts recorded, along with structured HANDOFF.md, an updated spec.md anytime the plan changes, and an evals.md for all evaluations considered/bugs found/loopholes/problems and decisions taken on your own - these files are all append-only, do not ever delete from this file.

I'm starting this planning phase with the model Opus 5.5 (and this kind of detail in the app shouldn't be something I should have to type, it should be auto-captured in the multi-AI orchestrator through connecting to several Git repos for each "variant" and automatically managing them in ways that keep them isolated, with secure policies, while allowing the orchestrator to easily access, rollback, and travel through time of every prompt, thought trace, and artifact generated).

TODO: at some point remind to manually build a verifier about this append-only rule for every commit pushed to the repo in CI, and ensuring force pushes are not possible.
