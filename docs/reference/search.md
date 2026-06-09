# `nm search` commands

Index: [index.md](index.md)

> **Toplist and recommend commands** are now documented in [toplist.md](toplist.md).

## Commands in this group

| Command | Description | Auth |
|---|---|---|
| `nm search --keyword <text>` | Search songs, artists, albums, playlists | No |
| `nm search hot` | Hot search trends | No |
| `nm search suggest --keyword <text>` | Search suggestions | No |

## Command details

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

### `nm search hot`

| Field | Value |
|---|---|
| **Name** | `search hot` |
| **Description** | Get hot search trends |
| **Usage** | `nm search hot` |

#### Examples

```bash
nm search hot
```

### `nm search suggest`

| Field | Value |
|---|---|
| **Name** | `search suggest` |
| **Description** | Get search suggestions |
| **Usage** | `nm search suggest --keyword <text>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--keyword <text>` | string | yes | Search keyword |

#### Examples

```bash
nm search suggest --keyword 告五人
```
