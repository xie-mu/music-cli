import { describe, expect, it } from 'vitest';

describe('SmtcService', () => {
  it('normalizes helper status output into a stable SMTC result', async () => {
    const { createSmtcService } = await import('../src/services/smtc.js');
    const service = createSmtcService({
      platform: 'win32',
      helperPath: 'fake-helper.exe',
      helperExists: () => true,
      runner: () => ({
        status: 0,
        stderr: '',
        stdout: JSON.stringify({
          ok: true,
          source: 'smtc',
          session: {
            sourceAppUserModelId: 'cloudmusic.exe',
            appName: 'cloudmusic.exe',
            isNetease: true,
            song: { title: 'Song', artist: 'Artist', album: 'Album' },
            playbackStatus: 'Playing',
            position: 42,
            duration: 210,
            canControl: true,
          },
        }),
      }),
    });

    expect(service.status()).toMatchObject({
      ok: true,
      source: 'smtc',
      playing: true,
      helperPath: 'fake-helper.exe',
      session: {
        isNetease: true,
        song: { title: 'Song', artist: 'Artist', album: 'Album' },
        playbackStatus: 'Playing',
        position: 42,
        duration: 210,
        canControl: true,
      },
    });
  });

  it('normalizes extended media properties, timeline, and controls', async () => {
    const { normalizeSmtcResult } = await import('../src/services/smtc.js');

    const result = normalizeSmtcResult({
      ok: true,
      sourceAppUserModelId: 'cloudmusic.exe',
      appName: 'cloudmusic.exe',
      isNetease: true,
      song: {
        title: 'Extended Song',
        artist: 'Extended Artist',
        album: 'Extended Album',
        albumArtist: 'Album Artist',
        genres: 'Rock, Pop',
        subtitle: 'feat. Someone',
        trackNumber: 3,
        albumTrackCount: 12,
        playbackType: 'Music',
        hasThumbnail: true,
        thumbnailPath: 'C:\\Temp\\thumb.jpg',
      },
      playbackStatus: 'Paused',
      position: 60,
      duration: 240,
      startTime: 0,
      minSeekTime: 5,
      maxSeekTime: 240,
      playbackRate: 1.25,
      controls: {
        canPlay: true,
        canPause: true,
        canNext: true,
        canPrev: true,
        canStop: false,
        canSeek: true,
        canShuffle: true,
        canRepeat: false,
        canFastForward: false,
        canRewind: false,
        canRate: true,
      },
    });

    expect(result).toMatchObject({
      ok: true,
      playing: false,
      session: {
        song: {
          title: 'Extended Song',
          artist: 'Extended Artist',
          album: 'Extended Album',
          albumArtist: 'Album Artist',
          genres: 'Rock, Pop',
          subtitle: 'feat. Someone',
          trackNumber: 3,
          albumTrackCount: 12,
          playbackType: 'Music',
          hasThumbnail: true,
          thumbnailPath: 'C:\\Temp\\thumb.jpg',
        },
        playbackStatus: 'Paused',
        position: 60,
        duration: 240,
        startTime: 0,
        minSeekTime: 5,
        maxSeekTime: 240,
        playbackRate: 1.25,
        canControl: true,
        controls: {
          canPlay: true,
          canPause: true,
          canNext: true,
          canPrev: true,
          canStop: false,
          canSeek: true,
          canShuffle: true,
          canRepeat: false,
          canFastForward: false,
          canRewind: false,
          canRate: true,
        },
      },
    });
  });

  it('returns unsupported_platform outside Windows without launching the helper', async () => {
    const { createSmtcService } = await import('../src/services/smtc.js');
    let launched = false;
    const service = createSmtcService({
      platform: 'linux',
      helperPath: 'fake-helper.exe',
      helperExists: () => true,
      runner: () => {
        launched = true;
        return { status: 0, stdout: '{}', stderr: '' };
      },
    });

    expect(service.status()).toMatchObject({
      ok: false,
      source: 'smtc',
      playing: false,
      unsupported: true,
      reason: 'unsupported_platform',
    });
    expect(launched).toBe(false);
  });

  it('reports helper_missing when the Windows bridge is unavailable', async () => {
    const { createSmtcService } = await import('../src/services/smtc.js');
    const service = createSmtcService({
      platform: 'win32',
      helperPath: 'missing-helper.exe',
      helperExists: () => false,
      runner: () => ({ status: 1, stdout: '', stderr: '' }),
    });

    expect(service.status()).toMatchObject({
      ok: false,
      source: 'smtc',
      playing: false,
      reason: 'helper_missing',
      helperPath: 'missing-helper.exe',
    });
  });

  it('maps sessions and control requests to helper arguments', async () => {
    const { createSmtcService } = await import('../src/services/smtc.js');
    const calls: string[][] = [];
    const service = createSmtcService({
      platform: 'win32',
      helperPath: 'fake-helper.exe',
      helperExists: () => true,
      runner: (_helperPath, args) => {
        calls.push(args);
        return {
          status: 0,
          stderr: '',
          stdout: JSON.stringify({
            ok: true,
            source: 'smtc',
            playing: false,
            action: args[1],
            controlSucceeded: true,
            sessions: [],
          }),
        };
      },
    });

    service.sessions();
    service.control('seek', 60);
    service.control('next');
    service.control('rate', 1.25);
    service.control('shuffle', true);
    service.control('repeat', 'all');

    expect(calls).toEqual([
      ['sessions'],
      ['control', 'seek', '60'],
      ['control', 'next'],
      ['control', 'rate', '1.25'],
      ['control', 'shuffle', 'true'],
      ['control', 'repeat', 'all'],
    ]);
  });

  it('normalizes legacy helper songName output', async () => {
    const { normalizeSmtcResult } = await import('../src/services/smtc.js');

    expect(normalizeSmtcResult({
      ok: true,
      sourceAppUserModelId: 'orpheus',
      appName: 'orpheus',
      isNetease: true,
      songName: 'Legacy Song',
      artist: 'Legacy Artist',
      albumTitle: 'Legacy Album',
      playbackStatus: 'Paused',
      position: 1,
      duration: 2,
    })).toMatchObject({
      ok: true,
      playing: false,
      session: {
        song: { title: 'Legacy Song', artist: 'Legacy Artist', album: 'Legacy Album' },
        playbackStatus: 'Paused',
      },
    });
  });
});

describe('SMTC commands', () => {
  it('exports every local SMTC capability as a public command', async () => {
    const commands = await import('../src/commands/smtc.js');
    const commandNames = [
      commands.smtcStatusCommand,
      commands.smtcSessionsCommand,
      commands.smtcPlayCommand,
      commands.smtcPauseCommand,
      commands.smtcToggleCommand,
      commands.smtcNextCommand,
      commands.smtcPrevCommand,
      commands.smtcStopCommand,
      commands.smtcSeekCommand,
      commands.smtcRateCommand,
      commands.smtcShuffleCommand,
      commands.smtcRepeatCommand,
      commands.smtcFastForwardCommand,
      commands.smtcRewindCommand,
    ].map(command => command.name);

    expect(commandNames).toEqual([
      'smtc status',
      'smtc sessions',
      'smtc play',
      'smtc pause',
      'smtc toggle',
      'smtc next',
      'smtc prev',
      'smtc stop',
      'smtc seek',
      'smtc rate',
      'smtc shuffle',
      'smtc repeat',
      'smtc fast-forward',
      'smtc rewind',
    ]);
    expect(commands.smtcSeekCommand.options[0]).toMatchObject({
      flag: '--position <seconds>',
      required: true,
      type: 'number',
    });
    expect(commands.smtcRepeatCommand.options[0]).toMatchObject({
      flag: '--mode <none|one|all>',
      required: true,
    });
  });
});
