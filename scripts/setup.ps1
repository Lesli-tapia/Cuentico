param([switch]$SkipInstall)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskPortableNode = Join-Path $taskRoot '.tools\node-v24.22.1-win-x64'
if (Test-Path -LiteralPath (Join-Path $taskPortableNode 'node.exe')) {
  $env:PATH = $taskPortableNode + [IO.Path]::PathSeparator + $env:PATH
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
  throw 'Instala Node.js 22 o posterior y vuelve a ejecutar este script.'
}
Push-Location -LiteralPath $taskRoot
try {
  if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
  if (-not $SkipInstall) {
    & npm.cmd install
    if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación de dependencias.' }
  }
  & npm.cmd run setup
  if ($LASTEXITCODE -ne 0) { throw 'Falló la preparación de SQLite.' }
  Write-Output 'Cuentico preparado. Inicia con: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev.ps1'
} finally { Pop-Location }
