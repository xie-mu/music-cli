# `nm nowplaying`

Index: [index.md](index.md)

## Command details

### `nm nowplaying`

| Field | Value |
|---|---|
| **Name** | `nowplaying` |
| **Description** | Detect current NetEase song from browser window titles |
| **Usage** | `nm nowplaying` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--output json` | string | no | Output parsed song info in JSON |

#### Examples

```bash
nm nowplaying
nm nowplaying --output json
```

## Capability boundary

- Works only when a browser window title exposes a recognizable NetEase song page.
- Does **not** read the NetEase desktop client media session.
- Does **not** support `--smtc`; use `nm smtc status` for Windows SMTC session reads.
- JSON output returns parsed song info when available, or raw window titles when
  NetEase pages are detected but cannot be parsed.
- This is a lightweight browser-title parser, not an SMTC reader and not an audio
  verification command.
