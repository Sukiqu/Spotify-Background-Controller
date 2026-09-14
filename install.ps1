# Register Spotify Background Controller using the paths available on this computer.
$ErrorActionPreference = 'Stop'

$pluginRoot = $PSScriptRoot
$server = Join-Path $pluginRoot 'scripts\server.mjs'
if (-not (Test-Path -LiteralPath $server)) {
  throw "server.mjs was not found in this plugin folder: $server"
}

function Find-Codex {
  try {
    $found = (Get-Command codex -ErrorAction Stop).Path
    if ($found) { return $found }
  } catch {}
  if ($env:LOCALAPPDATA) {
    return Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\bin') -Filter 'codex.exe' -File -Recurse -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1 -ExpandProperty FullName
  }
}

function Find-Node {
  if ($env:CODEX_MCP_NODE_PATH -and (Test-Path -LiteralPath $env:CODEX_MCP_NODE_PATH)) {
    return $env:CODEX_MCP_NODE_PATH
  }
  try {
    $found = (Get-Command node -ErrorAction Stop).Path
    if ($found) { return $found }
  } catch {}
  $roots = @()
  if ($env:LOCALAPPDATA) { $roots += (Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\runtimes') }
  if ($env:USERPROFILE) { $roots += (Join-Path $env:USERPROFILE '.cache\codex-runtimes') }
  foreach ($root in $roots) {
    if (Test-Path -LiteralPath $root) {
      $found = Get-ChildItem -Path $root -Filter 'node.exe' -File -Recurse -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 -ExpandProperty FullName
      if ($found) { return $found }
    }
  }
}

$codex = Find-Codex
if (-not $codex) { throw 'Codex executable was not found. Install Codex and run this file again.' }
$node = Find-Node
if (-not $node) { throw 'Node.js runtime was not found. Run this from a Codex installation that provides its Node runtime.' }

# Validate the package before changing an existing MCP registration.
$integrityScript = Join-Path $pluginRoot 'scripts\integrity.mjs'
& $node $integrityScript
if ($LASTEXITCODE -ne 0) { throw 'Package integrity check failed. Extract a fresh official release before installing.' }

$dataRoot = if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA 'SpotifyBackground' } else { Join-Path $env:USERPROFILE 'SpotifyBackground' }
New-Item -ItemType Directory -Force -Path $dataRoot | Out-Null

# This is the same registration as the known-working command, with machine-specific paths discovered above.
$strictErrorAction = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
try { & $codex mcp remove spotify-background 2>$null } catch {}
$addOutput = & $codex mcp add spotify-background --env ("SPOTIFY_BACKGROUND_DATA_DIR=" + $dataRoot) -- $node $server 2>&1
$addExitCode = $LASTEXITCODE
$ErrorActionPreference = $strictErrorAction
if ($addExitCode -ne 0) {
  $addOutput | ForEach-Object { Write-Output $_ }
  throw 'Codex could not register Spotify Background Controller.'
}
$addOutput | ForEach-Object { Write-Output $_ }

Write-Output 'Spotify Background Controller registered successfully.'
Write-Output ('Codex: ' + $codex)
Write-Output ('Node: ' + $node)
Write-Output ('Server: ' + $server)
Write-Output ('Data: ' + $dataRoot)
Write-Output 'Restart Codex and start a new local task before using the controller.'
