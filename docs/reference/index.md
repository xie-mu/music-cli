# NetEase Cloud Music CLI (`nm`) — Command Reference

> Auto-generated from CLI source. Do not edit by hand.

## Quick index

| Command | Description | Detail |
|---|---|---|
| `nm search` | Search songs, artists, albums, playlists | [search.md](search.md) |
| `nm search hot` | Get hot search trends | [search.md](search.md) |
| `nm search suggest` | Get search suggestions | [search.md](search.md) |
| `nm music info` | Song details (name, artist, album, duration) | [music.md](music.md) |
| `nm music lyric` | LRC lyrics | [music.md](music.md) |
| `nm music url` | Song play URL | [music.md](music.md) |
| `nm music play` | Open browser web player | [music.md](music.md) |
| `nm music download` | Download song | [music.md](music.md) |
| `nm music like` | Like a song | [music.md](music.md) |
| `nm music unlike` | Unlike a song | [music.md](music.md) |
| `nm playlist show` | Playlist details | [playlist.md](playlist.md) |
| `nm playlist tracks` | All songs in playlist | [playlist.md](playlist.md) |
| `nm playlist list` | User's playlists | [playlist.md](playlist.md) |
| `nm playlist summary` | Playlist analysis | [playlist.md](playlist.md) |
| `nm playlist create` | Create playlist | [playlist.md](playlist.md) |
| `nm album show` | Album details | [album.md](album.md) |
| `nm album list` | Subscribed albums | [album.md](album.md) |
| `nm album sub` | Subscribe to album | [album.md](album.md) |
| `nm album unsub` | Unsubscribe from album | [album.md](album.md) |
| `nm album dynamic` | Album dynamic data | [album.md](album.md) |
| `nm album summary` | Album summary | [album.md](album.md) |
| `nm user profile` | User profile | [user.md](user.md) |
| `nm user account` | Account info | [user.md](user.md) |
| `nm user history` | Listening history | [user.md](user.md) |
| `nm user level` | User level | [user.md](user.md) |
| `nm user subcount` | Subscription counts | [user.md](user.md) |
| `nm toplist` | Music charts | [toplist.md](toplist.md) |
| `nm toplist detail` | Chart details | [toplist.md](toplist.md) |
| `nm recommend songs` | Daily recommend songs | [toplist.md](toplist.md) |
| `nm recommend playlists` | Recommend playlists | [toplist.md](toplist.md) |
| `nm auth login` | Login (QR/phone) | [auth.md](auth.md) |
| `nm auth status` | Check login status | [auth.md](auth.md) |
| `nm auth logout` | Logout | [auth.md](auth.md) |
| `nm config show` | Show configuration | [config.md](config.md) |
| `nm config set` | Set configuration | [config.md](config.md) |
| `nm config export-schema` | Export agent tool schema | [config.md](config.md) |
| `nm pipeline validate` | Validate pipeline YAML | [pipeline.md](pipeline.md) |
| `nm pipeline run` | Run pipeline workflow | [pipeline.md](pipeline.md) |
| `nm memory show` | Show local music memory summary | [memory.md](memory.md) |
| `nm memory export` | Export local music memory events | [memory.md](memory.md) |
| `nm memory clear` | Clear local music memory | [memory.md](memory.md) |
| `nm library liked` | Liked songs library | [library.md](library.md) |
| `nm queue add` | Add song to local queue | [queue.md](queue.md) |
| `nm queue list` | List local queue | [queue.md](queue.md) |
| `nm queue remove` | Remove queue item | [queue.md](queue.md) |
| `nm queue clear` | Clear local queue | [queue.md](queue.md) |
| `nm queue next` | Advance queue cursor | [queue.md](queue.md) |
| `nm queue play` | Open queue item in web player | [queue.md](queue.md) |
| `nm insight weekly` | Weekly listening insight | [insight.md](insight.md) |
| `nm insight monthly` | Monthly listening insight | [insight.md](insight.md) |
| `nm insight yearly` | Yearly listening insight | [insight.md](insight.md) |
| `nm doctor` | Installation and capability diagnostics | [doctor.md](doctor.md) |

## By group

| Group | Commands | Reference |
|---|---|---|
| `auth` | `login`, `status`, `logout` | [auth.md](auth.md) |
| `config` | `show`, `set`, `export-schema` | [config.md](config.md) |
| `user` | `profile`, `account`, `history`, `level`, `subcount` | [user.md](user.md) |
| `music` | `info`, `url`, `lyric`, `download`, `play`, `like`, `unlike` | [music.md](music.md) |
| `playlist` | `show`, `tracks`, `list`, `summary`, `create` | [playlist.md](playlist.md) |
| `album` | `show`, `list`, `sub`, `unsub`, `dynamic`, `summary` | [album.md](album.md) |
| `search` | `(root)`, `hot`, `suggest` | [search.md](search.md) |
| `toplist` | `(root)`, `detail` | [toplist.md](toplist.md) |
| `recommend` | `songs`, `playlists` | [toplist.md](toplist.md) |
| `pipeline` | `validate`, `run` | [pipeline.md](pipeline.md) |
| `memory` | `show`, `export`, `clear` | [memory.md](memory.md) |
| `library` | `liked` | [library.md](library.md) |
| `queue` | `add`, `list`, `remove`, `clear`, `next`, `play` | [queue.md](queue.md) |
| `insight` | `weekly`, `monthly`, `yearly` | [insight.md](insight.md) |
| `doctor` | `(root)` | [doctor.md](doctor.md) |

## Global flags

Available on every command (in addition to command-specific options):

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output <format>` | string | no | Output format: text, json, markdown |
| `--quiet` | boolean | no | Suppress non-essential output |
| `--verbose` | boolean | no | Print HTTP request/response details |
| `--dry-run` | boolean | no | Preview mode, no actual API calls |
| `--timeout <seconds>` | number | no | Request timeout |
| `--help` | boolean | no | Show help |
| `--version` | boolean | no | Print version |

## Notes

- **Auth required**: All user-specific commands (`user *`, `music like/unlike`, `playlist create`, `album sub`) require `nm auth login`.
- **Public data**: `search`, `music info`, `music lyric`, `playlist show`, `album show`, `toplist` work without authentication.
- **CDN restriction**: Direct audio URLs may return 403. Use `nm music play` to open the web player in browser.
- **Sync lyrics**: `nm music lyric --id X --sync` provides timed lyrics synchronized with playback.
- **Local memory**: `memory`, `queue`, and `insight` use local state under `~/.netease-music/state/`.
