# `nm playlist` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm playlist show` | View playlist details |
| `nm playlist play` | Push entire playlist to NetEase desktop client (cloud push) |
| `nm playlist tracks` | List all songs in playlist |
| `nm playlist list` | List user's playlists |
| `nm playlist summary` | Analyze playlist data |
| `nm playlist create` | Create a new playlist |
| `nm playlist add` | Add songs to a playlist |
| `nm playlist import-album` | Import album songs into a playlist in playback order |
| `nm playlist remove` | Remove songs from a playlist |
| `nm playlist dedupe` | Find or remove duplicate songs |
| `nm playlist merge` | Merge source playlists |
| `nm playlist export` | Export playlist tracks |
| `nm playlist audit` | Audit playlist quality |

> ⚠️ **NetEase prepends new songs.** `playlist add` inserts at the **top** of the playlist.
> To get order A→B→C, pass IDs in reverse: `--song-ids C,B,A`.
> `playlist import-album` handles this automatically.

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

### `nm playlist play`

| Field | Value |
|---|---|
| **Name** | `playlist play` |
| **Description** | Push entire playlist to the NetEase desktop client (cloud push) |
| **Usage** | `nm playlist play --id <playlistId> [--player orpheus|browser] [--no-open]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Playlist ID |
| `--player <name>` | string | no | Playback target: `orpheus` or `browser` |
| `--no-open` | boolean | no | Return the playlist URL without launching a player |

#### Examples

```bash
nm playlist play --id 3778678
nm playlist play --id 3778678 --player orpheus --output json
nm playlist play --id 3778678 --no-open --output json
```

`nm queue *` manages the CLI local queue under local state. It does not rewrite
the NetEase desktop client's right-side play queue. To load a remote playlist
into the desktop client's playback list, use `nm playlist play --id <playlistId>`.

### `nm playlist import-album`

| Field | Value |
|---|---|
| **Name** | `playlist import-album` |
| **Description** | Import all songs from an album into a playlist |
| **Usage** | `nm playlist import-album --id <playlistId> --album-id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Target playlist ID |
| `--album-id <id>` | number | yes | Source album ID |

#### Examples

```bash
nm playlist import-album --id 123 --album-id 92895788
nm playlist import-album --id 123 --album-id 92895788 --dry-run --output json
```

The command submits album songs from last to first. NetEase prepends newly added
songs to the playlist, so this preserves the album's normal playback order in
the final playlist.

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
