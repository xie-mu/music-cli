# `nm auth` commands

Index: [index.md](index.md)

> **Installation:** See [SKILL.md](../../SKILL.md#installation) for `npm install -g` instructions.
> Requires Node.js ≥ 22.12.0.

## Auth overview

NetEase Cloud Music uses **cookie-based authentication**. After login, credentials
persist in `~/.netease-music/cookie.json`. There is no API key — all requests are
authenticated by the session cookie (`MUSIC_U`).

### What requires auth

| Auth requirement | Command groups |
|---|---|
| **Required** | `user *`, `recommend *`, `music like/unlike`, `playlist list/create/add/import-album/remove/dedupe/merge`, `album list/sub/unsub`, `library liked`, `insight *` |
| **No NetEase login required** | `auth *`, `config *`, `search *`, `music info/url/lyric/download/play`, `playlist show/play/tracks/summary/export/audit`, `album show/dynamic/summary`, `toplist *`, `pipeline *`, `memory show/export`, `queue *`, `smtc *`, `nowplaying`, `doctor` |
| **Local sensitive without NetEase login** | `memory clear` deletes local CLI memory state and should be used only when requested |

### Auth methods

| Method | Command | Notes |
|---|---|---|
| **QR code** (recommended) | `nm auth login --qrcode` | Displays QR in terminal; scan with NetEase app |
| **Phone + password** | `nm auth login --phone <num> --password <pwd>` | Requires phone-bound account |

## Commands in this group

| Command | Description |
|---|---|
| `nm auth login` | Login with QR code or phone number |
| `nm auth status` | Check current login status |
| `nm auth logout` | Clear stored credentials |

## Command details

### `nm auth login`

| Field | Value |
|---|---|
| **Name** | `auth login` |
| **Description** | Login to NetEase Cloud Music |
| **Usage** | `nm auth login --qrcode` \| `nm auth login --phone <number> --password <pwd>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--qrcode` | boolean | no | QR code scan login |
| `--phone <number>` | string | no | Phone number |
| `--password <pwd>` | string | no | Account password |
| `--country-code <code>` | string | no | Country code (default: 86) |

#### Examples

```bash
nm auth login --qrcode
nm auth login --phone 138xxxxxxx --password mypassword
```

### `nm auth status`

| Field | Value |
|---|---|
| **Name** | `auth status` |
| **Description** | Check login status |
| **Usage** | `nm auth status` |

#### Examples

```bash
nm auth status
nm auth status --output json
```

### `nm auth logout`

| Field | Value |
|---|---|
| **Name** | `auth logout` |
| **Description** | Clear stored credentials |
| **Usage** | `nm auth logout` |

#### Examples

```bash
nm auth logout
```
