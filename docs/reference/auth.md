# `nm auth` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm auth login` | Login with QR code or phone number |
| `nm auth status` | Check current login status |
| `nm auth logout` | Clear stored credentials |

## Command details

### `nm auth login`

| Field | Value |
|---|---|
| **Name** | `auth login` |
| **Description** | Login to NetEase Cloud Music |
| **Usage** | `nm auth login --qrcode` \| `nm auth login --phone <number> --password <pwd>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--qrcode` | boolean | no | QR code scan login |
| `--phone <number>` | string | no | Phone number |
| `--password <pwd>` | string | no | Account password |
| `--country-code <code>` | string | no | Country code (default: 86) |

#### Examples

```bash
nm auth login --qrcode
nm auth login --phone 138xxxxxxx --password mypassword
```

### `nm auth status`

| Field | Value |
|---|---|
| **Name** | `auth status` |
| **Description** | Check login status |
| **Usage** | `nm auth status` |

#### Examples

```bash
nm auth status
nm auth status --output json
```

### `nm auth logout`

| Field | Value |
|---|---|
| **Name** | `auth logout` |
| **Description** | Clear stored credentials |
| **Usage** | `nm auth logout` |

#### Examples

```bash
nm auth logout
```
