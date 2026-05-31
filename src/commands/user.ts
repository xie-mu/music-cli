import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

export const userProfileCommand: Command = {
  name: 'user profile',
  description: 'Get user profile',
  usage: 'nm user profile [--uid <id>]',
  permission: 'auth',
  capability: 'user.profile',
  returns: 'UserProfile',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm user profile', 'nm user profile --uid 123456'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).user.profile(flags.uid ? Number(flags.uid) : undefined);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const userAccountCommand: Command = {
  name: 'user account',
  description: 'Get current account info',
  usage: 'nm user account',
  permission: 'auth',
  capability: 'user.account',
  returns: 'Account',
  options: [],
  examples: ['nm user account'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).user.account();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const userHistoryCommand: Command = {
  name: 'user history',
  description: 'Get listening records',
  usage: 'nm user history [--uid <id>] [--type all|week]',
  permission: 'auth',
  capability: 'user.history',
  returns: 'PlayRecord[]',
  options: [
    { flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' },
    { flag: '--type <type>', description: 'all or week', default: 'all' },
  ],
  examples: ['nm user history', 'nm user history --type week', 'nm user history --uid 123456'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).user.history(
      flags.uid ? Number(flags.uid) : undefined,
      flags.type === 'week' ? 'week' : 'all'
    );
    process.stdout.write(formatOutput(result.data.map(record => record.song), flags.output || config.output) + '\n');
    if ((flags.output || config.output) !== 'json') process.stdout.write(`Total: ${result.data.length}\n`);
  },
};

export const userLevelCommand: Command = {
  name: 'user level',
  description: 'Get user level',
  usage: 'nm user level',
  permission: 'auth',
  capability: 'user.level',
  returns: 'UserLevel',
  options: [],
  examples: ['nm user level'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).user.level();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const userSubcountCommand: Command = {
  name: 'user subcount',
  description: 'Get subscription counts',
  usage: 'nm user subcount',
  permission: 'auth',
  capability: 'user.subcount',
  returns: 'UserSubcount',
  options: [],
  examples: ['nm user subcount'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).user.subcount();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
