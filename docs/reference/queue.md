# `nm queue` commands

Index: [index.md](index.md)

| Command | Description |
|---|---|
| `nm queue add` | Add a song to the local playback queue |
| `nm queue list` | List queue items |
| `nm queue remove` | Remove a queue item by 1-based index |
| `nm queue clear` | Clear the local queue |
| `nm queue next` | Advance queue cursor |
| `nm queue play` | Open or prepare current/next item through the official web player |

```bash
nm queue add --id 186016
nm queue list
nm queue play
nm queue play --no-open --output json
```

Queue playback opens the official NetEase web player in a detached background process by default and does not bypass NetEase streaming restrictions. Use `--no-open` to avoid launching a browser and only return the official song URL.
