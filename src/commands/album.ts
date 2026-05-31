import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

export const albumShowCommand: Command = {
  name: 'album show',
  description: 'View album details and tracks',
  usage: 'nm album show --id <albumId>',
  permission: 'public',
  capability: 'album.show',
  returns: 'Album',
  options: [{ flag: '--id <id>', description: 'Album ID', required: true, type: 'number' }],
  examples: ['nm album show --id 32311', 'nm album show --id 32311 --output json'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.show(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const albumListCommand: Command = {
  name: 'album list',
  description: 'List subscribed albums',
  usage: 'nm album list',
  permission: 'auth',
  capability: 'album.list',
  returns: 'Album[]',
  options: [],
  examples: ['nm album list'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.list();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const albumSubCommand: Command = {
  name: 'album sub',
  description: 'Subscribe to an album',
  usage: 'nm album sub --id <albumId>',
  permission: 'write',
  capability: 'album.sub',
  returns: 'AlbumSubscriptionResult',
  options: [{ flag: '--id <id>', description: 'Album ID', required: true, type: 'number' }],
  examples: ['nm album sub --id 32311'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.sub(Number(flags.id), true);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const albumUnsubCommand: Command = {
  name: 'album unsub',
  description: 'Unsubscribe from an album',
  usage: 'nm album unsub --id <albumId>',
  permission: 'write',
  capability: 'album.unsub',
  returns: 'AlbumSubscriptionResult',
  options: [{ flag: '--id <id>', description: 'Album ID', required: true, type: 'number' }],
  examples: ['nm album unsub --id 32311'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.sub(Number(flags.id), false);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const albumDynamicCommand: Command = {
  name: 'album dynamic',
  description: 'View album dynamic stats',
  usage: 'nm album dynamic --id <albumId>',
  permission: 'public',
  capability: 'album.dynamic',
  returns: 'AlbumDynamic',
  options: [{ flag: '--id <id>', description: 'Album ID', required: true, type: 'number' }],
  examples: ['nm album dynamic --id 32311'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.dynamic(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const albumSummaryCommand: Command = {
  name: 'album summary',
  description: 'Summarize album data',
  usage: 'nm album summary --id <albumId>',
  permission: 'public',
  capability: 'album.summary',
  returns: 'AlbumSummary',
  options: [{ flag: '--id <id>', description: 'Album ID', required: true, type: 'number' }],
  examples: ['nm album summary --id 32311'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).album.summary(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
