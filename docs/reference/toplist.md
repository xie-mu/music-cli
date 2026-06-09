# `nm toplist / recommend` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description | Auth |
|---|---|---|
| `nm toplist` | List all NetEase charts | No |
| `nm toplist detail --id <id>` | List tracks in a chart | No |
| `nm recommend songs` | Daily recommended songs | Yes |
| `nm recommend playlists` | Recommended playlists | Yes |

## Command details

### `nm toplist`

| Field | Value |
|---|---|
| **Name** | `toplist` |
| **Description** | List all NetEase music charts |
| **Usage** | `nm toplist` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm toplist
nm toplist --output json
```

### `nm toplist detail`

| Field | Value |
|---|---|
| **Name** | `toplist detail` |
| **Description** | List tracks in a specific chart |
| **Usage** | `nm toplist detail --id <chartId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Chart ID |
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm toplist detail --id 3778678 --output json
```

### `nm recommend songs`

| Field | Value |
|---|---|
| **Name** | `recommend songs` |
| **Description** | Get daily recommended songs |
| **Usage** | `nm recommend songs` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm recommend songs
nm recommend songs --output json
```

### `nm recommend playlists`

| Field | Value |
|---|---|
| **Name** | `recommend playlists` |
| **Description** | Get recommended playlists |
| **Usage** | `nm recommend playlists` |

#### Examples

```bash
nm recommend playlists
```

## Notes

- `toplist` and `toplist detail` use public chart data.
- `recommend *` is personalized and requires login.
