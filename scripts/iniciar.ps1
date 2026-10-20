param([switch]$Verificar, [switch]$SemBuild)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env'
$example = Join-Path $root '.env.example'
$caBundle = $null
$previousCaFile = [Environment]::GetEnvironmentVariable('SUZANO_BUILD_CA_FILE', 'Process')

function Docker-Step([string[]]$Arguments) {
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) { throw "Docker falhou: docker $($Arguments -join ' ')" }
}

function Build-ProjectImages($Config, [string]$CaFile) {
    # Evita a conversao Compose -> Bake de caminhos Windows. Mantem o Compose
    # como fonte de nomes, contextos, estagios e argumentos das tres imagens.
    foreach ($serviceName in @('migrate', 'api', 'web')) {
        $service = $Config.services.$serviceName
        $build = $service.build
        if ($null -eq $build) { throw "Servico $serviceName sem configuracao de build." }
        $image = if ($service.image) { [string]$service.image } else { "$($Config.name)-$serviceName" }
        $dockerfile = if ($build.dockerfile) { [string]$build.dockerfile } else { 'Dockerfile' }
        if (-not [System.IO.Path]::IsPathRooted($dockerfile)) { $dockerfile = Join-Path $build.context $dockerfile }
        $arguments = @('buildx', 'build', '--load', '--progress', 'plain', '--file', $dockerfile, '--tag', $image)
        if ($build.target) { $arguments += @('--target', [string]$build.target) }
        foreach ($argument in $build.args.PSObject.Properties) {
            $arguments += @('--build-arg', "$($argument.Name)=$($argument.Value)")
        }
        if ($CaFile) { $arguments += @('--secret', "id=system_ca,src=$CaFile") }
        $arguments += @([string]$build.context)
        Write-Host "Construindo $serviceName ($image) com Buildx."
        Docker-Step $arguments
    }
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

    if (-not $SemBuild) {
        Docker-Step @('buildx', 'version')
        . (Join-Path $PSScriptRoot 'certificados.ps1')
        # Bake limita a leitura ao contexto; o PEM fica dentro dele, mas ignorado
        # pelo Git/Docker e fornecido exclusivamente como secret de build.
        $caBundle = Export-WindowsRootCaBundle -Directory $root
        $env:SUZANO_BUILD_CA_FILE = $caBundle.Path
        $composeArgs += @('-f', (Join-Path $root 'compose.ca.yaml'))
        Docker-Step ($composeArgs + @('config', '--quiet'))
        Write-Host "Build com $($caBundle.Count) CAs raiz confiaveis do Windows (uso temporario)."
    }

    $json = & docker @composeArgs config --format json
    if ($LASTEXITCODE -ne 0) { throw 'Nao foi possivel consultar a configuracao do projeto.' }
    $config = ($json -join "`n") | ConvertFrom-Json
    if (-not $SemBuild) { Build-ProjectImages $config $caBundle.Path }
    Write-Host 'Iniciando banco, migrations, API e interface.'
    Docker-Step ($composeArgs + @('up', '-d', '--no-build', '--wait', '--wait-timeout', '180'))
    Docker-Step ($composeArgs + @('ps', '-a'))
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
} finally {
    if ($null -ne $caBundle) {
        [Environment]::SetEnvironmentVariable('SUZANO_BUILD_CA_FILE', $previousCaFile, 'Process')
        try { [System.IO.File]::Delete($caBundle.Path) }
        catch { Write-Warning "Nao foi possivel remover o bundle temporario: $($caBundle.Path)" }
    }
}
