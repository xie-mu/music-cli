# NetEase SMTC Capability Support

> Status: capability and implemented CLI boundary for the current SMTC helper.
> Date: 2026-06-06
> Chinese version: [SMTC_CAPABILITY_SUPPORT.zh-CN.md](SMTC_CAPABILITY_SUPPORT.zh-CN.md)

## Scope

SMTC here means Windows System Media Transport Controls exposed through
`Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager`.

For NetEase Cloud Music, this is an operating-system media-session surface. It
can observe and request control of the NetEase desktop client's active media
session when the client publishes one to Windows. It is not a NetEase Web API,
not a playback-stream API, and not a substitute for authenticated NetEase
catalog APIs.

## Support Summary

| Area | Support | Notes |
|---|---:|---|
| Detect active media sessions | Yes | SMTC can list available system media sessions and inspect the current session. |
| Identify NetEase session | Partial | Possible by matching `SourceAppUserModelId`/app identity strings such as `cloudmusic`, `netease`, or `orpheus`; this is heuristic. |
| Read current song title | Yes | Available when the NetEase client publishes media properties. |
| Read artist | Yes | Available when the client publishes media properties. |
| Read album title | Yes | Available when the client publishes media properties. |
| Read playback state | Yes | Typical states include `Playing`, `Paused`, `Stopped`, or `Unknown`. |
| Read progress and duration | Yes | Available through timeline properties when the client publishes them. |
| Read control availability | Partial | SMTC exposes playback control flags, but the client can still decline a request. |
| Play / pause / toggle | Yes | Sent as a request to the media session; success means accepted by SMTC/client, not audio-confirmed. |
| Next / previous | Yes | Depends on whether the NetEase session enables skip controls. |
| Stop | Partial | Supported by SMTC, but many music clients ignore or treat stop differently from pause. |
| Seek | Partial | Supported by SMTC timeline control, but may be declined or rounded by the client. |
| Watch status changes | Partial | Can be implemented by polling; native SMTC also has change events, but a CLI process may prefer polling. |
| Get song ID | No | SMTC media properties do not expose NetEase song IDs. |
| Get playlist / queue details | No | SMTC exposes the current media session, not NetEase queue/catalog structure. |
| Get lyrics | No | Use NetEase metadata APIs, not SMTC. |
| Get audio URL or download stream | No | SMTC does not expose media streams and should not be used for playback circumvention. |
| Like/unlike, collect, comment, account actions | No | These are NetEase account/API actions, outside SMTC. |
| Open a specific NetEase song by ID | No | SMTC can control an existing session; it does not navigate the client to an arbitrary song. |

## Read Capabilities

### Session Discovery

SMTC can request a `GlobalSystemMediaTransportControlsSessionManager`, then read:

- all currently available media sessions;
- the system's current media session;
- each session's source app identity.

For this project, a NetEase session can be selected by matching the source app
identity against known NetEase-related strings. This is useful but not a formal
NetEase contract; future client package names or bridge names may change.

### Media Metadata

SMTC media properties can expose:

- title;
- artist;
- album title;
- album artist;
- genres;
- subtitle;
- thumbnail;
- track number and album track count;
- playback type.

The current local SMTC helper maps the fields most useful for CLI status output,
including title, artist, album, playback status, timeline, advertised controls,
and optional extended media properties. Fields should still be treated as
optional because the NetEase client may not publish them consistently.

### Playback Information

SMTC can expose playback information at the time of the call:

- playback status;
- playback controls advertised by the session;
- timeline position;
- timeline start/end time, which can be normalized into duration.

This makes SMTC well-suited for `now playing` style output and status polling.
It is weaker for strict verification because the CLI sees the SMTC session
state, not the actual audio pipeline.

## Control Capabilities

SMTC can send request-style control operations to the selected NetEase media
session:

| Operation | SMTC support | CLI suitability | Caveat |
|---|---:|---:|---|
| Play | Yes | High | Only confirms the request was accepted. |
| Pause | Yes | High | Only confirms the request was accepted. |
| Toggle play/pause | Yes | High | Result depends on current state and client behavior. |
| Next track | Yes | High | Requires NetEase to expose next-track control. |
| Previous track | Yes | High | Requires NetEase to expose previous-track control. |
| Stop | Yes | Medium | Music clients may ignore stop or map it to pause. |
| Seek to position | Yes | Medium | Requires a valid timeline and seek-enabled session. |
| Change playback rate | SMTC supports | Low | Not expected to be useful for NetEase music playback. |
| Shuffle/repeat | SMTC supports | Low | Client support is uncertain; NetEase business state may not reflect it. |
| Fast-forward/rewind | SMTC supports | Low | More relevant to video/podcast clients than songs. |
| Record/channel controls | SMTC supports | Not applicable | Outside NetEase music playback use cases. |

Control results should be phrased carefully. A boolean accepted result means the
Windows session/client accepted the request. It does not prove that audio
started, stopped, or reached speakers.

## Current CLI Surface

The implemented command surface is intentionally narrow:

| Command | Purpose | Output |
|---|---|---|
| `nm smtc status` | Read the current NetEase SMTC session. | Current track, app, status, position, duration. |
| `nm smtc status --all` | Include all active system media sessions. | NetEase target plus other sessions for diagnostics. |
| `nm smtc status --watch` | Poll status changes until interrupted. | Text stream or repeated JSON snapshots. |
| `nm smtc sessions` | List active Windows media sessions. | Session list with app identity and current metadata. |
| `nm smtc play` | Request play on the NetEase session. | Request result plus refreshed session. |
| `nm smtc pause` | Request pause on the NetEase session. | Request result plus refreshed session. |
| `nm smtc toggle` | Request play/pause toggle. | Request result plus refreshed session. |
| `nm smtc next` | Request next track. | Request result plus refreshed session. |
| `nm smtc prev` | Request previous track. | Request result plus refreshed session. |
| `nm smtc stop` | Request stop. | Request result plus refreshed session. |
| `nm smtc seek --position <seconds>` | Request seek to an absolute position. | Request result plus refreshed session. |
| `nm smtc rate --value <rate>` | Request playback-rate change. | Request result plus refreshed session. |
| `nm smtc shuffle --enabled <true\|false>` | Request shuffle mode change. | Request result plus refreshed session. |
| `nm smtc repeat --mode <none\|one\|all>` | Request repeat mode change. | Request result plus refreshed session. |
| `nm smtc fast-forward` | Request fast-forward state. | Request result plus refreshed session. |
| `nm smtc rewind` | Request rewind state. | Request result plus refreshed session. |

Machine-facing output should support JSON. A stable normalized shape could be:

```json
{
  "ok": true,
  "source": "smtc",
  "playing": true,
  "action": "play",
  "controlSucceeded": true,
  "session": {
    "sourceAppUserModelId": "...",
    "appName": "...",
    "isNetease": true,
    "song": {
      "title": "...",
      "artist": "...",
      "album": "..."
    },
    "playbackStatus": "Playing",
    "position": 42,
    "duration": 210,
    "canControl": true
  }
}
```

Common failure states should stay explicit:

| Reason | Meaning |
|---|---|
| `unsupported_platform` | The host is not Windows. |
| `helper_missing` | A Windows helper executable or equivalent bridge is unavailable. |
| `no_active_session` | Windows reports no active media sessions. |
| `no_netease_session` | Media sessions exist, but none match NetEase. |
| `invalid_position` | Seek position is missing or invalid. |
| `invalid_rate` | Playback rate is missing or invalid. |
| `invalid_shuffle` | Shuffle value is missing or invalid. |
| `invalid_repeat_mode` | Repeat mode is outside `none`, `one`, or `all`. |
| `unknown_action` | Control action is outside the supported command set. |
| `helper_no_json` / `helper_invalid_json` | The helper failed to return parseable structured output. |

## Product Boundaries

SMTC should be treated as a local user-session capability:

- It only works when the user is on Windows and the NetEase client has an active
  SMTC media session.
- It should not require or collect NetEase cookies.
- It should not download audio, expose stream URLs, bypass DRM, or bypass paid
  content restrictions.
- It should not claim real playback verification. The CLI can report session
  state and accepted control requests, not confirmed audio output.
- It should complement the existing Orpheus/browser playback handoff, not
  replace NetEase catalog APIs or account APIs.

## Recommended Use Cases

1. `now playing` status for the local NetEase desktop client.
2. Local playback controls for an already-active NetEase session.
3. Diagnostics after a playback handoff: whether Windows now sees a NetEase
   session, what track metadata is visible, and what status it reports.
4. Agent-friendly polling with JSON output for dashboards or local automation.

## Not Recommended

1. Starting playback of an arbitrary NetEase song by ID.
2. Resolving NetEase song IDs from SMTC metadata alone.
3. Building queue, playlist, album, lyric, or account features on top of SMTC.
4. Treating `controlSucceeded: true` as proof that music audibly played.
5. Relying on SMTC for non-Windows platforms.

## Source Notes

- Microsoft documents `GlobalSystemMediaTransportControlsSessionManager` as a
  Windows 10 version 1809+ API that can request a session manager and list
  available sessions.
- Microsoft documents `GlobalSystemMediaTransportControlsSession` methods for
  reading playback info, reading media properties, and requesting controls such
  as play, pause, skip, stop, toggle, seek, rate, shuffle, repeat, fast-forward,
  and rewind.
- Microsoft documents media properties including title, artist, album title,
  album artist, genres, subtitle, thumbnail, playback type, and track numbers.
- The local SMTC command/helper maps the project-facing subset used by this CLI:
  status, sessions, play, pause, toggle, next, previous, stop, seek, rate,
  shuffle, repeat, fast-forward, rewind, media metadata, timeline, advertised
  controls, and control acceptance.

References:

- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmanager
- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssession
- https://learn.microsoft.com/en-us/uwp/api/windows.media.control.globalsystemmediatransportcontrolssessionmediaproperties
