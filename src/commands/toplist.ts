import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

export const toplistCommand: Command = {
  name: 'toplist',
  description: 'List all NetEase charts',
  usage: 'nm toplist',
  permission: 'public',
  capability: 'toplist.list',
  returns: 'Playlist[]',
  options: [],
  examples: ['nm toplist', 'nm toplist --output json'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).toplist.list();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const toplistDetailCommand: Command = {
  name: 'toplist detail',
  description: 'Get chart tracks',
  usage: 'nm toplist detail --id <toplistId>',
  permission: 'public',
  capability: 'toplist.detail',
  returns: 'Song[]',
  options: [{ flag: '--id <id>', description: 'Toplist playlist ID', required: true, type: 'number' }],
  examples: ['nm toplist detail --id 3778678'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).toplist.detail(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const recommendSongsCommand: Command = {
  name: 'recommend songs',
  description: 'Get daily recommended songs',
  usage: 'nm recommend songs',
  permission: 'auth',
  capability: 'recommend.songs',
  returns: 'Song[]',
  options: [],
  examples: ['nm recommend songs'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).recommend.songs();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const recommendPlaylistsCommand: Command = {
  name: 'recommend playlists',
  description: 'Get recommended playlists',
  usage: 'nm recommend playlists',
  permission: 'auth',
  capability: 'recommend.playlists',
  returns: 'Playlist[]',
  options: [],
  examples: ['nm recommend playlists'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).recommend.playlists();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
