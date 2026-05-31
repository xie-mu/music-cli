/**
 * NetEase Cloud Music encryption implementation.
 * Three encryption methods reverse-engineered from NetEase Web:
 *
 * 1. weapi: Double AES-128-CBC + RSA (legacy)
 * 2. linuxapi: AES-128-ECB → /api/linux/forward (currently returning 500)
 * 3. eapi: AES-128-ECB with MD5 digest (what modern endpoints actually use!)
 *
 * The CORRECT eapi method (used by NetEase Web since ~2023):
 *   key = "e82ckenh8dichen8"
 *   digest = MD5("nobody${url}use${text}md5forencrypt")
 *   data = "${url}-36cd479b6b5-${text}-36cd479b6b5-${digest}"
 *   params = AES-ECB-encrypt(data) → uppercase hex
 *   POST to original URL with params=XXX
 */
import { createCipheriv, createDecipheriv, randomBytes, createPublicKey, publicEncrypt, constants, createHash } from 'node:crypto';

// ── eapi (the one that actually works) ───────────────────────
const EAPI_KEY = 'e82ckenh8dichen8';

/** AES-128-ECB encrypt → uppercase hex */
function aesEcbEncrypt(text: string, key: string): string {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(key), null as any);
  return (cipher.update(text, 'utf-8', 'hex') + cipher.final('hex')).toUpperCase();
}

/**
 * Device header for eapi requests (mimics NetEase iPhone client).
 */
export function buildEapiHeader(csrfToken = ''): Record<string, string> {
  return {
    osver: '16.2', // iOS version
    deviceId: `D${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    os: 'iPhone OS',
    appver: '9.0.90',
    versioncode: '140',
    mobilename: '',
    buildver: Date.now().toString().slice(0, 10),
    resolution: '1920x1080',
    __csrf: csrfToken,
    channel: 'distribution',
    requestId: `${Date.now()}_${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
  };
}

/**
 * eapi encryption — THE CORRECT ONE modern NetEase Web/App uses.
 *
 * Key differences from the wrong linuxapi approach:
 * - URL goes to `/eapi/...` NOT `/api/linux/forward`
 * - Body param is `params=XXX` (not `eparams=XXX`)
 * - Response is ALSO encrypted and needs decryption
 * - Requires device header in the params
 */
export function eapiEncrypt(
  apiPath: string,
  params: Record<string, any>,
  csrfToken = ''
): { url: string; body: string } {
  // KEY INSIGHT: eapi uses the ORIGINAL /api/ URL path for the digest calculation,
  // but sends the POST to the /eapi/ endpoint.
  const originalPath = apiPath.startsWith('http')
    ? new URL(apiPath).pathname
    : apiPath;
  const eapiPath = originalPath.replace('/api/', '/eapi/'); // e.g., /eapi/song/xxx

  // Add device header to params
  const fullParams = {
    ...params,
    header: buildEapiHeader(csrfToken),
    e_r: true, // Enable response encryption
  };

  const text = JSON.stringify(fullParams);
  // Digest uses ORIGINAL path (/api/...), NOT /eapi/...
  const digest = createHash('md5').update(`nobody${originalPath}use${text}md5forencrypt`).digest('hex');
  const data = `${originalPath}-36cd479b6b5-${text}-36cd479b6b5-${digest}`;
  const encrypted = aesEcbEncrypt(data, EAPI_KEY);

  return {
    url: `https://music.163.com${eapiPath}`,
    body: new URLSearchParams({ params: encrypted }).toString(),
  };
}

// ── linuxapi (fallback, currently broken) ────────────────────
const LINUXAPI_KEY = Buffer.from('7246674226682325323F5E6544673A51', 'hex').toString('utf-8');

export function linuxapiEncode(method: string, url: string, params: Record<string, any>): { body: string; url: string } {
  const cleanUrl = url.startsWith('http') ? url.replace(/https?:\/\/[^\/]+/, '') : url;
  const data = { method, url: cleanUrl, params };
  const encrypted = aesEcbEncrypt(JSON.stringify(data), LINUXAPI_KEY);
  return {
    body: new URLSearchParams({ eparams: encrypted }).toString(),
    url: 'https://music.163.com/api/linux/forward',
  };
}

/**
 * Decrypt an eapi-encrypted response.
 * The server returns raw binary → convert to hex → AES-ECB decrypt.
 * Response format: hex-encoded AES-ECB encrypted JSON.
 */
export function eapiDecrypt(encryptedHex: string): any {
  const hex = encryptedHex.replace(/[^0-9a-fA-F]/g, '');
  if (hex.length === 0) throw new Error('Empty encrypted response');

  try {
    const decipher = createDecipheriv('aes-128-ecb', Buffer.from(EAPI_KEY), null as any);
    decipher.setAutoPadding(true);
    const decoded = decipher.update(hex, 'hex', 'utf-8') + decipher.final('utf-8');
    return JSON.parse(decoded);
  } catch {
    // Try with zero padding (some older responses)
    try {
      const decipher2 = createDecipheriv('aes-128-ecb', Buffer.from(EAPI_KEY), null as any);
      decipher2.setAutoPadding(false);
      let plain = decipher2.update(hex, 'hex', 'binary') + decipher2.final('binary');
      // Strip PKCS7 padding
      const padLen = plain.charCodeAt(plain.length - 1);
      if (padLen > 0 && padLen <= 16) plain = plain.slice(0, -padLen);
      return JSON.parse(plain);
    } catch {
      return { raw: encryptedHex };
    }
  }
}

// ── weapi (fallback) ────────────────────────────────────
const IV = Buffer.from('0102030405060708', 'utf-8');
const PRESET_KEY = Buffer.from('0CoJUm6Qyw8W8jud');
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const PUBLIC_KEY = createPublicKey({
  key: {
    kty: 'RSA',
    n: '4LUJ9iWd-GQtvDVmKQFHffImd-wVK1_2is5hW7e3JRUrOrF6h2rqilqnbS5BdinsTuNB9WE1_M9pUoAQTgMS7L2pJVfJOHARSvbJ0FxPfww2hbeka-4lWTJXXM4QtCTYE8_kh10-ggR7l93vUnQdVGuOKJ3Gk1s-zgRi2woiuOc',
    e: 'AQAB',
  },
  format: 'jwk',
});

function aesEncrypt(buffer: Buffer, key: Buffer): Buffer {
  const cipher = createCipheriv('aes-128-cbc', key, IV);
  return Buffer.concat([cipher.update(buffer), cipher.final()]);
}

function rsaEncrypt(buffer: Buffer): Buffer {
  const padded = Buffer.concat([Buffer.alloc(128 - buffer.length), buffer]);
  return publicEncrypt({ key: PUBLIC_KEY, padding: constants.RSA_NO_PADDING }, padded);
}

export function weapiEncrypt(params: Record<string, any>): { params: string; encSecKey: string } {
  const text = JSON.stringify(params);
  const layer1 = aesEncrypt(Buffer.from(text, 'utf-8'), PRESET_KEY);
  const layer1Base64 = layer1.toString('base64');
  const rawBytes = randomBytes(16);
  const secretKeyBytes = Buffer.from(Array.from(rawBytes).map(b => BASE62[b % 62].charCodeAt(0)));
  const layer2 = aesEncrypt(Buffer.from(layer1Base64, 'utf-8'), secretKeyBytes);
  const reversedKey = Buffer.from(secretKeyBytes).reverse();
  const encSecKey = rsaEncrypt(reversedKey).toString('hex');
  return { params: layer2.toString('base64'), encSecKey };
}
