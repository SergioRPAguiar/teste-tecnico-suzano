param([Parameter(Mandatory = $true)][string]$Directory)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

. (Join-Path $PSScriptRoot '../../scripts/certificados.ps1')
Export-WindowsRootCaBundle -Directory $Directory | ConvertTo-Json -Compress
