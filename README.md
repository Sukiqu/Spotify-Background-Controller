# Spotify Background Controller

Ask Codex to control Spotify while you keep working. Play songs and playlists, add a song to the queue, skip tracks, or change volume without bringing Spotify to the foreground.

**Windows · Local Codex MCP server · Spotify Connect · Version 1.3.2**

[English setup guide](README-ENGLISH.md) · [Türkçe kurulum rehberi](README-TURKCE.md) · [Download the latest release](https://github.com/Sukiqu/Spotify-Background-Controller/releases/latest)

## What it does

| Capability | Example request |
| --- | --- |
| Play a specific song | “Play Monster by Skillet on my computer.” |
| Play a library playlist | “Start the Focus playlist from my library.” |
| Play Liked Songs | “Play my Liked Songs.” |
| Add one song to the queue | “Add Monster by Skillet to the queue.” |
| Control playback | “Pause Spotify.” / “Resume.” / “Next song.” |
| Set volume | “Set Spotify volume to 30 percent.” |
| Inspect playback | “What is playing on Spotify?” |

You can type these requests in a local Codex task. Where your Codex session supports voice, you can speak the same requests. Voice recognition and microphone access are provided by Codex; this controller does not implement a separate voice assistant.

The controller sends requests through the Spotify Web API to an explicitly selected Spotify Connect device. Playback commands do not use mouse or keyboard automation. Initial account authorization requires opening Spotify's permission page.

## Requirements and limits

- Windows, a working Codex installation, and an available Node.js runtime. The installer searches for Node on PATH and in known Codex runtime locations; it does not bundle or download Codex or Node.
- Spotify Premium, an available Spotify desktop device, and your own Spotify developer application.
- One initial Spotify authorization per Windows account and computer. Detailed Client ID and Redirect URI instructions are in the setup guides above.
- This package registers a local MCP server named `spotify-background`. It is separate from the built-in Spotify connector and is not automatically available in a regular ChatGPT or cloud conversation.
- Liked Songs playback uses up to 100 saved tracks. Playlist lookup reads up to 1,000 library playlists.
- Queueing an entire playlist is not implemented. A queue acknowledgement confirms Spotify accepted the request, not its position in the queue.
- After an unknown network outcome, inspect Spotify before repeating a queue request to avoid duplicates.
- Keep the extracted installation folder in its installed location. If you move it, rerun the installer from the new location.
- Tool approval prompts are controlled by Codex. This controller does not override your approval settings.

## Documentation

- [English: installation, connection, example commands and troubleshooting](README-ENGLISH.md)
- [Türkçe: kurulum, bağlantı, örnek komutlar ve sorun giderme](README-TURKCE.md)
- [Release history](CHANGELOG.md)
- [Contributing and reporting issues](https://github.com/Sukiqu/Spotify-Background-Controller/blob/main/CONTRIBUTING.md)
- [Data handling and security reports](SECURITY.md)
- [Copyright and usage terms](LICENSE.md)

## Development

The server uses Node.js built-in modules and has no npm dependencies.

The commands below are for a source checkout, not the installer ZIP. Clone the [source repository](https://github.com/Sukiqu/Spotify-Background-Controller) or download its source archive, then run the commands from its root directory. The installer ZIP intentionally excludes development tests and contributor files.

```powershell
node --test tests/*.test.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/uninstall.test.ps1
```

The automated checks use simulated Spotify responses and mocked uninstall operations. They do not verify live account playback or voice recognition.

| Path | Purpose |
| --- | --- |
| `scripts/` | MCP server, Spotify requests, OAuth PKCE and Windows DPAPI token storage |
| `.codex-plugin/plugin.json` | Plugin identity and presentation metadata |
| `.mcp.json` | Companion MCP launch configuration |
| `install.ps1` / `uninstall.ps1` | Local registration and removal |
| `tests/` | Offline regression checks |

## Project status

Version 1.3.2 is the current release. The controller is usable for local Windows Codex tasks and is still under active development. Live Spotify behavior depends on Spotify account access, Premium status, Development Mode limits, and the selected Connect device. Voice commands depend on voice support in the Codex session; this project does not provide its own speech-recognition service.

This project is independent and is not an official Spotify or OpenAI product. Copyright © 2026 suki. All rights reserved. See [LICENSE.md](LICENSE.md) for usage terms.

Before installation and startup, the controller checks the signature of `.codex-plugin/plugin.json` using the bundled public key. This check covers the manifest only; it does not verify the scripts, installers, documentation or entire ZIP. Someone who can replace the package can also replace the key, signature or verifier. The Release provides a SHA-256 checksum to compare downloaded ZIP files. See [SECURITY.md](SECURITY.md#package-integrity) for the scope and limits of these checks.
