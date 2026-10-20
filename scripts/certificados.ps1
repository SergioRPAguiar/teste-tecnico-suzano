function Export-WindowsRootCaBundle {
    param([string]$Directory = [System.IO.Path]::GetTempPath())
    $blocked = New-Object 'System.Collections.Generic.HashSet[string]'
    $seen = New-Object 'System.Collections.Generic.HashSet[string]'
    $pem = New-Object System.Text.StringBuilder
    $locations = @([System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser, [System.Security.Cryptography.X509Certificates.StoreLocation]::LocalMachine)
    # Apenas raizes explicitamente confiaveis; intermediarios nao viram novas
    # ancoras de confianca. Respeita tambem o repositorio Disallowed do Windows.
    foreach ($name in @('Disallowed', 'Root')) {
        foreach ($location in $locations) {
            $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($name, $location)
            try {
                $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadOnly -bor [System.Security.Cryptography.X509Certificates.OpenFlags]::OpenExistingOnly)
                foreach ($certificate in $store.Certificates) {
                    try {
                        if ($name -eq 'Disallowed') { [void]$blocked.Add($certificate.Thumbprint); continue }
                        if ($blocked.Contains($certificate.Thumbprint) -or -not $seen.Add($certificate.Thumbprint)) { continue }
                        [void]$pem.AppendLine('-----BEGIN CERTIFICATE-----')
                        [void]$pem.AppendLine([Convert]::ToBase64String($certificate.RawData, [System.Base64FormattingOptions]::InsertLineBreaks))
                        [void]$pem.AppendLine('-----END CERTIFICATE-----')
                    } finally { $certificate.Dispose() }
                }
            } finally { $store.Close() }
        }
    }
    if ($seen.Count -eq 0) { throw 'Nenhuma CA raiz confiavel foi encontrada no Windows.' }
    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) { throw 'Diretorio para o bundle temporario indisponivel.' }
    $path = Join-Path $Directory (".suzano-build-ca-{0}.pem" -f [guid]::NewGuid().ToString('N'))
    try {
        [System.IO.File]::WriteAllText($path, $pem.ToString(), (New-Object System.Text.UTF8Encoding($false)))
        return [pscustomobject]@{ Path = $path; Count = $seen.Count }
    } catch {
        if ([System.IO.File]::Exists($path)) { [System.IO.File]::Delete($path) }
        throw
    }
}
