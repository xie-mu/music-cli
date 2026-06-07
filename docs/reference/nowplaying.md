# `nm nowplaying`

Index: [index.md](index.md)

`nm nowplaying` detects NetEase Cloud Music browser pages by reading local
browser window titles. It is a lightweight browser-title parser, not an SMTC
reader and not an audio verification command.

## Usage

```bash
nm nowplaying
nm nowplaying --output json
```

## Capability boundary

- Works only when a browser window title exposes a recognizable NetEase song page.
- Does not read the NetEase desktop client media session.
- Does not support `--smtc`; use `nm smtc status` for Windows SMTC session reads.
- JSON output returns parsed song info when available, or raw window titles when
  NetEase pages are detected but cannot be parsed.
