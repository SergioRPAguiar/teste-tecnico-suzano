#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CHECK=false
BUILD_OPTION=--build
CA_TEMP=''
cleanup() {
  if [[ -n "$CA_TEMP" ]]; then
    rm -f -- "$CA_TEMP" || echo "Nao foi possivel remover o bundle temporario: $CA_TEMP" >&2
  fi
}
trap cleanup EXIT
for option in "$@"; do
  case "$option" in
    --verificar) CHECK=true ;;
    --sem-build) BUILD_OPTION=--no-build ;;
    *) echo 'Uso: bash iniciar.sh [--verificar] [--sem-build]' >&2; exit 2 ;;
  esac
done
trap 'echo "Falha na inicializacao. Nenhum volume foi apagado. Consulte docs/INSTALACAO.md; corrija e execute novamente." >&2' ERR

echo 'Case Suzano - verificacao do ambiente'
if ! command -v docker >/dev/null 2>&1; then
  echo 'Instale Docker Engine/Desktop e o plugin Compose v2. Veja docs/INSTALACAO.md.' >&2
  exit 1
fi
docker compose version
if ! OS="$(docker info --format '{{.OSType}}')"; then
  echo 'Docker indisponivel. Verifique o servico e a permissao do usuario para acessar o daemon.' >&2
  exit 1
fi
if [[ "$OS" != 'linux' ]]; then echo 'Este projeto exige containers Linux.' >&2; exit 1; fi
HELP="$(docker compose up --help)"
if [[ "$HELP" != *'--wait-timeout'* ]]; then echo 'Atualize Compose v2: necessario --wait e --wait-timeout.' >&2; exit 1; fi

ENV_FILE="$ROOT/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  if $CHECK; then ENV_FILE="$ROOT/.env.example"; echo 'Validando exemplo sem criar .env.'
  else cp -- "$ROOT/.env.example" "$ENV_FILE"; echo '.env criado com configuracao de demonstracao.'; fi
else echo '.env existente preservado.'; fi
COMPOSE=(docker compose --project-directory "$ROOT" --env-file "$ENV_FILE" -f "$ROOT/compose.yaml")
"${COMPOSE[@]}" config --quiet
if $CHECK; then echo 'Pre-requisitos e configuracao validos. Nenhum servico foi alterado.'; exit 0; fi

if [[ "$BUILD_OPTION" == '--build' ]]; then
  for bundle in /etc/ssl/certs/ca-certificates.crt /etc/pki/tls/certs/ca-bundle.crt /etc/ssl/cert.pem; do
    if [[ -r "$bundle" && -s "$bundle" ]]; then
      # Bake permite leitura do contexto; a copia fica nele, ignorada pelo
      # Git/Docker, e e enviada somente pelo canal de secrets do BuildKit.
      CA_TEMP="$(mktemp "$ROOT/.suzano-build-ca-XXXXXXXX")"
      cp -- "$bundle" "$CA_TEMP"
      export SUZANO_BUILD_CA_FILE="$CA_TEMP"
      COMPOSE+=(-f "$ROOT/compose.ca.yaml")
      "${COMPOSE[@]}" config --quiet
      echo 'Build com as CAs confiaveis do sistema Linux (uso temporario).'
      break
    fi
  done
fi

echo 'Iniciando. Na primeira execucao, o build baixa imagens e pode levar varios minutos.'
"${COMPOSE[@]}" up -d "$BUILD_OPTION" --wait --wait-timeout 180
"${COMPOSE[@]}" ps -a
WEB_BIND="$("${COMPOSE[@]}" port web 3000)"
API_BIND="$("${COMPOSE[@]}" port api 3001)"
echo
echo "Aplicacao pronta: http://localhost:${WEB_BIND##*:}"
echo "Swagger: http://localhost:${API_BIND##*:}/docs"
echo 'Conta padrao do exemplo: admin / Suzano@123. Se personalizou .env, use sua conta.'
echo 'Pode fechar o terminal: servicos continuam em segundo plano.'
echo 'Para parar preservando dados: docker compose down, na raiz do projeto.'
