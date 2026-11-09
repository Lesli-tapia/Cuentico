param([int]$Port = 3000)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskPortableNode = Join-Path $taskRoot '.tools\node-v24.22.1-win-x64'
if (Test-Path -LiteralPath (Join-Path $taskPortableNode 'node.exe')) {
  $env:PATH = $taskPortableNode + [IO.Path]::PathSeparator + $env:PATH
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Se necesita Node.js 22 o posterior.' }
Push-Location -LiteralPath $taskRoot
try { & npm.cmd run dev -- --port $Port } finally { Pop-Location }
