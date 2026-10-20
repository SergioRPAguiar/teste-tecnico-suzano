#!/bin/sh
set -eu

# O secret existe somente nesta instrucao RUN; a confianca adicional vale para
# este processo e seus filhos, sem alterar o trust store ou a imagem resultante.
if [ -f /run/secrets/system_ca ]; then
  if [ ! -s /run/secrets/system_ca ]; then
    echo 'O bundle de CAs do sistema esta vazio.' >&2
    exit 1
  fi
  export NODE_EXTRA_CA_CERTS=/run/secrets/system_ca
fi
exec "$@"
