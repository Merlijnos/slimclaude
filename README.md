# slimclaude

[![npm version](https://img.shields.io/npm/v/slimclaude.svg)](https://www.npmjs.com/package/slimclaude)
[![CI](https://github.com/Merlijnos/slimclaude/actions/workflows/ci.yml/badge.svg)](https://github.com/Merlijnos/slimclaude/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

Usage trackers tell you what you spent. slimclaude cuts the spend.

It finds the context your AI coding agents reload every session — bloated memory
files, missing ignore files, dead config — fixes it with diffs you approve, and
shows the tokens saved. Local only. No network, no account.

```
npx slimclaude
```

## Example

A repo using Claude Code and Cursor, scanned read-only:

```
slimclaude  ·  ~/code/acme-api  ·  grade  F 
Detected agents: Claude Code, Cursor

┌─────────────┬─────────────┬───────────────────────────────────────────────────────────┬────────────────┬─────────┐
│ Agent       │ Type        │ Finding                                                   │ Tokens/session │ $/month │
├─────────────┼─────────────┼───────────────────────────────────────────────────────────┼────────────────┼─────────┤
│ Claude Code │ Memory      │ ./CLAUDE.md: 84 redundant tokens                          │             84 │   $0.03 │
│ Claude Code │ Ignore      │ .claudeignore missing — 3 heavy path(s) unignored         │         10,003 │   $3.00 │
│ Claude Code │ Definitions │ ~/.claude/agents/reviewer.md.bak — backup/temp artifact   │              5 │   $0.00 │
│ Claude Code │ Definitions │ ~/.claude/skills/half-built — missing SKILL.md            │              7 │   $0.00 │
│ Cursor      │ Memory      │ ./.cursorrules: 17 redundant tokens                       │             17 │   $0.01 │
│ Cursor      │ Ignore      │ .cursorignore missing — 3 heavy path(s) unignored         │         10,003 │   $3.00 │
└─────────────┴─────────────┴───────────────────────────────────────────────────────────┴────────────────┴─────────┘

Estimated savings if fixed: ~20,119 tokens/session (~$6.04/month) (summed across 2 agents)
```

Then `slimclaude fix` shows a diff per change, asks before writing, backs up every
file it touches, and reports the result:

```
• Claude Code · Memory — ./CLAUDE.md: 84 redundant tokens
--- ./CLAUDE.md
+++ ./CLAUDE.md
@@ -8,17 +8,7 @@
 
 
-## Code style
-- Use TypeScript strict mode everywhere.
-- Prefer composition over inheritance.
-- Write the minimum code that solves the task.
-
 ## Testing
 - Every new module needs a unit test before it is considered done.
-- Every new module needs a unit test before it is considered done.
 
 ## Git
 - Use Conventional Commits with imperative subject lines.
-- Use Conventional Commits with imperative subject lines.
Apply this change? [y/N] y

Before vs after
┌────────────────────────┬────────┬───┬───────┬────────┐
│                        │ Before │   │ After │  Saved │
├────────────────────────┼────────┼───┼───────┼────────┤
│ Context tokens/session │ 21,346 │ → │ 1,227 │ 20,119 │
│ $/month                │  $6.40 │ → │ $0.37 │  $6.04 │
│ Grade                  │     F  │ → │    A  │        │
└────────────────────────┴────────┴───┴───────┴────────┘
```

Same run also created `.claudeignore` and `.cursorignore`, and archived the dead
definitions. The MCP servers it found were left untouched — see "What it leaves
alone" below.

## Supported agents

slimclaude detects which agents a repo uses and only scans those.

| Agent          | Memory files                                              | Ignore file       | MCP |
| -------------- | -------------------------------------------------------- | ----------------- | --- |
| Claude Code    | `CLAUDE.md`, `.claude/CLAUDE.md`, `~/.claude/CLAUDE.md`   | `.claudeignore`   | yes |
| Codex          | `AGENTS.md`, `~/.codex/AGENTS.md`                         | —                 | —   |
| Cursor         | `.cursorrules`, `.cursor/rules/*.mdc`                     | `.cursorignore`   | yes |
| Gemini CLI     | `GEMINI.md`, `~/.gemini/GEMINI.md`                        | `.geminiignore`   | yes |
| Windsurf       | `.windsurfrules`, `.windsurf/rules/*.md`                  | `.codeiumignore`  | —   |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions`| —                 | yes |

`AGENTS.md` is read by Codex, Cursor, Zed and others.

## What it finds

1. Bloated memory files. Removes only provably redundant lines: exact duplicates,
   repeated headers, blank-line runs, trailing whitespace. Code fences untouched.
2. Missing or weak ignore files. Generates one so `node_modules`, `dist`, lockfiles
   and similar never enter context.
3. MCP servers. Each one's tool schema is reloaded every session. Listed with an
   estimated cost so you can decide.
4. Dead definitions under `~/.claude` — empty files, `.bak`/temp leftovers, skill
   folders with no `SKILL.md`. Archived, never deleted.

## What it leaves alone

slimclaude does not read your session history, so it cannot know whether an MCP
server or a skill is actually used. Those go in a separate "needs your review"
list, never count toward the headline number, and are never changed by `--yes`.
You decide, with an explicit prompt. Only provably-dead waste is counted and
auto-fixable.

## How the numbers work

Estimates, not measurements — stated plainly so you can judge them:

- Tokens are approximated as characters / 4. No tokenizer is run.
- Heavy directories are sized from disk bytes, capped per path, since a session
  reads only part of `node_modules`.
- Cost is `tokens/session × sessions/month × input price`, default 100 sessions
  and Sonnet pricing ($3 / 1M). Change with `--sessions-per-month` and `--model`.
- With multiple agents the headline sums each agent's per-session waste, and says so.

## vs ccusage / CodeBurn

|                         | ccusage / CodeBurn | slimclaude        |
| ----------------------- | ------------------ | ----------------- |
| Reports usage           | yes                | no                |
| Reads session history   | yes                | no                |
| Multiple agents         | Claude only        | six (table above) |
| Applies fixes           | no                 | yes, via diffs    |
| Measures before / after | no                 | yes               |

They report the bill. slimclaude lowers it.

## Commands and flags

```
slimclaude            scan, read-only
slimclaude fix        show diffs, confirm, apply, report savings

--path <dir>                directory to scan (default: current)
--sessions-per-month <n>    for the cost estimate (default: 100)
--model <opus|sonnet|haiku> pricing model (default: sonnet)
--json                      machine-readable output
--dry-run                   show diffs, write nothing
--yes                       apply fixes without prompting
```

## Safety

- Never deletes. Archiving moves files to `~/.claude/.slimclaude-archive/`.
- Never writes without a `[y/N]` confirmation or `--yes`.
- Backs up every file before changing it (`.bak`).
- `--yes` applies only the provably-dead fixes; MCP servers and real definitions
  always require a separate, explicit yes.
- `--dry-run` shows every diff and writes nothing.

## Install

```
npx slimclaude          # run without installing
npm install -g slimclaude
```

Requires Node 20+.

## Develop

```
git clone https://github.com/Merlijnos/slimclaude.git
cd slimclaude
npm install
npm run build
npm test
```

## License

[MIT](./LICENSE). Sponsor: https://github.com/sponsors/Merlijnos
