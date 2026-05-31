# `nm search / toplist / recommend` commands

Index: [index.md](index.md)

## search

| Command | Description |
|---|---|
| `nm search --keyword <text>` | Search songs, artists, albums, playlists |
| `nm search hot` | Hot search trends |
| `nm search suggest --keyword <text>` | Search suggestions |

### `nm search`

| Field | Value |
|---|---|
| **Name** | `search` |
| **Description** | Search NetEase Cloud Music |
| **Usage** | `nm search --keyword <text> [--type song|artist|album|playlist]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--keyword <text>` | string | yes | Search keyword |
| `--type <type>` | string | no | Type: song (default), artist, album, playlist |
| `--limit <n>` | number | no | Results per page (default: 20) |

#### Examples

```bash
nm search --keyword 告五人
nm search --keyword "Taylor Swift" --type artist
nm search --keyword 周杰伦 --output json
```

## toplist

| Command | Description |
|---|---|
| `nm toplist` | List all music charts |
| `nm toplist detail --id <id>` | Chart detail (top songs) |

### `nm toplist`

| Field | Value |
|---|---|
| **Name** | `toplist` |
| **Description** | List all NetEase music charts |
| **Usage** | `nm toplist` |

#### Examples

```bash
nm toplist
nm toplist --output json
```

## recommend

| Command | Description |
|---|---|
| `nm recommend songs` | Daily recommended songs |
| `nm recommend playlists` | Recommended playlists |

### `nm recommend songs`

| Field | Value |
|---|---|
| **Name** | `recommend songs` |
| **Description** | Get daily recommended songs |
| **Usage** | `nm recommend songs` |

#### Examples

```bash
nm recommend songs
```
