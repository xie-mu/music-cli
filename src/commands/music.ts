import { createInterface } from 'node:readline';
import { formatOutput } from '../formatter.js';
import { Command } from '../types/core.js';
import { createNeteaseServices } from '../services/index.js';

interface LrcLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(lrc)) !== null) {
    const min = Number(match[1]);
    const sec = Number(match[2]);
    const ms = Number(match[3].padEnd(3, '0'));
    const text = match[4].trim();
    if (text) lines.push({ time: min * 60 + sec + ms / 1000, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function waitForEnter(): Promise<boolean> {
  return await new Promise<boolean>(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.on('line', line => {
      rl.close();
      resolve(line.toLowerCase() !== 'q');
    });
  });
}

function shouldSkipOpening(flags: Record<string, any>): boolean {
  return flags.noOpen === true
    || flags.noOpen === 'true'
    || flags['no-open'] === true
    || flags['no-open'] === 'true';
}

async function showSyncedLyrics(lrcText: string, translatedText: string): Promise<void> {
  const lrcLines = parseLrc(lrcText);
  const translatedLines = parseLrc(translatedText);
  if (lrcLines.length === 0) {
    process.stdout.write('(lyrics have no timestamps)\n');
    return;
  }

  process.stdout.write('Sync lyrics mode\n');
  process.stdout.write('Start playback in browser/client, then press Enter here. Press q then Enter to quit.\n\n');
  for (const line of lrcLines.slice(0, 10)) {
    process.stdout.write(`${fmtTime(line.time)} ${line.text}\n`);
  }

  const shouldStart = await waitForEnter();
  if (!shouldStart) return;

  const duration = Math.max(...lrcLines.map(line => line.time)) + 5;
  const startTime = Date.now();
  let lastIndex = -1;

  const timer = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    let currentIndex = -1;
    for (let i = 0; i < lrcLines.length; i++) {
      if (lrcLines[i].time <= elapsed) currentIndex = i;
      else break;
    }
    if (currentIndex === lastIndex) return;
    lastIndex = currentIndex;

    console.clear();
    process.stdout.write(`${fmtTime(elapsed)} / ${fmtTime(duration)}\n\n`);
    const start = Math.max(0, currentIndex - 4);
    const end = Math.min(lrcLines.length, start + 10);
    for (let i = start; i < end; i++) {
      const marker = i === currentIndex ? '>' : ' ';
      process.stdout.write(`${marker} ${fmtTime(lrcLines[i].time)} ${lrcLines[i].text}\n`);
      if (i === currentIndex) {
        const translated = translatedLines.find(line => Math.abs(line.time - lrcLines[i].time) < 0.3);
        if (translated) process.stdout.write(`  ${translated.text}\n`);
      }
    }
  }, 200);

  setTimeout(() => {
    clearInterval(timer);
    process.stdout.write('\nSync finished\n');
  }, (duration + 5) * 1000);
}

export const musicInfoCommand: Command = {
  name: 'music info',
  description: 'Get song details',
  usage: 'nm music info --id <songId>',
  permission: 'public',
  capability: 'music.info',
  returns: 'Song[]',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--ids <ids>', description: 'Comma-separated song IDs' },
  ],
  examples: ['nm music info --id 186016', 'nm music info --ids 186016,186017'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const ids = flags.ids ? String(flags.ids).split(',').map(Number) : [Number(flags.id)];
    const result = await services.music.getInfo(ids);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const musicUrlCommand: Command = {
  name: 'music url',
  description: 'Get song playback URL',
  usage: 'nm music url --id <songId> [--br 320000]',
  permission: 'public',
  capability: 'music.url',
  returns: 'PlaybackUrl[]',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--br <br>', description: 'Bitrate: 128000/192000/320000/999000', default: '320000' },
  ],
  examples: ['nm music url --id 186016', 'nm music url --id 186016 --br 999000'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.music.getUrl(Number(flags.id), Number(flags.br) || 320000);
    process.stdout.write(formatOutput(result.data, flags.output || config.output) + '\n');
  },
};

export const musicLyricCommand: Command = {
  name: 'music lyric',
  description: 'Get LRC lyrics, optionally synced',
  usage: 'nm music lyric --id <songId> [--sync]',
  permission: 'public',
  capability: 'music.lyric',
  returns: 'Lyric',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--sync', description: 'Synchronized display mode' },
  ],
  examples: ['nm music lyric --id 186016', 'nm music lyric --id 1807799505 --sync'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.music.getLyric(Number(flags.id));
    const lrcText = result.data.lrc;
    const translatedText = result.data.translated || '';
    if (!lrcText) {
      process.stdout.write('(no lyrics)\n');
      return;
    }
    if (!flags.sync) {
      process.stdout.write(lrcText + '\n');
      if (translatedText) process.stdout.write('\n--- translation ---\n' + translatedText + '\n');
      return;
    }
    await showSyncedLyrics(lrcText, translatedText);
  },
};

export const musicDownloadCommand: Command = {
  name: 'music download',
  description: 'Download song to a local file',
  usage: 'nm music download --id <songId> [--out <path>] [--br 320000]',
  permission: 'public',
  capability: 'music.download',
  returns: 'DownloadResult',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--out <path>', description: 'Output file path' },
    { flag: '--br <br>', description: 'Bitrate', default: '320000' },
  ],
  examples: ['nm music download --id 186016', 'nm music download --id 186016 --out ./song.mp3'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const result = await services.music.download(Number(flags.id), Number(flags.br) || 320000, flags.out);
    process.stdout.write(`Downloaded: ${result.data.path} (${(result.data.bytes / 1024 / 1024).toFixed(1)} MB)\n`);
  },
};

export const musicPlayCommand: Command = {
  name: 'music play',
  description: 'Open the official NetEase web player',
  usage: 'nm music play --id <songId> [--no-open]',
  permission: 'public',
  capability: 'music.play',
  returns: 'PlayerResult',
  options: [
    { flag: '--id <id>', description: 'Song ID', required: true, type: 'number' },
    { flag: '--br <br>', description: 'Bitrate', default: '320000' },
    { flag: '--player <name>', description: 'Player: orpheus (background) | browser (default: auto)' },
    { flag: '--no-open', description: 'Do not open browser; only return the official song URL', type: 'boolean' },
  ],
  examples: ['nm music play --id 186016', 'nm music play --id 186016 --no-open --output json', 'nm music play --id 186016 --player browser'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    const id = Number(flags.id);
    const info = await services.music.getInfo([id]);
    const title = info.data[0]?.name || String(id);
    await services.store.appendEvent('music_play', { songId: id, title });

    if (!config.quiet) process.stdout.write(`${title}\n`);
    const { playSong } = await import('../player.js');
    const result = await playSong(id, title, {
      open: !shouldSkipOpening(flags),
      player: flags.player,
    });
    if ((flags.output || config.output) === 'json') {
      process.stdout.write(formatOutput(result, 'json') + '\n');
      return;
    }
    process.stdout.write(result.message + '\n');
  },
};

export const musicLikeCommand: Command = {
  name: 'music like',
  description: 'Like a song',
  usage: 'nm music like --id <songId>',
  permission: 'write',
  capability: 'music.like',
  returns: 'LikeResult',
  options: [{ flag: '--id <id>', description: 'Song ID', required: true, type: 'number' }],
  examples: ['nm music like --id 186016'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    await services.music.like(Number(flags.id), true);
    process.stdout.write('Added to liked songs\n');
  },
};

export const musicUnlikeCommand: Command = {
  name: 'music unlike',
  description: 'Unlike a song',
  usage: 'nm music unlike --id <songId>',
  permission: 'write',
  capability: 'music.unlike',
  returns: 'LikeResult',
  options: [{ flag: '--id <id>', description: 'Song ID', required: true, type: 'number' }],
  examples: ['nm music unlike --id 186016'],
  async run(config, flags) {
    const services = createNeteaseServices(config);
    await services.music.like(Number(flags.id), false);
    process.stdout.write('Removed from liked songs\n');
  },
};
