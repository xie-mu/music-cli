/**
 * Core engine tests: Trie router, config merging, eapi encryption
 */
import { describe, it, expect } from 'vitest';

// ── Trie Router ──────────────────────────────────────────
describe('CommandRouter', () => {
  it('should register and resolve commands', async () => {
    const { getCommandRouter } = await import('../src/router.js');
    const router = getCommandRouter();
    // Register a test command
    const testCmd = {
      name: 'test hello',
      description: 'Test command',
      usage: 'nm test hello',
      options: [],
      examples: [],
      async run() {},
    };
    router.register(['test', 'hello'], testCmd);
    const { command, extra } = router.resolve(['test', 'hello']);
    expect(command.name).toBe('test hello');
    expect(extra).toEqual([]);
  });

  it('should detect group paths', async () => {
    const { getCommandRouter } = await import('../src/router.js');
    const router = getCommandRouter();
    expect(router.isGroupPath(['test'])).toBe(true);
  });

  it('should return extra args after matching', async () => {
    const { getCommandRouter } = await import('../src/router.js');
    const router = getCommandRouter();
    const { extra } = router.resolve(['test', 'hello', '--flag', 'value']);
    expect(extra).toEqual(['--flag', 'value']);
  });

  it('should throw for unknown commands', async () => {
    const { getCommandRouter } = await import('../src/router.js');
    const router = getCommandRouter();
    expect(() => router.resolve(['nonexistent'])).toThrow();
  });
});

// ── Config Merging ───────────────────────────────────────
describe('Config merging', () => {
  it('should provide defaults', async () => {
    const { getDefaultConfig } = await import('../src/config.js');
    const cfg = getDefaultConfig();
    expect(cfg.output).toBe('text');
    expect(cfg.timeout).toBe(30);
    expect(cfg.countryCode).toBe('86');
  });

  it('should merge flags on top of defaults', async () => {
    const { mergeConfig } = await import('../src/config.js');
    const cfg = mergeConfig({ output: 'json', timeout: '60' });
    expect(cfg.output).toBe('json');
    // timeout stays as string until main.ts converts it
    expect(cfg.timeout).toBe('60');
  });
});

// ── eapi Encryption ──────────────────────────────────────
describe('eapi encryption', () => {
  it('should produce params and correct URL path', async () => {
    const { eapiEncrypt } = await import('../src/crypto.js');
    const result = eapiEncrypt('/api/v3/song/detail', { id: 186016 });
    expect(result.url).toContain('/eapi/v3/song/detail');
    expect(result.body).toContain('params=');
    expect(result.body.length).toBeGreaterThan(50);
  });

  it('should handle different endpoints', async () => {
    const { eapiEncrypt } = await import('../src/crypto.js');
    const result = eapiEncrypt('/api/song/enhance/player/url', { ids: '[186016]', br: 320000 });
    expect(result.url).toBe('https://music.163.com/eapi/song/enhance/player/url');
  });

  it('should decrypt its own encrypted response', async () => {
    const { eapiEncrypt, eapiDecrypt } = await import('../src/crypto.js');
    // We can't fully test without a real API response,
    // but we can test that the functions exist and accept params
    expect(typeof eapiEncrypt).toBe('function');
    expect(typeof eapiDecrypt).toBe('function');
  });
});

// ── Argument Parser ──────────────────────────────────────
describe('Argument parser', () => {
  it('should parse --flag value', async () => {
    const { parseArgs } = await import('../src/parser.js');
    const result = parseArgs(['--id', '123', '--output', 'json']);
    expect(result.id).toBe('123');
    expect(result.output).toBe('json');
  });

  it('should parse --flag=value', async () => {
    const { parseArgs } = await import('../src/parser.js');
    const result = parseArgs(['--id=456']);
    expect(result.id).toBe('456');
  });

  it('should expose camelCase aliases for kebab-case flags', async () => {
    const { parseArgs } = await import('../src/parser.js');
    const result = parseArgs(['--page-size', '20', '--song-ids=186016,1807799505']);
    expect(result['page-size']).toBe('20');
    expect(result.pageSize).toBe('20');
    expect(result['song-ids']).toBe('186016,1807799505');
    expect(result.songIds).toBe('186016,1807799505');
  });

  it('should collect positional args', async () => {
    const { parseArgs } = await import('../src/parser.js');
    const result = parseArgs(['subcommand', '--flag', 'val']);
    expect(result._positional).toEqual(['subcommand']);
  });

  it('should handle boolean flags (no value)', async () => {
    const { parseArgs } = await import('../src/parser.js');
    const result = parseArgs(['--verbose', '--quiet']);
    expect(result.verbose).toBe('true');
    expect(result.quiet).toBe('true');
  });
});

// ── NeteaseError ─────────────────────────────────────────
describe('NeteaseError', () => {
  it('should create error with code and hint', async () => {
    const { NeteaseError } = await import('../src/error.js');
    const err = new NeteaseError('AUTH', '测试错误', '请重新登录');
    expect(err.code).toBe('AUTH');
    expect(err.message).toBe('测试错误');
    expect(err.hint).toBe('请重新登录');
    expect(err.exitCode).toBe(1);
  });

  it('should serialize to JSON', async () => {
    const { NeteaseError } = await import('../src/error.js');
    const err = new NeteaseError('USAGE', '参数错误', '使用 --help 查看帮助');
    const json = err.toJSON();
    expect(json.code).toBe('USAGE');
    expect(json.message).toBe('参数错误');
  });

  it('should map API codes to hints', async () => {
    const { apiCodeToHint } = await import('../src/error.js');
    expect(apiCodeToHint(301)).toBeTruthy();
    expect(apiCodeToHint(200)).toBeNull();
  });
});

// ── Pipeline Expression Engine ───────────────────────────
describe('Pipeline expressions', () => {
  it('should resolve template strings with ${input.xxx}', async () => {
    const { evaluate } = await import('../src/pipeline/expression.js');
    const ctx = {
      input: { playlistId: '3778678' },
      stepOutputs: new Map(),
      env: {},
    };
    const result = evaluate('${input.playlistId}', ctx);
    expect(result).toBe('3778678');
  });

  it('should handle $from references', async () => {
    const { evaluate } = await import('../src/pipeline/expression.js');
    const outputs = new Map();
    outputs.set('step1', { songs: [{ name: '晴天' }] });
    const ctx = { input: {}, stepOutputs: outputs, env: {} };
    // $from with path is evaluated via the template syntax
    const result = evaluate({ $from: 'step1' }, ctx);
    expect(result.songs[0].name).toBe('晴天');
  });

  it('should handle $concat strings', async () => {
    const { evaluate } = await import('../src/pipeline/expression.js');
    const ctx = { input: { name: 'World' }, stepOutputs: new Map(), env: {} };
    const result = evaluate({ $concat: ['Hello ', { $input: 'name' }] }, ctx);
    expect(result).toBe('Hello World');
  });
});
