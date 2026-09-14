# Spotify Background Controller — English setup guide

Version 1.3.2 · [Project overview](README.md) · [Türkçe](README-TURKCE.md)

## Before installing

You need Windows, Codex, an available Node.js runtime, Spotify Premium, and the Spotify desktop app. Use a local Codex task on the computer running this package. The built-in Spotify connector is a separate integration.

## Install

1. Download **Spotify-Background-Controller-1.3.2.zip** from [Releases](https://github.com/Sukiqu/Spotify-Background-Controller/releases/latest).
2. Extract the complete ZIP to a permanent location. Keep all files together.
3. Double-click **Spotify Background Controller - Install.cmd**. Do not paste its contents into PowerShell or run it inside the ZIP.
4. Check that installation completed successfully, then fully close and restart Codex.
5. Open a new **local Codex task** and open the Spotify desktop app.

The installer finds Codex and Node on your computer and registers `spotify-background`. It does not install these prerequisites. Moving or deleting the extracted folder breaks the registration; after moving it, rerun the installer from the new location.

## Get your Spotify Client ID

A Client ID identifies your developer application. It is not a password and cannot grant access to your account by itself. This project uses OAuth Authorization Code with PKCE, so it does not need a Client Secret.

1. Open the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and sign in with your Spotify account.
2. Select an existing application or create an application for your personal controller. Select **Web API** if the form asks which API you will use.
3. Open the application's settings. Add and save this exact **Redirect URI**:

   `http://127.0.0.1:43821/callback`

4. Copy the **Client ID** displayed for that application. Do not copy **Client Secret**.
5. If a different Spotify account will authorize a Development Mode app, check its **Users and Access** allowlist.

Spotify applies [Development Mode account and user limits](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide): new apps have a five-user limit and developers can create one Client ID; the app owner needs Premium. Existing apps may retain grandfathered IDs or users. Use your existing app when appropriate.

See Spotify's [app setup](https://developer.spotify.com/documentation/web-api/concepts/apps) and [Redirect URI rules](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri) for current requirements. The loopback address points to this computer and must match the saved setting.

## Connect in Codex

1. Send: `Connect Spotify Background Controller. Client ID: YOUR_CLIENT_ID`
2. Open the authorization link returned by the controller and approve the Spotify permissions. The link expires after five minutes.
3. After the browser displays **Spotify connected**, return to Codex and ask: `Check Spotify Background Controller connection status.`
4. Ask: `List my Spotify devices.` Select the computer by its exact device name.
5. Try: `Play Monster by Skillet on DEVICE_NAME.`

The controller does not need access to your Developer Dashboard. You configure the developer app yourself; the controller receives the Client ID and returns Spotify's authorization link. Never send a Client Secret, password, authorization code or token in chat.

## Example commands

Type these commands, or speak them when your Codex session supports voice. Replace names and `DEVICE_NAME` with your own values.

| Action | Example |
| --- | --- |
| Check connection | “Check Spotify Background Controller connection status.” |
| Connect | “Connect Spotify Background Controller. Client ID: YOUR_CLIENT_ID” |
| List devices | “List my Spotify devices.” |
| Find a song | “Find Monster by Skillet.” |
| Resolve an ambiguous title | “Play Monster.” — Codex should ask you to choose an artist. |
| Play a song | “Play Monster by Skillet on DEVICE_NAME.” |
| Play a track link | “Play this Spotify track link on DEVICE_NAME: TRACK_LINK.” |
| List library playlists | “List my Spotify playlists.” |
| Start a playlist | “Start the Focus playlist from my library on DEVICE_NAME.” |
| Play Liked Songs | “Play my Liked Songs on DEVICE_NAME.” |
| Queue a song | “Add Monster by Skillet to the queue on DEVICE_NAME.” |
| Pause / resume | “Pause Spotify on DEVICE_NAME.” / “Resume Spotify on DEVICE_NAME.” |
| Next / previous | “Next song on DEVICE_NAME.” / “Previous song on DEVICE_NAME.” |
| Set volume | “Set Spotify volume to 30 percent on DEVICE_NAME.” |
| Check playback | “What is playing on Spotify?” |

Liked Songs uses up to 100 saved tracks; playlist lookup reads up to 1,000 library playlists. Whole-playlist queueing is not supported. Queue success acknowledges acceptance without verifying queue position. After a timeout, inspect Spotify's queue before trying again.

## Update or uninstall

To update, extract the new version, run its Install file, then restart Codex. Existing authorization data is stored outside the package and is normally reused. Reconnect only if required permissions changed, authorization expired or you want to use a different account.

To uninstall, double-click **Spotify Background Controller - Uninstall.cmd**. It removes the MCP registration. At the data deletion prompt, **Enter or N keeps authorization data**; only an explicit **Y/Yes** deletes it. Installation files remain on disk. Restart Codex afterward. This safe default applies to version 1.3.2; in 1.3.1, explicitly answer **N** to preserve data.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Controller is missing in a new task | Use a local Codex task, restart Codex, and rerun Install if the package was moved. |
| Codex or Node cannot be found | Install the missing prerequisite or make Node available on PATH, then rerun Install. |
| Invalid Redirect URI | Save `http://127.0.0.1:43821/callback` exactly in your developer app. |
| Authorization link expired or local port busy | Finish or close an earlier connection attempt; request a fresh link after it expires. |
| Spotify denies access | Check Premium, the app's user allowlist, and granted library/playback permissions. |
| Computer is not listed | Open Spotify on that computer, confirm the same Spotify account, then list devices again. |
| Secure storage is unavailable | Run under your normal Windows account. Authorization files cannot be moved between Windows accounts/computers as a portable login. |
| Queue outcome is unknown | Inspect Spotify before repeating the command. |
| Codex asks for tool approval | Follow your Codex approval settings; the controller does not bypass them. |
| Plugin integrity verification failed | Re-extract the official release ZIP. Do not edit or remove `.codex-plugin/plugin.json`, its signature, or the public key. |

See [data handling](SECURITY.md). When reporting a problem, include the version, Windows version and redacted error text; never attach authorization data.
