import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { buildListeningInsight, createNeteaseServices, formatInsightMarkdown } from '../services/index.js';

async function runInsight(config: any, flags: Record<string, any>, label: string, historyType: 'all' | 'week') {
  const services = createNeteaseServices(config);
  const result = await services.user.history(flags.uid ? Number(flags.uid) : undefined, historyType);
  const insight = buildListeningInsight(label, result.data);
  if ((flags.output || config.output) === 'markdown') {
    process.stdout.write(formatInsightMarkdown(insight) + '\n');
    return;
  }
  process.stdout.write(formatOutput(insight, flags.output || config.output) + '\n');
}

export const insightWeeklyCommand: Command = {
  name: 'insight weekly',
  description: 'Generate weekly listening insight',
  usage: 'nm insight weekly [--uid <id>]',
  permission: 'auth',
  capability: 'insight.weekly',
  returns: 'ListeningInsight',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm insight weekly', 'nm insight weekly --output markdown'],
  async run(config, flags) {
    await runInsight(config, flags, 'weekly', 'week');
  },
};

export const insightMonthlyCommand: Command = {
  name: 'insight monthly',
  description: 'Generate monthly-style listening insight from available history',
  usage: 'nm insight monthly [--uid <id>]',
  permission: 'auth',
  capability: 'insight.monthly',
  returns: 'ListeningInsight',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm insight monthly --output json'],
  async run(config, flags) {
    await runInsight(config, flags, 'monthly', 'all');
  },
};

export const insightYearlyCommand: Command = {
  name: 'insight yearly',
  description: 'Generate yearly-style listening insight from available history',
  usage: 'nm insight yearly [--uid <id>]',
  permission: 'auth',
  capability: 'insight.yearly',
  returns: 'ListeningInsight',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm insight yearly --output markdown'],
  async run(config, flags) {
    await runInsight(config, flags, 'yearly', 'all');
  },
};
