# Instruções do projeto

- A entrega cobre frontend e backend. Consulte `docs/requisitos.md` (evidências reais)
  e `docs/decisoes.md` (contratos aprovados). Mudanças de escopo/stack/arquitetura,
  prioridades, testes ou publicação exigem autorização explícita ANTES da execução;
  apresente motivo, impacto e alternativa e registre a decisão. Correções no plano podem prosseguir.
- Pacotes/lockfiles independentes em backend/ e frontend/, sem workspace npm na raiz.
  Scripts npm nas respectivas pastas; Compose na raiz, projeto suzano-case.
- Iniciadores do avaliador: iniciar.cmd/scripts/iniciar.ps1 (Windows) e iniciar.sh (Bash).
  Preservam .env/volumes; Verificar/--verificar só confere ambiente. SemBuild/--sem-build
  exige imagens existentes. Guia operacional detalhado em docs/INSTALACAO.md.
- Compose sobe db → migrate (migrations/seed, termina0) → api → web. `down` preserva
  volume; `down --volumes` remove dados. POSTGRES_* só inicializa volume vazio.
- Padrões: frontend3000, API3001, PostgreSQL local5433. Exemplos de ambiente separados
  para Compose, backend, testes backend e frontend; não presumir carregamento do .env da raiz por npm.
- Gere Prisma Client antes de build/typecheck/start:dev num clone limpo. Prisma7 usa
  URL em prisma.config.ts, runtime PrismaPg; moduleFormat=cjs/importFileExtension=js
  são necessários para o client compilado em dist. Client gerado é ignorado.
- Use migrations, não db push: CHECKs complementares só no SQL. Não editar migration aplicada.
  No PowerShell5.1, npm.ps1 perdeu flags após --; foi verificado
  `npm.cmd --% run db:migrate -- --name init --create-only`.
- Testes de integração backend exigem DATABASE_URL com banco terminado em _test;
  runner cria banco/aplica migrations e limpa só fixtures. Nunca apontar para dados de uso normal.
- JWT: leitura de produtos e login públicos; mutações/pedidos protegidos. Conta única
  configurada no servidor, sem cadastro de usuários. Não expor JWT_SECRET via NEXT_PUBLIC_*.

## Contratos e fluxos críticos

- C01–C08: categoria/estoque no formulário, imagem obrigatória, dinheiro como string
  decimal na API. Total no servidor com Decimal; itens guardam preço histórico.
- Pedido omitindo status assume Pendente; três status aceitos na criação, sem transição
  ou reserva. Só Concluído baixa estoque. Produto referenciado não pode ser excluído (409).
- Baixa usa update condicional stock>=quantity dentro da transação; locks em ordem de ID.
  Não trocar por ler/decrementar sem condição. Integração sincroniza duas leituras antes da disputa.
- Filtro → ordenação → paginação no frontend. Padrão10, opções20/50/100; após cadastro,
  limpar filtros, manter ordem/tamanho e navegar à página do novo item (C07).
- ValidationPipe sem coerção implícita, rejeitando campos extras. PATCH omite campos,
  mas não deve aceitar null como se fosse omissão (`skipNullProperties: false`).
- Middleware usa `{*path}` no Express5; loga método/caminho/status/duração, sem query,
  corpo ou headers. Não mover acesso ao banco para middleware.

## Frontend, testes e continuidade técnica

- App Router em src/app. Componentes interativos usam use client; layout/metadata ficam
  no servidor. Tailwind4 via @tailwindcss/postcss e @import, não setup legado de v3.
- Frontend local padrão mock (MSW), Compose padrão real. Worker público versionado.
  NEXT_PUBLIC_* é configuração de build: mudar modo/URL exige reiniciar/recompilar.
- Estado global em Zustand; lista filtrada/ordenada/paginada é derivada, sem cópias paralelas.
- next typegen precede tsc. next-env.d.ts/.next/caches e node_modules são ignorados.
- Preserve lockfiles multiplataforma: regenerar com node_modules instalado pode perder
  opcionais de outros sistemas. Docker Linux detectou esse problema e a geração limpa corrigiu.
- Snapshot real está em frontend/tests/__screenshots__; comparar em imagem Playwright
  Linux fixada, usando test:visual:docker. Atualizar baseline só por mudança visual intencional/revisada.
- Ao fechar etapa use audit-case-requirements; para estoque/pedidos ou filtros/ordem/
  paginação use review-critical-flows. Código existente não significa teste executado.
- Use split-commits-by-diff quando solicitado commit. Commit e push exigem solicitações
  próprias; preserve trabalho preexistente e revise staged diff. Não publicar material pessoal.
- Clone executa sem OpenCode. Skills apoiam desenvolvimento; não são dependências
  da aplicação e não autorizam adicionar funcionalidades de IA fora do escopo.
