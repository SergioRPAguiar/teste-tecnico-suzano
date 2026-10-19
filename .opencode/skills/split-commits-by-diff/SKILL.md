---
name: split-commits-by-diff
description: Use quando o responsável solicitar organizar ou criar commits neste repositório; agrupa o diff por intenção e revisa o conteúdo antes de commitar.
---

# Commits por intenção

Este projeto tem um único repositório; backend/ e frontend/ não têm históricos Git
independentes. Confirme a raiz antes de operar e não presuma obrigatoriedade de WSL.

1. Confirme a raiz com `git rev-parse --show-toplevel`. Inspecione `git status --short`,
   `git diff`, `git diff --cached` e `git log --oneline -10` (histórico pode estar vazio).
   Leia arquivos novos relevantes; o diff não mostra seu conteúdo antes de adicioná-los.
2. Identifique alterações preexistentes e grupos por intenção, mantendo código,
   migrations e testes dependentes juntos. Não force número de commits.
3. Apresente arquivos, motivo e mensagem de cada grupo antes de alterar o índice.
   Se foi solicitado apenas um plano, pare aqui.
4. Com autorização de commit, prepare somente caminhos deliberados. Evite `git add .`.
   Não altere o conteúdo de trabalho para simular uma separação. Se precisar separar
   trechos, use estratégia não interativa revisável ou mantenha dependências juntas.
5. Revise `git diff --cached` e arquivos excluídos: material particular, PDF original,
   credenciais, `.env`, dependências e artefatos não devem entrar no commit.
6. Execute verificações pertinentes disponíveis; relate as não executadas. Crie commits
   concisos, seguindo o histórico existente (se houver). Não pule hooks.
7. Confira `git show --stat --oneline -1` e `git status --short`; reporte commits e pendências.

Commit não autoriza push. Não reescreva histórico, não force push e não faça commits
vazios. Falha de hook exige revisão/correção, não bypass ou amend automático.
