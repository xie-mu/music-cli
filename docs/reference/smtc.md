# nm smtc - Windows SMTC Commands

> Manually maintained and checked by docs consistency tests. Keep this file
> aligned with `src/commands/smtc.ts` when SMTC commands change.

## `nm smtc status`

**Read the current NetEase SMTC media session**

**Usage:** `nm smtc status [--watch] [--all]`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--watch` | boolean | no | - | Poll SMTC status until interrupted |
| `--all` | boolean | no | - | Include all system media sessions |

**Examples:**

```
nm smtc status
nm smtc status --output json
nm smtc status --watch
```

## `nm smtc sessions`

**List active Windows SMTC media sessions**

**Usage:** `nm smtc sessions`

**Examples:**

```
nm smtc sessions
nm smtc sessions --output json
```

## `nm smtc play`

**Request SMTC play on the NetEase media session**

**Usage:** `nm smtc play`

**Examples:**

```
nm smtc play
```

## `nm smtc pause`

**Request SMTC pause on the NetEase media session**

**Usage:** `nm smtc pause`

**Examples:**

```
nm smtc pause
```

## `nm smtc toggle`

**Request SMTC toggle on the NetEase media session**

**Usage:** `nm smtc toggle`

**Examples:**

```
nm smtc toggle
```

## `nm smtc next`

**Request SMTC next on the NetEase media session**

**Usage:** `nm smtc next`

**Examples:**

```
nm smtc next
```

## `nm smtc prev`

**Request SMTC prev on the NetEase media session**

**Usage:** `nm smtc prev`

**Examples:**

```
nm smtc prev
```

## `nm smtc stop`

**Request SMTC stop on the NetEase media session**

**Usage:** `nm smtc stop`

**Examples:**

```
nm smtc stop
```

## `nm smtc seek`

**Request SMTC seek on the NetEase media session**

**Usage:** `nm smtc seek --position <seconds>`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--position <seconds>` | number | yes | - | Playback position in seconds |

**Examples:**

```
nm smtc seek --position 60
```

## `nm smtc rate`

**Request SMTC rate on the NetEase media session**

**Usage:** `nm smtc rate --value <rate>`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--value <rate>` | number | yes | - | Playback rate, for example 1 or 1.25 |

**Examples:**

```
nm smtc rate --value 1.25
```

## `nm smtc shuffle`

**Request SMTC shuffle on the NetEase media session**

**Usage:** `nm smtc shuffle --enabled <true|false>`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--enabled <true|false>` | string | yes | - | Enable or disable shuffle |

**Examples:**

```
nm smtc shuffle --enabled true
```

## `nm smtc repeat`

**Request SMTC repeat on the NetEase media session**

**Usage:** `nm smtc repeat --mode <none|one|all>`

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `--mode <none|one|all>` | string | yes | - | Repeat mode: none, one, or all |

**Examples:**

```
nm smtc repeat --mode all
```

## `nm smtc fast-forward`

**Request SMTC fast-forward on the NetEase media session**

**Usage:** `nm smtc fast-forward`

**Examples:**

```
nm smtc fast-forward
```

## `nm smtc rewind`

**Request SMTC rewind on the NetEase media session**

**Usage:** `nm smtc rewind`

**Examples:**

```
nm smtc rewind
```
