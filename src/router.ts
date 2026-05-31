import { Command } from './types/core.js';
import { NeteaseError } from './error.js';

// Singleton router instance for global access
let _globalRouter: CommandRouter | null = null;

class TrieNode {
  children = new Map<string, TrieNode>();
  command?: Command;
}

export class CommandRouter {
  private root = new TrieNode();
  private flatCatalog = new Map<string, Command>();

  register(path: string[], command: Command): void {
    this.flatCatalog.set(command.name, command);
    let node = this.root;
    for (const segment of path) {
      if (!node.children.has(segment)) {
        node.children.set(segment, new TrieNode());
      }
      node = node.children.get(segment)!;
    }
    if (node.command) {
      throw new NeteaseError('USAGE', `Duplicate command registration: ${command.name}`);
    }
    node.command = command;
  }

  resolve(path: string[]): { command: Command; extra: string[] } {
    let node = this.root;
    const matched: string[] = [];
    for (const segment of path) {
      if (!node.children.has(segment)) break;
      node = node.children.get(segment)!;
      matched.push(segment);
    }
    if (node.command) {
      return { command: node.command, extra: path.slice(matched.length) };
    }
    // Auto-complete: if only one child and it has a command
    if (matched.length > 0 && node.children.size === 1) {
      const onlyChild = node.children.values().next().value;
      if (onlyChild?.command) {
        return { command: onlyChild.command, extra: path.slice(matched.length) };
      }
    }
    // Group path: show available sub-commands
    if (matched.length > 0 && !node.command && node.children.size > 0) {
      const subCommands = Array.from(node.children.entries())
        .map(([k, v]) => {
          if (v.command) return `  ${matched.join(' ')} ${k}`;
          const deeper = Array.from(v.children.keys());
          return `  ${matched.join(' ')} ${k} [${deeper.join(', ')}]`;
        })
        .join('\n');
      throw new NeteaseError(
        'USAGE',
        `Unknown command: nm ${path.join(' ')}`,
        `Available sub-commands:\n${subCommands}`
      );
    }
    throw new NeteaseError(
      'USAGE',
      `Unknown command: nm ${path.join(' ')}`,
      'Run: nm --help for available commands'
    );
  }

  isGroupPath(paths: string[]): boolean {
    let node = this.root;
    for (const segment of paths) {
      if (!node.children.has(segment)) return false;
      node = node.children.get(segment)!;
    }
    return !node.command && node.children.size > 0;
  }

  getAllCommands(): Command[] {
    return Array.from(this.flatCatalog.values());
  }

  getCommand(name: string): Command | undefined {
    return this.flatCatalog.get(name);
  }
}

/** Get or create the global router singleton */
export function getCommandRouter(): CommandRouter {
  if (!_globalRouter) {
    _globalRouter = new CommandRouter();
  }
  return _globalRouter;
}

/** Register a command on the global router */
export function register(cmd: Command): void {
  const router = getCommandRouter();
  router.register(cmd.name.split(' '), cmd);
}

/** Get all registered commands convenience */
export function getAllCommands(): Command[] {
  return getCommandRouter().getAllCommands();
}
