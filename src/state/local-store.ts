import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface LocalEvent {
  id: string;
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface ReadEventOptions {
  type?: string;
  limit?: number;
}

function safeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function ensureParent(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export class LocalStore {
  constructor(private rootDir: string) {}

  getRootDir(): string {
    return this.rootDir;
  }

  async appendEvent(type: string, payload: Record<string, unknown>): Promise<LocalEvent> {
    const event: LocalEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      payload,
    };
    const filePath = join(this.rootDir, 'events.jsonl');
    await ensureParent(filePath);
    await appendFile(filePath, JSON.stringify(event) + '\n', 'utf-8');
    return event;
  }

  async readEvents(options: ReadEventOptions = {}): Promise<LocalEvent[]> {
    const filePath = join(this.rootDir, 'events.jsonl');
    if (!existsSync(filePath)) return [];
    const content = await readFile(filePath, 'utf-8');
    const events = content
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => JSON.parse(line) as LocalEvent)
      .filter(event => !options.type || event.type === options.type);

    if (options.limit && options.limit > 0) {
      return events.slice(-options.limit);
    }
    return events;
  }

  async clearEvents(): Promise<void> {
    await rm(join(this.rootDir, 'events.jsonl'), { force: true });
  }

  async setCache(namespace: string, key: string, value: unknown): Promise<void> {
    const filePath = this.cachePath(namespace, key);
    await ensureParent(filePath);
    await writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
  }

  async getCache<T = unknown>(namespace: string, key: string): Promise<T | null> {
    const filePath = this.cachePath(namespace, key);
    if (!existsSync(filePath)) return null;
    return JSON.parse(await readFile(filePath, 'utf-8')) as T;
  }

  async clearNamespace(namespace: string): Promise<void> {
    await rm(join(this.rootDir, 'cache', safeSegment(namespace)), { recursive: true, force: true });
  }

  async clearAll(): Promise<void> {
    await rm(this.rootDir, { recursive: true, force: true });
  }

  private cachePath(namespace: string, key: string): string {
    return join(this.rootDir, 'cache', safeSegment(namespace), `${safeSegment(key)}.json`);
  }
}
