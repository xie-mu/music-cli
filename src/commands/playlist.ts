import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

function parseIds(value: unknown): number[] {
  return String(value || '')
    .split(',')
    .map(id => Number(id.trim()))
    .filter(id => Number.isFinite(id) && id > 0);
}

function flagValue(flags: Record<string, any>, camel: string, kebab: string): unknown {
  return flags[camel] ?? flags[kebab];
}

function shouldSkipOpening(flags: Record<string, any>): boolean {
  return flags.noOpen === true
    || flags.noOpen === 'true'
    || flags['no-open'] === true
    || flags['no-open'] === 'true';
}

export function albumSongsForPlaylistInsertion(songs: Array<{ id: number }>): number[] {
  return songs
    .map(song => Number(song.id))
    .filter(id => Number.isFinite(id) && id > 0)
    .reverse();
}

export const playlistShowCommand: Command = {
  name: 'playlist show',
  description: 'View playlist details',
  usage: 'nm playlist show --id <playlistId>',
  permission: 'public',
  capability: 'playlist.show',
  returns: 'Playlist',
  options: [{ flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' }],
  examples: ['nm playlist show --id 3778678', 'nm playlist show --id 3778678 --output json'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.show(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistPlayCommand: Command = {
  name: 'playlist play',
  description: 'Play a playlist in the NetEase desktop client',
  usage: 'nm playlist play --id <playlistId> [--player orpheus|browser] [--no-open]',
  permission: 'public',
  capability: 'playlist.play',
  returns: 'PlayerResult',
  options: [
    { flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' },
    { flag: '--player <name>', description: 'Playback target: orpheus or browser' },
    { flag: '--no-open', description: 'Do not open player; only return the playlist URL', type: 'boolean' },
  ],
  examples: [
    'nm playlist play --id 3778678',
    'nm playlist play --id 3778678 --player orpheus --output json',
    'nm playlist play --id 3778678 --no-open --output json',
  ],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const playlistId = Number(flags.id);
    let title: string | undefined;
    try {
      const info = await services.playlist.show(playlistId);
      title = info.data.name;
    } catch {
      // Playlist playback only needs the id; metadata lookup is best-effort.
    }
    const { playPlaylist } = await import('../player.js');
    const result = await playPlaylist(playlistId, title, {
      open: !shouldSkipOpening(flags),
      player: flags.player ? String(flags.player) : undefined,
    });

    if ((flags.output || config.output) === 'json') {
      process.stdout.write(formatOutput(result, 'json') + '\n');
      return;
    }
    process.stdout.write(result.message + '\n');
  },
};

export const playlistTracksCommand: Command = {
  name: 'playlist tracks',
  description: 'List playlist songs',
  usage: 'nm playlist tracks --id <playlistId> [--page <n>] [--page-size <n>] [--all]',
  permission: 'public',
  capability: 'playlist.tracks',
  returns: 'Song[]',
  options: [
    { flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' },
    { flag: '--page <n>', description: 'Page number (default: 1)', type: 'number', default: '1' },
    { flag: '--page-size <n>', description: 'Results per page (default: 50)', type: 'number', default: '50' },
    { flag: '--all', description: 'Show ALL tracks (overrides --page)' },
  ],
  examples: [
    'nm playlist tracks --id 3778678',
    'nm playlist tracks --id 316153443 --page 2',
    'nm playlist tracks --id 316153443 --all',
  ],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.tracks(Number(flags.id));
    const tracks = result.data || [];
    const total = tracks.length;

    if (flags.all) {
      // Show all tracks
      process.stdout.write(formatOutput(tracks, flags.output || config.output) + '\n');
      return;
    }

    // Pagination
    const pageSize = Math.max(1, Number(flags.pageSize) || 50);
    const page = Math.max(1, Number(flags.page) || 1);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const pageTracks = tracks.slice(start, end);

    if ((flags.output || config.output) === 'json') {
      process.stdout.write(JSON.stringify({
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        tracks: pageTracks,
      }, null, 2) + '\n');
      return;
    }

    // Text table display
    const maxNameLen = 50;
    process.stdout.write(`\n📋 Total: ${total} songs  |  Page ${page}/${Math.ceil(total / pageSize)} (${pageSize} per page)\n`);
    process.stdout.write('\n');
    process.stdout.write('  #    Song' + ' '.repeat(Math.max(1, maxNameLen - 4)) + 'Artist                  Duration\n');
    process.stdout.write('  ' + '-'.repeat(12 + maxNameLen) + '\n');

    pageTracks.forEach((s: any, i: number) => {
      const idx = start + i + 1;
      const name = (s.name || '').length > maxNameLen ? (s.name || '').substring(0, maxNameLen - 3) + '...' : (s.name || '');
      const artist = (s.artists?.[0]?.name || '').padEnd(22);
      const min = Math.floor((s.durationMs || 0) / 1000 / 60);
      const sec = String(Math.floor((s.durationMs || 0) / 1000 % 60)).padStart(2, '0');
      process.stdout.write(`  ${String(idx).padStart(4)}. ${name.padEnd(maxNameLen)} ${artist} ${min}:${sec}\n`);
    });

    process.stdout.write('\n');
    if (page < Math.ceil(total / pageSize)) {
      process.stdout.write(`  Tip: nm playlist tracks --id ${flags.id} --page ${page + 1}  (next page)\n`);
    }
    if (page > 1) {
      process.stdout.write(`  Tip: nm playlist tracks --id ${flags.id} --page ${page - 1}  (prev page)\n`);
    }
    if (total > pageSize) {
      process.stdout.write(`  Tip: nm playlist tracks --id ${flags.id} --all  (show all ${total} songs)\n`);
    }
  },
};

export const playlistListCommand: Command = {
  name: 'playlist list',
  description: 'List user playlists',
  usage: 'nm playlist list [--uid <id>]',
  permission: 'auth',
  capability: 'playlist.list',
  returns: 'Playlist[]',
  options: [{ flag: '--uid <id>', description: 'User ID; defaults to current user', type: 'number' }],
  examples: ['nm playlist list', 'nm playlist list --uid 123456'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.list(flags.uid ? Number(flags.uid) : undefined);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistSummaryCommand: Command = {
  name: 'playlist summary',
  description: 'Analyze playlist data',
  usage: 'nm playlist summary --id <playlistId>',
  permission: 'public',
  capability: 'playlist.summary',
  returns: 'PlaylistSummary',
  options: [{ flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' }],
  examples: ['nm playlist summary --id 3778678', 'nm playlist summary --id 3778678 --output json'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.summary(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistCreateCommand: Command = {
  name: 'playlist create',
  description: 'Create a playlist',
  usage: 'nm playlist create --name <name> [--desc <text>]',
  permission: 'write',
  capability: 'playlist.create',
  returns: 'PlaylistCreateResult',
  options: [
    { flag: '--name <name>', description: 'Playlist name', required: true },
    { flag: '--desc <text>', description: 'Playlist description' },
  ],
  examples: ['nm playlist create --name "My Favorites"'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.create(String(flags.name), String(flags.desc || ''));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistAddCommand: Command = {
  name: 'playlist add',
  description: 'Add songs to a playlist',
  usage: 'nm playlist add --id <playlistId> --song-ids <id1,id2>',
  permission: 'write',
  capability: 'playlist.add',
  returns: 'PlaylistMutationResult',
  options: [
    { flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' },
    { flag: '--song-ids <ids>', description: 'Comma-separated song IDs', required: true },
  ],
  examples: ['nm playlist add --id 123 --song-ids 186016,1807799505'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.add(Number(flags.id), parseIds(flagValue(flags, 'songIds', 'song-ids')));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistImportAlbumCommand: Command = {
  name: 'playlist import-album',
  description: 'Import album songs into a playlist in playback order',
  usage: 'nm playlist import-album --id <playlistId> --album-id <albumId>',
  permission: 'write',
  capability: 'playlist.importAlbum',
  returns: 'PlaylistAlbumImportResult',
  options: [
    { flag: '--id <id>', description: 'Target playlist ID', required: true, type: 'number' },
    { flag: '--album-id <id>', description: 'Source album ID', required: true, type: 'number' },
  ],
  examples: [
    'nm playlist import-album --id 123 --album-id 92895788',
    'nm playlist import-album --id 123 --album-id 92895788 --dry-run --output json',
  ],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const playlistId = Number(flags.id);
    const albumId = Number(flagValue(flags, 'albumId', 'album-id'));
    const album = await services.album.show(albumId);
    const albumSongIds = album.data.songs.map(song => song.id);
    const submittedSongIds = albumSongsForPlaylistInsertion(album.data.songs);

    if (config.dryRun) {
      process.stdout.write(formatOutput({
        playlistId,
        albumId,
        albumName: album.data.name,
        songIds: albumSongIds,
        submittedSongIds,
        addedCount: submittedSongIds.length,
        applied: false,
        order: 'last-to-first',
      }, flags.output || config.output) + '\n');
      return;
    }

    const results = [];
    for (const songId of submittedSongIds) {
      const result = await services.playlist.add(playlistId, [songId]);
      results.push(result.data);
    }

    process.stdout.write(formatOutput({
      playlistId,
      albumId,
      albumName: album.data.name,
      songIds: albumSongIds,
      submittedSongIds,
      addedCount: submittedSongIds.length,
      applied: true,
      order: 'last-to-first',
      results,
    }, flags.output || config.output) + '\n');
  },
};

export const playlistRemoveCommand: Command = {
  name: 'playlist remove',
  description: 'Remove songs from a playlist',
  usage: 'nm playlist remove --id <playlistId> --song-ids <id1,id2>',
  permission: 'write',
  capability: 'playlist.remove',
  returns: 'PlaylistMutationResult',
  options: [
    { flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' },
    { flag: '--song-ids <ids>', description: 'Comma-separated song IDs', required: true },
  ],
  examples: ['nm playlist remove --id 123 --song-ids 186016'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.remove(Number(flags.id), parseIds(flagValue(flags, 'songIds', 'song-ids')));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistDedupeCommand: Command = {
  name: 'playlist dedupe',
  description: 'Find or remove duplicate songs in a playlist',
  usage: 'nm playlist dedupe --id <playlistId> [--apply]',
  permission: 'write',
  capability: 'playlist.dedupe',
  returns: 'PlaylistDedupeResult',
  options: [
    { flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' },
    { flag: '--apply', description: 'Remove duplicates remotely' },
  ],
  examples: ['nm playlist dedupe --id 123', 'nm playlist dedupe --id 123 --apply'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.dedupe(Number(flags.id), Boolean(flags.apply));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistMergeCommand: Command = {
  name: 'playlist merge',
  description: 'Merge source playlists into a target playlist',
  usage: 'nm playlist merge --source-ids <id1,id2> [--target-id <id>] [--apply]',
  permission: 'write',
  capability: 'playlist.merge',
  returns: 'PlaylistMergeResult',
  options: [
    { flag: '--source-ids <ids>', description: 'Comma-separated source playlist IDs', required: true },
    { flag: '--target-id <id>', description: 'Target playlist ID', type: 'number' },
    { flag: '--apply', description: 'Add merged songs to target playlist' },
  ],
  examples: ['nm playlist merge --source-ids 1,2', 'nm playlist merge --source-ids 1,2 --target-id 3 --apply'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.merge(
      parseIds(flagValue(flags, 'sourceIds', 'source-ids')),
      flagValue(flags, 'targetId', 'target-id') ? Number(flagValue(flags, 'targetId', 'target-id')) : undefined,
      Boolean(flags.apply)
    );
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistExportCommand: Command = {
  name: 'playlist export',
  description: 'Export playlist tracks as JSON/Markdown/text',
  usage: 'nm playlist export --id <playlistId> [--output json|markdown|text]',
  permission: 'public',
  capability: 'playlist.export',
  returns: 'Song[]',
  options: [{ flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' }],
  examples: ['nm playlist export --id 3778678 --output markdown'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.tracks(Number(flags.id));
    if ((flags.output || config.output) === 'markdown') {
      process.stdout.write(result.data.map((song, index) => `${index + 1}. ${song.name} - ${song.artists.map(a => a.name).join(', ')}`).join('\n') + '\n');
      return;
    }
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const playlistAuditCommand: Command = {
  name: 'playlist audit',
  description: 'Audit playlist quality and duplicates',
  usage: 'nm playlist audit --id <playlistId>',
  permission: 'public',
  capability: 'playlist.audit',
  returns: 'PlaylistAudit',
  options: [{ flag: '--id <id>', description: 'Playlist ID', required: true, type: 'number' }],
  examples: ['nm playlist audit --id 3778678'],
  async run(config, flags) {
    const result = await createNeteaseServices(config).playlist.audit(Number(flags.id));
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};
