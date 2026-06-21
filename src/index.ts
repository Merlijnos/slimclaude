#!/usr/bin/env node
import { Command } from "commander";
import os from "node:os";
import path from "node:path";

import { runFix } from "./fix";
import { printScanResult } from "./report";
import { scan } from "./scan";
import { Model, ResolvedOptions } from "./types";

interface RawOptions {
  path?: string;
  sessionsPerMonth?: string;
  model?: string;
  json?: boolean;
  dryRun?: boolean;
  yes?: boolean;
}

function resolveOptions(raw: RawOptions): ResolvedOptions {
  const model = (raw.model ?? "sonnet").toLowerCase();
  if (model !== "opus" && model !== "sonnet" && model !== "haiku") {
    console.error(`Invalid --model "${raw.model}". Use opus, sonnet, or haiku.`);
    process.exit(1);
  }
  const parsed = Number.parseInt(raw.sessionsPerMonth ?? "100", 10);
  const sessionsPerMonth = Number.isFinite(parsed) && parsed > 0 ? parsed : 100;

  return {
    path: path.resolve(raw.path ?? process.cwd()),
    home: os.homedir(),
    sessionsPerMonth,
    model: model as Model,
    json: Boolean(raw.json),
    dryRun: Boolean(raw.dryRun),
    yes: Boolean(raw.yes),
  };
}

function addCommonOptions(cmd: Command): Command {
  return cmd
    .option("--path <dir>", "project directory to scan", process.cwd())
    .option("--sessions-per-month <n>", "sessions/month for cost estimate", "100")
    .option("--model <model>", "pricing model: opus|sonnet|haiku", "sonnet")
    .option("--json", "machine-readable JSON output")
    .option("--dry-run", "show changes but write nothing")
    .option("--yes", "apply all high-confidence fixes without prompting");
}

const program = new Command();
program
  .name("slimclaude")
  .description("Detect, fix, and measure Claude Code context-token waste.")
  .version("0.1.0");

addCommonOptions(program);
program.action(() => {
  const o = resolveOptions(program.opts<RawOptions>());
  printScanResult(scan(o), o);
});

const fix = program
  .command("fix")
  .description(
    "Generate fixes, show diffs, apply on confirmation, then show before/after."
  );
addCommonOptions(fix);
fix.action(async () => {
  await runFix(resolveOptions(fix.optsWithGlobals<RawOptions>()));
});

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
