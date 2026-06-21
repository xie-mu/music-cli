# NetEase Cloud Music CLI (`nm`) — Command Reference

> Maintained from the CLI source. Keep this file aligned with `src/main.ts`,
> command definitions under `src/commands/`, and `nm --help`.

## Quick index

| Command | Description | Detail |
|---|---|---|
| `nm search` | Search songs, artists, albums, playlists | [search.md](search.md) |
| `nm search hot` | Get hot search trends | [search.md](search.md) |
| `nm search suggest` | Get search suggestions | [search.md](search.md) |
| `nm music info` | Song details (name, artist, album, duration) | [music.md](music.md) |
| `nm music lyric` | LRC lyrics | [music.md](music.md) |
| `nm music url` | Song play URL | [music.md](music.md) |
| `nm music play` | Open or prepare playback through Orpheus/browser handoff | [music.md](music.md) |
| `nm music download` | Download song | [music.md](music.md) |
| `nm music like` | Like a song | [music.md](music.md) |
| `nm music unlike` | Unlike a song | [music.md](music.md) |
| `nm playlist show` | Playlist details | [playlist.md](playlist.md) |
| `nm playlist play` | Play playlist in the NetEase desktop client | [playlist.md](playlist.md) |
| `nm playlist tracks` | All songs in playlist | [playlist.md](playlist.md) |
| `nm playlist list` | User's playlists | [playlist.md](playlist.md) |
| `nm playlist summary` | Playlist analysis | [playlist.md](playlist.md) |
| `nm playlist create` | Create playlist | [playlist.md](playlist.md) |
| `nm playlist add` | Add songs to a playlist | [playlist.md](playlist.md) |
| `nm playlist import-album` | Import album songs into a playlist (auto-order) | [playlist.md](playlist.md) |
| `nm playlist remove` | Remove songs from a playlist | [playlist.md](playlist.md) |
| `nm playlist dedupe` | Find or remove duplicate songs | [playlist.md](playlist.md) |
| `nm playlist merge` | Merge source playlists | [playlist.md](playlist.md) |
| `nm playlist export` | Export playlist tracks | [playlist.md](playlist.md) |
| `nm playlist audit` | Audit playlist quality and duplicates | [playlist.md](playlist.md) |
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
| `nm recommend songs` | Daily recommend songs | [toplist.md](toplist.md#recommend) |
| `nm recommend playlists` | Recommend playlists | [toplist.md](toplist.md#recommend) |
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
| `nm smtc status` | Read the current NetEase SMTC media session | [smtc.md](smtc.md) |
| `nm smtc sessions` | List active Windows SMTC media sessions | [smtc.md](smtc.md) |
| `nm smtc play` | Request SMTC play on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc pause` | Request SMTC pause on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc toggle` | Request SMTC toggle on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc next` | Request SMTC next on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc prev` | Request SMTC prev on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc stop` | Request SMTC stop on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc seek` | Request SMTC seek on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc rate` | Request SMTC rate on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc shuffle` | Request SMTC shuffle on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc repeat` | Request SMTC repeat on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc fast-forward` | Request SMTC fast-forward on the NetEase media session | [smtc.md](smtc.md) |
| `nm smtc rewind` | Request SMTC rewind on the NetEase media session | [smtc.md](smtc.md) |
| `nm nowplaying` | Detect current NetEase song from browser window titles | [nowplaying.md](nowplaying.md) |
| `nm doctor` | Installation and capability diagnostics | [doctor.md](doctor.md) |

## By group

| Group | Commands | Reference |
|---|---|---|
| `auth` | `login`, `status`, `logout` | [auth.md](auth.md) |
| `config` | `show`, `set`, `export-schema` | [config.md](config.md) |
| `user` | `profile`, `account`, `history`, `level`, `subcount` | [user.md](user.md) |
| `music` | `info`, `url`, `lyric`, `download`, `play`, `like`, `unlike` | [music.md](music.md) |
| `playlist` | `show`, `play`, `tracks`, `list`, `summary`, `create`, `add`, `import-album`, `remove`, `dedupe`, `merge`, `export`, `audit` | [playlist.md](playlist.md) |
| `album` | `show`, `list`, `sub`, `unsub`, `dynamic`, `summary` | [album.md](album.md) |
| `search` | `(root)`, `hot`, `suggest` | [search.md](search.md) |
| `toplist` | `(root)`, `detail` | [toplist.md](toplist.md) |
| `recommend` | `songs`, `playlists` | [toplist.md](toplist.md#recommend) |
| `pipeline` | `validate`, `run` | [pipeline.md](pipeline.md) |
| `memory` | `show`, `export`, `clear` | [memory.md](memory.md) |
| `library` | `liked` | [library.md](library.md) |
| `queue` | `add`, `list`, `remove`, `clear`, `next`, `play` | [queue.md](queue.md) |
| `insight` | `weekly`, `monthly`, `yearly` | [insight.md](insight.md) |
| `smtc` | `status`, `sessions`, `play`, `pause`, `toggle`, `next`, `prev`, `stop`, `seek`, `rate`, `shuffle`, `repeat`, `fast-forward`, `rewind` | [smtc.md](smtc.md) |
| `nowplaying` | `(root)` | [nowplaying.md](nowplaying.md) |
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

- **Auth required**: User-specific and account-write commands (`user *`, `recommend *`, `music like/unlike`, `playlist list/create/add/import-album/remove/dedupe/merge`, `album list/sub/unsub`, `library liked`, `insight *`) require `nm auth login` or a valid cookie.
- **No NetEase login required**: `auth *`, `config *`, `search *`, `music info/url/lyric/download/play`, `playlist show/play/tracks/summary/export/audit`, `album show/dynamic/summary`, `toplist *`, `pipeline *`, `memory show/export`, `queue *`, `smtc *`, `nowplaying`, and `doctor` work without NetEase login.
- **Local sensitive without NetEase login**: `memory clear` deletes local CLI memory state and should be used only when requested.
- **Playback handoff**: `nm music play` uses the official Orpheus desktop protocol on Windows when possible, falls back to the browser player, and returns only launch intent. Use SMTC commands for local desktop-session status/control when available.
- **Desktop playlist handoff**: `nm playlist play --id X` hands a remote playlist to the NetEase desktop client. `nm queue *` remains a CLI-local queue stored under local state and does not rewrite the desktop client's right-side play queue.
- **Album imports**: `nm playlist import-album` submits album songs from last to first so NetEase playlist prepending keeps the final playback order correct.
- **CDN restriction**: Direct audio URLs and downloads may return 403 because of regional, copyright, or member restrictions.
- **Sync lyrics**: `nm music lyric --id X --sync` provides timed lyrics synchronized with playback.
- **Local memory**: `memory`, `queue`, and `insight` use local state under `~/.netease-music/state/`.
