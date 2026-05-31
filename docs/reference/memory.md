# `nm memory` commands

Index: [index.md](index.md)

| Command | Description |
|---|---|
| `nm memory show` | Show local music memory summary |
| `nm memory export` | Export local music memory events |
| `nm memory clear` | Clear local memory or one cache namespace |

```bash
nm memory show --output json
nm memory export --type search
nm memory clear --namespace queue
```

Memory is stored under `~/.netease-music/state/` by default. It stores non-sensitive local events only; cookies remain in the auth cookie file.
