param(
    [Parameter(Mandatory = $true)]
    [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
    [string]$Archive
)

$ErrorActionPreference = 'Stop'
$resolved = (Resolve-Path -LiteralPath $Archive).Path
$hash = (Get-FileHash -LiteralPath $resolved -Algorithm SHA256).Hash.ToLowerInvariant()
$output = "$resolved.sha256"
"$hash  $(Split-Path -Leaf $resolved)" | Set-Content -LiteralPath $output -Encoding ascii
Write-Output "SHA-256 written to $output"
