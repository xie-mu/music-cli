import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';
import { SearchType } from '../services/search.js';

export const searchCommand: Command = {
  name: 'search',
  description: 'Search NetEase Cloud Music',
  usage: 'nm search --keyword <text> [--type song|playlist|album|artist]',
  permission: 'public',
  capability: 'search',
  returns: 'Song[]|Artist[]|Album[]|Playlist[]',
  options: [
    { flag: '--keyword <text>', description: 'Search keyword', required: true },
    { flag: '--type <type>', description: 'Type: song, playlist, album, artist', default: 'song' },
    { flag: '--limit <n>', description: 'Results per page', type: 'number', default: '20' },
  ],
  examples: ['nm search --keyword sunny', 'nm search --keyword "Jay Chou" --type artist'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.search.search(
      String(flags.keyword),
      (flags.type || 'song') as SearchType,
      Number(flags.limit) || 20
    );
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const searchHotCommand: Command = {
  name: 'search hot',
  description: 'Get hot search terms',
  usage: 'nm search hot',
  permission: 'public',
  capability: 'search.hot',
  returns: 'HotSearchTerm[]',
  options: [],
  examples: ['nm search hot'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.search.hot();
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const searchSuggestCommand: Command = {
  name: 'search suggest',
  description: 'Get search suggestions',
  usage: 'nm search suggest --keyword <text>',
  permission: 'public',
  capability: 'search.suggest',
  returns: 'SearchSuggestion[]',
  options: [{ flag: '--keyword <text>', description: 'Search keyword', required: true }],
  examples: ['nm search suggest --keyword sunny'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.search.suggest(String(flags.keyword));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
