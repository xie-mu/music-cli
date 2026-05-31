import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

export const libraryLikedCommand: Command = {
  name: 'library liked',
  description: 'List liked songs for the current or specified user',
  usage: 'nm library liked [--uid <id>]',
  permission: 'auth',
  capability: 'library.liked',
  returns: 'Song[]',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm library liked', 'nm library liked --uid 123456 --output json'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).library.liked(flags.uid ? Number(flags.uid) : undefined);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
