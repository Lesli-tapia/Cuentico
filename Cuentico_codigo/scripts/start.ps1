param(
  [ValidateRange(1024, 65535)][int]$Port = 3000,
  [switch]$CompartirEnRed
)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskPortableNode = Join-Path $taskRoot '.tools\node-v24.22.1-win-x64'
if (Test-Path -LiteralPath (Join-Path $taskPortableNode 'node.exe')) {
  $env:PATH = $taskPortableNode + [IO.Path]::PathSeparator + $env:PATH
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Se necesita Node.js 22 o posterior.' }
Push-Location -LiteralPath $taskRoot
try {
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo compilar Cuentico.' }
  $taskBindAddress = if ($CompartirEnRed) { '0.0.0.0' } else { '127.0.0.1' }
  if ($CompartirEnRed) {
    Write-Output ('Modo Wi-Fi: abre http://<IPv4 de esta computadora>:' + $Port + ' desde tu celular en la misma red.')
  }
  & node.exe (Join-Path $taskRoot 'node_modules\next\dist\bin\next') start --hostname $taskBindAddress --port $Port
} finally { Pop-Location }
