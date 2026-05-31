import { LocalStore } from '../state/local-store.js';

export interface QueueSongInput {
  id: number;
  name?: string;
  artist?: string;
}

export interface QueueItem {
  songId: number;
  name: string;
  artist?: string;
  addedAt: string;
}

interface QueueState {
  items: QueueItem[];
  currentIndex: number;
}

const QUEUE_NAMESPACE = 'queue';
const QUEUE_KEY = 'default';

export class QueueService {
  constructor(private store: LocalStore) {}

  async add(song: QueueSongInput): Promise<QueueItem> {
    const state = await this.readState();
    const item: QueueItem = {
      songId: song.id,
      name: song.name || String(song.id),
      artist: song.artist,
      addedAt: new Date().toISOString(),
    };
    await this.writeState({ ...state, items: [...state.items, item] });
    await this.store.appendEvent('queue_add', { songId: item.songId, name: item.name });
    return item;
  }

  async list(): Promise<QueueItem[]> {
    return (await this.readState()).items;
  }

  async remove(index: number): Promise<QueueItem | null> {
    const state = await this.readState();
    const removeIndex = index - 1;
    if (removeIndex < 0 || removeIndex >= state.items.length) return null;
    const removed = state.items[removeIndex];
    const items = state.items.filter((_, idx) => idx !== removeIndex);
    const currentIndex = state.currentIndex >= items.length ? Math.max(items.length - 1, -1) : state.currentIndex;
    await this.writeState({ items, currentIndex });
    await this.store.appendEvent('queue_remove', { songId: removed.songId, index });
    return removed;
  }

  async clear(): Promise<void> {
    await this.writeState({ items: [], currentIndex: -1 });
    await this.store.appendEvent('queue_clear', {});
  }

  async next(): Promise<QueueItem | null> {
    const state = await this.readState();
    if (state.items.length === 0) return null;
    const nextIndex = state.currentIndex < 0 ? 0 : Math.min(state.currentIndex + 1, state.items.length - 1);
    await this.writeState({ ...state, currentIndex: nextIndex });
    const item = state.items[nextIndex];
    await this.store.appendEvent('queue_next', { songId: item.songId, index: nextIndex + 1 });
    return item;
  }

  async getCurrent(): Promise<QueueItem | null> {
    const state = await this.readState();
    return state.currentIndex >= 0 ? state.items[state.currentIndex] || null : null;
  }

  private async readState(): Promise<QueueState> {
    return await this.store.getCache<QueueState>(QUEUE_NAMESPACE, QUEUE_KEY) || { items: [], currentIndex: -1 };
  }

  private async writeState(state: QueueState): Promise<void> {
    await this.store.setCache(QUEUE_NAMESPACE, QUEUE_KEY, state);
  }
}
