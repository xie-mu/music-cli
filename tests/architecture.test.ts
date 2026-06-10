import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function commandNamesFromSource(): string[] {
  const commandDir = join(process.cwd(), 'src', 'commands');
  const main = readFileSync(join(process.cwd(), 'src', 'main.ts'), 'utf-8');
  const files = [
    'auth.ts',
    'config.ts',
    'user.ts',
    'music.ts',
    'playlist.ts',
    'album.ts',
    'search.ts',
    'toplist.ts',
    'pipeline.ts',
    'memory.ts',
    'library.ts',
    'queue.ts',
    'insight.ts',
    'smtc.ts',
    'nowplaying.ts',
    'doctor.ts',
  ];
  const commandByExport = new Map<string, string>();

  for (const file of files) {
    const source = readFileSync(join(commandDir, file), 'utf-8');
    for (const match of source.matchAll(/export const (\w+):?[^=]*=\s*\{[\s\S]*?name:\s*'([^']+)'/g)) {
      commandByExport.set(match[1], match[2]);
    }
    for (const match of source.matchAll(/export const (\w+)\s*=\s*controlCommand\('([^']+)'/g)) {
      commandByExport.set(match[1], `smtc ${match[2]}`);
    }
  }

  return [...main.matchAll(/register\((\w+)\)/g)]
    .map(match => {
      const command = commandByExport.get(match[1]);
      if (!command) throw new Error(`Could not resolve registered command export: ${match[1]}`);
      return command;
    });
}

describe('domain normalizers', () => {
  it('normalizes NetEase song shapes into a stable Song model', async () => {
    const { normalizeSong } = await import('../src/domain/models.js');

    const song = normalizeSong({
      id: 186016,
      name: 'Sunny Day',
      dt: 269000,
      ar: [{ id: 6452, name: 'Jay Chou' }],
      al: { id: 18905, name: 'Ye Hui Mei', picUrl: 'cover.jpg' },
      fee: 0,
    });

    expect(song).toMatchObject({
      id: 186016,
      name: 'Sunny Day',
      durationMs: 269000,
      artists: [{ id: 6452, name: 'Jay Chou' }],
      album: { id: 18905, name: 'Ye Hui Mei', picUrl: 'cover.jpg' },
      fee: 0,
    });
    expect(song.raw.id).toBe(186016);
  });
});

describe('LocalStore', () => {
  it('stores events and cache entries under a configurable state directory', async () => {
    const { LocalStore } = await import('../src/state/local-store.js');
    const root = mkdtempSync(join(tmpdir(), 'nm-store-'));

    try {
      const store = new LocalStore(root);
      await store.appendEvent('search', { keyword: 'jazz' });
      await store.appendEvent('play', { songId: 186016 });
      await store.setCache('profile', 'summary', { topArtist: 'Jay Chou' });

      const events = await store.readEvents();
      const searchEvents = await store.readEvents({ type: 'search' });
      const cacheValue = await store.getCache('profile', 'summary');

      expect(events).toHaveLength(2);
      expect(searchEvents).toHaveLength(1);
      expect(cacheValue).toEqual({ topArtist: 'Jay Chou' });

      await store.clearNamespace('profile');
      expect(await store.getCache('profile', 'summary')).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('QueueService', () => {
  it('maintains a local playback queue without touching remote playback', async () => {
    const { LocalStore } = await import('../src/state/local-store.js');
    const { QueueService } = await import('../src/services/queue.js');
    const root = mkdtempSync(join(tmpdir(), 'nm-queue-'));

    try {
      const queue = new QueueService(new LocalStore(root));
      await queue.add({ id: 1, name: 'First' });
      await queue.add({ id: 2, name: 'Second' });
      const next = await queue.next();

      expect((await queue.list()).map(item => item.songId)).toEqual([1, 2]);
      expect(next?.songId).toBe(1);
      expect((await queue.getCurrent())?.songId).toBe(1);

      await queue.remove(1);
      expect((await queue.list()).map(item => item.songId)).toEqual([2]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe('PlaylistService', () => {
  it('creates playlists through structured encrypted API params', async () => {
    const { PlaylistService } = await import('../src/services/playlist.js');
    const calls: Array<{ path: string; params: Record<string, unknown> | undefined; method?: string }> = [];
    const api = {
      requestWeapi: async (path: string, params?: Record<string, unknown>, method?: string) => {
        calls.push({ path, params, method });
        return { code: 200, id: 123, playlist: { id: 123, name: params?.name } };
      },
    };
    const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
    const store = {
      appendEvent: async (type: string, payload: Record<string, unknown>) => {
        events.push({ type, payload });
      },
    };

    const result = await new PlaylistService(api as any, store as any).create('Write Test', 'Verification');

    expect(result.data.id).toBe(123);
    expect(calls).toEqual([
      {
        path: '/api/playlist/create',
        params: { name: 'Write Test', desc: 'Verification', privacy: 0, type: 'NORMAL' },
        method: undefined,
      },
    ]);
    expect(events).toEqual([{ type: 'playlist_create', payload: { name: 'Write Test' } }]);
  });

  it('rejects empty playlist mutation song id lists before calling the API', async () => {
    const { PlaylistService } = await import('../src/services/playlist.js');
    const api = { request: async () => { throw new Error('should not call API'); } };
    const service = new PlaylistService(api as any);

    await expect(service.add(123, [])).rejects.toMatchObject({
      code: 'USAGE',
      message: 'No valid song IDs were provided',
    });
    await expect(service.remove(123, [])).rejects.toMatchObject({
      code: 'USAGE',
      message: 'No valid song IDs were provided',
    });
  });
});

describe('playlist album import ordering', () => {
  it('submits album songs from last to first so NetEase prepends into playback order', async () => {
    const { albumSongsForPlaylistInsertion } = await import('../src/commands/playlist.js');

    const submittedSongIds = albumSongsForPlaylistInsertion([
      { id: 101 },
      { id: 102 },
      { id: 103 },
    ]);

    expect(submittedSongIds).toEqual([103, 102, 101]);
  });
});

describe('pipeline music builtins', () => {
  it('registers music/search executors that reuse service functions', async () => {
    const { PipelineEngine } = await import('../src/pipeline/executor.js');
    const { registerNeteasePipelineBuiltins } = await import('../src/pipeline/builtins.js');

    const engine = new PipelineEngine();
    registerNeteasePipelineBuiltins(engine, {
      music: {
        getInfo: async (ids: number[]) => ({ ok: true, source: 'fake', data: ids.map(id => ({ id, name: `song-${id}` })) }),
        getLyric: async (id: number) => ({ ok: true, source: 'fake', data: { songId: id, lrc: 'line' } }),
      },
      search: {
        search: async (keyword: string) => ({ ok: true, source: 'fake', data: [{ id: 7, name: keyword }] }),
      },
    } as any);

    const result = await engine.run({
      version: 'workflow/v1',
      steps: [
        { id: 'song', type: 'music/info', input: { id: 186016 } },
        { id: 'search', type: 'search', input: { keyword: { $from: 'song', path: '0.name' } } },
      ],
    }, {}, {
      output: 'json',
      timeout: 30,
      quiet: false,
      verbose: false,
      dryRun: false,
      nonInteractive: false,
      noColor: true,
      cookieFile: '',
      countryCode: '86',
      downloadDir: '',
      stateDir: '',
    });

    expect(result.status).toBe('succeeded');
    expect(result.steps[0].output).toEqual([{ id: 186016, name: 'song-186016' }]);
    expect(result.steps[1].output).toEqual([{ id: 7, name: 'song-186016' }]);
  });
});

describe('reference docs', () => {
  it('does not link to missing markdown files from the command index', () => {
    const indexPath = join(process.cwd(), 'docs', 'reference', 'index.md');
    const content = readFileSync(indexPath, 'utf-8');
    const links = [...content.matchAll(/\]\(([^)]+\.md)\)/g)].map(match => match[1]);
    const missing = links.filter(link => !existsSync(join(process.cwd(), 'docs', 'reference', link)));

    expect(missing).toEqual([]);
  });

  it('keeps the command reference index aligned with registered CLI commands', () => {
    const commands = commandNamesFromSource();
    const indexContent = readFileSync(join(process.cwd(), 'docs', 'reference', 'index.md'), 'utf-8');
    const documentedCommands = [...indexContent.matchAll(/\| `nm ([^`]+)` \|/g)].map(match => match[1]);

    expect(commands).toHaveLength(75);
    expect(documentedCommands).toHaveLength(75);
    expect([...documentedCommands].sort()).toEqual([...commands].sort());
  });

  it('documents command counts, auth boundaries, and schema export scope consistently', () => {
    const commands = commandNamesFromSource();
    const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf-8');
    const rootReadme = read('README.md');
    const architecture = read(join('docs', 'ARCHITECTURE.md'));
    const skill = read('SKILL.md');
    const authReference = read(join('docs', 'reference', 'auth.md'));
    const indexReference = read(join('docs', 'reference', 'index.md'));
    const configReference = read(join('docs', 'reference', 'config.md'));
    const configCommand = read(join('src', 'commands', 'config.ts'));

    expect(rootReadme).toContain('75');
    expect(rootReadme).not.toMatch(/73 (?:个命令|涓|commands?)/i);
    expect(architecture).toContain('Total: 75 registered commands across 17 top-level groups');
    expect(commands).toHaveLength(75);

    for (const doc of [skill, authReference, indexReference]) {
      expect(doc).toContain('import-album');
    }
    for (const doc of [authReference, indexReference]) {
      expect(doc).toContain('playlist show/play/tracks/summary');
      expect(doc).toContain('queue *');
      expect(doc).toContain('smtc *');
    }

    expect(configCommand).toContain("cmd.name !== 'config export-schema'");
    expect(configReference).toContain('excludes `config export-schema` itself');
    expect(commands.filter(command => command !== 'config export-schema')).toHaveLength(commands.length - 1);
  });
});
