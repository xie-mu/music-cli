import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

type CommandMetadata = {
  name: string;
  permission?: string;
};

function commandMetadataFromSource(): CommandMetadata[] {
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
  const commandByExport = new Map<string, CommandMetadata>();

  for (const file of files) {
    const source = readFileSync(join(commandDir, file), 'utf-8');
    for (const match of source.matchAll(/export const (\w+):?[^=]*=\s*\{[\s\S]*?name:\s*'([^']+)'([\s\S]*?)\n\};/g)) {
      const permission = match[3].match(/permission:\s*'([^']+)'/)?.[1];
      commandByExport.set(match[1], { name: match[2], permission });
    }
    for (const match of source.matchAll(/export const (\w+)\s*=\s*controlCommand\('([^']+)'/g)) {
      commandByExport.set(match[1], { name: `smtc ${match[2]}`, permission: 'public' });
    }
  }

  return [...main.matchAll(/register\((\w+)\)/g)]
    .map(match => {
      const command = commandByExport.get(match[1]);
      if (!command) throw new Error(`Could not resolve registered command export: ${match[1]}`);
      return command;
    });
}

function commandNamesFromSource(): string[] {
  return commandMetadataFromSource().map(command => command.name);
}

function commandFromInlineNmReference(reference: string, registeredCommands: Set<string>): string | null {
  if (/^<[^>]+>/.test(reference) || reference.includes('/') || reference.includes('*')) return null;

  const tokens = reference
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => !token.startsWith('--') && !token.startsWith('<') && !token.startsWith('['));

  while (tokens.length > 0) {
    const candidate = tokens.join(' ');
    if (registeredCommands.has(candidate)) return candidate;
    tokens.pop();
  }
  return null;
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
    const rootSkill = read('SKILL.md');
    const detailedSkill = read(join('agent', 'skill', 'SKILL.md'));
    const authReference = read(join('docs', 'reference', 'auth.md'));
    const indexReference = read(join('docs', 'reference', 'index.md'));
    const configReference = read(join('docs', 'reference', 'config.md'));
    const configCommand = read(join('src', 'commands', 'config.ts'));

    expect(rootReadme).toContain('75');
    expect(rootReadme).not.toMatch(/73 (?:个命令|涓|commands?)/i);
    expect(architecture).toContain('Total: 75 registered commands across 17 top-level groups');
    expect(commands).toHaveLength(75);

    expect(rootSkill).toContain('name: muge-music');
    expect(rootSkill).toContain('agent/skill/SKILL.md');
    expect(rootSkill).toContain('agent/tools/tool-manifest.json');
    expect(detailedSkill).toContain('display_name: muge music');

    for (const doc of [detailedSkill, authReference, indexReference]) {
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

  it('keeps the detailed muge music skill command routing aligned with registered commands and clean of drift markers', () => {
    const commands = new Set(commandNamesFromSource());
    const rootSkill = readFileSync(join(process.cwd(), 'SKILL.md'), 'utf-8');
    const skill = readFileSync(join(process.cwd(), 'agent', 'skill', 'SKILL.md'), 'utf-8');
    const inlineNmReferences = [...skill.matchAll(/`nm ([^`]+)`/g)].map(match => match[1]);
    const unresolved = inlineNmReferences
      .map(reference => ({ reference, command: commandFromInlineNmReference(reference, commands) }))
      .filter(({ reference, command }) => {
        if (command) return false;
        return ![
          '<resource> <command> [flags]',
          '<command> --help',
          'auth *',
          'config *',
          'search *',
          'toplist *',
          'pipeline *',
          'queue *',
          'smtc *',
          'memory show/export/clear',
          'queue add/list/play/next',
          'playlist list/create/add/import-album/remove/dedupe/merge',
          'playlist show/play/tracks/summary/export/audit',
        ].includes(reference);
      })
      .map(({ reference }) => reference);

    const capabilityRows = skill
      .split('\n')
      .filter(line => line.startsWith('|') && line.includes('`nm '));
    const rowCommands = capabilityRows
      .map(line => line.match(/`nm ([^`]+)`/)?.[1])
      .filter(Boolean);
    const duplicatedRows = rowCommands.filter((command, index) => rowCommands.indexOf(command) !== index);

    expect(unresolved).toEqual([]);
    expect(duplicatedRows).toEqual([]);
    expect(rootSkill).not.toMatch(/73 (?:registered commands|commands|个命令)/i);
    expect(rootSkill).not.toMatch(/鈥|馃|鉁|鈿|狅|笍|涓|鎵|绔|→/);
    expect(skill).not.toMatch(/73 (?:registered commands|commands|个命令)/i);
    expect(skill).not.toMatch(/鈥|馃|鉁|鈿|狅|笍|涓|鎵|绔|→/);
    expect(skill).toContain('full `muge music` routing guide');
    expect(skill).toContain('`nm playlist play`');
    expect(skill).toContain('`nm playlist import-album`');
    expect(skill).toContain('`nm queue *`');
    expect(skill).toContain('`nm smtc *`');
    expect(skill).toContain('`nm config export-schema`');
  });

  it('keeps auth boundary summaries aligned with command permission metadata', () => {
    const metadata = commandMetadataFromSource();
    const publicCommands = metadata.filter(command => command.permission === 'public').map(command => command.name);
    const writeCommands = metadata.filter(command => command.permission === 'write').map(command => command.name);
    const authCommands = metadata.filter(command => command.permission === 'auth').map(command => command.name);
    const sensitiveCommands = metadata.filter(command => command.permission === 'sensitive').map(command => command.name);

    expect(publicCommands).toEqual(expect.arrayContaining([
      'music play',
      'music download',
      'playlist play',
      'playlist export',
      'playlist audit',
      'album dynamic',
      'album summary',
      'queue play',
      'smtc status',
    ]));
    expect(writeCommands).toEqual(expect.arrayContaining([
      'music like',
      'music unlike',
      'playlist create',
      'playlist add',
      'playlist import-album',
      'playlist remove',
      'album sub',
      'album unsub',
    ]));
    expect(authCommands).toEqual(expect.arrayContaining([
      'user profile',
      'recommend songs',
      'playlist list',
      'library liked',
      'insight weekly',
    ]));
    expect(sensitiveCommands).toEqual(['memory clear']);

    const docs = [
      readFileSync(join(process.cwd(), 'agent', 'skill', 'SKILL.md'), 'utf-8'),
      readFileSync(join(process.cwd(), 'docs', 'reference', 'auth.md'), 'utf-8'),
      readFileSync(join(process.cwd(), 'docs', 'reference', 'index.md'), 'utf-8'),
    ];

    for (const doc of docs) {
      expect(doc).toContain('music info/url/lyric/download/play');
      expect(doc).toContain('playlist show/play/tracks/summary/export/audit');
      expect(doc).toContain('album show/dynamic/summary');
      expect(doc).toContain('memory show/export');
      expect(doc).toContain('memory clear');
      expect(doc).toContain('playlist list/create/add/import-album/remove/dedupe/merge');
    }
  });

  it('keeps the muge music tool layer manifest, schema snapshot, and runner usable', () => {
    const schema = JSON.parse(readFileSync(join(process.cwd(), 'agent', 'tools', 'schema.generated.json'), 'utf-8'));
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'agent', 'tools', 'tool-manifest.json'), 'utf-8'));
    const metadata = JSON.parse(readFileSync(join(process.cwd(), 'agent', 'skill', 'metadata.json'), 'utf-8'));

    expect(metadata).toMatchObject({
      name: 'muge-music',
      display_name: 'muge music',
      version: '1.3.0',
    });
    expect(manifest).toMatchObject({
      version: '1.3.0',
      schema_count: 74,
      command_count: 75,
      runner: 'agent/tools/nm-tool-runner.mjs',
    });
    expect(schema).toHaveLength(74);
    expect(schema.map((tool: any) => tool.name)).toEqual(expect.arrayContaining([
      'netease_config_show',
      'netease_music_info',
      'netease_playlist_import-album',
      'netease_smtc_status',
    ]));

    const readRunner = spawnSync(
      process.execPath,
      ['agent/tools/nm-tool-runner.mjs', 'netease_config_show', '{}', '{"preferLocal":true}'],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(readRunner.status).toBe(0);
    const readResult = JSON.parse(readRunner.stdout);
    expect(readResult).toMatchObject({
      ok: true,
      tool: 'netease_config_show',
      command: 'config show',
      cliSource: 'local-dist',
    });
    expect(readResult.parsed).toHaveProperty('output');

    const blockedWrite = spawnSync(
      process.execPath,
      ['agent/tools/nm-tool-runner.mjs', 'netease_playlist_create', '{"name":"x"}'],
      { cwd: process.cwd(), encoding: 'utf8' },
    );
    expect(blockedWrite.status).toBe(3);
    const blockedResult = JSON.parse(blockedWrite.stdout);
    expect(blockedResult).toMatchObject({
      ok: false,
      tool: 'netease_playlist_create',
      permission: 'write',
    });
  });
});
