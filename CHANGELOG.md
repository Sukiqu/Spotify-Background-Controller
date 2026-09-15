# Changelog

User-facing features and fixes in Spotify Background Controller.

## 1.3.2 — 2026-09-14

- Keep authorization data when uninstall receives an empty, negative or unrecognized answer. Require an explicit Yes to delete it.
- Report MCP removal and data deletion failures without claiming successful completion; reject linked data directories.
- Use English installer, uninstaller and OAuth result messages. Preserve Turkish command recognition and the Turkish guide.
- Verify the signed plugin manifest before installation and startup; stop if the manifest or required verification files are missing or invalid.
- Update starter prompts for compatibility with Codex.

## 1.3.1

- Fixed successful queue requests being reported as errors when Spotify returns an empty or non-JSON success body.
- Kept unknown network outcomes non-retriable so a track is not accidentally added twice.

## 1.3.0

- Added the `add_to_queue` MCP tool for Turkish and English queue requests.

## 1.2.0

- Added Liked Songs playback support.
- Added Spotify library permission handling.

## 1.1.0

- Added exact playlist matching and playlist playback.
