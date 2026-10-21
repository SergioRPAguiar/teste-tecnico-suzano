# Guia de testes

Este guia explica **o que está sendo verificado**, onde executar cada comando e o
que preparar antes. Não é necessário executar todos os grupos para abrir a aplicação.
Os iniciadores de [instalação](INSTALACAO.md) sobem o ambiente; os testes são uma
verificação adicional e precisam ser chamados separadamente.

## 1. Escolher a verificação

| Pergunta que queremos responder | Verificação | Comando e pasta |
|---|---|---|
| Os tipos TypeScript continuam consistentes? | Typecheck | `npm run typecheck`, em cada pacote |
| As regras do backend respondem corretamente a entradas controladas? | Unitários backend | `npm run test:unit`, em `backend/` |
| A API valida requisições e grava corretamente no PostgreSQL? | Integração HTTP/backend | `npm run test:e2e`, em `backend/` |
| A lógica de consulta e dinheiro da interface está correta? | Unitários frontend | `npm run test:unit`, em `frontend/` |
| Os fluxos da tela funcionam e o layout corresponde à referência? | Navegador mock/visual | `npm run test:visual:docker`, em `frontend/` |
| A tela consegue autenticar, cadastrar e consultar dados reais? | Navegador integrado | `npm run test:real:docker`, em `frontend/` |

**Typecheck não executa a aplicação.** Um teste unitário verifica uma parte da lógica
de forma isolada. Um teste de integração verifica a colaboração entre componentes;
neste backend, inclui HTTP e PostgreSQL real. O teste de navegador interage com a
tela como um usuário: preenche campos, clica e verifica o resultado.

## 2. Preparação: computador e container são ambientes diferentes

Ao clonar o Git, você recebe os arquivos do projeto, mas não `node_modules` nem o
Prisma Client gerado. O npm consegue ler os scripts do `package.json` sem essas
dependências; por isso `npm run` pode começar e logo informar `jest: not found`.

```text
Computador/WSL onde você abre o terminal
├── backend/node_modules     ← instalado por npm ci em backend/
└── frontend/node_modules    ← instalado por npm ci em frontend/

Docker
├── imagens da aplicação    ← dependências instaladas dentro das imagens
└── imagem Playwright       ← dependências e navegador do ambiente de teste
```

Construir as imagens não instala ferramentas nas pastas do computador. Também não
copie `node_modules` do Windows para Linux: faça a instalação no ambiente em que os
comandos serão executados, usando os lockfiles versionados.

### Preparação local do backend

Requisitos: Node.js 22.12+ na linha 22 ou 24+, e npm. Dentro de **`backend/`**:

```sh
npm ci --include=dev
npm run db:generate
```

O primeiro comando instala as dependências fixadas em `package-lock.json`, incluindo
TypeScript, Jest e as ferramentas de integração. O segundo gera o Prisma Client a
partir do schema. **A geração não exige conexão com o banco.**

### Preparação local do frontend

Dentro de **`frontend/`**:

```sh
npm ci --include=dev
```

Faça essa preparação ao clonar, após mudanças nas dependências ou para corrigir uma
instalação incompleta. Não é preciso reinstalar antes de cada teste. Não há pacote
npm na raiz; backend e frontend têm dependências e lockfiles independentes.

## 3. Backend: tipos e testes unitários

Depois da preparação, dentro de **`backend/`**:

```sh
npm run typecheck
npm run test:unit
```

### O que é testado

- Produto: campos obrigatórios, preço decimal positivo como string, estoque inteiro,
  limites de valores, imagem HTTP(S) e rejeição de campos extras.
- Atualização parcial: campos podem ser omitidos, mas `null` indevido é rejeitado.
- Pedido: total calculado com preços do servidor, itens repetidos, produto inexistente,
  disponibilidade e baixa apenas quando o status é Concluído.
- Falha de baixa condicional: o pedido não deve ser criado como se a disputa tivesse
  sido vencida.

Os repositories são substituídos por respostas controladas nos testes de regras.
**Não é preciso subir PostgreSQL, API ou frontend.** Concorrência e rollback reais
são verificados na integração, não apenas nesses testes isolados.

### Alternativa: usar a imagem já construída

Se já construiu a aplicação pelo iniciador e preparou o `.env` da raiz, pode executar
os mesmos comandos na imagem `migrate`, que contém as ferramentas de desenvolvimento.
Execute **na raiz**, com o Docker disponível:

```sh
docker compose run --rm --no-deps migrate npm run typecheck
docker compose run --rm --no-deps migrate npm run test:unit
```

Isso cria containers temporários, não instala pacotes no computador e não inicia
os serviços dependentes. Essa alternativa é para tipos/unitários; o próximo grupo
exige configuração própria de banco de testes.

## 4. Backend: integração HTTP com PostgreSQL real

### Preparar o banco e os arquivos de ambiente

1. Conclua a preparação local do backend da seção 2.
2. Na **raiz**, tenha `.env` criado pelo iniciador ou copiado de `.env.example`.
   Se já existe, preserve-o. Suba somente o banco:

   ```sh
   docker compose up -d --wait db
   ```

3. Dentro de **`backend/`**, crie `.env.test` a partir de `.env.test.example`, somente
   se ainda não existir:

   **Linux/Bash**
   ```bash
   test -f .env.test || cp .env.test.example .env.test
   ```

   **Windows/PowerShell**
   ```powershell
   if (-not (Test-Path -LiteralPath '.env.test')) { Copy-Item -LiteralPath '.env.test.example' -Destination '.env.test' }
   ```

4. Confira a configuração. O exemplo usa os valores de demonstração do Compose:

   ```dotenv
   DATABASE_URL="postgresql://suzano:suzano_local_dev@127.0.0.1:5433/suzano_case_test?schema=public"
   ```

   Ajuste usuário, senha e porta se personalizou o ambiente. Para um comando executado
   no computador, a porta padrão é **5433**; dentro da rede Compose, o banco usa 5432.
   A conta precisa ter permissão para criar o banco de testes quando ele não existe.

5. Execute dentro de **`backend/`**:

   ```sh
   npm run test:e2e
   ```

`.env` da raiz, `backend/.env` e `backend/.env.test` são arquivos distintos. Esse
runner carrega `.env.test`; uma `DATABASE_URL` já exportada no terminal tem precedência
sobre o arquivo. Se ele rejeitar o nome do banco, confira também essa variável.

**Use um banco dedicado cujo nome termine em `_test`. Nunca aponte esse comando
para o banco de uso normal.** Não é necessário executar o seed para a suíte.

### O que o runner faz

1. Confere o sufixo `_test` antes de conectar/criar o banco.
2. Cria o banco se necessário e aplica as migrations versionadas.
3. A suíte inicializa uma aplicação Nest própria, sem precisar de outra API na porta 3001.
4. Envia requisições HTTP com Supertest e consulta o PostgreSQL para conferir a gravação.
5. Ao finalizar, remove os registros que criou e fecha a aplicação de teste. O banco
   de testes pode continuar existindo para a próxima execução.

Os registros temporários usados para preparar os cenários são chamados **fixtures**.
Se houver interrupção forçada, a limpeza final pode não concluir; não use remoção
de volumes do ambiente normal como forma de corrigir uma falha dessa suíte.

### O que é testado

- Login/JWT: leitura pública de produtos, escritas e pedidos protegidos; credenciais,
  assinatura adulterada e token expirado rejeitados.
- OpenAPI: rotas, formato do preço e autenticação presentes na documentação da API.
- CRUD: cadastro/listagem persistidos, PATCH, exclusão e respostas 400/404/409.
- Dinheiro: cálculo exato no servidor e preço da compra preservado após alterar o catálogo.
- Estoque: somente Concluído baixa; Pendente/Cancelado não reservam ou baixam, mas
  também verificam disponibilidade na criação.
- Atomicidade: se um item perde disponibilidade, uma baixa anterior é revertida junto
  com o pedido. Total fora do limite também é rejeitado sem gravação parcial.
- Concorrência: duas compras são sincronizadas após lerem a última unidade, antes
  da baixa; apenas uma conclui, sem estoque negativo ou dois pedidos concluídos.

## 5. Frontend: tipos e lógica isolada

Depois da instalação local, dentro de **`frontend/`**:

```sh
npm run typecheck
npm run test:unit
```

O typecheck gera os tipos de rotas do Next antes de executar o TypeScript. Os unitários
não abrem navegador e não precisam de API/banco.

### O que é testado

- Busca por nome combinada com limites de preço inclusivos.
- Ordenação de toda a seleção antes da paginação, com desempate por ID.
- Intervalos inválidos e ajuste da página quando a seleção diminui.
- Cadastro bem-sucedido limpa filtros, mantém ordem/tamanho e mostra o novo produto.
- Entrada monetária: `125` vira `01,25` no campo e `"1.25"` na API, sem arredondamento
  ou truncamento silencioso; entradas inválidas e limites também são conferidos.
- Imagens demo: geração/migração preserva preços, estoques, fotos próprias e cadastros.

## 6. Frontend: navegador mock e comparação visual

Dentro de **`frontend/`**, com Node/npm e Docker disponíveis:

```sh
npm run test:visual:docker
```

O controlador desse comando usa módulos nativos do Node; ele prepara as dependências
dentro do Docker. Portanto, não precisa de Jest instalado no host para iniciar essa
etapa. A instalação local continua necessária para os unitários da seção anterior.

### Por que construir outra imagem?

`Dockerfile.visual` usa uma imagem Playwright fixada por versão/digest, com navegadores
e bibliotecas Linux. Ele instala as dependências do frontend, compila o Next.js e
prepara um ambiente igual para comparar imagens entre computadores diferentes.

Depois, um container temporário executa Chromium e inicia o frontend de teste na
porta 3000 interna. Não publica outra porta 3000 no host. O modo é **mock**: MSW simula
as respostas HTTP; não é preciso iniciar backend ou PostgreSQL.

### O que é testado

- Busca, faixa de preço, ordenação e páginas de 10/20/50/100 produtos.
- Login simulado, cadastro, confirmação e exibição do novo item.
- Categoria textual, preço por centavos, validação de campos e limites monetários.
- Reautenticação após 401 preservando o rascunho do formulário.
- Cancelamento, foco inicial, Escape e formulário utilizável em telas pequenas.
- Tela vazia, fallback de imagem e catálogo sem transbordamento nas larguras verificadas.
- Screenshot desktop comparado com a referência versionada em
  `frontend/tests/__screenshots__/catalogo-desktop.png`.

O snapshot complementa os testes funcionais. Uma imagem parecida não comprova, por
exemplo, que um pedido foi gravado corretamente no banco.

### Para que servem os mounts?

Mounts conectam pastas do computador ao container:

| Pasta no computador | Pasta no container | Uso |
|---|---|---|
| `frontend/tests` | `/app/tests` | Ler os cenários e o PNG de referência |
| `frontend/test-results` | `/app/test-results` | Preservar screenshots, diffs e traces gerados |

O comando normal compara a referência; não a atualiza. Ao encerrar, `--rm` remove o
container temporário. A imagem e o cache ficam disponíveis para outras execuções.

### A primeira execução está demorando?

O processo tem duas fases diferentes:

```text
Preparação: baixar imagem → npm ci → compilar o Next.js → carregar imagem local
Execução:   Running ... tests → cenários no navegador → resumo de resultados
```

O download da imagem, npm e compilação podem levar vários minutos, inclusive mais
de 10 em rede lenta, com proxy ou poucos recursos. Não há duração fixa. Se permanecer
muito tempo sem avanço, identifique a última etapa antes de concluir que os testes travaram.
Repetições sem alterações aproveitam camadas `CACHED`; mudar fontes/lockfiles pode
exigir reconstrução. Cancelar o build pode exigir refazer a etapa incompleta.

Para ver a saída por etapa, dentro de **`frontend/`**:

**Linux/Bash**
```bash
BUILDKIT_PROGRESS=plain npm run test:visual:docker
```

**Windows/PowerShell**
```powershell
$env:BUILDKIT_PROGRESS = 'plain'
npm run test:visual:docker
```

`BUILDKIT_PROGRESS` muda só a apresentação do log; não aumenta timeouts nem muda os
critérios dos testes. O limite de download npm é por requisição, não um prazo global
para completar toda a preparação.

## 7. Frontend: navegador com API e banco reais

Primeiro, na **raiz**, inicie a aplicação com o iniciador da plataforma. Se as imagens
já existem e o código/configuração de build não mudou, pode usar `-SemBuild` ou
`--sem-build`. Confira `docker compose ps`: db/api/web devem estar saudáveis e migrate
deve ter concluído com código 0.

Depois, dentro de **`frontend/`**:

```sh
npm run test:real:docker
```

O navegador entra na rede Compose e abre a interface do serviço web. O teste autentica,
preenche o cadastro, confere preço/categoria/estoque pela API e verifica a persistência
após recarregar a página. Ao finalizar, exclui seu produto exclusivo. Outro cenário
simula falha de conexão e verifica nova tentativa/estado de carregamento.

**Esta suíte usa a aplicação ativa e seu banco**, com uma fixture exclusiva. É diferente
da integração backend, cujo runner exige outro banco terminado em `_test`.

O acesso padrão é o de demonstração. Se alterou a conta, exporte `ADMIN_USERNAME` e
`ADMIN_PASSWORD` para o processo do runner; ele não lê automaticamente as credenciais
do `.env` da raiz. Instalações alternativas também admitem `E2E_COMPOSE_PROJECT`,
`E2E_PUBLIC_API_URL` e `E2E_PUBLIC_WEB_URL`, correspondentes à rede e URLs compiladas.

## 8. Interpretar a saída e diagnosticar

O **typecheck** termina sem erros quando os tipos estão consistentes; ele não precisa
imprimir `PASS`. O Jest mostra suítes (agrupamentos de testes) e verificações individuais.
Exemplo de resumo para os unitários backend, conforme a versão documentada:

```text
Test Suites: 3 passed, 3 total
Tests:       48 passed, 48 total
```

No Playwright, `Running 8 tests` indica que a preparação terminou e os cenários mock
começaram. O resumo `8 passed` indica que todos eles passaram. Esses exemplos explicam
o formato da saída; não representam uma execução nova realizada por abrir este guia.

| Mensagem | Interpretação / próximo passo |
|---|---|
| `PASS`, `passed` | As verificações executadas passaram. Confira se é o grupo que pretendia executar. |
| `FAIL`, `failed`, `Expected` / `Received` | Leia o nome do cenário, arquivo e diferença entre resultado esperado/obtido. No navegador, veja os artefatos. |
| `tsc: not found` / `jest: not found` | Dependências locais ausentes/incompletas. Execute `npm ci --include=dev` no pacote correspondente. Não é necessário instalar ferramentas globalmente. |
| `Cannot find module 'pg'` | O runner não encontrou sua dependência; a integração ainda não começou. Instale as dependências em backend/. |
| `npm ci` terminou com erro | A preparação não concluiu. Resolva a mensagem de instalação antes de executar TypeScript/Jest; a ausência de ferramentas pode ser consequência dessa falha. |
| Módulo Prisma gerado ausente | Execute `npm run db:generate` em backend/ após a instalação. |
| Nome do banco deve terminar em `_test` | Confira backend/.env.test e uma possível DATABASE_URL exportada no terminal. Não contorne a proteção usando o banco normal. |
| `ECONNREFUSED` no PostgreSQL | Confira db ativo, porta 5433 no host, URL e local de execução. |
| Falha de autenticação no PostgreSQL | Confira as credenciais que inicializaram o volume; mudar POSTGRES_* não troca a senha de um banco já existente. |
| `Canceled: context canceled` | Build/operação interrompida. Se cancelou no terminal, o resultado é esperado; não é uma reprovação de cenário. |
| Build em `npm ci`, sem `Running ... tests` | Ainda está preparando dependências. Acompanhe a etapa, rede, proxy e recursos disponíveis. |
| `self-signed certificate in certificate chain` | Falha de confiança TLS na preparação. Consulte a seção corporativa da instalação; os comandos npm locais e o runner visual não exportam automaticamente as CAs dos iniciadores. |
| PNG diferente | Compare esperado/obtido/diff em frontend/test-results; confirme ambiente Linux fixado e dados antes de decidir atualizar a referência. |
| Navegador real não encontra serviços/rede | Inicie o Compose completo e confira nome do projeto, portas e URLs públicas. |

Respostas HTTP 400/401/404/409 podem aparecer em cenários que conferem rejeições
intencionais. O resultado do teste depende de essa resposta ser a esperada, não de
todas as requisições retornarem 200.

Para uma mudança visual **intencional e revisada**, há `npm run test:visual:docker:update`
em frontend/. Inspecione o novo PNG e execute depois a comparação normal. Não use
atualização de snapshot como correção automática para uma diferença desconhecida.

Playwright direto (`npm run test:e2e`) exige build e navegador instalados no ambiente.
No modo mock, não mantenha outro frontend na porta 3000 que será usada pelo servidor
de teste. A comparação da referência é condicionada a Linux; Docker é o caminho recomendado.

## 9. Resultados registrados e integração contínua

Os [resultados consolidados](../README.md#resultados-executados) e a
[matriz de evidências](requisitos.md) distinguem testes executados de código apenas
implementado. Os totais são 48 unitários backend, 11 integrações backend, 33 unitários
frontend, 8 cenários mock/visual e 2 reais, conforme as execuções documentadas.

Este guia explica como reproduzir as verificações; não significa que elas já foram
executadas no seu computador. Jobs no GitHub Actions verificam backend, frontend e
navegador mock; o navegador integrado à aplicação real tem o comando separado acima.
Consulte o [resultado remoto](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions)
para a execução de CI, sem confundi-la com as validações locais.
