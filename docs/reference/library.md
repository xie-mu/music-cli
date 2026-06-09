# `nm library` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description | Auth |
|---|---|---|
| `nm library liked` | List liked songs for the current or specified user | Yes |

## Command details

### `nm library liked`

| Field | Value |
|---|---|
| **Name** | `library liked` |
| **Description** | List liked songs for the current or specified user |
| **Usage** | `nm library liked [--uid <id>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--uid <id>` | number | no | User ID (defaults to current user) |

#### Examples

```bash
nm library liked
nm library liked --uid 123456 --output json
```

#### Notes

Requires login when `--uid` is omitted.
