# `nm queue` commands

Index: [index.md](index.md)

| Command | Description |
|---|---|
| `nm queue add` | Add a song to the local playback queue |
| `nm queue list` | List queue items |
| `nm queue remove` | Remove a queue item by 1-based index |
| `nm queue clear` | Clear the local queue |
| `nm queue next` | Advance queue cursor |
| `nm queue play` | Open or prepare current/next item through the shared playback handoff |

```bash
nm queue add --id 186016
nm queue list
nm queue play
nm queue play --no-open --output json
```

Queue playback calls the same `src/player.ts` handoff used by `nm music play`.
On Windows this may use the official Orpheus desktop protocol; otherwise it
falls back to the browser player. It does not bypass NetEase streaming
restrictions, and launch success is not audio confirmation. Use `--no-open` to
avoid launching an external player and only return the official song URL.
