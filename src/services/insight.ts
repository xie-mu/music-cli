import { PlayRecord } from '../domain/models.js';

export interface ListeningInsight {
  label: string;
  totalSongs: number;
  uniqueSongs: number;
  topArtists: Array<{ name: string; count: number }>;
  topSongs: Array<{ id: number; name: string; count: number }>;
}

export function buildListeningInsight(label: string, records: PlayRecord[]): ListeningInsight {
  const artistCounts = new Map<string, number>();
  const songCounts = new Map<number, { id: number; name: string; count: number }>();

  for (const record of records) {
    const count = record.playCount || 1;
    const song = record.song;
    songCounts.set(song.id, {
      id: song.id,
      name: song.name,
      count: (songCounts.get(song.id)?.count || 0) + count,
    });
    for (const artist of song.artists) {
      artistCounts.set(artist.name, (artistCounts.get(artist.name) || 0) + count);
    }
  }

  return {
    label,
    totalSongs: records.length,
    uniqueSongs: songCounts.size,
    topArtists: [...artistCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count })),
    topSongs: [...songCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
  };
}

export function formatInsightMarkdown(insight: ListeningInsight): string {
  const lines = [`# Listening Insight: ${insight.label}`, ''];
  lines.push(`- Total records: ${insight.totalSongs}`);
  lines.push(`- Unique songs: ${insight.uniqueSongs}`);
  lines.push('');
  lines.push('## Top Artists');
  for (const artist of insight.topArtists.slice(0, 10)) {
    lines.push(`- ${artist.name}: ${artist.count}`);
  }
  lines.push('');
  lines.push('## Top Songs');
  for (const song of insight.topSongs.slice(0, 10)) {
    lines.push(`- ${song.name} (${song.id}): ${song.count}`);
  }
  return lines.join('\n');
}
