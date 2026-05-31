/**
 * Playwright-based auto-play for NetEase Cloud Music.
 * Opens headed browser, injects cookies, navigates to song, clicks play.
 * 
 * Usage: node player_playwright.mjs <songId>
 */
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const songId = process.argv[2] || '1807799505';

async function main() {
  // Load cookies
  const cookiePath = join(homedir(), '.netease-music', 'cookie.json');
  let cookieStr = '';
  if (existsSync(cookiePath)) {
    try {
      cookieStr = JSON.parse(readFileSync(cookiePath, 'utf-8')).cookie || '';
    } catch {}
  }

  // Parse cookies
  const cookies = cookieStr.split(';').map(c => {
    const eqIdx = c.indexOf('=');
    if (eqIdx < 0) return null;
    return {
      name: c.substring(0, eqIdx).trim(),
      value: c.substring(eqIdx + 1).trim(),
      domain: '.music.163.com',
      path: '/',
    };
  }).filter(Boolean);

  // Launch system Chrome (headed = visible to user)
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-gpu',
      '--no-sandbox',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    locale: 'zh-CN',
  });

  // Inject cookies
  if (cookies.length > 0) {
    await context.addCookies(cookies);
  }

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER]', msg.text());
  });

  // Navigate to song
  const url = `https://music.163.com/#/song?id=${songId}`;
  console.log(`🎵 Opening: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for page to fully render
  await page.waitForTimeout(2000);

  // Wait for page to fully render
  await page.waitForSelector('.m-playbar', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Click the play button using the correct selector
  const playBtn = await page.$('a.ply.j-flag[data-action="play"]');
  if (playBtn) {
    try {
      await playBtn.click();
      console.log('✅ 已自动点击播放按钮');
    } catch (e) {
      console.log('⚠️ 点击播放按钮失败:', e.message.substring(0, 60));
    }
  } else {
    console.log('⚠️ 未找到播放按钮');
  }

  // Keep browser open - user will close manually
  console.log('🎵 浏览器保持打开，音乐正在播放中...');
  console.log('💡 关闭浏览器窗口即可停止播放');
}

main().catch(console.error);
