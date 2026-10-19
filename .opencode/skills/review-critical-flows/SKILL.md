---
name: review-critical-flows
description: Use ao revisar pedidos, estoque ou a interação de cadastro, filtros, ordenação e paginação; procura falhas concretas e define verificações pertinentes.
---

# Revisão de fluxos críticos

Leia os contratos decididos em `docs/decisoes.md` antes de revisar. Questões abertas
devem ser apontadas, não resolvidas silenciosamente pela revisão.

## Backend

- Total a partir de preços confiáveis do servidor, precisão monetária e validação de quantidades.
- Produto inexistente, itens repetidos, estoque insuficiente e exclusão de produto referenciado.
- Status e momento da baixa; distinguir disponibilidade de reserva de estoque.
- Atomicidade: falha em qualquer item não pode deixar pedido/estoque parcialmente alterados.
- Concorrência: duas requisições disputando uma unidade não podem concluir ambas.
  Inspecione a operação/isolamento real; uma transação por si só não comprova proteção.

## Frontend e integração

- Cadastro aparece na lista; regras de filtro podem ocultá-lo e devem ter comportamento claro.
- Filtros e ordenação se aplicam de forma coerente antes da paginação; mudança de filtro
  não deve deixar página inválida. Evitar duplicação inconsistente de estado derivado.
- Estados carregando, erro, vazio, validação e imagem indisponível.
- Compatibilidade de campos, status HTTP e erros entre MSW e backend.
- Snapshot com dados/ambiente estáveis; não atualizar baseline para esconder regressão.

Para cada achado: cenário reproduzível, arquivo, impacto, evidência, teste sugerido
e correção proporcional. Diferencie suspeita de falha reproduzida. Priorize integridade
e obrigatórios; não acrescente features. Teste de carga leve é secundário à correção.
