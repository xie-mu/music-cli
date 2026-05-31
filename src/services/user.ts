import { NeteaseAPI } from '../http.js';
import {
  CapabilityResult,
  PlayRecord,
  UserProfile,
  capabilityResult,
  normalizePlayRecord,
  normalizeUserProfile,
} from '../domain/models.js';
import { NeteaseError } from '../error.js';
import { LocalStore } from '../state/local-store.js';

export class UserService {
  constructor(private api: NeteaseAPI, private store?: LocalStore) {}

  async profile(uid?: number): Promise<CapabilityResult<UserProfile>> {
    const data = uid
      ? await this.api.request('/api/v1/user/detail', { uid })
      : await this.api.request('/api/nuser/account/get');
    return capabilityResult(normalizeUserProfile(data), uid ? 'netease:user/detail' : 'netease:user/account', {
      requiresAuth: !uid,
      raw: data,
    });
  }

  async account(): Promise<CapabilityResult<any>> {
    const data = await this.api.request('/api/nuser/account/get');
    return capabilityResult(data, 'netease:user/account', { requiresAuth: true, raw: data });
  }

  async history(uid?: number, type: 'all' | 'week' = 'all'): Promise<CapabilityResult<PlayRecord[]>> {
    let targetUid = uid;
    if (!targetUid) {
      const profile = await this.api.request('/api/nuser/account/get');
      targetUid = profile?.profile?.userId;
    }
    if (!targetUid) {
      throw new NeteaseError('AUTH', 'Unable to resolve user id', 'Login first or provide --uid');
    }

    const recordType = type === 'week' ? 1 : 0;
    const data = await this.api.request('/api/v1/playlist/record', { uid: targetUid, type: recordType });
    const records = recordType === 0 ? data.allData : data.weekData;
    const normalized = (records || []).map(normalizePlayRecord);
    await this.store?.appendEvent('history_sync', { uid: targetUid, type, count: normalized.length });
    return capabilityResult(normalized, 'netease:user/history', { requiresAuth: !uid, raw: data });
  }

  async level(): Promise<CapabilityResult<any>> {
    const data = await this.api.request('/api/user/level');
    return capabilityResult(data, 'netease:user/level', { requiresAuth: true, raw: data });
  }

  async subcount(): Promise<CapabilityResult<any>> {
    const data = await this.api.request('/api/user/subcount');
    return capabilityResult(data, 'netease:user/subcount', { requiresAuth: true, raw: data });
  }
}
