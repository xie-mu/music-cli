#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const schemaPath = join(__dirname, 'schema.generated.json');

function printJson(value, exitCode = 0) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(exitCode);
}

function parseJsonArg(raw, label) {
  if (!raw || !raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    printJson({
      ok: false,
      error: `Invalid ${label} JSON`,
      received: raw,
    }, 2);
  }
}

function loadSchemas() {
  if (!existsSync(schemaPath)) {
    printJson({
      ok: false,
      error: 'Tool schema snapshot is missing',
      schemaPath,
    }, 2);
  }
  return JSON.parse(readFileSync(schemaPath, 'utf8'));
}

function toolNameToCommand(toolName) {
  if (!toolName.startsWith('netease_')) {
    return null;
  }
  return toolName.slice('netease_'.length).replace(/_/g, ' ');
}

function kebabCase(key) {
  return key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
}

function valueToFlagArgs(key, value) {
  if (value === undefined || value === null) return [];
  const flag = `--${kebabCase(key)}`;
  if (typeof value === 'boolean') {
    return value ? [flag] : [];
  }
  if (Array.isArray(value)) {
    return [flag, value.join(',')];
  }
  return [flag, String(value)];
}

function commandArgsFromParams(command, params) {
  const args = command.split(' ');
  const hasOutput = Object.keys(params).some(key => key === 'output');
  for (const [key, value] of Object.entries(params)) {
    args.push(...valueToFlagArgs(key, value));
  }
  if (!hasOutput) {
    args.push('--output', 'json');
  }
  return args;
}

function findCli(options) {
  if (!options.preferLocal) {
    const probe = spawnSync('nm', ['--version'], { encoding: 'utf8' });
    if (!probe.error && probe.status === 0) {
      return { executable: 'nm', prefixArgs: [], source: 'global' };
    }
  }

  const localEntry = join(repoRoot, 'dist', 'main.mjs');
  if (existsSync(localEntry)) {
    return { executable: process.execPath, prefixArgs: [localEntry], source: 'local-dist' };
  }

  return null;
}

function parseStdout(stdout) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

const [, , toolName, rawParams = '{}', rawOptions = '{}'] = process.argv;
if (!toolName) {
  printJson({
    ok: false,
    error: 'Usage: node agent/tools/nm-tool-runner.mjs <toolName> <paramsJson> [optionsJson]',
  }, 2);
}

const params = parseJsonArg(rawParams, 'params');
const options = parseJsonArg(rawOptions, 'options');
const schemas = loadSchemas();
const schema = schemas.find(item => item.name === toolName);
if (!schema) {
  printJson({
    ok: false,
    tool: toolName,
    error: 'Unknown tool name',
  }, 2);
}

if ((schema.permission === 'write' || schema.permission === 'sensitive') && options.allowWrite !== true) {
  printJson({
    ok: false,
    tool: toolName,
    command: toolNameToCommand(toolName),
    permission: schema.permission,
    error: `Refusing to execute ${schema.permission} tool without options.allowWrite=true`,
  }, 3);
}

const command = toolNameToCommand(toolName);
if (!command) {
  printJson({
    ok: false,
    tool: toolName,
    error: 'Tool name must start with netease_',
  }, 2);
}

const cli = findCli(options);
if (!cli) {
  printJson({
    ok: false,
    tool: toolName,
    command,
    permission: schema.permission,
    error: 'Could not find global nm or local dist/main.mjs',
  }, 2);
}

const commandArgs = commandArgsFromParams(command, params);
const finalArgs = [...cli.prefixArgs, ...commandArgs];
const result = spawnSync(cli.executable, finalArgs, {
  cwd: repoRoot,
  encoding: 'utf8',
  shell: false,
});

printJson({
  ok: result.status === 0,
  tool: toolName,
  command,
  permission: schema.permission || null,
  capability: schema.capability || null,
  cliSource: cli.source,
  executable: cli.executable,
  args: commandArgs,
  exitCode: result.status,
  stdout: result.stdout || '',
  stderr: result.stderr || '',
  parsed: parseStdout(result.stdout || ''),
});
