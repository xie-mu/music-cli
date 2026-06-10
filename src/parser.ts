import { OptionDef } from './types/core.js';

export interface ParsedArgs {
  [key: string]: any;
  _positional: string[];
}

export function parseArgs(argv: string[], _options?: OptionDef[]): ParsedArgs {
  const result: ParsedArgs = { _positional: [] };
  let i = 0;

  function assignFlag(key: string, value: string): void {
    if (key in result) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      result[key].push(value);
    } else {
      result[key] = value;
    }

    if (!key.includes('-')) return;
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (camelKey !== key) {
      result[camelKey] = result[key];
    }
  }

  while (i < argv.length) {
    const arg = argv[i];

    // -- terminator: rest are positional
    if (arg === '--') {
      i++;
      while (i < argv.length) {
        result._positional.push(argv[i]);
        i++;
      }
      break;
    }

    // Long flag: --flag=value or --flag value or --flag
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      let key: string;
      let value: string | undefined;

      if (eqIdx >= 0) {
        key = arg.slice(2, eqIdx);
        value = arg.slice(eqIdx + 1);
      } else {
        key = arg.slice(2);
        // Next arg is value if it doesn't start with --
        if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          value = argv[++i];
        } else {
          value = 'true'; // boolean flag
        }
      }

      // Handle repeated flags → array
      assignFlag(key, value);
    }
    // Short flag: -f value (basic support)
    else if (arg.startsWith('-') && arg.length > 1 && !arg.startsWith('--')) {
      const key = arg.slice(1);
      if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        result[key] = argv[++i];
      } else {
        result[key] = 'true';
      }
    }
    // Positional argument
    else {
      result._positional.push(arg);
    }

    i++;
  }

  return result;
}

/** Convert camelCase args back to kebab-case flags for CLI execution */
export function convertToFlags(args: Record<string, any>): string[] {
  const flags: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (key === '_positional') continue;
    const flagName = key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`);
    if (Array.isArray(value)) {
      for (const v of value) {
        flags.push(`--${flagName}`, String(v));
      }
    } else if (value !== undefined && value !== null) {
      flags.push(`--${flagName}`, String(value));
    }
  }
  return flags;
}
