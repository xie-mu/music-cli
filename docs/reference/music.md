# `nm music` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm music info` | Get song details |
| `nm music url` | Get song play URL |
| `nm music lyric` | Get LRC lyrics (--sync for timed sync) |
| `nm music download` | Download song to local file |
| `nm music play` | Open or prepare playback through Orpheus/browser handoff |
| `nm music like` | Like a song |
| `nm music unlike` | Unlike a song |

## Command details

### `nm music info`

| Field | Value |
|---|---|
| **Name** | `music info` |
| **Description** | Get song details (name, artist, album, duration) |
| **Usage** | `nm music info --id <songId> [--ids id1,id2]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |
| `--ids <ids>` | string | no | Comma-separated multiple IDs |

#### Examples

```bash
nm music info --id 186016
nm music info --id 1807799505 --output json
nm music info --ids 186016,1807799505 --output json
```

### `nm music url`

| Field | Value |
|---|---|
| **Name** | `music url` |
| **Description** | Get song play URL from CDN |
| **Usage** | `nm music url --id <songId> [--br 320000]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |
| `--br <br>` | number | no | Bitrate: 128000/192000/320000/999000 |

#### Note

CDN URLs may return 403 due to regional/copyright restrictions. Use `nm music play` for reliable playback through the web player.

#### Examples

```bash
nm music url --id 1807799505
nm music url --id 1807799505 --br 999000 --output json
```

### `nm music lyric`

| Field | Value |
|---|---|
| **Name** | `music lyric` |
| **Description** | Get LRC lyrics |
| **Usage** | `nm music lyric --id <songId> [--sync]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |
| `--sync` | boolean | no | Synchronized mode: press Enter when playback starts |

#### Sync mode

In `--sync` mode, the CLI displays a live-updating lyrics view. Press Enter when you start playback, and lyrics scroll in real-time. Translation lines shown when available. Press `q` to quit.

#### Examples

```bash
nm music lyric --id 186016
nm music lyric --id 1807799505 --sync
```

### `nm music download`

| Field | Value |
|---|---|
| **Name** | `music download` |
| **Description** | Download song to local file |
| **Usage** | `nm music download --id <songId> [--out <path>] [--br 320000]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |
| `--out <path>` | string | no | Output file path (default: downloadDir/songname.mp3) |
| `--br <br>` | number | no | Bitrate (default: 320000) |

#### Note

Direct downloads may fail (403) due to CDN restrictions. Use `nm music play` for reliable playback.

#### Examples

```bash
nm music download --id 1807799505
nm music download --id 1807799505 --out ./唯一.mp3
```

### `nm music play`

| Field | Value |
|---|---|
| **Name** | `music play` |
| **Description** | Play song through the official desktop/browser handoff, or return the link silently |
| **Usage** | `nm music play --id <songId> [--br 320000] [--player orpheus|browser] [--no-open]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |
| `--br <br>` | number | no | Bitrate (default: 320000) |
| `--player <name>` | string | no | `orpheus` to force desktop protocol, `browser` to force web player, omitted for auto |
| `--no-open` | boolean | no | Do not open browser; only return the official song URL |

#### Playback flow

Default mode delegates to `src/player.ts`. On Windows, auto mode attempts the
official `orpheus://` desktop protocol first and falls back to
`https://music.163.com/#/song?id=X` in the browser if the protocol handoff
cannot be launched. On other platforms, browser handoff is the normal path.

The CLI reports handoff intent only; it does not prove that audio is playing.
Use `nm smtc status` when the NetEase desktop client exposes a Windows media
session and you need local status/control evidence. Use `--no-open` for
Agent/headless runs where you only want the URL and local playback intent
recorded.

#### Examples

```bash
nm music play --id 1807799505
nm music play --id 1807799505 --player browser
nm music play --id 1807799505 --player orpheus --output json
nm music play --id 1807799505 --no-open --output json
```

### `nm music like`

| Field | Value |
|---|---|
| **Name** | `music like` |
| **Description** | Like a song (requires auth) |
| **Usage** | `nm music like --id <songId>` |

#### Examples

```bash
nm music like --id 1807799505
```

### `nm music unlike`

| Field | Value |
|---|---|
| **Name** | `music unlike` |
| **Description** | Unlike a song |
| **Usage** | `nm music unlike --id <songId>` |

#### Examples

```bash
nm music unlike --id 1807799505
```
