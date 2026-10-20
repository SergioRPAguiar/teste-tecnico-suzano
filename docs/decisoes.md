# Decisões técnicas

## Processo de alteração

O plano inicial foi aprovado pelo responsável na conversa de preparação.
Mudanças de rota precisam de autorização explícita antes de implementar. Registrar:
problema, proposta, impacto, alternativa, decisão do responsável e evidência da autorização.
Não transformar hipótese em decisão aprovada. Preservar decisões anteriores como substituídas,
em vez de apagá-las. Detalhes operacionais que não mudam o plano podem ser resolvidos na execução.

## D01 — Escopo e estrutura — aprovado

- Entregar os dois desafios em um repositório com `frontend/` e `backend/`.
- Sem ferramentas adicionais de monorepo nesta base.
- Priorizar obrigatórios, depois extras do enunciado e evidências de qualidade.
- Não acrescentar chatbot, dashboard, busca semântica ou funcionalidades de negócio fora do case.
- Motivo: manter rastreabilidade ao enunciado e complexidade proporcional à entrega.

## D02 — Base técnica — direção aprovada e implementada

| Área | Escolha planejada | Motivo / consequência |
|---|---|---|
| Frontend | Next.js, TypeScript, Tailwind | Exigências do enunciado |
| Estado global | Zustand | Responsabilidade pequena e explícita; definir o estado antes de adotar |
| Mock | MSW | Exercitar HTTP com API fictícia; preservar modo mock além da integração real |
| Backend | NestJS; controller/service/repository | Exigências do enunciado; evitar abstrações sem necessidade |
| Banco | PostgreSQL | Relações entre produtos/pedidos e suporte a transações |
| Acesso ao banco | Prisma | Cliente de dados e migrations; não substitui desenho de transações/concorrência |
| API | Swagger | Documentação dos endpoints próxima da implementação |
| Testes backend | Jest e Supertest | Regras unitárias e verificação HTTP |
| Testes frontend | Componentes/interações; Playwright para fluxos e snapshot visual | Biblioteca de componentes ainda a selecionar; controlar dados/ambiente do snapshot |
| Ambiente | Docker Compose | Subida reproduzível dos serviços |
| CI | GitHub Actions | Executar verificações automatizadas |

Detalhes de versão/comandos são acrescentados conforme verificados (D05–D08).
Troca da direção técnica exige aprovação. Os marcos iniciais D05–D08 foram ampliados,
conforme o plano, pelos fluxos finais D09–D13; evidências consolidadas em requisitos.md.

## D03 — Contratos e regras — aprovados

| ID | Questão resolvida | Decisão resumida |
|---|---|---|
| C01 | Categoria no cadastro | Campo obrigatório de texto, sem CRUD de categorias |
| C02 | Imagem e estoque nos modos mock/real | Contrato único; imagem obrigatória e estoque inicial explícito no formulário |
| C03 | Status na criação, baixa e eventuais transições | Pendente por padrão, status aceito na criação; sem rota de transição |
| C04 | Representação de dinheiro | Decimal exato, strings na API e cálculo no servidor |
| C05 | Produto repetido no pedido | Rejeitar duplicatas com erro de validação |
| C06 | Exclusão de produto referenciado | Bloquear com HTTP 409 e restrição no banco |
| C07 | Filtros, ordenação e paginação | Paginação no frontend: padrão 10; opções 20, 50 e 100 |
| C08 | Pedido pendente e estoque | Sem reserva; baixa condicional atômica apenas em Concluído |

### Contrato aprovado — etapa 1

Autorização: responsável respondeu “de resto concordo com tudo” à proposta C01–C08,
solicitando em C07 opções de 20, 50 e 100 além de 10 produtos por página. A proposta
anterior de tamanho fixo 10 foi substituída por essa seleção. Implementação verificada na matriz.

- **C01:** incluir categoria obrigatória no formulário, como texto, sem criar CRUD de categorias.
- **C02:** mesmo contrato nos modos mock/real: produto com os campos do backend e URL
  de imagem. Formulário com nome, categoria, descrição, preço, URL da imagem e estoque
  inicial explícito (inteiro não negativo). A API também exige imagem para garantir
  produtos exibíveis no frontend. Não inventar quantidade padrão escondida.
- **C03:** criação aceita Pendente, Concluído ou Cancelado; ausência de status significa
  Pendente. Validar disponibilidade em toda criação, inclusive Cancelado, seguindo a
  leitura literal do enunciado. Apenas Concluído baixa estoque, na mesma operação
  transacional que persiste pedido/itens. Sem endpoint de transição nesta entrega;
  pendentes não poderão ser concluídos depois. Demonstrar cada status na criação.
- **C04:** BRL com duas casas decimais; API recebe/devolve valores monetários como
  strings decimais (ex.: `"19.90"`), banco usa decimal exato e cálculos usam aritmética
  decimal (não Number de ponto flutuante). Rejeitar preço com mais de duas casas,
  em vez de arredondar silenciosamente. Preço positivo; total calculado no servidor.
  Guardar preço unitário no item para preservar o total após edição do produto.
- **C05:** rejeitar itens repetidos no pedido com erro de validação; quantidades
  devem ser inteiros positivos e a lista deve ter ao menos um item.
- **C06:** permitir exclusão física somente de produto sem referência em pedido;
  produto referenciado retorna conflito HTTP 409, apoiado por restrição no banco.
  Evitar exclusão em cascata e soft delete nesta base. Edição de preço não altera pedidos anteriores.
- **C07:** busca por trecho do nome, sem distinguir maiúsculas/minúsculas; limites
  de preço inclusivos e combináveis, com intervalo inválido rejeitado. Ordenações:
  nome A–Z/Z–A, preço crescente/decrescente, com ID como desempate estável. Página
  com 10 produtos por padrão e seletor de 10, 20, 50 ou 100. Para o volume do case,
  frontend aplica filtro → ordenação → paginação sobre a lista recebida; mudar
  filtro, ordem ou tamanho da página volta à primeira página.
  Cadastro bem-sucedido limpa filtros, mantém a ordenação e navega até a página
  que contém o novo produto, com destaque visual e confirmação. Assim o produto
  aparece sem introduzir exceção na ordenação.
- **C08:** pedidos pendentes/cancelados não reservam nem baixam estoque. A validação
  na criação não garante disponibilidade futura. Para Concluído, baixa condicional
  atômica por item, dentro da transação, deve falhar se o saldo for insuficiente;
  falha em qualquer item reverte o pedido e todas as baixas. Cobrir concorrência real em teste.

## D04 — Evidência e uso de IA — aprovado

- Publicar guia técnico e três skills de desenvolvimento; execução da aplicação independe de OpenCode.
- IA auxilia implementação/revisão, mas testes, inspeção e decisões do responsável validam a entrega.
- Não declarar resultados não executados nem métricas de carga como capacidade de produção.
- Manter autenticação JWT simples, sem expandir para recuperação de senha e permissões elaboradas.

## D05 — Ambiente PostgreSQL — marco inicial, ampliado em D13

Detalhamento da direção Docker Compose/PostgreSQL já aprovada:

- Serviço `db`, projeto Compose `suzano-case`, rede e volume próprios. Sem `container_name`
  fixo nem reaproveitamento de volumes de outros projetos.
- Imagem PostgreSQL 17 Alpine fixada pelo digest presente em `compose.yaml`; a imagem
  verificada informa versão 17.7. O digest mantém o conteúdo reproduzível entre execuções.
- Porta publicada `127.0.0.1:5433` para desenvolvimento no computador; internamente 5432.
  `POSTGRES_PORT` permite ajustar a porta local sem alterar a porta do PostgreSQL.
- Volume nomeado em `/var/lib/postgresql/data` persiste ao recriar o container.
- Healthcheck com `pg_isready`; `up --wait` aguarda disponibilidade. Saúde do serviço
  não substitui consulta autenticada, migration ou teste das regras da aplicação.
- `.env.example` descreve configuração; `.env` local ignorado pelo Git. Variáveis de
  inicialização PostgreSQL afetam apenas volume vazio.
- Na inicialização, Compose subia somente o banco. D13 registra a conclusão do
  ambiente completo e sua verificação com volume novo.

## D06 — Modelo relacional e Prisma — implementado e verificado

Detalhamento da direção Prisma/PostgreSQL e do contrato C01–C08, sem alteração de escopo:

- Pacote independente em `backend/`, npm e lockfile versionado; Node 22.12+ (linha 22)
  ou 24+. Prisma e client 7.10.1 estáveis, compatíveis com o ambiente verificado.
- `prisma.config.ts` carrega `.env` do diretório de execução (`backend/`). URL em
  `DATABASE_URL`; geração do client não exige URL definida, migrations exigem conexão.
- Generator `prisma-client`, saída local ignorada `src/generated/prisma`, formato CommonJS.
  Na integração NestJS (D07), `importFileExtension = "js"` foi acrescentado para que a
  saída compilada referencie JavaScript; essa mudança de generator não altera tabelas.
- Três modelos: Product, Order e OrderItem; nomes em inglês no código e tabelas
  `products`, `orders`, `order_items`, com colunas compostas em snake_case.
- IDs Int autogerados. Relações explícitas, unicidade (order_id, product_id) e índice
  product_id para localizar referências. Relações restringem exclusão; não há cascade delete.
- OrderStatus tem nomes internos PENDING/COMPLETED/CANCELLED, mapeados no PostgreSQL
  para Pendente/Concluído/Cancelado; o contrato HTTP deverá apresentar os valores aprovados.
- Preço e preço unitário Decimal(12,2); total Decimal(14,2), com espaço adicional para
  soma de itens. A futura validação deve respeitar limites e rejeitar precisão excessiva.
- O preço unitário é copiado para o item pelo futuro service; atualizar Product.price
  não altera OrderItem.unitPrice nem total já gravado.
- CHECKs SQL adicionais garantem estoque não negativo e preço/total/quantidade positivos.
  Prisma não os representa em atributos do schema; migration é a fonte versionada desses CHECKs.
- Migration inicial revisada e complementada ANTES de aplicar, envolvendo DDL em transação.
  Migrations aplicadas não devem ser reescritas; alterações futuras criam novos arquivos.
- O modelo não garante sozinho total correto, pelo menos um item, validação HTTP,
  baixa por status ou ausência de corrida de estoque. Essas regras foram implementadas
  nos services/testes descritos em D10.

## D07 — Inicialização NestJS e listagem — implementado e verificado

Detalhamento da arquitetura aprovada, começando por uma fatia de leitura de produtos:

- NestJS 11.2.7, CLI 11.0.21 e TypeScript 5.9.3 fixados, com dependências compatíveis
  com Node 22.12 verificado. Nest12/CLI12 não usados: transitivas da CLI exigiam Node mais novo.
- `GET /products` em controller/service/repository, com injeção de dependências por
  classes/providers Nest. Sem interfaces/camadas adicionais sem necessidade atual.
- Resposta HTTP com nomes `id`, `name`, `category`, `description`, `price`, `stockQuantity`
  e `imageUrl`; preço string em duas casas. Colunas snake_case permanecem detalhe de persistência.
- Lista completa, estável por ID crescente. C07 permanece no frontend: filtro → ordenação
  → paginação. Não foi acrescentada paginação de servidor ou outro contrato de consulta.
- PrismaPg conecta o client ao PostgreSQL. PrismaService centraliza inicialização/
  desconexão e é compartilhado pelos providers, evitando criar pools por requisição.
- PORT padrão 3001; dotenv carrega backend/.env antes do bootstrap. Build e watch usam
  o mesmo código; TypeScript estrito e metadata de decorators habilitados para DI.
- Middleware de log transversal, sem lógica de negócio: método/caminho/status/duração,
  sem query string, corpo ou headers. Padrão `{*path}` compatível com Express5 inclui rotas inexistentes.
- DTO de resposta descreve o formato; a conversão efetiva do preço acontece no service.
  TypeScript não transforma nem valida dados de entrada em runtime apenas pela anotação.
- Verificações iniciais registradas em I06/I07; D09–D13 registram CRUD completo,
  Swagger/JWT, frontend e suítes executadas.

## D08 — Base frontend — implementada e verificada

Detalhamento da inicialização Next.js/TypeScript/Tailwind já prevista na etapa1:

- Pacote independente em frontend/, sem workspace ou ferramentas de monorepo.
  Versões fixadas: Next16.4.2, React/ReactDOM19.3.1, Tailwind/plugin PostCSS4.3.3,
  PostCSS8.5.30 e TypeScript5.9.3; compatibilidade verificada com Node22.12.
- App Router em src/app; layout comum com idioma/metadados/CSS e page da rota inicial.
  Componentes atuais estáticos/de servidor; componentes interativos serão delimitados
  com use client quando houver estado/eventos, sem tornar o layout inteiro cliente por padrão.
- Tailwind4 via @tailwindcss/postcss e import no CSS global; sem configuração legada v3.
- Tipos de rota/next-env e build são gerados; typecheck roda typegen antes do tsc;
  código de aplicação TS/TSX com checagem estrita e lockfile versionado.
- Fontes do sistema nesta base, sem download de fonte externa durante o build.
- A base inicial não adicionou consulta/mocks/estado global antecipadamente.
  A implementação completa com MSW e Zustand está registrada em D12.
- I08 registra build/typecheck/HTTP/CSS; não equivale a teste visual ou de comportamento.

## D09 — Entrada, atualização e documentação — implementado

- ValidationPipe global com transformação de DTO, sem coerção implícita; rejeita campos
  desconhecidos e null indevido. Textos são aparados e não podem ficar vazios.
- Preço é string decimal simples, positivo e limitado ao DECIMAL(12,2), sem vírgula,
  sinal ou expoente na API; até duas casas. Frontend aceita vírgula e normaliza antes de enviar.
- Estoque inteiro entre0 e2147483647; imagem HTTP(S) obrigatória, sem buscar seu conteúdo no servidor.
- PATCH usa PartialType sem ignorar null; corpo vazio é rejeitado. FK/restrição real
  determina conflito409 na exclusão, evitando uma checagem prévia vulnerável a corrida.
- Swagger documenta rotas, DTOs, respostas e Bearer; não é mecanismo de validação.

## D10 — Pedidos e estoque — implementado e testado

- Service controla regras/total; repository concentra consultas e transação. ReadCommitted
  com UPDATE condicional saldo>=quantidade evita duas baixas da última unidade.
- Todos os produtos são verificados, inclusive em Cancelado. Pendente/Cancelado não
  reservam nem baixam estoque. IDs de produto são únicos no pedido; preços/total não vêm do cliente.
- Baixas ordenadas por ID reduzem deadlocks. Criação do pedido/itens está na mesma
  transação: falha de qualquer baixa desfaz as anteriores. Conflitos retornam409.
- Total Decimal limitado ao DECIMAL(14,2). Preço unitário histórico é copiado na criação;
  editar preço do produto não altera pedidos existentes.
- Integração usou barreira para duas transações lerem a unidade antes da baixa, com
  apenas201/409. Outra integração comprovou rollback após primeira baixa efetiva.

## D11 — JWT proporcional ao extra — implementado

- Uma conta administrativa configurada por ambiente, sem expandir para CRUD de usuários,
  recuperação de senha ou refresh tokens. Valores de exemplo são para demonstração local.
- Login compara digests de tamanho fixo com timingSafeEqual; credenciais não são logadas.
  Token HS256 dura1h e valida assinatura, expiração, issuer, audience e subject.
- Leitura do catálogo pública; mutações e pedidos protegidos. Mock simula o mesmo
  contrato de sessão, sem se apresentar como autenticação criptográfica real.
- Frontend mantém token em memória e exige novo login após recarregar. Falha401 durante
  cadastro permite reautenticação preservando o rascunho.

## D12 — Frontend e API fictícia — implementado

- Zustand guarda produtos, consulta/ordem/página/tamanho e sessão; diálogos/formulários
  usam estado local. Seleção derivada é função pura: filtro → ordenação → paginação.
- Comparações monetárias no frontend usam centavos inteiros dentro do limite seguro;
  cálculos financeiros do pedido continuam no servidor com Decimal.
- MSW usa requisições HTTP reais interceptadas no navegador. Worker é versionado;
  dados fictícios ficam no localStorage. Modo real usa os mesmos campos e formatos.
- Inicialização aguarda worker antes de consultar. NEXT_PUBLIC_* é resolvido no build;
  não usar essa configuração para segredo JWT ou credenciais de banco.
- Imagens arbitrárias do contrato usam img nativo com lazy loading e fallback SVG local;
  evita exigir uma lista fixa de hosts do otimizador. Não há fontes externas no build.
- Diálogo nativo fornece comportamento modal/foco; labels, estados de erro e feedback
  de cadastro são explícitos. C07 foi testado, mantendo ordenação e exibindo o novo item.

## D13 — Execução e evidência — implementado

- Compose db → migrations/seed → API → frontend, healthchecks e volume próprio.
  Seed é idempotente e preserva produtos existentes. Runtime das aplicações usa usuário node.
- Node/PostgreSQL/Playwright fixados por digest; cache de npm nos builds e heap de build
  limitado. Standalone Next usado só no Docker; manifesto final é validado durante build.
- Jest/ts-jest e Supertest:48 unitários backend e11 integrações PostgreSQL. Banco de
  teste com sufixo obrigatório _test, migrations próprias e limpeza só de fixtures.
- Frontend:22 unitários e Playwright com8 fluxos mock (incluindo PNG de tela) +2 reais.
  Snapshot comparado em Linux/Chromium/ambiente fixados; não confundir com teste de comportamento.
- Overrides YAML corrigem transitivas, mantendo API load usada pelo loader Istanbul
  (compatibilidade conferida) e versão5 corrigida no Swagger. Lockfile regenerado limpo
  para preservar opcionais multiplataforma; npm ci Linux e Windows conferidos nos marcos.
- Instalação com volume novo e interface real passou em projeto Docker isolado. Nenhum
  arquivo pessoal, OpenCode ou código gerado local é necessário à execução.
- CI configurado para as suítes; código publicado e resultado remoto consultável no GitHub Actions.
  Não foi declarado benchmark de capacidade de produção nem aprovação remota não executada.

## D14 — Inicialização assistida Windows/Linux — autorizada

O responsável solicitou explicitamente simplificar instalação/execução para o avaliador
e documentar os dois sistemas. Adicionados iniciar.cmd/scripts/iniciar.ps1 e iniciar.sh,
sem mudança de stack. Eles verificam Docker/engineLinux/Compose, criam .env somente se
ausente, validam configuração e executam Compose com build/espera de saúde.
Não instalam software global, sobrescrevem configuração ou removem dados. Retornam
código de falha e mostram links efetivos. O modo de verificação não sobe serviços.
Guia docs/INSTALACAO.md cobre pré-requisitos, execução, Swagger e problemas comuns.

Verificação: PowerShell executou preflight e fluxo completo de build/subida fora da
pasta do projeto, com três serviços saudáveis. Bash teve sintaxe verificada em Linux,
preflight no Ubuntu/WSL e subida com imagens existentes via --sem-build concluídos.
O build completo via WSL em /mnt/d excedeu a janela de600s ao transferir contexto;
não foi classificado como concluído. Guia orienta evitar essa travessia de filesystem.

## D15 — Fotografias demo e roteiro Swagger — autorizados e verificados

O responsável solicitou imagens reais ilustrativas no catálogo e instruções de Swagger
detalhadas para iniciantes, autorizando os testes, a atualização visual e a publicação
dessas mudanças. Motivo: tornar a demonstração visual e o teste manual mais claros.
Alternativa considerada: manter o placeholder e o roteiro curto de operações.

- Seis JPEGs locais em frontend/public/images, compartilhados pelos 48 itens demo.
  Autores, fontes, licenças e redimensionamento registrados em images/FONTES.md.
  As fotografias são ilustrativas; não representam imagens oficiais de produtos Suzano.
- Seed atualiza somente a imagem gerenciada do item demo encontrado pelo nome,
  preservando preço, estoque, demais campos e URLs personalizadas. Não muda o schema.
  No mock, migra apenas o placeholder local dos IDs/nomes demo, sem limpar localStorage.
- Formulário e exemplos OpenAPI usam a foto local papel.jpg como sugestão editável.
- docs/SWAGGER.md detalha Try it out/Execute, login/Authorize, IDs reais, JSONs,
  total/estoque, preço histórico, conflitos e exclusão; instalação e README apontam o guia.
- Verificação: typecheck e 20 unitários frontend; build backend Windows e builds Docker;
  48 produtos comparados antes/depois com todos os campos não visuais preservados,
  seis JPEGs HTTP 200 e repetição do seed sem alterações. Playwright Linux: 6 mock e 2 reais
  passaram, incluindo fotos carregadas. Snapshot atualizado intencionalmente, inspecionado
  e depois comparado com sucesso sem atualização. Roteiro exercitado por HTTP com
  fixtures exclusivas removidas ao final, sem alterar os registros preexistentes.

## D16 — Editar produtos pela interface — solicitado e verificado

O responsável solicitou explicitamente um botão para editar qualquer item do catálogo.
A API já possui PATCH protegido; a alteração reutiliza essa rota, autenticação e formulário,
com suporte equivalente no mock. Alternativa anterior: editar somente pelo Swagger.

- Botão Editar em cada cartão, com nome acessível identificando o produto; formulário
  preenchido com os seis campos atuais. Cancelar não salva; salvar sem alterações é informado.
- PATCH envia apenas os campos efetivamente alterados, sem ID no corpo. Assim, mudar
  descrição não reenvia estoque/preço capturados antes de uma possível atualização externa.
  Alterar estoque explicitamente continua permitido pelo contrato de produtos existente.
- Login exigido antes de abrir; 401 ao salvar retoma a mesma edição/rascunho após autenticação.
- Sucesso substitui o mesmo ID na lista, limpa filtros e mostra sua página na ordenação
  atual, mantendo ordem/tamanho e destacando Atualizado. A regra de cadastro C07 foi preservada.
- Seed reconhece como gerenciada apenas a foto esperada daquele tipo ou o placeholder
  antigo: escolher outra foto local não a faz ser sobrescrita na próxima inicialização.
- Verificação: typecheck e 22 unitários frontend, builds backend/Docker, 8 testes mock e 2
  reais passaram. Cobertos todos os campos, cancelamento, persistência, reautenticação,
  PATCH parcial e ausência de duplicação. Snapshot com os botões inspecionado e comparação
  posterior aprovada. Rebuild preservou integralmente os 48 produtos existentes; verificação
  do seed compilado em memória confirmou preservação de foto personalizada local/externa.

## D17 — CAs do sistema no build corporativo — autorizado e verificado

O responsável relatou falha de TLS em binaries.prisma.sh no computador corporativo
e pediu execução simples sem obter certificado manualmente com a TI. Autorizou
explicitamente a adaptação automática, validação com CA de teste, commit e push.
Alternativas discutidas: certificado fornecido manualmente ou imagens pré-compiladas.
A solução mantém a stack e o mesmo comando de inicialização.

- PowerShell lê Root de CurrentUser/LocalMachine em modo somente leitura, exclui
  certificados Disallowed, deduplica e gera PEM público temporário. Não lê chaves
  privadas, instala certificados no sistema ou escreve configuração permanente.
- Bash usa o bundle de CAs do Linux quando disponível. Ambos acrescentam o override
  compose.ca.yaml, que fornece system_ca como secret de build para migrate/api/web.
- Helper POSIX define NODE_EXTRA_CA_CERTS apenas no processo/filhos daquele RUN.
  Npm e geração do Prisma recebem a confiança adicional; validação HTTPS continua ativa.
  Execução sem secret segue com a confiança padrão. Nenhum bundle é incorporado à imagem.
- Verificar e SemBuild preservam seus contratos; a limpeza Windows ocorre em finally
  em sucesso/erro tratado, restaurando também a variável de ambiente do processo.
- Verificações: CA de laboratório aceita quando fornecida, ausente/incorreta rejeitadas;
  secrets ausentes na camada seguinte. PEM Windows parseável/deduplicado e limpeza
  em sucesso/falha com caminhos contendo espaços. Build/subida Windows completos,
  backend sem secret reconstruído sem cache do estágio, dois testes reais de navegador
  aprovados e 48 produtos/.env preservados. Bash: sintaxe, seleção de CA com Docker
  substituído, preflight e subida real sem build no WSL aprovados. Não se declara um
  build completo WSL nem execução na rede corporativa do responsável nesta máquina.

## D18 — Compatibilidade do build Windows com Bake — correção de D17

O responsável retornou com falha antes de executar o Dockerfile: `failed to execute
bake`, usando Compose5.6.0. A adaptação de instalação e sua publicação já haviam
sido autorizadas em D17; esta etapa corrige a compatibilidade desse mesmo fluxo.

- Reproduzida a rejeição do secret fora do contexto com a proteção de leitura do
  Bake ativa. Movido para arquivo temporário na raiz, ignorado por Git/Docker e
  removido ao encerrar. Linux faz uma cópia temporária do bundle no mesmo limite.
- Teste adicional com Compose5.6.0 oficial e Buildx0.19.2 local revelou duplicação
  do caminho absoluto do Dockerfile no adaptador Bake. No Windows, Buildx constrói
  migrate/api/web sequencialmente com --load; Compose continua responsável pela
  configuração e pela subida db→migrate→api→web com --no-build. Nenhuma troca de stack.
- Nomes de imagens, contextos, Dockerfiles, estágios e argumentos vêm do config
  Compose normalizado. CA permanece secret de build; TLS e proteções de filesystem
  continuam ativos. Não se utiliza builder clássico nem se desativam verificações.
- Validação: build/subida completos com Compose 2.31.0 e 5.6.0 reais; 48 produtos e `.env`
  preservados. Função pública de build exercitada em diretório com espaços; secret
  disponível no RUN, excluído de COPY e ausente na camada seguinte. Sucesso/falha
  de build/falha de subida/Verificar/SemBuild exercitados, incluindo limpeza.
  Bash: limpeza em sucesso/falha, sintaxe e subida real sem build verificadas no WSL.
  Dois testes reais de navegador aprovados nas imagens resultantes. O certificado
  e a versão de Buildx específicos do computador corporativo ainda serão revalidados lá.
