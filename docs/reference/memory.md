# `nm memory` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm memory show` | Show local music memory summary |
| `nm memory export` | Export local music memory events |
| `nm memory clear` | Clear local memory or one cache namespace |

## Command details

### `nm memory show`

| Field | Value |
|---|---|
| **Name** | `memory show` |
| **Description** | Show local music memory summary |
| **Usage** | `nm memory show` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm memory show
nm memory show --output json
```

### `nm memory export`

| Field | Value |
|---|---|
| **Name** | `memory export` |
| **Description** | Export local music memory events |
| **Usage** | `nm memory export [--type <type>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--type <type>` | string | no | Event type filter (e.g. search) |

#### Examples

```bash
nm memory export
nm memory export --type search --output json
```

### `nm memory clear`

| Field | Value |
|---|---|
| **Name** | `memory clear` |
| **Description** | Clear local memory or one cache namespace |
| **Usage** | `nm memory clear [--namespace <ns>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--namespace <ns>` | string | no | Namespace to clear (e.g. queue) |

#### Examples

```bash
nm memory clear
nm memory clear --namespace queue
```

## Notes

Memory is stored under `~/.netease-music/state/` by default. It stores non-sensitive local events only; cookies remain in the auth cookie file.
