import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  execSync: vi.fn(),
  platform: vi.fn(),
  spawn: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  execSync: mocks.execSync,
  spawn: mocks.spawn,
}));

vi.mock('node:os', () => ({
  platform: mocks.platform,
}));

describe('playSong desktop handoff', () => {
  beforeEach(() => {
    mocks.execSync.mockReset();
    mocks.platform.mockReset();
    mocks.spawn.mockReset();
    mocks.platform.mockReturnValue('win32');
    mocks.execSync.mockReturnValue('cloudmusic.exe');
    mocks.spawn.mockReturnValue({ unref: vi.fn() });
  });

  it('pushes through Orpheus without scheduling NetEase minimization on Windows', async () => {
    const { playSong } = await import('../src/player.js');

    const result = await playSong(2608448649, '走走', { player: 'orpheus' });

    expect(result).toMatchObject({
      player: 'orpheus',
      success: true,
      opened: false,
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);
    expect(mocks.spawn.mock.calls[0]).toEqual([
      'cmd',
      expect.arrayContaining(['/c', 'start', '']),
      expect.objectContaining({ detached: true, windowsHide: true }),
    ]);
    expect(String(mocks.spawn.mock.calls[0][1][3])).toMatch(/^orpheus:\/\//);
  });

  it('can push a playlist through Orpheus so the desktop client loads that playlist', async () => {
    const { playPlaylist } = await import('../src/player.js');

    const result = await playPlaylist(18043078287, 'nm-codex-write-test-20260610', { player: 'orpheus' });

    expect(result).toMatchObject({
      player: 'orpheus',
      success: true,
      opened: false,
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(1);

    const url = String(mocks.spawn.mock.calls[0][1][3]);
    expect(url).toMatch(/^orpheus:\/\//);
    const payload = JSON.parse(Buffer.from(url.slice('orpheus://'.length), 'base64').toString('utf8'));
    expect(payload).toEqual({
      type: 'playlist',
      id: '18043078287',
      cmd: 'play',
      channel: 'webset',
    });
  });
});
