import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform as osPlatform } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SmtcAction =
  | 'play'
  | 'pause'
  | 'toggle'
  | 'next'
  | 'prev'
  | 'stop'
  | 'seek'
  | 'rate'
  | 'shuffle'
  | 'repeat'
  | 'fast-forward'
  | 'rewind';

export interface SmtcControls {
  canPlay: boolean;
  canPause: boolean;
  canNext: boolean;
  canPrev: boolean;
  canStop: boolean;
  canSeek: boolean;
  canShuffle: boolean;
  canRepeat: boolean;
  canFastForward: boolean;
  canRewind: boolean;
  canRate: boolean;
}

export interface SmtcSong {
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  genres?: string;
  subtitle?: string;
  trackNumber?: number;
  albumTrackCount?: number;
  playbackType?: string;
  hasThumbnail?: boolean;
  thumbnailPath?: string;
}

export interface SmtcSession {
  sourceAppUserModelId?: string;
  appName?: string;
  isNetease: boolean;
  song: SmtcSong;
  playbackStatus?: string;
  position?: number;
  duration?: number;
  startTime?: number;
  minSeekTime?: number;
  maxSeekTime?: number;
  playbackRate?: number;
  canControl: boolean;
  controls?: SmtcControls;
}

export interface SmtcResult {
  ok: boolean;
  source: 'smtc';
  playing: boolean;
  reason?: string;
  error?: string;
  unsupported?: boolean;
  helperPath?: string;
  action?: SmtcAction;
  controlSucceeded?: boolean;
  session?: SmtcSession;
  current?: SmtcSession;
  sessions?: SmtcSession[];
}

export interface SmtcRunnerResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export type SmtcRunner = (helperPath: string, args: string[]) => SmtcRunnerResult;

export interface SmtcServiceOptions {
  platform?: string;
  helperPath?: string;
  helperExists?: (helperPath: string) => boolean;
  runner?: SmtcRunner;
}

function defaultRunner(helperPath: string, args: string[]): SmtcRunnerResult {
  const result = spawnSync(helperPath, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
  });
  return {
    status: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

export function resolveSmtcHelperPath(): string {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(process.cwd(), 'tools', 'smtc_query.exe'),
    resolve(process.cwd(), 'smtc_query.exe'),
    resolve(moduleDir, '..', '..', 'tools', 'smtc_query.exe'),
    resolve(moduleDir, '..', '..', '..', 'tools', 'smtc_query.exe'),
  ];
  return candidates.find(candidate => existsSync(candidate)) || candidates[0];
}

function firstJsonObject(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  return trimmed.slice(start, end + 1);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toControls(raw: any): SmtcControls | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  // Check each control flag against the raw object
  const c = raw.controls ?? raw;
  const hasAny = 'canPlay' in c || 'canPause' in c || 'canNext' in c || 'canPrev' in c;
  if (!hasAny) return undefined;
  return {
    canPlay: Boolean(c.canPlay),
    canPause: Boolean(c.canPause),
    canNext: Boolean(c.canNext),
    canPrev: Boolean(c.canPrev),
    canStop: Boolean(c.canStop),
    canSeek: Boolean(c.canSeek),
    canShuffle: Boolean(c.canShuffle),
    canRepeat: Boolean(c.canRepeat),
    canFastForward: Boolean(c.canFastForward),
    canRewind: Boolean(c.canRewind),
    canRate: Boolean(c.canRate),
  };
}

function makeSong(raw: any): SmtcSong {
  const s = raw.song ?? raw;
  return {
    title: String(s.title || ''),
    artist: String(s.artist || ''),
    album: optionalString(s.album),
    albumArtist: optionalString(s.albumArtist),
    genres: optionalString(s.genres),
    subtitle: optionalString(s.subtitle),
    trackNumber: optionalNumber(s.trackNumber),
    albumTrackCount: optionalNumber(s.albumTrackCount),
    playbackType: optionalString(s.playbackType),
    hasThumbnail: s.hasThumbnail === true ? true : undefined,
    thumbnailPath: optionalString(s.thumbnailPath),
  };
}

function toSession(raw: any): SmtcSession | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  if (raw.song) {
    return {
      sourceAppUserModelId: optionalString(raw.sourceAppUserModelId),
      appName: optionalString(raw.appName),
      isNetease: Boolean(raw.isNetease),
      song: makeSong(raw),
      playbackStatus: optionalString(raw.playbackStatus),
      position: optionalNumber(raw.position),
      duration: optionalNumber(raw.duration),
      startTime: optionalNumber(raw.startTime),
      minSeekTime: optionalNumber(raw.minSeekTime),
      maxSeekTime: optionalNumber(raw.maxSeekTime),
      playbackRate: optionalNumber(raw.playbackRate),
      canControl: raw.canControl !== false,
      controls: toControls(raw),
    };
  }

  if (raw.songName) {
    return {
      sourceAppUserModelId: optionalString(raw.sourceAppUserModelId),
      appName: optionalString(raw.appName),
      isNetease: Boolean(raw.isNetease),
      song: {
        title: String(raw.songName || ''),
        artist: String(raw.artist || ''),
        album: optionalString(raw.albumTitle),
      },
      playbackStatus: optionalString(raw.playbackStatus),
      position: optionalNumber(raw.position),
      duration: optionalNumber(raw.duration),
      canControl: raw.canControl !== false,
    };
  }

  return undefined;
}

export function normalizeSmtcResult(raw: any): SmtcResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, source: 'smtc', playing: false, reason: 'invalid_helper_output' };
  }

  const session = toSession(raw.session) || toSession(raw);
  const current = toSession(raw.current);
  const sessions = Array.isArray(raw.sessions)
    ? raw.sessions.map(toSession).filter((v: any): v is SmtcSession => Boolean(v))
    : undefined;

  const status = session?.playbackStatus || raw.playbackStatus;
  const playing = raw.playing !== undefined ? Boolean(raw.playing) : status === 'Playing';

  return {
    ok: raw.ok !== undefined ? Boolean(raw.ok) : Boolean(session && !raw.error),
    source: 'smtc',
    playing,
    reason: optionalString(raw.reason),
    error: optionalString(raw.error),
    unsupported: Boolean(raw.unsupported),
    action: raw.action,
    controlSucceeded: raw.controlSucceeded,
    session,
    current,
    sessions,
  };
}

export class SmtcService {
  private readonly platform: string;
  private readonly helperPath: string;
  private readonly helperExistsFn: (helperPath: string) => boolean;
  private readonly runner: SmtcRunner;

  constructor(options: SmtcServiceOptions = {}) {
    this.platform = options.platform || osPlatform();
    this.helperPath = options.helperPath || resolveSmtcHelperPath();
    this.helperExistsFn = options.helperExists || existsSync;
    this.runner = options.runner || defaultRunner;
  }

  helperExists(): boolean {
    return this.helperExistsFn(this.helperPath);
  }

  getHelperPath(): string {
    return this.helperPath;
  }

  status(options: { all?: boolean } = {}): SmtcResult {
    return this.run(['status', ...(options.all ? ['--all'] : [])]);
  }

  sessions(): SmtcResult {
    return this.run(['sessions']);
  }

  control(action: SmtcAction, value?: number | string | boolean): SmtcResult {
    const args = ['control', action];
    if (value !== undefined) args.push(String(value));
    return this.run(args);
  }

  private run(args: string[]): SmtcResult {
    if (this.platform !== 'win32') {
      return {
        ok: false,
        source: 'smtc',
        playing: false,
        unsupported: true,
        reason: 'unsupported_platform',
        helperPath: this.helperPath,
      };
    }

    if (!this.helperExists()) {
      return {
        ok: false,
        source: 'smtc',
        playing: false,
        reason: 'helper_missing',
        helperPath: this.helperPath,
      };
    }

    const result = this.runner(this.helperPath, args);
    const json = firstJsonObject(result.stdout) || firstJsonObject(result.stderr);
    if (!json) {
      return {
        ok: false,
        source: 'smtc',
        playing: false,
        reason: 'helper_no_json',
        error: result.stderr.trim() || result.stdout.trim() || undefined,
        helperPath: this.helperPath,
      };
    }

    try {
      return {
        ...normalizeSmtcResult(JSON.parse(json)),
        helperPath: this.helperPath,
      };
    } catch (error) {
      return {
        ok: false,
        source: 'smtc',
        playing: false,
        reason: 'helper_invalid_json',
        error: error instanceof Error ? error.message : String(error),
        helperPath: this.helperPath,
      };
    }
  }
}

export function createSmtcService(options?: SmtcServiceOptions): SmtcService {
  return new SmtcService(options);
}
