# `nm playlist` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm playlist show` | View playlist details |
| `nm playlist tracks` | List all songs in playlist |
| `nm playlist list` | List user's playlists |
| `nm playlist summary` | Analyze playlist data |
| `nm playlist create` | Create a new playlist |
| `nm playlist add` | Add songs to a playlist |
| `nm playlist remove` | Remove songs from a playlist |
| `nm playlist dedupe` | Find or remove duplicate songs |
| `nm playlist merge` | Merge source playlists |
| `nm playlist export` | Export playlist tracks |
| `nm playlist audit` | Audit playlist quality |

## Command details

### `nm playlist show`

| Field | Value |
|---|---|
| **Name** | `playlist show` |
| **Description** | View playlist details (name, creator, track count) |
| **Usage** | `nm playlist show --id <playlistId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Playlist ID |

#### Examples

```bash
nm playlist show --id 3778678
nm playlist show --id 3778678 --output json
```

### `nm playlist tracks`

| Field | Value |
|---|---|
| **Name** | `playlist tracks` |
| **Description** | List all songs in a playlist |
| **Usage** | `nm playlist tracks --id <playlistId>` |

#### Examples

```bash
nm playlist tracks --id 3778678
nm playlist tracks --id 3778678 --output json
```

### `nm playlist list`

| Field | Value |
|---|---|
| **Name** | `playlist list` |
| **Description** | List the current user's playlists |
| **Usage** | `nm playlist list [--uid <id>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--uid <id>` | number | no | User ID (defaults to current user) |

#### Examples

```bash
nm playlist list
nm playlist list --uid 252561940
```

### `nm playlist summary`

| Field | Value |
|---|---|
| **Name** | `playlist summary` |
| **Description** | Analyze playlist: total tracks, duration, artist distribution |
| **Usage** | `nm playlist summary --id <playlistId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Playlist ID |

#### Examples

```bash
nm playlist summary --id 3778678
nm playlist summary --id 3778678 --output json
```

### `nm playlist create`

| Field | Value |
|---|---|
| **Name** | `playlist create` |
| **Description** | Create a new playlist |
| **Usage** | `nm playlist create --name <name> [--desc <text>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--name <name>` | string | yes | Playlist name |
| `--desc <text>` | string | no | Playlist description |

#### Examples

```bash
nm playlist create --name "My Favorites"
nm playlist create --name "Road Trip" --desc "Songs for driving"
nm playlist add --id 123 --song-ids 186016,1807799505
nm playlist remove --id 123 --song-ids 186016
nm playlist dedupe --id 123
nm playlist merge --source-ids 1,2 --target-id 3 --apply
nm playlist export --id 3778678 --output markdown
nm playlist audit --id 3778678
```
