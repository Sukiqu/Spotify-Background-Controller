# Remove the Spotify Background Controller MCP registration without deleting package files.
$ErrorActionPreference = 'Stop'

$codex = $null
try { $codex = (Get-Command codex -ErrorAction Stop).Path } catch {}
if (-not $codex -and $env:LOCALAPPDATA) {
  $codex = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin') -Filter 'codex.exe' -File -Recurse -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1 -ExpandProperty FullName
}

if (-not $codex) { throw 'Codex was not found. The MCP registration could not be removed.' }
& $codex mcp remove spotify-background
if ($LASTEXITCODE -ne 0) {
  throw 'Codex could not remove the MCP registration. Authorization data and installation files were preserved.'
}
Write-Output 'Spotify Background Controller MCP registration removed.'

$answer = Read-Host 'Delete local Spotify authorization data? [y/N]'
if ($answer -and $answer.Trim() -match '^(?i:y|yes|e|evet)$') {
  if (-not $env:LOCALAPPDATA) { throw 'LOCALAPPDATA is unavailable. No authorization data was deleted.' }
  $basePath = [System.IO.Path]::GetFullPath($env:LOCALAPPDATA).TrimEnd('\')
  $dataPath = [System.IO.Path]::GetFullPath((Join-Path $basePath 'SpotifyBackground'))
  if ([System.IO.Path]::GetDirectoryName($dataPath) -ne $basePath) {
    throw 'Unexpected data directory. No authorization data was deleted.'
  }
  if (Test-Path -LiteralPath $dataPath) {
    $dataItem = Get-Item -LiteralPath $dataPath -Force
    if ($dataItem.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
      throw 'The authorization directory is a link. Check its target before removing its data manually.'
    }
    Remove-Item -LiteralPath $dataPath -Recurse -Force
    Write-Output 'Local Spotify authorization data deleted.'
  } else {
    Write-Output 'No local Spotify authorization data was found.'
  }
} else {
  Write-Output 'Local Spotify authorization data preserved.'
}

Write-Output 'Uninstall complete. Installation files were preserved. Restart Codex to unload the controller.'
