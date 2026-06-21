# slimclaude

[![npm version](https://img.shields.io/npm/v/slimclaude.svg)](https://www.npmjs.com/package/slimclaude)
[![CI](https://github.com/Merlijnos/slimclaude/actions/workflows/ci.yml/badge.svg)](https://github.com/Merlijnos/slimclaude/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

**Other tools tell you that you're wasting AI coding-agent tokens. slimclaude fixes it — and proves the savings.**

Your agents re-send the same persistent context every single session: bloated memory files, missing ignore files, and MCP tool schemas. slimclaude scans your setup, **applies the fixes via reviewable diffs**, and measures the before/after token reduction. Detect → fix → measure. 100% local. No network, no login, no telemetry.

```bash
npx slimclaude
```

---

## Works with the agents you actually use

slimclaude **auto-detects** which agents a project (and your home dir) use, and only scans those:

| Agent | Memory files | Ignore file | MCP |
|---|---|---|---|
| **Claude Code** | `CLAUDE.md`, `.claude/CLAUDE.md`, `~/.claude/CLAUDE.md` | `.claudeignore` | ✅ |
| **Codex** | `AGENTS.md`, `~/.codex/AGENTS.md` | — | — |
| **Cursor** | `.cursorrules`, `.cursor/rules/*.mdc` | `.cursorignore` | ✅ |
| **Gemini CLI** | `GEMINI.md`, `~/.gemini/GEMINI.md` | `.geminiignore` | ✅ |
| **Windsurf** | `.windsurfrules`, `.windsurf/rules/*.md` | `.codeiumignore` | — |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/instructions/*` | — | ✅ |

`AGENTS.md` is the shared standard — Cursor, Codex, Zed and others read it too.

---

## What it does

Two commands.

### `slimclaude` — scan (read-only)

```text
$ npx slimclaude

slimclaude  ·  ~/code/acme-api  ·  grade  D 
Detected agents: Claude Code, Cursor

┌──────────────┬────────┬──────────────────────────────────────────┬────────────────┬─────────┐
│ Agent        │ Type   │ Finding                                    │ Tokens/session │ $/month │
├──────────────┼────────┼──────────────────────────────────────────┼────────────────┼─────────┤
│ Claude Code  │ Memory │ ./CLAUDE.md: 612 redundant tokens          │            612 │   $0.18 │
│ Claude Code  │ Ignore │ .claudeignore missing — 3 path(s) unignored│          4,180 │   $1.25 │
│ Cursor       │ Memory │ ./.cursor/rules/ts.mdc: 240 redundant      │            240 │   $0.07 │
│ Cursor       │ Ignore │ .cursorignore missing — 3 path(s) unignored│          4,180 │   $1.25 │
└──────────────┴────────┴──────────────────────────────────────────┴────────────────┴─────────┘

Estimated savings if fixed: ~9,212 tokens/session (~$2.76/month) (summed across 2 agents)

Potential savings — needs your review (not counted above)
slimclaude cannot see invocation history, so it cannot confirm these are unused.
┌──────────────┬──────┬───────────────────────────────────────┬────────────────────┐
│ Claude Code  │ MCP  │ github (~/.claude.json)               │                 550 │
│ Claude Code  │ MCP  │ sentry (~/.claude.json)               │                 550 │
└──────────────┴──────┴──────────────────────────────────────┴────────────────────┘
Unconfirmed potential: ~1,100 tokens/session (~$0.33/month) — your judgment, not detected.
```

### `slimclaude fix` — fix + measure

Shows a unified diff for every change, asks `[y/N]` per change, backs up every file it touches, then prints the money shot:

```text
$ npx slimclaude fix

High-confidence fixes

• Claude Code · Memory — ./CLAUDE.md: 612 redundant tokens
  --- ./CLAUDE.md
  +++ ./CLAUDE.md
  @@ -1,8 +1,4 @@
   # Rules
  -
  -
  -Always validate every external input explicitly.
   Always validate every external input explicitly.
  -# Rules
  Apply this change? [y/N] y
  applied

Before vs after
┌────────────────────────┬────────┬───┬────────┬────────┐
│                        │ Before │   │ After  │  Saved │
├────────────────────────┼────────┼───┼────────┼────────┤
│ Context tokens/session │  9,940 │ → │    728 │  9,212 │
│ $/month                │ $29.82 │ → │  $2.18 │ $27.64 │
│ Grade                  │   D    │ → │   A    │        │
└────────────────────────┴────────┴───┴────────┴────────┘
```

Numbers above are illustrative. Run it on your own setup to see real ones.

---

## What it detects (and fixes)

For every detected agent:

1. **Bloated memory files** — trims *provably* redundant content only: duplicate lines, repeated headers, blank-line runs, trailing whitespace. Conservative, and code fences are never touched.
2. **Missing / weak ignore files** — generates or augments the agent's ignore file so heavy dirs (`node_modules`, `dist`, `.next`, `vendor`, lockfiles, `*.min.js`, …) don't get pulled into context.
3. **MCP servers** — every configured server injects tool schemas every session. Listed with estimated cost for **your review** (see below).
4. **Orphaned Claude definitions** under `~/.claude/` — empty files, backup/temp junk (`*.bak`, `*.orig`, …), and skill folders missing their `SKILL.md` are archived (never deleted). Real definitions are listed for **your review**.

---

## How it estimates tokens

Be skeptical — these are **estimates**, not measurements.

- **chars / 4.** slimclaude approximates tokens as characters divided by 4. It does **not** run a real tokenizer (intentional for v0.1). Real counts vary by content and model.
- **Heavy directories** are estimated from on-disk bytes, capped per path (a session only ever reads a fraction of `node_modules`).
- **Cost** = `tokens/session × sessions-per-month × input price`. Defaults: 100 sessions/month, Sonnet pricing ($3 / 1M input). Override with `--sessions-per-month` and `--model opus|sonnet|haiku`.
- **Summed across agents.** If you use multiple agents, the headline sums each agent's per-session waste — fixing each agent's files saves tokens in that agent's sessions. The output labels this explicitly.
- **slimclaude cannot see your invocation history.** It does *not* read session logs, so it genuinely cannot know whether an MCP server or a definition was ever used. Those appear in a separate "needs your review" section, are **never** modified by `--yes`, and require an explicit confirmation. Deciding what's unused is your call, not a detection.

Only provably-dead items (redundant memory content, uncovered heavy paths, empty/junk definitions) count toward the green headline number and the grade.

---

## How it's different from ccusage / CodeBurn

| | ccusage / CodeBurn | **slimclaude** |
|---|---|---|
| Reports token usage | ✅ | — (not its job) |
| Reads session history | ✅ | ❌ (focuses on fixable persistent context) |
| Multiple agents | Claude-only | ✅ Claude, Codex, Cursor, Gemini, Windsurf, Copilot |
| **Applies fixes** | ❌ | ✅ via reviewable diffs |
| **Measures before/after savings** | ❌ | ✅ |

They tell you that you're spending. slimclaude reduces the spend and shows you the delta.

---

## Flags

```text
--path <dir>                project directory to scan (default: cwd)
--sessions-per-month <n>    for the cost estimate (default: 100)
--model <opus|sonnet|haiku> pricing model (default: sonnet)
--json                      machine-readable output (any command)
--dry-run                   show diffs, write nothing
--yes                       apply all high-confidence fixes without prompting
```

## Safety

This tool edits your files. It is built to be conservative:

- **Never deletes.** Archiving moves files to `~/.claude/.slimclaude-archive/`.
- **Never writes without** a `[y/N]` confirmation or `--yes`.
- **Backs up** every file before modifying it (`.bak`).
- `--yes` only touches high-confidence fixes. MCP servers and real definitions are never auto-changed — they always require an explicit, separate confirmation.
- Use `--dry-run` to preview every diff without writing a byte.

---

## Install

```bash
npx slimclaude          # scan (no install)
npx slimclaude fix      # fix + measure

# or install globally
npm install -g slimclaude
slimclaude
```

No config files. Works anywhere Node 20+ runs.

## Contributing

```bash
git clone https://github.com/Merlijnos/slimclaude.git
cd slimclaude
npm install
npm run build
npm test
```

CI runs build + tests on Node 20 and 22.

## License

[MIT](./LICENSE)

## Sponsor

If slimclaude saved you tokens, consider [sponsoring](https://github.com/sponsors/Merlijnos).
