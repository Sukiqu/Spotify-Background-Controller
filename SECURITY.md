# Data handling and security

## Local authorization data

The controller uses Spotify OAuth Authorization Code with PKCE. It does not require a Client Secret or handle your Spotify password. The temporary callback listener binds to `127.0.0.1:43821`, checks OAuth state, and expires after five minutes.

Access and refresh tokens are encrypted with Windows DPAPI for the current Windows user. The normal installer stores them in `%LOCALAPPDATA%\SpotifyBackground\tokens.dpapi`. DPAPI does not protect against software already running with that Windows user's privileges.

The server contacts Spotify's authorization and Web API endpoints. This project has no additional analytics or telemetry endpoint. Track titles, device names, playlist names and playback results returned to Codex become part of the host's tool interactions.

## Removal

Version 1.3.2 preserves authorization data by default during uninstall. Only an explicit Yes removes the local data directory. Installation files remain intact. Removing local files does not revoke authorization on Spotify's servers; manage connected apps in your Spotify account if you also want to revoke it.

Version 1.3.1 users must explicitly answer N to preserve authorization data; its empty-response behavior is fixed in 1.3.2.

## Package integrity

Before installation and MCP startup, the controller verifies the bytes of `.codex-plugin/plugin.json` against `plugin.json.sig` using the bundled `public-key.pem`. The private signing key is not included. A missing verification file, an unreadable key or an invalid manifest signature stops verification.

The package performs a signed-manifest check before installation and startup. The verification details and package-integrity limits are documented here so users can understand how the check works.

The Release includes a SHA-256 checksum for the installer ZIP. Comparing it with a downloaded ZIP detects a difference from the published checksum. A checksum is not encryption or a digital signature, and it does not establish authenticity if both the ZIP and its published checksum are replaced.

## Reporting a vulnerability

Do not attach tokens, Client Secrets, authorization codes or live authorization links to an issue. If GitHub offers a private vulnerability reporting option for this repository, use it. Otherwise contact the repository owner through an existing private channel before sharing sensitive technical details. This project does not currently publish a dedicated security email address.

Ordinary bug reports can use GitHub Issues with sensitive information removed. There is no guaranteed response time or independent security certification.
