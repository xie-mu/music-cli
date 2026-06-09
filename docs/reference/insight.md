# `nm insight` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description | Auth |
|---|---|---|
| `nm insight weekly` | Weekly listening insight | Yes |
| `nm insight monthly` | Monthly-style insight from available history | Yes |
| `nm insight yearly` | Yearly-style insight from available history | Yes |

## Command details

### `nm insight weekly`

| Field | Value |
|---|---|
| **Name** | `insight weekly` |
| **Description** | Get weekly listening insight report |
| **Usage** | `nm insight weekly` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json|markdown` | string | no | Output format |

#### Examples

```bash
nm insight weekly
nm insight weekly --output json
nm insight weekly --output markdown
```

### `nm insight monthly`

| Field | Value |
|---|---|
| **Name** | `insight monthly` |
| **Description** | Get monthly-style insight from available history |
| **Usage** | `nm insight monthly` |

#### Examples

```bash
nm insight monthly --output json
```

### `nm insight yearly`

| Field | Value |
|---|---|
| **Name** | `insight yearly` |
| **Description** | Get yearly-style insight from available history |
| **Usage** | `nm insight yearly` |

#### Examples

```bash
nm insight yearly --output json
nm insight yearly --output markdown
```

## Notes

Insights use NetEase listening records and require login when `--uid` is omitted.
