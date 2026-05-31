# `nm pipeline` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm pipeline validate` | Validate a pipeline YAML definition |
| `nm pipeline run` | Execute a pipeline workflow |

## Command details

### `nm pipeline validate`

| Field | Value |
|---|---|
| **Name** | `pipeline validate` |
| **Description** | Validate a pipeline YAML/JSON definition |
| **Usage** | `nm pipeline validate <file.yaml>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--file <path>` | string | no | Path to pipeline file |

#### Examples

```bash
nm pipeline validate scenarios/playlist-report.yaml
```

### `nm pipeline run`

| Field | Value |
|---|---|
| **Name** | `pipeline run` |
| **Description** | Execute a multi-step pipeline workflow |
| **Usage** | `nm pipeline run <file.yaml> [--input <json>] [--dry-run]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--file <path>` | string | no | Path to pipeline file |
| `--input <json>` | string | no | Runtime input as JSON |

#### Pipeline steps

Built-in step types:
- `playlist/tracks` — Fetch playlist tracks
- `playlist/summary` — Analyze playlist stats
- `music/info` — Fetch song details
- `music/lyric` — Fetch lyrics
- `user/history` — Fetch listening history
- `user/profile` — Fetch user profile
- `album/show` — Fetch album details
- `search` — Search NetEase Cloud Music
- `recommend/songs` — Fetch daily recommended songs
- `script/js` — Run inline JavaScript
- `logic/switch` — Conditional branching
- `logic/select` — Value selection

#### Examples

```bash
# Dry-run to preview execution
nm pipeline run scenarios/playlist-report.yaml --dry-run --output json --input '{"playlistId":"3778678"}'

# Actual execution
nm pipeline run scenarios/playlist-report.yaml --input '{"playlistId":"3778678"}'
```

## Built-in scenarios

| File | Description |
|---|---|
| `src/pipeline/scenarios/playlist-report.yaml` | Analyze a playlist: fetch tracks, compute stats, generate report |
| `src/pipeline/scenarios/user-weekly.yaml` | User weekly listening summary |
