# Prompt 0017 — snappier canvas, Space panning, no selection on drag, maximize, API keys, alternatives.md

- Date: 2026-10-06
- Channel: Claude Code on the web (cloud session)
- Model: Opus 5.5
- Session: https://claude.ai/code/session_017nwYSVsFdNRoEYMi7RDvgn
- Branch: `prototype/v0.3-wip-eval-story` (mirrored to `claude/cool-hawking-d5q52e`)

## Verbatim

### Sent 2026-10-06T13:58:05.842Z

- make the space panning feel much snappier, this feels very slow and clunky
- make space+mousedrag another pan option along with the existing click+drag on empty space
- when panning, the <div id=app> gets selected by my mouse during click+drag, fix this. same behavior happens on resizing a project window
- space+mousescroll should scroll the space instead of the iframe
- double click title bar should maximize screen real estate for that single project (resize the window and fullscreen it)
- add an appropriate way to add API tokens for the models (we're still just confirming that the UI looks good first, but if it's simple enough, implement at least a few models variant config options with clear instructions on where/how to get API tokens so I can start testing it too)

- make an alternatives.md file that documents all other projects that are similar: name, links to their github, demo URL, their license status, and any information you deem is relevant
