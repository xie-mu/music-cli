# `nm config` commands

Index: [index.md](index.md)

## Commands in this group

| Command | Description |
|---|---|
| `nm config show` | Display current configuration |
| `nm config set` | Set a config value |
| `nm config export-schema` | Export all commands as Function Calling schema |

## Command details

### `nm config show`

| Field | Value |
|---|---|
| **Name** | `config show` |
| **Description** | Display current configuration |
| **Usage** | `nm config show` |

#### Examples

```bash
nm config show
nm config show --output json
```

### `nm config set`

| Field | Value |
|---|---|
| **Name** | `config set` |
| **Description** | Set a config value |
| **Usage** | `nm config set --key <key> --value <value>` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--key <key>` | string | yes | Config key |
| `--value <value>` | string | yes | Config value |

#### Valid keys

`output`, `timeout`, `cookieFile`, `countryCode`, `player`, `downloadDir`, `stateDir`

#### Examples

```bash
nm config set --key output --value json
nm config set --key timeout --value 60
```

### `nm config export-schema`

| Field | Value |
|---|---|
| **Name** | `config export-schema` |
| **Description** | Export commands as OpenAI/Anthropic Function Calling schema |
| **Usage** | `nm config export-schema [--command <name>]` |

#### Options

| Flag | Type | Required | Description |
|---|---|---|---|
| `--command <name>` | string | no | Export only one command |

#### Examples

```bash
nm config export-schema
nm config export-schema --command "music info"
```

#### Schema scope

The CLI registers 75 commands. Full schema export returns 74 tool schemas
because it intentionally excludes `config export-schema` itself to avoid a
self-describing tool entry. Use `--command "config export-schema"` only when
you explicitly need that single command schema.
