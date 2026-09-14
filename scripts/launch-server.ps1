$ErrorActionPreference = 'Stop'
$nodeExe = $null
if ($env:CODEX_MCP_NODE_PATH -and (Test-Path -LiteralPath $env:CODEX_MCP_NODE_PATH -PathType Leaf)) {
  $nodeExe = $env:CODEX_MCP_NODE_PATH
}
if (-not $nodeExe) {
  $nodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue
  if ($nodeCommand) { $nodeExe = $nodeCommand.Source }
}
$runtimeRoots = @()
if ($env:LOCALAPPDATA) { $runtimeRoots += Join-Path $env:LOCALAPPDATA 'OpenAI\Codex\runtimes' }
if ($env:USERPROFILE) { $runtimeRoots += Join-Path $env:USERPROFILE '.cache\codex-runtimes' }
foreach ($runtimeRoot in $runtimeRoots) {
  if (-not $nodeExe -and (Test-Path -LiteralPath $runtimeRoot -PathType Container)) {
    $nodeExe = Get-ChildItem -LiteralPath $runtimeRoot -Filter node.exe -File -Recurse -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
  }
}
if (-not $nodeExe) { throw 'Spotify Background Controller could not find a Node.js runtime.' }
& $nodeExe (Join-Path $PSScriptRoot 'server.mjs')
exit $LASTEXITCODE
