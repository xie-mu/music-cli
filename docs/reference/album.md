# `nm album` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description | Auth |
|---|---|---|
| `nm album show` | View album details and track list | No |
| `nm album list` | List subscribed albums | Yes |
| `nm album sub` | Subscribe to an album | Yes |
| `nm album unsub` | Unsubscribe from an album | Yes |
| `nm album dynamic` | Album dynamic data (comments, shares) | No |
| `nm album summary` | Album summary | No |

## Command details

### `nm album show`

| Field | Value |
|---|---|
| **Name** | `album show` |
| **Description** | View album details and track list |
| **Usage** | `nm album show --id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Album ID |

#### Examples

```bash
nm album show --id 32311
nm album show --id 32311 --output json
```

### `nm album list`

| Field | Value |
|---|---|
| **Name** | `album list` |
| **Description** | List subscribed albums |
| **Usage** | `nm album list` |

#### Examples

```bash
nm album list
nm album list --output json
```

### `nm album sub`

| Field | Value |
|---|---|
| **Name** | `album sub` |
| **Description** | Subscribe to an album |
| **Usage** | `nm album sub --id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Album ID |

#### Examples

```bash
nm album sub --id 32311
```

### `nm album unsub`

| Field | Value |
|---|---|
| **Name** | `album unsub` |
| **Description** | Unsubscribe from an album |
| **Usage** | `nm album unsub --id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Album ID |

#### Examples

```bash
nm album unsub --id 32311
```

### `nm album dynamic`

| Field | Value |
|---|---|
| **Name** | `album dynamic` |
| **Description** | Get album dynamic data (comments, shares) |
| **Usage** | `nm album dynamic --id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Album ID |

#### Examples

```bash
nm album dynamic --id 32311 --output json
```

### `nm album summary`

| Field | Value |
|---|---|
| **Name** | `album summary` |
| **Description** | Get album summary |
| **Usage** | `nm album summary --id <albumId>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--id <id>` | number | yes | Album ID |

#### Examples

```bash
nm album summary --id 32311 --output json
```
