import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { OutputFormat } from './types/core.js';

export interface NeteaseConfig {
  output: OutputFormat;
  timeout: number;
  quiet: boolean;
  verbose: boolean;
  dryRun: boolean;
  nonInteractive: boolean;
  noColor: boolean;
  cookieFile: string;
  cookie?: string;
  countryCode: string;
  player?: string;
  downloadDir: string;
  stateDir: string;
}

export function getConfigDir(): string {
  return join(homedir(), '.netease-music');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function getDefaultCookieFile(): string {
  return join(getConfigDir(), 'cookie.json');
}

export function readConfigFile(): Partial<NeteaseConfig> {
  const path = getConfigPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as Partial<NeteaseConfig>;
  } catch {
    return {};
  }
}

function toCamelCase(str: string): string {
  return str.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function readEnvVars(): Record<string, string> {
  const result: Record<string, string> = {};
  const prefix = 'NETEASE_';
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && value) {
      const camelKey = toCamelCase(key.slice(prefix.length));
      result[camelKey] = value;
    }
  }
  return result;
}

export function getDefaultConfig(): NeteaseConfig {
  return {
    output: 'text',
    timeout: 30,
    quiet: false,
    verbose: false,
    dryRun: false,
    nonInteractive: false,
    noColor: false,
    cookieFile: getDefaultCookieFile(),
    countryCode: '86',
    downloadDir: join(homedir(), 'netease-music-downloads'),
    stateDir: join(getConfigDir(), 'state'),
  };
}

export function mergeConfig(flags: Record<string, any>): NeteaseConfig {
  const defaults = getDefaultConfig();
  const fileConfig = readConfigFile();
  const envConfig = readEnvVars();

  // Normalize flag values
  const normalizedFlags: Record<string, any> = {};
  for (const [key, value] of Object.entries(flags)) {
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    normalizedFlags[camelKey] = value;
  }

  return { ...defaults, ...fileConfig, ...envConfig, ...normalizedFlags } as NeteaseConfig;
}

export function saveConfigFile(config: Partial<NeteaseConfig>): void {
  const dir = getConfigDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}
