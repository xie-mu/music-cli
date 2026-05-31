import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

function summarize(events: any[]) {
  const byType = new Map<string, number>();
  for (const event of events) {
    byType.set(event.type, (byType.get(event.type) || 0) + 1);
  }
  return {
    totalEvents: events.length,
    byType: Object.fromEntries([...byType.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
    recent: events.slice(-10),
  };
}

export const memoryShowCommand: Command = {
  name: 'memory show',
  description: 'Show local music memory summary',
  usage: 'nm memory show [--limit <n>]',
  permission: 'public',
  capability: 'memory.show',
  returns: 'MemorySummary',
  options: [{ flag: '--limit <n>', description: 'Recent event limit', type: 'number' }],
  examples: ['nm memory show', 'nm memory show --output json'],
  async run(config, flags) {
    const store = createNeteaseServices(config).store;
    const events = await store.readEvents({ limit: Number(flags.limit) || undefined });
    process.stdout.write(formatOutput(summarize(events), flags.output || config.output) + '\n');
  },
};

export const memoryExportCommand: Command = {
  name: 'memory export',
  description: 'Export local music memory events',
  usage: 'nm memory export [--type <eventType>]',
  permission: 'public',
  capability: 'memory.export',
  returns: 'LocalEvent[]',
  options: [{ flag: '--type <eventType>', description: 'Filter event type' }],
  examples: ['nm memory export --output json', 'nm memory export --type search'],
  async run(config, flags) {
    const store = createNeteaseServices(config).store;
    const events = await store.readEvents({ type: flags.type });
    process.stdout.write(formatOutput(events, flags.output || config.output) + '\n');
  },
};

export const memoryClearCommand: Command = {
  name: 'memory clear',
  description: 'Clear local music memory',
  usage: 'nm memory clear [--namespace <name>]',
  permission: 'sensitive',
  capability: 'memory.clear',
  returns: 'MemoryClearResult',
  options: [{ flag: '--namespace <name>', description: 'Clear one cache namespace instead of all memory' }],
  examples: ['nm memory clear', 'nm memory clear --namespace queue'],
  async run(config, flags) {
    const store = createNeteaseServices(config).store;
    if (flags.namespace) {
      await store.clearNamespace(String(flags.namespace));
      process.stdout.write(`Cleared namespace: ${flags.namespace}\n`);
      return;
    }
    await store.clearAll();
    process.stdout.write('Cleared local music memory\n');
  },
};
