# How Kiro IDE was used to build BioLens

This file documents, truthfully, how the Kiro agentic IDE was used during
development. It is included in the repository per Hackachusetts requirements.

## Honest summary

BioLens was built almost entirely through **Kiro "vibe" sessions** — an
iterative, conversational workflow in Kiro's chat where we described each
feature or bug in plain English and Kiro proposed a plan, then implemented
it across the project files after we approved.

## Kiro features we actually used

- **Vibe (conversational) coding sessions.** Every feature — the DNA
  visualizer, PDF text extraction, the AI Notes / Quiz / Tutor / Visualize
  features, the multilingual system, and Demo Mode — was built by describing
  the goal in chat and iterating with Kiro.
- **Agentic multi-file edits.** Kiro read the existing code, proposed changes,
  and edited `index.html`, `style.css`, `tutor.js`, `ai.js`, `visualize.js`,
  `demo.js`, `i18n.js`, and the Flask backend in `server/app.py`.
- **In-session verification.** Kiro ran shell commands to check structure
  (grep/ls), validate that required element IDs existed, and confirm no
  secrets were committed.
- **Plan-before-code reviews.** For larger changes, Kiro presented a written
  plan (and sometimes a layout sketch) for approval before editing code.
- **Web search during debugging.** Kiro used web search to diagnose the
  Gemini `AQ.` key format change and the 403 project-access error against
  current Google documentation.

## Kiro features we did NOT use

To stay truthful, we did **not** use the following Kiro features in this
project, and make no claim otherwise:

- **Specs** (the structured requirements → design → tasks workflow).
- **Agent Hooks** (event-triggered automation).
- **Steering files as an active input** — this file exists only as required
  submission documentation; it was not used to steer the build.
- **MCP servers / Kiro Powers.**

## Why this matters

Our project emphasizes honesty about what is and isn't AI-generated. We hold
the same standard for describing our tools: the list above reflects what we
genuinely used, nothing more.
