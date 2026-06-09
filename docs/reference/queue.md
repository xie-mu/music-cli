# `nm queue` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm queue add` | Add a song to the local playback queue |
| `nm queue list` | List queue items |
| `nm queue remove` | Remove a queue item by 1-based index |
| `nm queue clear` | Clear the local queue |
| `nm queue next` | Advance queue cursor |
| `nm queue play` | Open or prepare current/next item through the shared playback handoff |

## Command details

### `nm queue add`

| Field | Value |
|---|---|
| **Name** | `queue add` |
| **Description** | Add a song to the local playback queue |
| **Usage** | `nm queue add --id <songId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Song ID |

#### Examples

```bash
nm queue add --id 186016
```

### `nm queue list`

| Field | Value |
|---|---|
| **Name** | `queue list` |
| **Description** | List queue items |
| **Usage** | `nm queue list` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm queue list
nm queue list --output json
```

### `nm queue remove`

| Field | Value |
|---|---|
| **Name** | `queue remove` |
| **Description** | Remove a queue item by 1-based index |
| **Usage** | `nm queue remove --index <n>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--index <n>` | number | yes | 1-based index of item to remove |

#### Examples

```bash
nm queue remove --index 1
```

### `nm queue clear`

| Field | Value |
|---|---|
| **Name** | `queue clear` |
| **Description** | Clear the local queue |
| **Usage** | `nm queue clear` |

#### Examples

```bash
nm queue clear
```

### `nm queue next`

| Field | Value |
|---|---|
| **Name** | `queue next` |
| **Description** | Advance queue cursor to next item |
| **Usage** | `nm queue next` |

#### Examples

```bash
nm queue next
```

### `nm queue play`

| Field | Value |
|---|---|
| **Name** | `queue play` |
| **Description** | Play current or next queue item |
| **Usage** | `nm queue play [--no-open]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--no-open` | boolean | no | Do not open external player; return URL only |

#### Examples

```bash
nm queue play
nm queue play --no-open --output json
```

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
