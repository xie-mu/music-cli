import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { NeteaseAPI } from '../http.js';
import { NeteaseConfig } from '../config.js';
import { NeteaseError } from '../error.js';
import { Command } from '../types/core.js';

async function loginPhone(config: NeteaseConfig, flags: Record<string, any>): Promise<void> {
  const phone = flags.phone || flags._positional?.[0];
  const password = flags.password || flags._positional?.[1];

  if (!phone || !password) {
    throw new NeteaseError('USAGE', '请提供手机号和密码', '用法: nm auth login --phone 138xxxx --password <pwd>');
  }

  const api = new NeteaseAPI(config);
  const md5 = createHash('md5').update(password).digest('hex');

  // Read response headers for cookie
  const response = await fetch('https://music.163.com/api/login/cellphone', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://music.163.com',
    },
    body: new URLSearchParams({
      phone,
      password: md5,
      countrycode: flags.countryCode || config.countryCode || '86',
    }).toString(),
  });

  const data = await response.json();

  if (data.code !== 200) {
    const msg = data.message || '登录失败';
    throw new NeteaseError('AUTH', msg, data.code === 502 ? '请检查手机号和密码' : undefined);
  }

  // Extract cookie from response headers
  const cookieHeader = response.headers.get('set-cookie') || '';
  // Extract MUSIC_U and __csrf
  const cookieParts: string[] = [];
  if (cookieHeader) {
    const cookies = cookieHeader.split(',').map(c => c.split(';')[0].trim());
    for (const c of cookies) {
      if (c.startsWith('MUSIC_U=') || c.startsWith('__csrf=') || c.startsWith('MUSIC_A=')) {
        cookieParts.push(c);
      }
    }
  }

  if (cookieParts.length === 0) {
    throw new NeteaseError('AUTH', '登录成功但未获取到 Cookie，请尝试二维码登录', 'nm auth login --qrcode');
  }

  const cookieStr = cookieParts.join('; ');
  api.setCookie(cookieStr);

  if (!config.quiet) {
    const user = data.profile || data.account;
    const name = user?.nickname || '未知用户';
    process.stdout.write(`✅ 登录成功: ${name}\n`);
  }
}

async function loginQrcode(config: NeteaseConfig): Promise<void> {
  const api = new NeteaseAPI(config);

  // Step 1: Get QR code key
  const keyResp = await fetch('https://music.163.com/api/login/qrcode/unikey', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://music.163.com',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ type: '1' }).toString(),
  });
  const keyData = await keyResp.json();
  if (keyData.code !== 200) throw new NeteaseError('AUTH', `获取二维码失败: ${keyData.message || ''}`);
  const unikey = keyData.unikey;

  // Step 2: Show QR code URL
  const qrUrl = `https://music.163.com/login?codekey=${unikey}`;
  process.stdout.write('\n');
  process.stdout.write('  ╔════════════════════════════════════════════════╗\n');
  process.stdout.write('  ║          网易云音乐 二维码登录                ║\n');
  process.stdout.write('  ╠════════════════════════════════════════════════╣\n');
  process.stdout.write('  ║  ① 在手机上打开网易云音乐 App                ║\n');
  process.stdout.write('  ║  ② 点击"扫一扫"扫描下方二维码               ║\n');
  process.stdout.write('  ║  ③ 扫码成功后回到此终端按 Enter 确认         ║\n');
  process.stdout.write('  ╚════════════════════════════════════════════════╝\n');
  process.stdout.write('\n');
  process.stdout.write(`  📱 二维码链接: ${qrUrl}\n`);
  process.stdout.write('\n');
  process.stdout.write('  等待扫码...\n');
  process.stdout.write('  (扫描完成后在此按 Enter 键继续)\n');
  await new Promise<void>(resolve => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.once('line', () => { rl.close(); resolve(); });
  });

  process.stdout.write('正在确认登录...\n');

  // Step 3: Poll for scan result (shorter poll since user already scanned)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const checkResp = await fetch(
      `https://music.163.com/api/login/qrcode/client?unikey=${unikey}&type=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://music.163.com' } }
    );
    const checkData = await checkResp.json();

    if (checkData.code === 803) {
      // Success! Need to follow redirect to get cookie
      for (const url of checkData.nickname ? [checkData.url] : (checkData.urls || [])) {
        const redirectResp = await fetch(url, {
          redirect: 'manual',
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        const cookieHeader = redirectResp.headers.get('set-cookie') || '';
        const cookieParts: string[] = [];
        const cookies = cookieHeader.split(',').map(c => c.split(';')[0].trim());
        for (const c of cookies) {
          if (c.startsWith('MUSIC_U=') || c.startsWith('__csrf=') || c.startsWith('MUSIC_A=')) {
            cookieParts.push(c);
          }
        }
        if (cookieParts.length > 0) {
          api.setCookie(cookieParts.join('; '));
          process.stdout.write(`✅ 登录成功\n`);
          return;
        }
      }
      throw new NeteaseError('AUTH', '扫码成功但获取 Cookie 失败');
    } else if (checkData.code === 800) {
      throw new NeteaseError('AUTH', '二维码已过期，请重新执行 nm auth login --qrcode');
    } else if (checkData.code === 802) {
      process.stdout.write('已扫码，确认中...\n');
    }
    // 801 = 等待扫码, continue polling
  }

  throw new NeteaseError('TIMEOUT', '确认登录超时');
}

export const authLoginCommand: Command = {
  name: 'auth login',
  description: '登录网易云音乐（手机号/二维码）',
  usage: 'nm auth login --phone <number> --password <pwd> | nm auth login --qrcode',
  options: [
    { flag: '--phone <number>', description: '手机号' },
    { flag: '--password <pwd>', description: '密码（明文）' },
    { flag: '--qrcode', description: '二维码登录' },
    { flag: '--country-code <code>', description: '国家码（默认86）' },
  ],
  examples: [
    'nm auth login --phone 138xxxx --password mypwd',
    'nm auth login --qrcode',
  ],
  async run(config, flags) {
    if (flags.qrcode) {
      await loginQrcode(config);
    } else {
      await loginPhone(config, flags);
    }
  },
};

export const authStatusCommand: Command = {
  name: 'auth status',
  description: '检查登录状态',
  usage: 'nm auth status',
  options: [],
  examples: ['nm auth status', 'nm auth status --output json'],
  async run(config, flags) {
    const api = new NeteaseAPI(config);
    const cookie = api.getCookie();

    if (!cookie) {
      process.stdout.write('未登录\n');
      process.stdout.write('请执行 nm auth login 登录\n');
      return;
    }

    try {
      const data = await api.request('/api/nuser/account/get');
      const account = data.account || data;
      const nickname = data.profile?.nickname || account.nickname || '';
      if (account.id || data.profile?.userId) {
        const userId = account.id || data.profile?.userId;
        const levelResp = await api.request('/api/user/level').catch(() => null);
        const level = levelResp && typeof levelResp === 'object' && 'data' in levelResp
          ? (levelResp as any).data : null;
        if (config.output === 'json') {
          process.stdout.write(JSON.stringify({
            status: 'authenticated',
            userId,
            nickname,
            level: level?.level || '?',
            vipType: account.vipType || 0,
          }, null, 2) + '\n');
        } else {
          process.stdout.write(`✅ 已登录: ${nickname || userId}\n`);
          if (level?.level) process.stdout.write(`   等级: ${level.level}\n`);
        }
      } else {
        process.stdout.write('⚠️ Cookie 已过期，请重新登录 (nm auth login --qrcode)\n');
      }
    } catch (err) {
      if (err instanceof NeteaseError && err.code === 'API_ERROR') {
        process.stdout.write('⚠️ Cookie 已过期或无效，请重新登录 (nm auth login --qrcode)\n');
      } else {
        process.stdout.write(`⚠️ 无法验证登录状态: ${err}\n`);
      }
    }
  },
};

export const authLogoutCommand: Command = {
  name: 'auth logout',
  description: '退出登录',
  usage: 'nm auth logout',
  options: [],
  examples: ['nm auth logout'],
  async run(config, flags) {
    const api = new NeteaseAPI(config);
    try {
      await api.request('/api/logout');
    } catch { /* ignore */ }
    api.clearCookie();
    process.stdout.write('已退出登录\n');
  },
};
