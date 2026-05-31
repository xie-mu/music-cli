# `nm user` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm user profile` | User profile (nickname, level, listens, days) |
| `nm user account` | Account binding info |
| `nm user history` | Listening history (all/week) |
| `nm user level` | User level and progress |
| `nm user subcount` | Subscription counts |

## Command details

### `nm user profile`

| Field | Value |
|---|---|
| **Name** | `user profile` |
| **Description** | Get current user profile |
| **Usage** | `nm user profile [--uid <id>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--uid <id>` | number | no | User ID (defaults to current user) |

#### Examples

```bash
nm user profile
nm user profile --output json
```

### `nm user history`

| Field | Value |
|---|---|
| **Name** | `user history` |
| **Description** | Get listening records |
| **Usage** | `nm user history [--type all|week]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--type <type>` | string | no | all (default) or week |

#### Examples

```bash
nm user history
nm user history --type week
```

### `nm user level`

| Field | Value |
|---|---|
| **Name** | `user level` |
| **Description** | Get user level info |
| **Usage** | `nm user level` |

#### Examples

```bash
nm user level --output json
```
