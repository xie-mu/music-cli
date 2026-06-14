# SKILL.md Capability Audit - 2026-06-15

## Conclusion

Overall status: **Pass with documented follow-up risks**.

`SKILL.md` is now structurally complete for the 11 requested skill architecture
parts, and its high-priority NetEase routing contract is mostly aligned with
the current CLI. Runtime evidence confirms `nm v1.2.0`, 75 commands across 17
groups, and 74 exported agent schemas. Existing architecture tests also pass.

This audit did **not** execute any repair action against `SKILL.md`, source
code, tests, reference docs, remote playlists, playback state, local queue, or
local memory. The only repository change in this pass is this audit document.

Risk summary:

| Risk | Level | Summary |
|---|---:|---|
| Missing explicit router entry for `recommend playlists` | Medium | Real command exists and is registered, but `SKILL.md` routes only `nm recommend songs` under recommendations. |
| Some commands lack `permission` metadata | Medium | `SKILL.md` classifies them as no-login, but schemas expose `(none)` permission for auth/config/pipeline/nowplaying commands. |
| Version gate mixes installed and repo-local checks | Low | `nm --version` and `where nm` are install checks; `node dist/main.mjs --help` is repo-local and may not exist for a global-only agent. |
| YAML capability list is high-level, not exhaustive | Low | `primary_capabilities` omits some real surfaces such as recommendations, user data, library, and config management. |

## Evidence

Verification commands run:

```bash
git status --short --branch
node dist/main.mjs --help
node dist/main.mjs config export-schema --output json
npm test -- --run tests/architecture.test.ts
rg -n "<old command counts, garbled markers, old auth wording, memory wildcard misuse, platform drift, playback overclaiming, bypass wording>" SKILL.md README.md docs/reference/auth.md docs/reference/index.md docs/PLAYBACK_STRATEGY.md
```

Observed runtime facts:

| Fact | Result |
|---|---|
| CLI version | `1.2.0` |
| Registered commands from `dist/main.mjs --help` | 75 |
| Top-level groups from `dist/main.mjs --help` | 17 |
| Exported schemas from `config export-schema` | 74 |
| Full schema contains `netease_playlist_play` | Yes |
| Full schema contains `netease_playlist_import-album` | Yes |
| Full schema contains `netease_config_export-schema` | No |
| Single schema lookup for `config export-schema` | Works; permission field absent |
| Architecture tests | 12 passed |
| Inline `nm ...` references in `SKILL.md` | 67 |
| Unresolved inline command references | 0 |
| Capability table rows | 32 |
| Duplicate command rows | 0 |

Current worktree before this audit document:

```text
## codex/derived-worktree-20260606...origin/codex/derived-worktree-20260606 [ahead 3]
 M README.md
 M SKILL.md
 M docs/reference/auth.md
 M docs/reference/index.md
 M tests/architecture.test.ts
```

## 11-Part Structure Review

| Area | Status | Evidence | Notes |
|---|---|---|---|
| YAML format / agent-readable declaration | Verified consistent | `SKILL.md` frontmatter plus `Agent-readable YAML declaration` section | Contains name, binary, priority, command/schema counts, sources, and primary capabilities. |
| Priority declaration | Verified consistent | `Priority declaration` section | Correctly anchors `nm` as highest priority while preserving safety limits. |
| Version gate | Partially consistent | `Version gate` section | Correct version and Node runtime are stated. Repo-local `node dist/main.mjs --help` may not exist in global-only installs. |
| Authoritative reference point | Verified consistent | `Authoritative reference points` section | Correctly points to runtime registry, reference docs, schema export, playback, and SMTC docs. |
| Intent-to-command router | Partially consistent | `Intent-to-command router` table | Covers major command families; misses explicit `recommend playlists` route. |
| Anti-pattern guard | Verified consistent | `Anti-pattern guard` section | Accurately guards against scraping, playback overclaiming, queue confusion, rights bypass, and silent mutation. |
| Setup auth | Verified consistent | `Setup and auth` section | Auth commands and no-login boundary are present. See permission metadata caveat below. |
| Quick example | Verified consistent | `Quick examples` section | Examples cover discovery/playback, cloud playlist write/play, album import, local queue, and schema export. |
| Capability boundary | Verified consistent | `Capability boundary` section | Correctly distinguishes handoff vs playback confirmation, local queue vs desktop queue, CDN denial, and SMTC limits. |
| Agent workflow | Verified consistent | `Agent workflows` section | Includes discovery, playlist write, album import, and playback control workflows. |
| Error escalation | Verified consistent | `Error escalation` section | Covers usage/auth/network/CDN/playback/SMTC/schema drift paths without instructing unsafe bypass. |

## Capability-to-CLI Alignment Matrix

| Capability declared in `SKILL.md` | Runtime command evidence | Status |
|---|---|---|
| Search | `search`, `search hot`, `search suggest` | Verified |
| Song metadata | `music info` | Verified |
| Lyrics | `music lyric` | Verified |
| Play URLs | `music url` | Verified |
| Single-song playback handoff | `music play` | Verified |
| Song download | `music download` | Verified, with CDN/right boundary documented |
| Cloud playlist read | `playlist show`, `playlist tracks`, `playlist summary`, `playlist export`, `playlist audit` | Verified |
| Cloud playlist write | `playlist create`, `playlist add`, `playlist remove`, `playlist dedupe`, `playlist merge` | Verified |
| Album import into playlist | `playlist import-album` | Verified |
| Whole-playlist desktop push | `playlist play` | Verified |
| Album metadata | `album show`, `album dynamic`, `album summary` | Verified |
| Album subscription | `album sub`, `album unsub` | Verified |
| Recommendations | `recommend songs`, `recommend playlists` | Partial: router only names `recommend songs` |
| Charts | `toplist`, `toplist detail` | Verified |
| User/account data | `user profile`, `user account`, `user history`, `user level`, `user subcount` | Verified |
| Local queue | `queue add/list/remove/clear/next/play` | Verified |
| Windows SMTC | `smtc status/sessions/play/pause/toggle/next/prev/stop/seek/rate/shuffle/repeat/fast-forward/rewind` | Verified |
| Browser now playing | `nowplaying` | Verified |
| Local memory | `memory show/export/clear` | Verified, with `memory clear` marked sensitive |
| Pipeline | `pipeline validate`, `pipeline run` | Verified |
| Diagnostics | `doctor` | Verified |
| Tool schema | `config export-schema` | Verified, full export excludes itself |

## Command Reference Validity

Automated static review found:

| Check | Result |
|---|---|
| Backticked `nm ...` references in `SKILL.md` | 67 |
| References resolving to real registered commands or allowed shorthand | 67 |
| Unresolved references | 0 |
| Capability table duplicate command rows | 0 |
| Old `73 commands` statements | 0 in `SKILL.md` |
| Old `Auth-free commands` / `Public data` wording | 0 in `SKILL.md` |
| Garbled marker scan | No stale garbled markers in `SKILL.md` |

The broader `rg` scan also found safety uses of the word `bypass` in
`SKILL.md`. These are expected because the document correctly says not to
bypass NetEase restrictions.

## Permission Boundary Review

Source type definition allows command permissions:

```text
public | auth | write | sensitive
```

Observed command metadata distribution:

| Permission metadata | Command count |
|---|---:|
| `public` | 42 |
| `auth` | 13 |
| `write` | 10 |
| `sensitive` | 1 |
| absent / `(none)` | 9 |

Commands without explicit permission metadata:

```text
auth login
auth logout
auth status
config export-schema
config set
config show
nowplaying
pipeline run
pipeline validate
```

Assessment:

- `SKILL.md` correctly classifies these as not requiring NetEase login.
- However, schemas for commands without metadata expose no `permission` field.
- This creates a contract gap for agents that rely only on schema permissions
  rather than reading `SKILL.md` or reference docs.

Recommended follow-up, not executed here:

- Add explicit `permission: 'public'` to `auth *`, `config *`, `pipeline *`,
  and `nowplaying`, or document that absent permission means no-login only for
  these specific groups.

## Playback Boundary Review

`SKILL.md` correctly states:

- `nm music play`, `nm queue play`, and `nm playlist play` are handoff commands.
- Orpheus/browser launch does not prove audio is playing.
- `nm smtc status` is the stronger local evidence path on Windows.
- `nm queue *` is CLI-local state and does not rewrite the NetEase desktop
  right-side playback queue.
- CDN URL/download failures may be NetEase rights outcomes rather than CLI
  failures.

No playback-control command was executed during this audit.

Recommended follow-up, not executed here:

- Keep future playback wording aligned with this boundary. Do not change
  `SKILL.md` to imply that protocol launch equals confirmed audio.

## Findings

### P2 - `recommend playlists` is registered but not separately routed

Evidence:

- Runtime `--help` lists `recommend playlists`.
- `src/main.ts` registers `recommendPlaylistsCommand`.
- `SKILL.md` router row says only: `Recommendations | nm recommend songs`.

Impact:

- Agents using the skill router may miss the daily/recommended playlist path
  and overuse `recommend songs` or manual search.

Suggested next action:

- Add a separate router row for `nm recommend playlists`, or change the row to
  explicitly mention both recommendation commands.

### P2 - Permission metadata is incomplete for no-login command families

Evidence:

- Schema export permissions include `(none)`.
- Single schema lookup for `config export-schema` returns no permission field.
- Static metadata extraction found 9 registered commands with absent
  permission metadata.

Impact:

- Agents relying on schema-only permission gates cannot distinguish these
  commands from accidentally unclassified commands.

Suggested next action:

- Either fill source permission metadata for those commands or add a test and
  document a deliberate `(none)` meaning.

### P3 - Version gate includes a repo-local command in a global-install context

Evidence:

- `SKILL.md` setup uses `npm install -g netease-music-cli`, `nm --version`, and
  `where nm`.
- Version gate also uses `node dist/main.mjs --help`.

Impact:

- An agent using only the globally installed CLI may not have `dist/main.mjs`
  available.

Suggested next action:

- Separate global-install verification from repo-local verification.

### P3 - YAML `primary_capabilities` is intentionally high-level but not exhaustive

Evidence:

- YAML includes major capabilities such as search, playback, cloud playlist
  write, local queue, SMTC, pipeline, diagnostics.
- Runtime includes additional surfaces such as recommendations, user/account
  data, library liked songs, config management, charts, and memory.

Impact:

- The YAML declaration is useful as an anchor but not enough as a full tool
  inventory.

Suggested next action:

- Either rename the field to `primary_capabilities` deliberately, as it is now,
  or add a second `not_exhaustive: true` / `see_reference_index: true` marker.

## Suggested Fix List

No fixes were executed in this audit. Suggested future changes:

1. Add explicit routing for `nm recommend playlists` in `SKILL.md`.
2. Decide whether absent command permission metadata is allowed; if not, add
   explicit permissions for auth/config/pipeline/nowplaying commands.
3. Split version-gate checks into global CLI checks and repo-local checks.
4. Add a marker that YAML `primary_capabilities` is intentionally non-exhaustive.
5. Keep the existing architecture test that guards command references, duplicate
   rows, auth boundary summaries, and schema exclusion.
