import { Config } from '../types/core.js';
import { NeteaseAPI } from '../http.js';
import { LocalStore } from '../state/local-store.js';
import { AlbumService } from './album.js';
import { LibraryService } from './library.js';
import { MusicService } from './music.js';
import { PlaylistService } from './playlist.js';
import { QueueService } from './queue.js';
import { RecommendService } from './recommend.js';
import { SearchService } from './search.js';
import { ToplistService } from './toplist.js';
import { UserService } from './user.js';

export interface NeteaseServices {
  api: NeteaseAPI;
  store: LocalStore;
  music: MusicService;
  search: SearchService;
  playlist: PlaylistService;
  album: AlbumService;
  user: UserService;
  recommend: RecommendService;
  toplist: ToplistService;
  library: LibraryService;
  queue: QueueService;
}

export function createNeteaseServices(config: Config): NeteaseServices {
  const api = new NeteaseAPI(config);
  const store = new LocalStore(config.stateDir);
  const music = new MusicService(api, config, store);
  const search = new SearchService(api, store);
  const playlist = new PlaylistService(api, store);
  const album = new AlbumService(api, store);
  const user = new UserService(api, store);
  const recommend = new RecommendService(api);
  const toplist = new ToplistService(api);
  const library = new LibraryService(api, user, music);
  const queue = new QueueService(store);

  return { api, store, music, search, playlist, album, user, recommend, toplist, library, queue };
}

export * from './album.js';
export * from './insight.js';
export * from './library.js';
export * from './music.js';
export * from './playlist.js';
export * from './queue.js';
export * from './recommend.js';
export * from './search.js';
export * from './toplist.js';
export * from './user.js';
