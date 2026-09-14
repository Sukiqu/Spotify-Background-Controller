# Changelog

Release preparation for 1.3.2 includes a signed manifest, startup integrity checks, pre-install verification, Windows/Linux CI, and weekly GitHub Actions dependency updates. The private signing key is not distributed. Older releases remain in the owner's private archive.

## 1.3.2 — 2026-09-14

- Keep authorization data when uninstall receives an empty, negative or unrecognized answer. Require an explicit Yes to delete it.
- Report MCP removal and data deletion failures without claiming successful completion; reject linked data directories.
- Use English installer, uninstaller and OAuth result messages. Preserve Turkish command recognition and the Turkish guide.
- Reorganize project documentation and bilingual examples; explain local tasks, Client ID setup, voice prerequisites and current limits.
- Add offline uninstall regression checks and project contribution/data-handling documentation.
- Align plugin starter prompts with the current manifest array format.
- Add a proprietary copyright and usage notice for the public repository.

## 1.3.1

- Fixed successful queue requests being reported as errors when Spotify returns an empty or non-JSON success body.
- Kept unknown network outcomes non-retriable so a track is not accidentally added twice.
- Added queue behavior tests for success, validation, rate limits, authorization refresh, and network failures.

## 1.3.0

- Added the `add_to_queue` MCP tool for Turkish and English queue requests.
- Added bilingual queue documentation.

## 1.2.0

- Added Liked Songs playback support.
- Added Spotify library permission handling.

## 1.1.0

- Added exact playlist matching and playlist playback.
