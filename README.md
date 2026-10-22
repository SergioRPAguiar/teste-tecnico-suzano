# Produtos e pedidos — Teste técnico Suzano

[![Verificação do case](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions/workflows/ci.yml/badge.svg)](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions/workflows/ci.yml)

Entrega dos desafios de **frontend e backend**: catálogo de produtos em Next.js e
API NestJS de produtos/pedidos com PostgreSQL. O frontend preserva uma API fictícia
executável com MSW, além da integração com o backend real.

## O que está implementado

- Listagem e cadastro pela interface, busca por nome/faixa de preço e ordenação.
- Cadastro com categoria em texto livre e preço digitado em centavos.
- Estado global com Zustand; paginação de 10 produtos, com opções 20/50/100.
- Interface responsiva com direção visual editorial, validação, estados de carregamento/erro/vazio e fallback de imagens.
- Fotografias ilustrativas locais nos 48 produtos demo, com [fontes e licenças](frontend/public/images/FONTES.md).
- CRUD de produtos; criação/listagem de pedidos; total calculado no servidor.
- Preços históricos nos itens, consistência transacional e proteção contra disputa de estoque.
- Middleware de log, Swagger, autenticação JWT e ambiente completo em Docker.
- Testes unitários, integração HTTP/PostgreSQL, navegador e snapshot visual de tela.

[Referência visual da tela](frontend/tests/__screenshots__/catalogo-desktop.png)
· [Checklist e evidências](docs/requisitos.md) · [Decisões técnicas](docs/decisoes.md)

## Início rápido — ambiente completo com Docker

**Para avaliar com o menor esforço:** instale Git e Docker; clone/extraia o projeto
e execute apenas o iniciador da sua plataforma. Ele prepara `.env`, banco, migrations,
48 produtos, API e interface. Não exige Node/npm/PostgreSQL instalados no computador.

| Windows | Linux |
|---|---|
| Dê dois cliques em **`iniciar.cmd`** ou execute `.\iniciar.cmd` no PowerShell. | Execute **`bash iniciar.sh`** na pasta extraída/clonada. |

**[Guia detalhado Windows/Linux: instalação, primeiro acesso, testes e solução de problemas](docs/INSTALACAO.md)**

Os scripts preservam `.env` e volumes existentes. A primeira execução baixa imagens
e compila a aplicação; aguarde a mensagem final. Interface3000 e Swagger3001/docs.
O iniciador Windows constrói as imagens com Buildx e usa Compose para iniciar os
serviços, evitando incompatibilidades do Bake com caminhos Windows. Fluxo verificado
também com o executável oficial do Compose 5.6.0.

### Execução manual — rede com certificados públicos

Pré-requisitos: Docker Desktop/Engine Linux com Compose v2 e BuildKit. Ambiente
verificado com Docker 27.4.0 e Compose 2.31.0. As imagens base estão fixadas por digest.

1. Na **raiz**, copie `.env.example` para `.env`, somente se ainda não existir.
   Execute o comando da sua plataforma:

   **Windows/PowerShell**
   ```powershell
   if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
   ```

   **Linux/Bash**
   ```bash
   test -f .env || cp .env.example .env
   ```

2. Na raiz, execute:

   ```sh
   docker compose config --quiet
   docker compose up -d --build --wait
   docker compose ps
   ```

Esses comandos manuais usam a confiança padrão das imagens. Para aproveitar as CAs
do computador em uma rede corporativa, use o iniciador da sua plataforma.

O Compose inicia PostgreSQL, aplica migrations/carrega o seed por um serviço de execução
única (`migrate`) e inicia API/frontend. `migrate` terminar com código 0 é esperado;
`db`, `api` e `web` devem ficar saudáveis. O seed adiciona 48 produtos de demonstração,
é idempotente e preserva os dados existentes. Em catálogos antigos, atualiza apenas
as imagens demo gerenciadas, sem mudar preço/estoque ou substituir fotos personalizadas.

| Serviço | Endereço padrão |
|---|---|
| Interface, integrada à API real | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| OpenAPI JSON / YAML | `/docs-json` / `/docs-yaml` na API |
| PostgreSQL para ferramentas locais | `127.0.0.1:5433` |

Para facilitar a avaliação, está disponível um [roteiro opcional de operações no Swagger, com exemplos de JSON e resultados esperados](docs/SWAGGER.md).

**Acesso de demonstração:** usuário `admin`, senha `Suzano@123`.
A leitura de produtos é pública. Cadastros/alterações/exclusões e pedidos exigem login.
Os valores dos arquivos de exemplo são configurações de desenvolvimento; a conta e
a chave JWT são configuráveis no ambiente do servidor.

Para parar preservando os dados:

```sh
docker compose down
```

Adicionar `--volumes` remove o banco do projeto. Variáveis `POSTGRES_*` só inicializam
um volume vazio: editar `.env` não altera a senha de um banco existente.

Se mudar portas, ajuste também URLs/CORS correspondentes no `.env`. Para credenciais
PostgreSQL com caracteres reservados em URL, configure `DATABASE_URL_DOCKER` com
credenciais percent-encoded. Os exemplos prontos não precisam desse ajuste.

## Frontend independente — modo fictício obrigatório

Para desenvolver localmente: Node.js 22.12+ na linha 22 (ou 24+) e npm.
Frontend e backend possuem pacotes e lockfiles separados; não há `npm install` na raiz.

Na pasta **`frontend/`**:

```sh
npm ci
npm run dev
```

O modo padrão é **mock**, sem necessidade de API/banco. MSW intercepta chamadas HTTP
compatíveis com os contratos reais. Há 48 produtos iniciais; cadastros fictícios são
salvos no armazenamento local do navegador. O login é simulado, com o mesmo acesso
de demonstração; o botão de acesso demo está disponível nesse modo.
Os placeholders antigos dos itens demo são substituídos pelas fotos locais, preservando
cadastros e alterações salvos no navegador.

Para selecionar o modo, copie o exemplo para `.env.local`, somente se ainda não
existir. Execute uma das opções dentro de **`frontend/`**:

**Windows/PowerShell**
```powershell
if (-not (Test-Path -LiteralPath '.env.local')) { Copy-Item -LiteralPath '.env.local.example' -Destination '.env.local' }
```

**Linux/Bash**
```bash
test -f .env.local || cp .env.local.example .env.local
```

O arquivo copiado contém:

```dotenv
NEXT_PUBLIC_API_MODE=mock
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Troque `mock` por **`real`** para consumir o NestJS. Reinicie o dev server; para produção,
recompile após mudar `NEXT_PUBLIC_*`, pois esses valores são incorporados no build.
No Compose, os argumentos de build vêm do `.env` da raiz e o padrão é `real`.
Nenhuma credencial/chave do servidor deve ser colocada em variáveis `NEXT_PUBLIC_*`.

Verificação/build local, também em `frontend/`:

```sh
npm run typecheck
npm run test:unit
npm run build
npm run start
```

Use apenas um servidor frontend por vez na porta 3000. O worker MSW está versionado
em `public/mockServiceWorker.js`; o clone não depende de OpenCode para funcionar.

## Backend local

1. Prepare o `.env` da raiz e suba somente o banco com `docker compose up -d --wait db`.
2. Na pasta **`backend/`**, copie `.env.example` para `.env`, somente se ainda não existir.
   Esse arquivo é separado do `.env` da raiz usado pelo Compose. Execute o comando
   da sua plataforma para copiar o arquivo diretamente, preservando sua codificação:

   **Windows/PowerShell**
   ```powershell
   if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
   ```

   **Linux/Bash**
   ```bash
   test -f .env || cp .env.example .env
   ```

   Depois da cópia, ajuste os valores se personalizou banco, portas ou credenciais.
3. Ainda na pasta **`backend/`**:

   ```sh
   npm ci
   npm run db:generate
   npm run db:deploy
   npm run build
   npm run db:seed
   npm run start:dev
   ```

Para execução compilada, use `npm run start:prod` depois do build. A porta padrão é 3001.
Não execute os servidores locais nas mesmas portas dos containers `api`/`web` já ativos.

### Rotas e regras

| Método | Rota | Acesso / resultado |
|---|---|---|
| POST | `/auth/login` | Público; JWT Bearer com validade de uma hora |
| GET | `/products` | Público; lista completa por ID crescente |
| POST | `/products` | JWT; produto criado (201) |
| PATCH | `/products/:id` | JWT; atualização parcial (200) |
| DELETE | `/products/:id` | JWT; sem referências (204); conflito (409) se usado em pedido |
| POST | `/orders` | JWT; criação com itens/quantidades e status opcional (201) |
| GET | `/orders` | JWT; pedidos com itens, preços históricos e total |

- Produto: `name`, `category`, `description`, `price`, `stockQuantity`, `imageUrl`.
- `price` é string decimal positiva, com até duas casas; a resposta normaliza para duas.
  Estoque é inteiro não negativo. Campos desconhecidos/null indevidos são rejeitados (400).
- Pedido recebe `items: [{ productId, quantity }]`, sem preços ou total enviados pelo cliente.
- Status: **Pendente** por padrão, **Concluído** ou **Cancelado**, escolhidos na criação.
  Disponibilidade é verificada em todos. Apenas Concluído baixa estoque; não há reserva
  nem endpoint de transição de status.
- Baixa condicional e gravação do pedido usam uma única transação. Falha em qualquer item
  reverte as baixas. Produto inexistente retorna 404; estoque insuficiente/conflito retorna 409.
- Itens repetidos são rejeitados (400). O preço de compra é mantido mesmo após editar o produto.
- Filtros/ordenação/paginação da interface são aplicados **nessa ordem**, no frontend.
  Após cadastro, filtros são limpos, ordenação/tamanho mantidos e a página do novo item é exibida.
- Categoria é um campo de texto obrigatório no formulário, assim como no contrato da API.
- No preço do cadastro, digite apenas os números: `125` aparece como `01,25` no campo
  e é enviado como `"1.25"`. Os cartões exibem o valor como `R$ 1,25`.

## Testes

**[Guia de testes: preparação, o que cada teste verifica e como interpretar os resultados](docs/TESTES.md)**

Os iniciadores sobem a aplicação, mas não executam as suítes. Você pode escolher quais
verificações rodar; os grupos abaixo têm objetivos e pré-requisitos diferentes.

| Grupo | O que verifica | Precisa de banco ou navegador? |
|---|---|---|
| Typecheck | Compatibilidade dos tipos TypeScript; não executa os fluxos da aplicação | Não |
| Unitários backend | Validação dos produtos e regras de pedidos, como total e disponibilidade | Não; acesso ao banco é substituído nos testes |
| Integração backend | Requisições HTTP, autenticação, persistência, rollback e concorrência | PostgreSQL real com banco `_test`; não usa navegador |
| Unitários frontend | Filtros → ordenação → paginação, preço em centavos e estado pós-cadastro | Não |
| Navegador mock + visual | Interações da tela, responsividade, erros e comparação do PNG de referência | Chromium dentro do Docker; não precisa de backend/banco |
| Navegador real | Cadastro pela interface, gravação no PostgreSQL e recuperação de erro de conexão | Compose completo em execução e navegador de teste no Docker |

### Antes dos comandos: instalar as dependências no ambiente correto

**O build Docker não cria `node_modules` nas pastas do computador.** Para executar
TypeScript/Jest diretamente no terminal, instale as dependências de cada pacote.
`npm run` executa um script; ele não instala ferramentas ausentes.

Na pasta **`backend/`**, ao preparar um clone ou após mudanças nas dependências:

```sh
npm ci --include=dev
npm run db:generate
```

Na pasta **`frontend/`**:

```sh
npm ci --include=dev
```

Node.js 22.12+ na linha 22 ou 24+ e npm são necessários para esses comandos locais.
`--include=dev` inclui TypeScript/Jest mesmo se o npm estiver configurado para omitir
dependências de desenvolvimento. Não há instalação npm na raiz. Essa preparação não
precisa ser repetida antes de cada teste.

### 1. Backend: tipos e regras isoladas — pasta `backend/`

```sh
npm run typecheck
npm run test:unit
```

Conferem, por exemplo, preço como string decimal, estoque inteiro, campos inválidos,
atualização parcial, total calculado com preços do servidor e baixa apenas em Concluído.
**Não é necessário subir a API ou o banco para os unitários.**

### 2. Backend: HTTP e PostgreSQL reais — pasta `backend/`

Depois da preparação, crie **`backend/.env.test` a partir de `backend/.env.test.example`**
se ainda não existir. Confira usuário, senha e porta. Na raiz, o `.env` deve estar
preparado e o banco ativo (`docker compose up -d --wait db`). Então, em `backend/`:

```sh
npm run test:e2e
```

O runner cria o banco `_test` quando necessário e aplica migrations. A suíte inicia
uma aplicação Nest própria, envia requisições HTTP e limpa os registros de teste ao
final. Não é preciso subir outra API na porta 3001.

São verificadas autenticação JWT, CRUD, preço histórico, estoque insuficiente, rollback
e disputa pela última unidade. A concorrência sincroniza as duas leituras antes da
baixa: apenas um pedido pode concluir. **Use somente um banco exclusivo terminado em
`_test`, nunca o banco de uso normal.** Passos para configurar em Windows/Linux estão no guia.

### 3. Frontend: lógica isolada — pasta `frontend/`

```sh
npm run typecheck
npm run test:unit
```

Verifica consulta combinada, limites de preço, desempate de ordenação, paginação,
exibição do produto após cadastro, conversão exata dos centavos e imagens demo.
Não abre navegador nem precisa de API/banco.

### 4. Frontend: tela mock e referência visual — pasta `frontend/`

```sh
npm run test:visual:docker
```

O comando prepara uma imagem Playwright, instala as dependências e compila o Next.js
dentro dela. Depois abre a tela com Chromium, usa a API fictícia MSW e testa cadastro,
filtros, ordenação, paginação, validação, novo login após 401, estados de imagem e layout.
Também compara a captura com `frontend/tests/__screenshots__/catalogo-desktop.png`.

Exige Node/npm para iniciar o script e Docker para o ambiente; o navegador não precisa
ser instalado no computador. A primeira preparação pode levar vários minutos; imagem,
npm e compilação são etapas anteriores à mensagem `Running ... tests`. Nas repetições,
camadas sem alterações são reaproveitadas. Artefatos ficam em `frontend/test-results/`.

### 5. Frontend: interface integrada ao backend — pasta `frontend/`

Com o Compose completo iniciado pelo iniciador e `db`, `api` e `web` saudáveis:

```sh
npm run test:real:docker
```

Verifica login, cadastro pela interface, preço/categoria/estoque persistidos, recarga
da página e erro de conexão recuperável. O produto exclusivo de teste é excluído ao
terminar. **Essa suíte usa o banco da aplicação ativa; a integração backend acima usa
outro banco, exclusivo de testes.** Se personalizar a conta,
exporte `ADMIN_USERNAME`/`ADMIN_PASSWORD` para o runner. O runner também admite
`E2E_COMPOSE_PROJECT`, `E2E_PUBLIC_API_URL` e `E2E_PUBLIC_WEB_URL` para instalações
isoladas/portas diferentes; as URLs públicas devem coincidir com as usadas pela aplicação.

### Entender o resultado

- `PASS` / `passed`: as verificações daquele grupo passaram. Um erro HTTP 400/401/409
  pode fazer parte de um cenário que testa rejeições esperadas.
- `tsc: not found`, `jest: not found` ou módulo `pg` ausente: confira a instalação
  local com `npm ci --include=dev` na pasta correspondente; a suíte ainda não começou.
- `Canceled: context canceled`: a preparação/build foi interrompida; se cancelou no
  terminal, esse resultado é esperado. Não significa que um cenário falhou.
- PNG diferente: examine a captura/diff em `frontend/test-results/` antes de decidir
  se há regressão. `test:visual:docker:update` existe para mudança visual intencional
  e revisada; não é o comando normal de validação.

O [guia completo](docs/TESTES.md) explica os mounts, a preparação demorada, mensagens
de banco/rede e como usar imagens já construídas. Playwright direto (`npm run test:e2e`)
requer navegador instalado e build prévio; a comparação visual de referência exige Linux.

### Resultados executados

| Verificação | Resultado |
|---|---|
| Backend unitário | 48 testes passaram |
| Backend HTTP/PostgreSQL | 11 testes passaram, incluindo concorrência e rollback |
| Frontend unitário | 33 testes passaram, incluindo entrada por centavos e imagens demo |
| Navegador mock | 8 testes passaram; cadastro, categoria livre, preço, retomada após 401, snapshot e larguras 320/375/768/1024/1440 |
| Navegador real | 2 testes passaram; cadastro/persistência e recuperação de conexão; instalação com volume novo verificada no marco I15 |
| Builds e typechecks | Passaram em Windows e/ou imagens Linux conforme evidências |

O workflow em `.github/workflows/ci.yml` executa essas verificações em jobs separados.
Consulte o [status atual no GitHub Actions](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions).
Os resultados da tabela são execuções locais; o resultado dos checks remotos é registrado no GitHub.

## Organização e decisões

API em classes controller/service/repository, módulos Nest e DI; PrismaPg para acesso
ao PostgreSQL. Valores monetários usam Decimal no servidor e strings no contrato.
O middleware registra método/caminho/status/duração sem query string, corpo ou headers.
Frontend usa App Router, Tailwind4 e Zustand; seleção derivada fica em funções testáveis.

Migrations são a fonte da estrutura, incluindo CHECKs SQL complementares. Não usar
`db push` ou editar migration já aplicada. Para evolução em desenvolvimento, use
`npm run db:migrate` e regenere o client. Particularidades do PowerShell estão no `AGENTS.md`.

O JWT atende autenticação simples com uma conta configurada no ambiente, sem expandir
o case para cadastro/recuperação de usuários. A proteção concorrente foi testada para
as regras do desafio; não se apresenta uma medição local como capacidade de produção.

O desenvolvimento assistido por IA utiliza `AGENTS.md` e três skills públicas de apoio
a commits, auditoria de requisitos e revisão de fluxos. São instruções de desenvolvimento,
não dependências da aplicação nem substitutos dos testes. Detalhes em [decisões](docs/decisoes.md).
