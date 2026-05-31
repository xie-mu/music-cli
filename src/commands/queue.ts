import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

function shouldSkipOpening(flags: Record<string, any>): boolean {
  return flags.noOpen === true
    || flags.noOpen === 'true'
    || flags['no-open'] === true
    || flags['no-open'] === 'true';
}

export const queueAddCommand: Command = {
  name: 'queue add',
  description: 'Add a song to the local playback queue',
  usage: 'nm queue add --id <songId> [--name <name>]',
  permission: 'public',
  capability: 'queue.add',
  returns: 'QueueItem',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--name <name>', description: 'Song name hint' },
  ],
  examples: ['nm queue add --id 186016', 'nm queue add --id 186016 --name Sunny'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    let name = flags.name;
    let artist = '';
    if (!name) {
      const info = await services.music.getInfo([Number(flags.id)]);
      name = info.data[0]?.name || String(flags.id);
      artist = info.data[0]?.artists.map(a => a.name).join(', ') || '';
    }
    const item = await services.queue.add({ id: Number(flags.id), name, artist });
    process.stdout.write(formatOutput(item, flags.output || config.output) + '\n');
  },
};

export const queueListCommand: Command = {
  name: 'queue list',
  description: 'List the local playback queue',
  usage: 'nm queue list',
  permission: 'public',
  capability: 'queue.list',
  returns: 'QueueItem[]',
  options: [],
  examples: ['nm queue list', 'nm queue list --output json'],
  async run(config, flags) {
    const items = await createNeteaseServices(config).queue.list();
    process.stdout.write(formatOutput(items, flags.output || config.output) + '\n');
  },
};

export const queueRemoveCommand: Command = {
  name: 'queue remove',
  description: 'Remove an item from the local queue by 1-based index',
  usage: 'nm queue remove --index <n>',
  permission: 'public',
  capability: 'queue.remove',
  returns: 'QueueItem|null',
  options: [{ flag: '--index <n>', description: '1-based queue index', required: true, type: 'number' }],
  examples: ['nm queue remove --index 1'],
  async run(config, flags) {
    const removed = await createNeteaseServices(config).queue.remove(Number(flags.index));
    process.stdout.write(formatOutput(removed || { removed: false }, flags.output || config.output) + '\n');
  },
};

export const queueClearCommand: Command = {
  name: 'queue clear',
  description: 'Clear the local playback queue',
  usage: 'nm queue clear',
  permission: 'public',
  capability: 'queue.clear',
  returns: 'QueueClearResult',
  options: [],
  examples: ['nm queue clear'],
  async run(config) {
    await createNeteaseServices(config).queue.clear();
    process.stdout.write('Queue cleared\n');
  },
};

export const queueNextCommand: Command = {
  name: 'queue next',
  description: 'Advance to the next local queue item',
  usage: 'nm queue next',
  permission: 'public',
  capability: 'queue.next',
  returns: 'QueueItem|null',
  options: [],
  examples: ['nm queue next'],
  async run(config, flags) {
    const item = await createNeteaseServices(config).queue.next();
    process.stdout.write(formatOutput(item || { empty: true }, flags.output || config.output) + '\n');
  },
};

export const queuePlayCommand: Command = {
  name: 'queue play',
  description: 'Open the current or next queue item in the official web player',
  usage: 'nm queue play [--no-open]',
  permission: 'public',
  capability: 'queue.play',
  returns: 'PlayerResult',
  options: [
    { flag: '--no-open', description: 'Do not open browser; only return the official song URL', type: 'boolean' },
  ],
  examples: ['nm queue play', 'nm queue play --no-open --output json'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const item = await services.queue.getCurrent() || await services.queue.next();
    if (!item) {
      process.stdout.write('Queue is empty\n');
      return;
    }
    const { playSong } = await import('../player.js');
    const result = await playSong(item.songId, item.name, { open: !shouldSkipOpening(flags) });
    await services.store.appendEvent('queue_play', { songId: item.songId, name: item.name });
    if ((flags.output || config.output) === 'json') {
      process.stdout.write(formatOutput(result, 'json') + '\n');
      return;
    }
    process.stdout.write(result.message + '\n');
  },
};
