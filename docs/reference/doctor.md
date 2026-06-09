# `nm doctor`

Index: [index.md](index.md)

## Command details

### `nm doctor`

| Field | Value |
|---|---|
| **Name** | `doctor` |
| **Description** | Check local installation and capability health |
| **Usage** | `nm doctor` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output in JSON format |

#### Examples

```bash
nm doctor
nm doctor --output json
```

## Diagnostics checks

`nm doctor` checks local installation health:

- build output presence
- cookie availability
- public API smoke check
- registered pipeline music builtins
- SMTC helper presence (`tools/smtc_query.exe`)
- reference documentation links

```bash
nm doctor
nm doctor --output json
```
