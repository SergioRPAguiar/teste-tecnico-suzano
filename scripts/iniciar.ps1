param([switch]$Verificar, [switch]$SemBuild)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'
$example = Join-Path $root '.env.example'

function Docker-Step([string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker falhou: docker $($Arguments -join ' ')" }
}

try {
    Write-Host 'Case Suzano - verificacao do ambiente'
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker nao encontrado. Instale e abra o Docker Desktop com containers Linux. Veja docs/INSTALACAO.md.'
    }
    Docker-Step @('compose', 'version')
    $os = & docker info --format '{{.OSType}}'
    if ($LASTEXITCODE -ne 0) { throw 'Motor Docker indisponivel. Abra o Docker Desktop e aguarde Engine running; no Linux, verifique o servico e suas permissoes.' }
    if ("$os".Trim() -ne 'linux') { throw 'Selecione containers Linux no Docker Desktop.' }
    $helpText = & docker compose up --help
    if ($LASTEXITCODE -ne 0 -or ($helpText -join "`n") -notmatch '--wait-timeout') {
        throw 'Atualize Docker Compose v2: o iniciador exige suporte a --wait e --wait-timeout.'
    }
    if (-not (Test-Path -LiteralPath $envFile)) {
        if ($Verificar) { Write-Host 'Ainda nao ha .env; validando o exemplo sem criar arquivos.' }
        else { Copy-Item -LiteralPath $example -Destination $envFile; Write-Host '.env criado com configuracao de demonstracao.' }
    } else { Write-Host '.env existente preservado.' }
    $selectedEnv = if (Test-Path -LiteralPath $envFile) { $envFile } else { $example }
    $composeArgs = @('compose', '--project-directory', $root, '--env-file', $selectedEnv, '-f', (Join-Path $root 'compose.yaml'))
    Docker-Step ($composeArgs + @('config', '--quiet'))
    if ($Verificar) { Write-Host 'Pre-requisitos e configuracao validos. Nenhum servico foi alterado.'; exit 0 }

    $buildOption = if ($SemBuild) { '--no-build' } else { '--build' }
    Write-Host 'Iniciando. Na primeira execucao, o build baixa imagens e pode levar varios minutos.'
    Docker-Step ($composeArgs + @('up', '-d', $buildOption, '--wait', '--wait-timeout', '180'))
    Docker-Step ($composeArgs + @('ps', '-a'))
    $json = & docker @composeArgs config --format json
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar os enderecos finais.' }
    $config = ($json -join "`n") | ConvertFrom-Json
    $webPort = $config.services.web.ports[0].published
    $apiPort = $config.services.api.ports[0].published
    Write-Host "`nAplicacao pronta: http://localhost:$webPort"
    Write-Host "Swagger: http://localhost:$apiPort/docs"
    Write-Host 'Conta padrao do exemplo: admin / Suzano@123. Se personalizou o .env, use sua conta.'
    Write-Host 'Pode fechar este terminal: os servicos continuam em segundo plano.'
    Write-Host 'Para parar preservando dados, execute docker compose down na raiz do projeto.'
} catch {
    Write-Host "`nERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Nenhum volume foi apagado. Apos corrigir o problema, execute novamente.'
    Write-Host 'Diagnostico na raiz: docker compose ps -a; docker compose logs --tail 100'
    Write-Host 'Guia: docs/INSTALACAO.md'
    exit 1
}
