import { Config } from '../types/core.js';
import { PipelineEngine } from './executor.js';
import { createNeteaseServices, NeteaseServices } from '../services/index.js';

export const NETEASE_PIPELINE_STEP_TYPES = [
  'music/info',
  'music/lyric',
  'playlist/tracks',
  'playlist/summary',
  'user/history',
  'user/profile',
  'album/show',
  'search',
  'recommend/songs',
] as const;

type PartialPipelineServices = Partial<Pick<
  NeteaseServices,
  'music' | 'playlist' | 'user' | 'album' | 'search' | 'recommend'
>>;

function resolveServices(config: Config, provided?: PartialPipelineServices): NeteaseServices | PartialPipelineServices {
  return provided ?? createNeteaseServices(config);
}

function idsFromInput(input: any): number[] {
  if (Array.isArray(input.ids)) return input.ids.map(Number);
  if (typeof input.ids === 'string') return input.ids.split(',').map(Number);
  if (input.id !== undefined) return [Number(input.id)];
  return [];
}

export function registerNeteasePipelineBuiltins(
  engine: PipelineEngine,
  services?: PartialPipelineServices
): void {
  engine.register('music/info', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.music!.getInfo(idsFromInput(input));
    return result.data;
  });

  engine.register('music/lyric', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.music!.getLyric(Number(input.id));
    return result.data;
  });

  engine.register('playlist/tracks', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.playlist!.tracks(Number(input.id));
    return result.data;
  });

  engine.register('playlist/summary', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.playlist!.summary(Number(input.id));
    return result.data;
  });

  engine.register('user/history', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.user!.history(input.uid ? Number(input.uid) : undefined, input.type === 'week' ? 'week' : 'all');
    return result.data;
  });

  engine.register('user/profile', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.user!.profile(input.uid ? Number(input.uid) : undefined);
    return result.data;
  });

  engine.register('album/show', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.album!.show(Number(input.id));
    return result.data;
  });

  engine.register('search', async (_type, input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.search!.search(String(input.keyword || input.q || ''), input.type || 'song', Number(input.limit) || 20);
    return result.data;
  });

  engine.register('recommend/songs', async (_type, _input, config) => {
    const resolved = resolveServices(config, services);
    const result = await resolved.recommend!.songs();
    return result.data;
  });
}
