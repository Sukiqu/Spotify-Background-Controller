# Contributing

Report reproducible problems through [GitHub Issues](https://github.com/Sukiqu/Spotify-Background-Controller/issues). Include the controller version, Windows and Node versions, the requested action, expected behavior, and a redacted error message.

Do not include tokens, authorization links, authorization codes, passwords, or Client Secrets. For security issues, follow [SECURITY.md](SECURITY.md).

Before proposing a change, run the offline tests below. Add a regression test for changes to request retries, device selection, authorization or deletion behavior. Keep English and Turkish setup guides consistent. Keep technical identifier `spotify-background` stable.

## Development checks

The server uses Node.js built-in modules and has no npm dependencies. Clone the source repository or download its source archive, then run these commands from its root directory. The installer ZIP excludes development tests and contributor files.

```powershell
node --test tests/*.test.mjs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/uninstall.test.ps1
```

These checks use simulated Spotify responses and mocked uninstall operations. They do not verify live account playback or voice recognition.

Tag releases only after version metadata, documentation and the release ZIP agree. Record changes in [CHANGELOG.md](CHANGELOG.md). Do not overwrite an already released version with different code.

No open-source license has been selected; coordinate reuse and contribution terms with the repository owner before redistributing code.
