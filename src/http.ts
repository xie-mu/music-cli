/**
 * HTTP request manager for NetEase Cloud Music API
 * - Automatic Cookie persistence
 * - Automatic weapi encryption for POST requests
 * - Browser-like headers for anti-bot avoidance
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { eapiEncrypt, eapiDecrypt, weapiEncrypt } from './crypto.js';
import { NeteaseError, apiCodeToHint } from './error.js';
import { Config, NeteaseResponse } from './types/core.js';

// Browser-like headers to avoid being blocked
const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
  Referer: 'https://music.163.com',
};

export class CookieManager {
  constructor(private cookiePath: string) {}

  load(): string | null {
    if (!existsSync(this.cookiePath)) return null;
    try {
      const data = JSON.parse(readFileSync(this.cookiePath, 'utf-8'));
      return data.cookie || null;
    } catch {
      return null;
    }
  }

  save(cookieString: string): void {
    const dir = dirname(this.cookiePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(this.cookiePath, JSON.stringify({ cookie: cookieString }), 'utf-8');
  }

  clear(): void {
    if (existsSync(this.cookiePath)) {
      unlinkSync(this.cookiePath);
    }
  }
}

export class NeteaseAPI {
  private cookieManager: CookieManager;
  private cookie: string | null;
  private baseUrl = 'https://music.163.com';

  constructor(config: Config) {
    this.cookieManager = new CookieManager(config.cookieFile);
    this.cookie = config.cookie || this.cookieManager.load();
  }

  setCookie(cookie: string): void {
    this.cookie = cookie;
    this.cookieManager.save(cookie);
  }

  getCookie(): string | null {
    return this.cookie;
  }

  clearCookie(): void {
    this.cookie = null;
    this.cookieManager.clear();
  }

  async request<T = any>(
    path: string,
    params?: Record<string, any>,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<NeteaseResponse<T>> {
    let url: string;
    let body: string | undefined;
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    // For full URL paths (already containing host), use as-is
    if (path.startsWith('http')) {
      url = path;
    } else {
      url = this.baseUrl + path;
    }

    if (params && method === 'POST') {
      const encoded = eapiEncrypt(url, params);
      body = encoded.body;
      url = encoded.url;
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (params) {
      const searchParams = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        searchParams.set(k, String(v));
      }
      url += '?' + searchParams.toString();
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
          throw new NeteaseError('TIMEOUT', '请求超时', '请检查网络连接或增加 --timeout', 1);
        }
        if (err.message.includes('fetch')) {
          throw new NeteaseError('NETWORK', '网络请求失败', '请检查网络连接或代理设置', 1);
        }
      }
      throw new NeteaseError('NETWORK', `请求失败: ${err}`, undefined, 1);
    }

    if (!response.ok) {
      throw new NeteaseError('API_ERROR', `HTTP ${response.status}: ${response.statusText}`, undefined, 1);
    }

    let data: NeteaseResponse<T>;

    // For eapi POST requests, response is binary → hex → decrypt
    if (method === 'POST' && body) {
      const arrayBuffer = await response.arrayBuffer();
      const rawHex = Buffer.from(arrayBuffer).toString('hex').toUpperCase();
      try {
        data = eapiDecrypt(rawHex);
      } catch {
        // If decryption fails, try parsing as JSON
        try {
          data = JSON.parse(Buffer.from(arrayBuffer).toString('utf-8'));
        } catch {
          throw new NeteaseError('API_ERROR', `无法解密响应: ${rawHex.substring(0, 60)}`, undefined, 1);
        }
      }
    } else {
      // For GET requests, response is plain JSON
      const rawText = await response.text();
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new NeteaseError('API_ERROR', `无法解析响应: ${rawText.substring(0, 100)}`, undefined, 1);
      }
    }

    if (data.code !== 200 && data.code !== undefined) {
      // 301 = session expired / need login — show friendly message
      if (data.code === 301) {
        throw new NeteaseError('AUTH', '登录已过期，请重新登录', '执行 nm auth login --qrcode 重新登录');
      }
      const hint = apiCodeToHint(data.code);
      throw new NeteaseError('API_ERROR', `API 错误 (${data.code}): ${data.message || '未知错误'}`, hint || undefined, 1);
    }

    return data;
  }

  async requestWeapi<T = any>(
    path: string,
    params: Record<string, any> = {}
  ): Promise<NeteaseResponse<T>> {
    const url = path.startsWith('http')
      ? path
      : this.baseUrl + path.replace('/api/', '/weapi/');
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const csrfToken = this.cookie ? /(?:^|;)\s*__csrf=([^;]+)/.exec(this.cookie)?.[1] || '' : '';
    const encrypted = weapiEncrypt({ ...params, csrf_token: csrfToken });
    const body = new URLSearchParams(encrypted).toString();

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30000),
      });
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
          throw new NeteaseError('TIMEOUT', '璇锋眰瓒呮椂', '璇锋鏌ョ綉缁滆繛鎺ユ垨澧炲姞 --timeout', 1);
        }
        if (err.message.includes('fetch')) {
          throw new NeteaseError('NETWORK', '缃戠粶璇锋眰澶辫触', '璇锋鏌ョ綉缁滆繛鎺ユ垨浠ｇ悊璁剧疆', 1);
        }
      }
      throw new NeteaseError('NETWORK', `璇锋眰澶辫触: ${err}`, undefined, 1);
    }

    if (!response.ok) {
      throw new NeteaseError('API_ERROR', `HTTP ${response.status}: ${response.statusText}`, undefined, 1);
    }

    const rawText = await response.text();
    let data: NeteaseResponse<T>;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new NeteaseError('API_ERROR', `鏃犳硶瑙ｆ瀽鍝嶅簲: ${rawText.substring(0, 100)}`, undefined, 1);
    }

    if (data.code !== 200 && data.code !== undefined) {
      if (data.code === 301) {
        throw new NeteaseError('AUTH', 'Login expired, please log in again', 'Run nm auth login --qrcode');
      }
      const hint = apiCodeToHint(data.code);
      throw new NeteaseError('API_ERROR', `API 閿欒 (${data.code}): ${data.message || '鏈煡閿欒'}`, hint || undefined, 1);
    }

    return data;
  }
}
