import { CapabilityResult, Song, capabilityResult } from '../domain/models.js';
import { NeteaseAPI } from '../http.js';
import { MusicService } from './music.js';
import { UserService } from './user.js';

export class LibraryService {
  constructor(
    private api: NeteaseAPI,
    private user: UserService,
    private music: MusicService
  ) {}

  async liked(uid?: number): Promise<CapabilityResult<Song[]>> {
    let targetUid = uid;
    if (!targetUid) {
      const account = await this.user.account();
      targetUid = account.data.profile?.userId;
    }
    const data = await this.api.request('/api/song/like/get', { uid: targetUid });
    const ids = data.ids || data.data || [];
    const info = ids.length > 0 ? await this.music.getInfo(ids.slice(0, 500).map(Number)) : capabilityResult([], 'local:empty');
    return capabilityResult(info.data, 'netease:library/liked', {
      requiresAuth: !uid,
      raw: data,
      warnings: ids.length > 500 ? ['Only the first 500 liked songs were expanded to full metadata.'] : undefined,
    });
  }
}
