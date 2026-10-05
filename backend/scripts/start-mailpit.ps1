$ErrorActionPreference = 'Stop'
$backendDirectory = Split-Path -Parent $PSScriptRoot
$executable = Join-Path $backendDirectory '.local/mailpit/mailpit.exe'
if (-not (Test-Path -LiteralPath $executable)) {
    throw 'Instala el binario oficial de Mailpit en backend/.local/mailpit/mailpit.exe. Consulta docs/identity.md.'
}
& $executable --listen 127.0.0.1:8025 --smtp 127.0.0.1:1025 --database (Join-Path $backendDirectory '.local/mailpit/messages.db') --disable-version-check
