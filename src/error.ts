import { NeteaseResponse, OutputFormat } from './types/core.js';

export type ErrorCode = 'AUTH' | 'USAGE' | 'NETWORK' | 'TIMEOUT' | 'API_ERROR' | 'GENERAL';

/** NetEase API error code to human-readable hint mapping */
const API_CODE_HINTS: Record<string, string> = {
  '301': '需要登录，请先执行 nm auth login',
  '302': '需要登录或登录已过期，请重新登录',
  '502': '参数错误，请检查输入参数',
  '400': '请求参数不正确',
  '403': '无权访问该资源',
  '404': '请求的资源不存在',
  '503': '服务暂时不可用，请稍后重试',
  '-460': '请求过于频繁，请稍后重试',
  '-461': '请求频率超限，请放慢速度',
  '-462': '需要输入验证码',
  '-463': '需要验证手机号',
};

export function apiCodeToHint(code: number): string | null {
  return API_CODE_HINTS[String(code)] || null;
}

export function isApiSuccess(response: NeteaseResponse): boolean {
  return response.code === 200;
}

/** Structured error following Bailian bl CLI's BlError pattern */
export class NeteaseError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public hint?: string,
    public exitCode: number = 1,
    public cause?: Error
  ) {
    super(message);
    this.name = 'NeteaseError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      exitCode: this.exitCode,
    };
  }
}

/** Handle errors with consistent formatting */
export function handleError(error: unknown, output: OutputFormat): never {
  if (error instanceof NeteaseError) {
    if (output === 'json') {
      process.stderr.write(JSON.stringify(error.toJSON(), null, 2) + '\n');
    } else {
      process.stderr.write(`Error [${error.code}]: ${error.message}\n`);
      if (error.hint) process.stderr.write(`Hint: ${error.hint}\n`);
    }
    process.exit(error.exitCode);
  }

  // Network errors
  if (error instanceof TypeError && error.message === 'fetch failed') {
    if (output === 'json') {
      process.stderr.write(JSON.stringify({ code: 'NETWORK', message: error.message }) + '\n');
    } else {
      process.stderr.write(`Error [NETWORK]: ${error.message}\n`);
      process.stderr.write('Hint: Check your network connection.\n');
    }
    process.exit(1);
  }

  // Unknown errors
  const msg = error instanceof Error ? error.message : String(error);
  if (output === 'json') {
    process.stderr.write(JSON.stringify({ code: 'GENERAL', message: msg }) + '\n');
  } else {
    process.stderr.write(`Error: ${msg}\n`);
  }
  process.exit(1);
}
