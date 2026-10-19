---
name: audit-case-requirements
description: Use ao concluir uma etapa ou preparar a entrega para auditar requisitos do case contra código, testes e execução documentada.
---

# Auditoria do case

1. Leia `docs/requisitos.md`, `docs/decisoes.md` e os scripts/configurações relevantes.
2. Confira cada ID afetado; na entrega, confira TODOS, inclusive extras e entrega.
   Não confunda compromissos de qualidade com obrigatórios do PDF.
3. Procure implementação e testes reais, não apenas menções no README.
4. Execute verificações pertinentes quando o ambiente permitir. Informe comando,
   diretório, resultado e versão/commit. Se não executar, registre o motivo.
5. Atualize estados sem extrapolar: Pendente; Implementado (não verificado);
   Verificado; Bloqueado. Resultado antigo não comprova código modificado.
6. Entregue tabela com ID, evidência, lacuna e ação necessária. Destaque primeiro
   obrigatórios ausentes, depois falhas de qualidade e extras incompletos.

Cuidados próprios do case: modo API fictícia mesmo com NestJS; categoria/imagem/estoque;
dois testes unitários backend; middleware; snapshot de tela; validação de estoque na
criação e baixa em pedido concluído; README com execução e testes reproduzíveis.

Não mude critérios, escopo ou prioridade para fazer a auditoria passar. Proponha
mudanças de rota ao responsável e aguarde autorização antes de executar.
