# Requisitos e evidências da entrega

Fonte: enunciado fornecido, páginas 1–5; entrega dos dois desafios. O PDF original não
é redistribuído. Evidências técnicas desta revisão foram executadas localmente;
publicação e checks remotos têm seus links indicados na seção de entrega.
**Verificado** significa código inspecionado e/ou cenário executado descrito abaixo;
execução local não é apresentada como execução remota de CI.

## Frontend obrigatório

| ID | Requisito | Estado | Evidência |
|---|---|---|---|
| F01 | Listar nome, categoria, preço, descrição e imagem por URL | Verificado | ProductCard e contrato Product; fotos locais carregadas no navegador mock/real (I13/I14/I16) |
| F02 | Formulário e exibição do produto cadastrado | Verificado | ProductForm, POST e foco pós-cadastro; categoria textual e preço por centavos; navegador nos dois modos (I13/I14/I21) |
| F03 | Filtrar nome e faixa de preço | Verificado | selectCatalog, testes combinados com limites inclusivos e intervalo inválido (I12/I13) |
| F04 | Ordenar resultados | Verificado | Nome A–Z/Z–A e preço crescente/decrescente; desempate por ID; ordenar antes de paginar (I12/I13) |
| F05 | Next.js e TypeScript | Verificado | Pacote frontend, typegen/typecheck/build em Windows/Linux |
| F06 | Estado global | Verificado | Zustand: produtos, filtros, ordem, página/tamanho e sessão; teste C07 e navegador (I12/I13) |
| F07 | Consumir API fictícia | Verificado | MSW executável sem backend; worker público versionado; fluxos HTTP mock passaram (I13) |
| F08 | Tailwind CSS | Verificado | Tailwind4/PostCSS, CSS compilado e tela real inspecionada |

## Frontend extras

| ID | Requisito | Estado | Evidência |
|---|---|---|---|
| FX01 | Paginação | Verificado | 10 por padrão, opções20/50/100; filtro → ordenação → paginação (I12/I13) |
| FX02 | Layout responsivo | Verificado | Navegador em320/375/768/1024/1440 sem transbordamento; diálogo em320/375/768, foco e teclado (I13/I22) |
| FX03 | Documentar escolhas | Verificado | README e decisões técnicas, conferidos contra configuração/código |
| FX04 | Um snapshot de tela | Verificado | PNG em tests/__screenshots__/catalogo-desktop.png; referência e comparação em Linux/Chromium fixados (I13) |

## Backend obrigatório

| ID | Requisito | Estado | Evidência |
|---|---|---|---|
| B01 | Criar/listar/editar/deletar produtos | Verificado | POST/GET/PATCH/DELETE; HTTP201/200/204/400/404/409 (I11) |
| B02 | Campos e ID autogerado do produto | Verificado | Product/DTOs/Prisma; persistência e listagem verificadas |
| B03 | Criar/listar pedidos | Verificado | OrdersController/Service/Repository e integração PostgreSQL (I11) |
| B04 | ID, itens/quantidades, total e status do pedido | Verificado | DTOs, modelo e resposta HTTP; total39.90 calculado por preços do servidor (I11) |
| B05 | Pendente/Concluído/Cancelado | Verificado | Default Pendente e criação nos três status; status inválido/null rejeitados (I11) |
| B06 | Verificar disponibilidade na criação | Verificado | Rejeição de estoque insuficiente, inclusive Cancelado; produto inexistente404 (I11) |
| B07 | Baixar estoque se concluído | Verificado | Baixa condicional em transação; rollback e concorrência sincronizada (I11) |
| B08 | Node.js/NestJS | Verificado | Build, bootstrap, testes HTTP e imagem API saudável |
| B09 | Classes, camadas e SOLID | Verificado | Produtos/pedidos em classes com responsabilidades separadas; queries nos repositories e regras nos services; DI substituída em testes, sem abstrações genéricas desnecessárias |
| B10 | Banco de dados | Verificado | PostgreSQL real, migrations e PrismaPg em execução |
| B11 | Middleware | Verificado | Método/caminho/status/duração; query/corpo/headers omitidos; logs200/404 conferidos (I07) |
| B12 | Pelo menos dois unitários | Verificado | 48 testes em3 suítes, incluindo entrada monetária, PATCH/null e regras de pedidos (I10/I11) |

## Backend extras

| ID | Requisito | Estado | Evidência |
|---|---|---|---|
| BX01 | Swagger ou Postman | Verificado | Swagger/docs-json/docs-yaml; operações e autenticação na especificação conferidas (I09/I11) |
| BX02 | JWT simples | Verificado | Login e proteção de mutações/pedidos; ausência/adulteração/expiração rejeitadas (I11) |
| BX03 | Docker para ambiente | Verificado | db/migrate/api/web; imagens multi-stage; inicialização com volume novo e teste de interface real (I15) |

## Qualidade adicional do plano

| ID | Aceite | Estado | Evidência |
|---|---|---|---|
| Q01 | Dinheiro exato e total no servidor | Verificado | Decimal e strings; rejeição de preço/total fornecidos, total acima do limite e preço histórico (I11/I12) |
| Q02 | Falha sem alterações parciais | Verificado | Primeira baixa efetivamente ocorreu e foi revertida após perda de disponibilidade do segundo item (I11) |
| Q03 | Concorrência pelo último item | Verificado | Barreira de teste assegurou duas leituras antes das baixas: apenas201/409, estoque0 e um pedido persistido (I11) |
| Q04 | Entradas e fluxos críticos backend | Verificado | 48 unitários +11 integrações; duplicatas, quantidades, inexistência e disponibilidade |
| Q05 | Fluxos/estados frontend | Verificado | Filtros combinados, cadastro, erro/retry/loading, vazio, fallback de imagem e rascunho após401 (I12–I14) |
| Q06 | Mock/real compatíveis | Verificado | Mesmos campos/contrato monetário; cadastro e listagem nos dois modos (I13/I14) |
| Q07 | CI reproduzível | Implementado (não verificado remotamente) | Workflow publicado com backend, frontend e browser. Comandos equivalentes executados localmente; resultado remoto ainda não acompanhado |
| Q08 | Instalação limpa e instruções | Verificado | Docker sem dependências/artefatos locais; volume novo, migrations, seed e interface real testados (I15). Sem dependência de OpenCode |

## Evidências executadas

| ID | Execução / resultado |
|---|---|
| I01–I03 | Configuração Compose/SQL e persistência conferidas na inicialização: registro sobreviveu down/up; tabela temporária removida |
| I04–I05 | Schema/migration/client e restrições SQL de integridade verificados antes dos fluxos HTTP |
| I06–I08 | Primeira listagem/API/middleware e base Next verificados em dev/prod, incluindo CSS; marcos iniciais, não substituem testes finais |
| I09–I10 | POST201/400 com gravação correta, Swagger UI/JSON/YAML e35 unitários iniciais; ampliados pelos testes finais |
| I11 | `backend`: test:unit →48 testes/3 suítes; test:e2e →11 testes com banco _test. Última integração executada também em imagem Linux, com migrations e limpeza de fixtures |
| I12 | `frontend`: test:unit →33 testes/4 suítes; pipeline de consulta, dinheiro, C07 pós-cadastro, preço em centavos e migração de imagens preservando dados |
| I13 | Playwright Linux/Chromium:8 testes mock passaram; filtros/ordenação/paginação, cadastro com categoria textual, preço,401/rascunho, responsividade, foco/teclado, fallback e snapshot inspecionado/comparado |
| I14 | Playwright:2 testes reais passaram; login/cadastro/persistência/limpeza e falha de conexão com retry/loading |
| I15 | Projeto Compose isolado `suzano-clean`: volume criado vazio, migration/seed, três serviços saudáveis e mesmos2 testes reais passando em portas alternativas. Recursos temporários removidos; instalação normal preservada |
| I16 | Fotos demo: build/subida Docker saudáveis;48 produtos existentes com preço/estoque e demais campos não visuais intactos,48 imagens atualizadas, seis JPEGs HTTP200; repetição do seed sem alterações. Playwright6 mock +2 reais passaram com fotos carregadas; novo snapshot intencional inspecionado e comparação posterior aprovada |
| I17 | Roteiro docs/SWAGGER.md exercitado por HTTP: login200, proteção401, produto201/PATCH200, pedido39.80/estoque3, preço histórico, conflitos409, DELETE204/404 e Pendente/Cancelado/default. Fixtures exclusivas removidas, sem alterar produtos preexistentes |
| I19 | CAs do sistema (D17): TLS de laboratório aceita CA correta e rejeita ausente/incorreta, sem desativar validação; secrets não persistem. PEM Windows válido/deduplicado, limpeza em sucesso/falha e caminhos com espaços verificados. Iniciador Windows completo e backend sem secret reconstruído passaram;48 produtos/.env preservados e2 testes reais de navegador aprovados. Bash: sintaxe, seleção do bundle com Docker substituído, preflight e subida real sem build passaram no WSL |
| I20 | Compatibilidade Bake (D18): reproduzido bloqueio de leitura do secret externo ao contexto; PEM interno ignorado aceito com proteção ativa. Windows constrói com Buildx e sobe com Compose; fluxos completos com executáveis reais2.31.0 e5.6.0 passaram, mantendo48 produtos/.env. Build em caminho com espaços, exclusão do PEM do COPY/camada, limpeza em sucesso/falhas e modos Verificar/SemBuild conferidos. Bash com limpeza/sintaxe/subida sem build e2 testes reais de navegador aprovados |
| I21 | Cadastro (D19): 33 unitários e 8 testes mock passaram. Categoria textual e preço 00,00→00,01→00,12→01,25→12,59→125,99 verificados; API recebe 125.99. Limites, Backspace, zero e rascunho após 401 cobertos. Diálogo móvel e preço inspecionados |
| I22 | Layout (D20): build/typecheck e 33 unitários aprovados; 8 cenários mock passaram, com comparação posterior do PNG sem atualizar referência. Catálogo em 320/375/768/1024/1440 sem transbordamento; formulário em 320/375/768, foco inicial e Escape verificados. Catálogo desktop/móvel, login e cadastro inspecionados. Dois testes reais passaram após rebuild; 50 produtos existentes e `.env` preservados, fixture exclusiva removida |

Builds/typechecks e instalações npm por lockfile passaram nos ambientes indicados.
Instalações finais reportaram0 vulnerabilidades no npm audit; isso é resultado datado,
não promessa sobre futuras bases de advisories. Nenhum benchmark de capacidade de produção foi declarado.

## Entrega operacional

| ID | Item | Estado | Observação |
|---|---|---|---|
| E01 | Publicar código e compartilhar link | Repositório de entrega | https://github.com/SergioRPAguiar/teste-tecnico-suzano — código e histórico na branch main |
| E02 | Prazo de cinco dias úteis do enunciado | Sob controle do responsável | Não é uma verificação de código |
| E03 | Instruções de execução/testes | Verificado | README, docs/INSTALACAO.md, docs/SWAGGER.md e docs/TESTES.md; preparação local/Docker, objetivos das suítes, banco `_test`, mounts e diagnóstico conferidos contra scripts. Iniciadores Windows/Linux, CAs automáticas e compatibilidade Compose5.6 (I17/I19/I20); builds/subidas conforme D14/D17/D18 |

**Auditoria:** obrigatórios e extras técnicos do PDF implementados e verificados localmente.
Publicação e histórico são verificáveis diretamente no repositório acima. O resultado
atual dos checks remotos deve ser consultado no GitHub Actions; não foi atribuído
resultado remoto aprovado com base apenas nas verificações locais.
