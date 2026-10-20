# Produtos e pedidos — Teste técnico Suzano

[![Verificação do case](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions/workflows/ci.yml/badge.svg)](https://github.com/SergioRPAguiar/teste-tecnico-suzano/actions/workflows/ci.yml)

Entrega dos desafios de **frontend e backend**: catálogo de produtos em Next.js e
API NestJS de produtos/pedidos com PostgreSQL. O frontend preserva uma API fictícia
executável com MSW, além da integração com o backend real.

## O que está implementado

- Listagem, cadastro e edição pela interface, busca por nome/faixa de preço e ordenação.
- Estado global com Zustand; paginação de 10 produtos, com opções 20/50/100.
- Interface responsiva, validação, estados de carregamento/erro/vazio e fallback de imagens.
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
Em redes corporativas, os iniciadores fornecem automaticamente ao build as CAs raiz
confiáveis do Windows ou o bundle do Linux. Não é preciso exportar certificados à mão;
a validação HTTPS permanece ativa. [Detalhes e diagnóstico](docs/INSTALACAO.md#certificados-em-redes-corporativas).

### Execução manual — rede com certificados públicos

Pré-requisitos: Docker Desktop/Engine Linux com Compose v2 e BuildKit. Ambiente
verificado com Docker 27.4.0 e Compose 2.31.0. As imagens base estão fixadas por digest.

1. Na raiz, crie **`.env` com o conteúdo de `.env.example`**.
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

**Nunca usou Swagger?** Siga o [roteiro do primeiro clique ao pedido, com JSON e resultados esperados](docs/SWAGGER.md).

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

Para selecionar o modo, crie `frontend/.env.local` a partir de
`frontend/.env.local.example`:

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
2. Crie **`backend/.env` a partir de `backend/.env.example`**. É separado do `.env` do Compose.
3. Na pasta **`backend/`**:

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
- Cada cartão tem **Editar**: após login, abre os dados atuais e salva por PATCH apenas
  os campos alterados. A edição também limpa filtros e mostra a nova posição do item,
  mantendo ordenação/tamanho; cancelar não salva. Funciona em mock e API real.

## Testes

### Backend — na pasta `backend/`

```sh
npm run typecheck
npm run test:unit
```

Os unitários não iniciam API ou banco. Para a integração HTTP com PostgreSQL real,
crie **`backend/.env.test` a partir de `backend/.env.test.example`**, mantenha o banco
do Compose ativo e execute:

```sh
npm run test:e2e
```

O runner exige banco com sufixo `_test`, cria-o quando necessário, aplica migrations
e remove apenas suas fixtures. O usuário de desenvolvimento precisa poder criar esse banco.
O teste de concorrência sincroniza duas transações **depois de ambas lerem a última
unidade**, antes da baixa: não é apenas uma execução sequencial disfarçada.

### Frontend — na pasta `frontend/`

```sh
npm run test:unit
npm run test:visual:docker
```

O segundo comando constrói a imagem Playwright fixada, executa os fluxos mock e compara
o snapshot em **Linux/Chromium**, evitando diferenças de fontes/plataforma. Exige Node/npm
e Docker locais; não exige instalar navegador no computador. Artefatos de falha ficam em
`frontend/test-results/`. A referência PNG é versionada separadamente dos testes de comportamento.

Com o Compose completo ativo, para testar a interface com API/banco reais:

```sh
npm run test:real:docker
```

O teste cadastra um produto exclusivo e o exclui ao terminar. Se personalizar a conta,
exporte `ADMIN_USERNAME`/`ADMIN_PASSWORD` para o runner. O runner também admite
`E2E_COMPOSE_PROJECT`, `E2E_PUBLIC_API_URL` e `E2E_PUBLIC_WEB_URL` para instalações
isoladas/portas diferentes; as URLs públicas devem coincidir com as usadas pela aplicação.

Para uma atualização visual **intencional e revisada**, existe
`npm run test:visual:docker:update`. Não atualize a referência apenas para esconder uma regressão.
Playwright direto (`npm run test:e2e`) requer navegador instalado e build prévio;
o snapshot é condicionado a Linux, por isso o caminho Docker é o recomendado.

### Resultados executados

| Verificação | Resultado |
|---|---|
| Backend unitário | 48 testes passaram |
| Backend HTTP/PostgreSQL | 11 testes passaram, incluindo concorrência e rollback |
| Frontend unitário | 22 testes passaram, incluindo imagens demo e estado pós-edição |
| Navegador mock | 8 testes passaram, incluindo edição, retomada após 401, snapshot e larguras 320/375/768 |
| Navegador real | 2 testes passaram, incluindo cadastro/edição/persistência; instalação com volume novo verificada no marco I15 |
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
