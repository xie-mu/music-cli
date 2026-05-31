# `nm toplist / recommend` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm toplist` | List all NetEase charts |
| `nm toplist detail --id <id>` | List tracks in a chart |
| `nm recommend songs` | Daily recommended songs |
| `nm recommend playlists` | Recommended playlists |

## Examples

```bash
nm toplist
nm toplist detail --id 3778678 --output json
nm recommend songs
nm recommend playlists
```

## Notes

- `toplist` and `toplist detail` use public chart data.
- `recommend *` is personalized and requires login.
