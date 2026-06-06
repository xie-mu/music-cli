import { createSmtcService, type SmtcAction, type SmtcResult, type SmtcSession } from '../services/smtc.js';
import type { Command, Config } from '../types/core.js';

function outputFormat(config: Config, flags: Record<string, any>): string {
  return String(flags.output || config.output || 'text');
}

function writeJson(value: unknown): void {
  process.stdout.write(JSON.stringify(value, null, 2) + '\n');
}

function formatSeconds(value?: number): string {
  if (!value || value < 0) return '00:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function sessionTitle(session?: SmtcSession): string {
  if (!session) return '(no session)';
  const artist = session.song.artist ? ` - ${session.song.artist}` : '';
  return `${session.song.title || '(unknown title)'}${artist}`;
}

export function formatSmtcText(result: SmtcResult): string {
  if (!result.ok) {
    const detail = result.error || result.reason || 'unknown error';
    if (result.reason === 'no_netease_session' && result.current) {
      return `SMTC did not find a NetEase session. Current system session: ${sessionTitle(result.current)} (${result.current.appName || 'unknown app'})`;
    }
    return `SMTC unavailable: ${detail}`;
  }

  const session = result.session;
  if (!session && result.sessions) {
    return result.sessions.map((item, index) => {
      const marker = item.isNetease ? 'NetEase' : 'other';
      return `${index + 1}. ${sessionTitle(item)} [${marker}] ${item.playbackStatus || 'Unknown'}`;
    }).join('\n') || 'No SMTC sessions found';
  }

  if (!session) return 'No SMTC session found';

  const song = session.song;
  const lines = [
    `${session.playbackStatus === 'Playing' ? '▶ Playing' : session.playbackStatus || '⏸ Unknown'}: ${sessionTitle(session)}`,
    `Source: SMTC (${session.appName || 'unknown app'})`,
  ];

  // ── Media Properties ──────────────────────────────────────
  if (song.album) {
    const albumStr = [song.album, song.albumArtist ? `(${song.albumArtist})` : ''].filter(Boolean).join(' ');
    lines.push(`Album: ${albumStr}`);
  }
  if (song.genres) lines.push(`Genre: ${song.genres}`);
  if (song.subtitle) lines.push(`Subtitle: ${song.subtitle}`);
  if (song.playbackType && song.playbackType !== 'Unknown' && song.playbackType !== 'Music') {
    lines.push(`Type: ${song.playbackType}`);
  }
  if (song.trackNumber && song.trackNumber > 0) {
    lines.push(`Track: ${song.trackNumber}${song.albumTrackCount ? ` / ${song.albumTrackCount}` : ''}`);
  }
  if (song.hasThumbnail && song.thumbnailPath) {
    lines.push(`Cover: ${song.thumbnailPath}`);
  }

  // ── Timeline ──────────────────────────────────────────────
  if (session.duration && session.duration > 0) {
    let progress = `Progress: ${formatSeconds(session.position)} / ${formatSeconds(session.duration)}`;
    if (session.playbackRate && session.playbackRate !== 1) {
      progress += ` (${session.playbackRate}x)`;
    }
    lines.push(progress);
  }
  if (session.startTime && session.startTime > 0 && session.minSeekTime !== undefined) {
    lines.push(`Seek range: ${formatSeconds(session.minSeekTime)} – ${formatSeconds(session.maxSeekTime ?? session.duration)}`);
  }

  // ── Available Controls ────────────────────────────────────
  const c = session.controls;
  if (c) {
    const available: string[] = [];
    if (c.canPlay) available.push('play');
    if (c.canPause) available.push('pause');
    if (c.canNext) available.push('next');
    if (c.canPrev) available.push('prev');
    if (c.canStop) available.push('stop');
    if (c.canSeek) available.push('seek');
    if (c.canShuffle) available.push('shuffle');
    if (c.canRepeat) available.push('repeat');
    if (c.canFastForward) available.push('ff');
    if (c.canRewind) available.push('rw');
    if (c.canRate) available.push('rate');
    if (available.length > 0) {
      lines.push(`Controls: ${available.join(', ')}`);
    }
  }

  if (result.action) {
    lines.push(`Action: ${result.action} ${result.controlSucceeded ? '✓ accepted' : '✗ rejected'}`);
  }
  return lines.join('\n');
}

function writeSmtcResult(config: Config, flags: Record<string, any>, result: SmtcResult): void {
  if (outputFormat(config, flags) === 'json') {
    writeJson(result);
    return;
  }
  process.stdout.write(formatSmtcText(result) + '\n');
}

async function watchStatus(config: Config, flags: Record<string, any>): Promise<void> {
  const service = createSmtcService();
  let lastKey = '';
  process.stdout.write('SMTC watch started. Press Ctrl+C to stop.\n\n');

  // Polling keeps the CLI process simple and works with the helper boundary.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = service.status({ all: flags.all === true || flags.all === 'true' });
    const session = result.session;
    const key = result.ok && session
      ? `${session.song.title}|${session.song.artist}|${session.playbackStatus}|${session.position}`
      : `${result.reason}|${result.error}`;
    if (key !== lastKey) {
      if (lastKey) process.stdout.write('\n---\n');
      writeSmtcResult(config, flags, result);
      lastKey = key;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

export const smtcStatusCommand: Command = {
  name: 'smtc status',
  description: 'Read the current NetEase SMTC media session',
  usage: 'nm smtc status [--watch] [--all]',
  permission: 'public',
  capability: 'smtc.status',
  returns: 'SmtcResult',
  options: [
    { flag: '--watch', description: 'Poll SMTC status until interrupted', type: 'boolean' },
    { flag: '--all', description: 'Include all system media sessions', type: 'boolean' },
  ],
  examples: ['nm smtc status', 'nm smtc status --output json', 'nm smtc status --watch'],
  async run(config, flags) {
    if (flags.watch === true || flags.watch === 'true') {
      await watchStatus(config, flags);
      return;
    }
    const result = createSmtcService().status({ all: flags.all === true || flags.all === 'true' });
    writeSmtcResult(config, flags, result);
  },
};

export const smtcSessionsCommand: Command = {
  name: 'smtc sessions',
  description: 'List active Windows SMTC media sessions',
  usage: 'nm smtc sessions',
  permission: 'public',
  capability: 'smtc.sessions',
  returns: 'SmtcResult',
  options: [],
  examples: ['nm smtc sessions', 'nm smtc sessions --output json'],
  async run(config, flags) {
    writeSmtcResult(config, flags, createSmtcService().sessions());
  },
};

function controlCommand(action: SmtcAction, usage: string): Command {
  const options = action === 'seek'
    ? [{ flag: '--position <seconds>', description: 'Playback position in seconds', required: true, type: 'number' as const }]
    : action === 'rate'
      ? [{ flag: '--value <rate>', description: 'Playback rate, for example 1 or 1.25', required: true, type: 'number' as const }]
      : action === 'shuffle'
        ? [{ flag: '--enabled <true|false>', description: 'Enable or disable shuffle', required: true, type: 'string' as const }]
        : action === 'repeat'
          ? [{ flag: '--mode <none|one|all>', description: 'Repeat mode: none, one, or all', required: true, type: 'string' as const }]
          : [];

  const examples = action === 'seek'
    ? ['nm smtc seek --position 60']
    : action === 'rate'
      ? ['nm smtc rate --value 1.25']
      : action === 'shuffle'
        ? ['nm smtc shuffle --enabled true']
        : action === 'repeat'
          ? ['nm smtc repeat --mode all']
          : [`nm smtc ${action}`];

  return {
    name: `smtc ${action}`,
    description: `Request SMTC ${action} on the NetEase media session`,
    usage,
    permission: 'public',
    capability: `smtc.${action}`,
    returns: 'SmtcResult',
    options,
    examples,
    async run(config, flags) {
      const value = action === 'seek'
        ? Number(flags.position)
        : action === 'rate'
          ? Number(flags.value)
          : action === 'shuffle'
            ? String(flags.enabled)
            : action === 'repeat'
              ? String(flags.mode)
              : undefined;
      writeSmtcResult(config, flags, createSmtcService().control(action, value));
    },
  };
}

export const smtcPlayCommand = controlCommand('play', 'nm smtc play');
export const smtcPauseCommand = controlCommand('pause', 'nm smtc pause');
export const smtcToggleCommand = controlCommand('toggle', 'nm smtc toggle');
export const smtcNextCommand = controlCommand('next', 'nm smtc next');
export const smtcPrevCommand = controlCommand('prev', 'nm smtc prev');
export const smtcStopCommand = controlCommand('stop', 'nm smtc stop');
export const smtcSeekCommand = controlCommand('seek', 'nm smtc seek --position <seconds>');
export const smtcRateCommand = controlCommand('rate', 'nm smtc rate --value <rate>');
export const smtcShuffleCommand = controlCommand('shuffle', 'nm smtc shuffle --enabled <true|false>');
export const smtcRepeatCommand = controlCommand('repeat', 'nm smtc repeat --mode <none|one|all>');
export const smtcFastForwardCommand = controlCommand('fast-forward', 'nm smtc fast-forward');
export const smtcRewindCommand = controlCommand('rewind', 'nm smtc rewind');
