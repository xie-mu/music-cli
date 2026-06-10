#!/usr/bin/env node

import { getCommandRouter, register, getAllCommands } from './router.js';
import { parseArgs } from './parser.js';
import { mergeConfig, NeteaseConfig, getDefaultConfig, readConfigFile, readEnvVars } from './config.js';
import { handleError } from './error.js';

// ── Import all commands ──────────────────────────────────────
import { authLoginCommand, authStatusCommand, authLogoutCommand } from './commands/auth.js';
import { configShowCommand, configSetCommand, configExportSchemaCommand } from './commands/config.js';
import { userProfileCommand, userAccountCommand, userHistoryCommand, userLevelCommand, userSubcountCommand } from './commands/user.js';
import {
  musicInfoCommand, musicUrlCommand, musicLyricCommand,
  musicDownloadCommand, musicPlayCommand, musicLikeCommand, musicUnlikeCommand,
} from './commands/music.js';
import {
  playlistShowCommand, playlistTracksCommand, playlistListCommand,
  playlistPlayCommand, playlistSummaryCommand, playlistCreateCommand, playlistAddCommand,
  playlistImportAlbumCommand, playlistRemoveCommand, playlistDedupeCommand, playlistMergeCommand,
  playlistExportCommand, playlistAuditCommand,
} from './commands/playlist.js';
import {
  albumShowCommand, albumListCommand, albumSubCommand, albumUnsubCommand,
  albumDynamicCommand, albumSummaryCommand,
} from './commands/album.js';
import { searchCommand, searchHotCommand, searchSuggestCommand } from './commands/search.js';
import { toplistCommand, toplistDetailCommand, recommendSongsCommand, recommendPlaylistsCommand } from './commands/toplist.js';
import { pipelineValidateCommand, pipelineRunCommand } from './commands/pipeline.js';
import { nowplayingCommand } from './commands/nowplaying.js';
import {
  smtcStatusCommand, smtcSessionsCommand, smtcPlayCommand, smtcPauseCommand,
  smtcToggleCommand, smtcNextCommand, smtcPrevCommand, smtcStopCommand, smtcSeekCommand,
  smtcRateCommand, smtcShuffleCommand, smtcRepeatCommand, smtcFastForwardCommand, smtcRewindCommand,
} from './commands/smtc.js';
import { memoryShowCommand, memoryExportCommand, memoryClearCommand } from './commands/memory.js';
import { libraryLikedCommand } from './commands/library.js';
import {
  queueAddCommand, queueListCommand, queueRemoveCommand,
  queueClearCommand, queueNextCommand, queuePlayCommand,
} from './commands/queue.js';
import { insightWeeklyCommand, insightMonthlyCommand, insightYearlyCommand } from './commands/insight.js';
import { doctorCommand } from './commands/doctor.js';

// ── Version ──────────────────────────────────────────────────
const VERSION = '1.2.0';

// ── Register commands ────────────────────────────────────────
const router = getCommandRouter();

// auth
register(authLoginCommand);
register(authStatusCommand);
register(authLogoutCommand);

// config
register(configShowCommand);
register(configSetCommand);
register(configExportSchemaCommand);

// user
register(userProfileCommand);
register(userAccountCommand);
register(userHistoryCommand);
register(userLevelCommand);
register(userSubcountCommand);

// music
register(musicInfoCommand);
register(musicUrlCommand);
register(musicLyricCommand);
register(musicDownloadCommand);
register(musicPlayCommand);
register(musicLikeCommand);
register(musicUnlikeCommand);

// playlist
register(playlistShowCommand);
register(playlistPlayCommand);
register(playlistTracksCommand);
register(playlistListCommand);
register(playlistSummaryCommand);
register(playlistCreateCommand);
register(playlistAddCommand);
register(playlistImportAlbumCommand);
register(playlistRemoveCommand);
register(playlistDedupeCommand);
register(playlistMergeCommand);
register(playlistExportCommand);
register(playlistAuditCommand);

// album
register(albumShowCommand);
register(albumListCommand);
register(albumSubCommand);
register(albumUnsubCommand);
register(albumDynamicCommand);
register(albumSummaryCommand);

// search
register(searchCommand);
register(searchHotCommand);
register(searchSuggestCommand);

// toplist & recommend
register(toplistCommand);
register(toplistDetailCommand);
register(recommendSongsCommand);
register(recommendPlaylistsCommand);

// pipeline
register(pipelineValidateCommand);
register(pipelineRunCommand);

// memory and local assistant state
register(memoryShowCommand);
register(memoryExportCommand);
register(memoryClearCommand);

// library
register(libraryLikedCommand);

// queue
register(queueAddCommand);
register(queueListCommand);
register(queueRemoveCommand);
register(queueClearCommand);
register(queueNextCommand);
register(queuePlayCommand);

// insight
register(insightWeeklyCommand);
register(insightMonthlyCommand);
register(insightYearlyCommand);

// system
register(smtcStatusCommand);
register(smtcSessionsCommand);
register(smtcPlayCommand);
register(smtcPauseCommand);
register(smtcToggleCommand);
register(smtcNextCommand);
register(smtcPrevCommand);
register(smtcStopCommand);
register(smtcSeekCommand);
register(smtcRateCommand);
register(smtcShuffleCommand);
register(smtcRepeatCommand);
register(smtcFastForwardCommand);
register(smtcRewindCommand);
register(nowplayingCommand);
register(doctorCommand);

// ── Main ──────────────────────────────────────────────────────
async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  // ── Quick paths ────────────────────────────────────────────
  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`nm ${VERSION}\n`);
    return;
  }

  const hasHelpFlag = argv.includes('--help') || argv.includes('-h');
  if (argv.length === 0 || hasHelpFlag) {
    if (hasHelpFlag) {
      // Check if there's a command/group before --help
      const helpIdx = argv.indexOf('--help') !== -1 ? argv.indexOf('--help') : argv.indexOf('-h');
      const cmdParts = argv.slice(0, helpIdx).filter(a => !a.startsWith('-'));
      if (cmdParts.length > 0) {
        if (router.isGroupPath(cmdParts)) {
          printResourceHelp(cmdParts);
          return;
        }
        printHelp();
        return;
      }
    }
    printHelp();
    return;
  }

  // ── Parse args into positional + flags ──────────────────────
  const allOptions: any[] = [];
  router.getAllCommands().forEach(cmd => allOptions.push(...cmd.options));
  const parsed = parseArgs(argv, allOptions);
  const positional: string[] = parsed._positional || [];
  const flags: Record<string, any> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (k !== '_positional') flags[k] = v;
  }

  // ── Merge config (3-layer) ─────────────────────────────────
  const config = mergeConfig(flags);

  // Re-apply output flag from flags
  if (flags.output) config.output = flags.output as 'text' | 'json' | 'markdown';
  if (flags.quiet) config.quiet = true;
  if (flags.verbose) config.verbose = true;
  if (flags.dryRun) config.dryRun = true;
  if (flags.timeout) config.timeout = Number(flags.timeout);

  // ── Resource group check ──────────────────────────────────
  if (positional.length > 0 && router.isGroupPath(positional)) {
    printResourceHelp(positional);
    return;
  }

  // ── Resolve and execute command ────────────────────────────
  try {
    const { command, extra } = router.resolve(positional);
    const cmdFlags = { ...flags, _positional: extra };
    await command.run(config, cmdFlags);
  } catch (err) {
    handleError(err, config.output);
  }
}

// ── Help ────────────────────────────────────────────────────
function printHelp(): void {
  process.stdout.write(`nm v${VERSION} - NetEase Cloud Music AI Agent CLI\n\n`);
  process.stdout.write('Usage: nm <resource> <command> [flags]\n\n');
  process.stdout.write('Resources:\n');

  const all = router.getAllCommands();
  const groups = new Map<string, string[]>();
  for (const cmd of all) {
    const parts = cmd.name.split(' ');
    const group = parts[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(cmd.name);
  }

  process.stdout.write('\n');
  for (const [group, cmds] of groups) {
    process.stdout.write(`  ${group}\n`);
    for (const cmdName of cmds) {
      const cmd = router.getCommand(cmdName);
      const subCmd = cmdName.includes(' ') ? cmdName.split(' ').slice(1).join(' ') : '';
      const desc = cmd?.description || '';
      process.stdout.write(`    ${subCmd.padEnd(20)} ${desc}\n`);
    }
    process.stdout.write('\n');
  }

  process.stdout.write('Global Flags:\n');
  process.stdout.write('  --output <format>   Output format: text | json | markdown\n');
  process.stdout.write('  --quiet             Suppress non-essential output\n');
  process.stdout.write('  --verbose           Print HTTP request/response details\n');
  process.stdout.write('  --dry-run           Preview mode, no actual requests\n');
  process.stdout.write('  --timeout <sec>     Request timeout\n');
  process.stdout.write('  --help              Show help\n');
  process.stdout.write('  --version           Print version\n');
}

function printResourceHelp(groupPath: string[]): void {
  const all = router.getAllCommands();
  const prefix = groupPath.join(' ');
  process.stdout.write(`nm ${prefix} commands:\n\n`);
  let count = 0;
  for (const cmd of all) {
    if (cmd.name.startsWith(prefix + ' ') || cmd.name === prefix) {
      const subCmd = cmd.name.includes(' ') ? cmd.name.split(' ').slice(1).join(' ') : '';
      process.stdout.write(`  ${subCmd.padEnd(22)} ${cmd.description}\n`);
      if (cmd.usage) process.stdout.write(`    ${cmd.usage}\n`);
      count++;
    }
  }
  if (count === 0) {
    process.stdout.write('  (no sub-commands)\n');
  }
  process.stdout.write('\nGlobal flags: --output, --quiet, --verbose, --dry-run, --timeout, --help, --version\n');
}

// ── Entry ────────────────────────────────────────────────────
main().catch(err => {
  handleError(err, 'text');
});
