# Offline integration tests: every external command, prompt and deletion is mocked.
$ErrorActionPreference = 'Stop'
$uninstallScript = Join-Path $PSScriptRoot '..\uninstall.ps1'
$originalLocalAppData = $env:LOCALAPPDATA
$testRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'mock-local-appdata'))
$cases = @(
  @{ Answer=''; Deletes=0 }, @{ Answer=' '; Deletes=0 },
  @{ Answer='N'; Deletes=0 }, @{ Answer='no'; Deletes=0 },
  @{ Answer='H'; Deletes=0 }, @{ Answer='maybe'; Deletes=0 },
  @{ Answer='yesterday'; Deletes=0 }, @{ Answer='Y'; Deletes=1 },
  @{ Answer=' yes '; Deletes=1 }, @{ Answer='Evet'; Deletes=1 },
  @{ Answer='Y'; Deletes=0; NativeFailure=$true; Throws=$true },
  @{ Answer='Y'; Deletes=0; Linked=$true; Throws=$true },
  @{ Answer='Y'; Deletes=0; Missing=$true }
)
try {
  $env:LOCALAPPDATA = $testRoot
  foreach ($case in $cases) {
    & {
      param($case, $uninstallScript, $testRoot)
      $observed = @{ Removals = [Collections.Generic.List[string]]::new(); Calls=0; Prompts=0 }
      function Get-Command { param($Name, $ErrorAction) return @{Path='Invoke-CodexMock'} }
      function Invoke-CodexMock {
        if (($args -join ' ') -ne 'mcp remove spotify-background') { throw 'Unexpected command.' }
        $observed.Calls++
        $global:LASTEXITCODE = if ($case.NativeFailure) { 1 } else { 0 }
      }
      function Read-Host { param($Prompt) $observed.Prompts++; return $case.Answer }
      function Test-Path { param($LiteralPath) return -not $case.Missing }
      function Get-Item {
        param($LiteralPath, [switch]$Force)
        return @{Attributes = $(if ($case.Linked) { [IO.FileAttributes]::ReparsePoint } else { [IO.FileAttributes]::Directory })}
      }
      function Remove-Item {
        param($LiteralPath, [switch]$Recurse, [switch]$Force)
        $expected = Join-Path $testRoot 'SpotifyBackground'
        if ($LiteralPath -ne $expected) { throw 'Deletion escaped the authorization directory.' }
        $observed.Removals.Add($LiteralPath)
      }
      $failure = $null
      try { . $uninstallScript | Out-Null } catch { $failure = $_ }
      if ([bool]$failure -ne [bool]$case.Throws) { throw "Unexpected error state for '$($case.Answer)': $failure" }
      if ($observed.Removals.Count -ne $case.Deletes) { throw "Wrong deletion count for '$($case.Answer)'." }
      if ($observed.Calls -ne 1) { throw 'MCP removal was not called exactly once.' }
      if ($case.NativeFailure -and $observed.Prompts -ne 0) { throw 'Data prompt appeared after MCP removal failed.' }
    } $case $uninstallScript $testRoot
  }
} finally { $env:LOCALAPPDATA = $originalLocalAppData }
Write-Output "$($cases.Count) uninstall regression cases passed. No actual registration or files were changed."
