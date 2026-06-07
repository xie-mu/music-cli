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

  it('pushes through Orpheus and schedules NetEase minimization on Windows', async () => {
    const { playSong } = await import('../src/player.js');

    const result = await playSong(2608448649, '走走', { player: 'orpheus' });

    expect(result).toMatchObject({
      player: 'orpheus',
      success: true,
      opened: false,
    });
    expect(mocks.spawn).toHaveBeenCalledTimes(2);
    expect(mocks.spawn.mock.calls[0]).toEqual([
      'cmd',
      expect.arrayContaining(['/c', 'start', '']),
      expect.objectContaining({ detached: true, windowsHide: true }),
    ]);
    expect(String(mocks.spawn.mock.calls[0][1][3])).toMatch(/^orpheus:\/\//);
    expect(mocks.spawn.mock.calls[1]).toEqual([
      'powershell',
      expect.arrayContaining(['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand']),
      expect.objectContaining({ stdio: 'ignore', windowsHide: true }),
    ]);
    const encodedCommand = mocks.spawn.mock.calls[1][1].at(-1);
    const decodedCommand = Buffer.from(String(encodedCommand), 'base64').toString('utf16le');
    expect(decodedCommand).toContain('ShowWindow');
    expect(decodedCommand).toContain('cloudmusic');
  });
});
