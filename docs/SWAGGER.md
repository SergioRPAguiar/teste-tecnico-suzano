# Swagger: do primeiro clique ao pedido concluído

Este roteiro apresenta uma sequência de operações para testar a API pelo navegador.
**Você não precisa executar comandos no terminal nesta seção.** Antes, inicie a
aplicação seguindo o [guia Windows/Linux](INSTALACAO.md) e aguarde a mensagem de sucesso.

## 1. Abrir a página certa e entender os botões

Abra **http://localhost:3001/docs**. A porta 3000 é da interface; **3000/docs retorna 404**.
Se personalizou portas, use o endereço do Swagger mostrado pelo iniciador.

Cada faixa é uma operação. Clique na faixa para expandir, depois em **Try it out**
para habilitar os campos e em **Execute** para enviar. Os nomes dos botões aparecem
em inglês porque são da ferramenta Swagger.

| Na tela | Significado |
|---|---|
| GET | Consultar registros. |
| POST | Fazer login ou criar um registro. |
| PATCH | Alterar alguns campos de um produto. |
| DELETE | Excluir um produto, quando permitido. |
| Request body / Edit Value | Caixa onde colar o JSON que será enviado. |
| Parameters → id | Campo para informar o número de um produto existente. |
| Server response → Code | Código do resultado da execução que você acabou de fazer. |
| Response body | Dados devolvidos pelo servidor; não é a caixa de envio. |
| Example Value / Schema | Documentação de exemplo, não o resultado de uma execução. |

Nos blocos JSON abaixo, copie tudo, incluindo as chaves. Use aspas duplas, preserve
nomes de campos/vírgulas e não acrescente comentários. Preço na API: `"19.90"`, com
ponto e aspas. IDs/quantidades: `123` e `2`, números sem aspas.

## 2. Consultar os produtos sem login

1. Expanda **Produtos → GET /products**.
2. Clique **Try it out → Execute**. Não há nada a preencher.
3. Em **Server response**, espere **Code 200**.
4. No Response body, veja a lista entre `[` e `]`. Em instalação nova há 48 produtos.

Vamos criar um produto próprio nos próximos passos; não precisa escolher/adivinhar
um ID dessa lista. A consulta é pública, mas as alterações e os pedidos exigem login.

## 3. Fazer login e autorizar

1. Expanda **Autenticação → POST /auth/login → Try it out**.
2. Na caixa Request body, apague o exemplo e cole:

   ```json
   {
     "username": "admin",
     "password": "Suzano@123"
   }
   ```

3. Clique Execute. Espere **Code 200**. Se mudou a conta no `.env`, use sua conta.
4. No Response body **dessa execução**, procure `accessToken`.
5. Copie **todo o valor entre as aspas**, sem as aspas. É um texto comprido: copie
   até o final. Não copie o nome accessToken, as chaves ou o JSON inteiro. O botão
   de copiar da resposta normalmente copia o JSON inteiro, não apenas o token.
6. Volte ao topo da página e clique **Authorize** (botão com cadeado).
7. Na janela, cole o token no campo **Value** da autenticação Bearer.
   **Não escreva Bearer antes dele:** o Swagger já acrescenta o prefixo.
8. Clique **Authorize** dentro da janela e depois **Close**.

O Swagger está autorizado. Fazer login na interface da porta 3000 não autoriza
automaticamente essa página. O token dura uma hora; após recarregar a página ou receber 401,
repita login/Authorize. Se colou o JSON inteiro ou `Bearer Bearer ...`, apague e cole só o token.

## 4. Criar um produto com preço 19.90 e estoque 5

1. Expanda **Produtos → POST /products → Try it out**.
2. Apague todo o exemplo do Request body e cole:

   ```json
   {
     "name": "Produto do roteiro Swagger",
     "category": "Papelaria",
     "description": "Produto criado para testar cadastro, pedido e estoque.",
     "price": "19.90",
     "stockQuantity": 5,
     "imageUrl": "http://localhost:3000/images/papel.jpg"
   }
   ```

3. Clique Execute. Espere **Code 201**: produto criado.
4. No Response body, procure **`id`** e **anote esse número como ID DO PRODUTO**.

**Esse ID foi gerado pelo servidor. Não envie id no corpo do cadastro.** Os exemplos
seguintes usam 123, mas **você deve apagar 123 e digitar o ID real que acabou de anotar**.
Seu número pode ser diferente e não precisa começar em 1. Cada novo POST cria outro produto.

A imagem usa a porta da **interface**, 3000. Se mudou portas, ajuste essa URL para a
porta atual da interface. A foto já acompanha o projeto; você pode conferir abrindo
http://localhost:3000/images/papel.jpg em outra aba.

## 5. Alterar somente a descrição

1. Expanda **PATCH /products/{id} → Try it out**.
2. Em **Parameters → id**, digite o **ID DO PRODUTO** que anotou.
3. Na caixa Request body, apague o exemplo e cole somente:

   ```json
   { "description": "Descrição atualizada pelo Swagger." }
   ```

4. Execute e espere **Code 200**. A descrição muda, mas o preço continua `"19.90"` e o estoque, 5.

PATCH altera só o que foi enviado. Não cole uma resposta inteira nesse campo: ela
contém id, que não é permitido no corpo. Não envie null para representar um campo omitido.

## 6. Criar um pedido concluído com duas unidades

1. Expanda **Pedidos → POST /orders → Try it out**.
2. Apague o exemplo e cole:

   ```json
   {
     "status": "Concluído",
     "items": [
       { "productId": 123, "quantity": 2 }
     ]
   }
   ```

3. **Troque 123 pelo ID DO PRODUTO do passo 4, sem aspas.** Mantenha quantity igual a 2 e o
   status exatamente `Concluído`, com acento.
4. Execute e espere **Code 201**.
5. Confira a resposta:

   | Campo | Valor esperado |
   |---|---|
   | id na raiz | ID DO PEDIDO, um número gerado para o pedido. Anote separadamente. |
   | status | Concluído |
   | total | `"39.80"` (2 × 19.90) |
   | items[0].productId | ID DO PRODUTO que você enviou |
   | items[0].quantity | 2 |
   | items[0].unitPrice | `"19.90"` |
   | items[0].subtotal | `"39.80"` |

**Não envie preço, subtotal ou total no pedido:** o servidor calcula. productId é
sempre ID de **produto**, não ID de pedido. Os números podem coincidir por acaso,
mas representam coisas diferentes.

## 7. Conferir a gravação e o estoque

1. Execute **GET /products** outra vez.
2. Localize seu produto pelo ID/nome; Ctrl+F do navegador pode ajudar a encontrar
   `Produto do roteiro Swagger` dentro da resposta.
3. **stockQuantity deve ser 3:** 5 iniciais menos 2 comprados.
4. Execute **GET /orders** e localize o ID DO PEDIDO. Deve manter total `"39.80"`.

Se a interface da porta 3000 estiver aberta, recarregue-a para buscar as alterações
feitas pelo Swagger. A interface não recebe atualização automática de outra tela.

## 8. Conferir que o pedido guarda o preço da compra

1. Em PATCH /products/{id}, informe o **ID DO PRODUTO** e envie:

   ```json
   { "price": "29.90" }
   ```

2. Espere **Code 200**, preço do produto `"29.90"` e estoque 3.
3. Execute GET /orders novamente: **o pedido já feito continua com unitPrice `"19.90"`
   e total `"39.80"`**. Alterar o preço do catálogo não reescreve uma compra anterior.

## 9. Testar dois conflitos esperados

### Estoque insuficiente

Em POST /orders, envie o JSON abaixo, **trocando 123 pelo seu ID DO PRODUTO**:

```json
{
  "status": "Concluído",
  "items": [{ "productId": 123, "quantity": 4 }]
}
```

Como sobraram 3 unidades, espere **Code 409** e mensagem de estoque insuficiente.
Consulte os produtos: o estoque continua 3, sem baixa parcial.

### Produto usado em pedido

Em DELETE /products/{id}, informe o mesmo ID DO PRODUTO e execute. Espere **Code 409**
e mensagem de produto referenciado. **É o resultado correto:** o sistema preserva o pedido.

## 10. Testar exclusão com sucesso

1. Repita o cadastro POST /products do passo 4, mudando o nome para
   `Produto temporário para excluir`. Mantenha os outros campos válidos.
2. Após Code 201, anote **o ID desse segundo produto**. Não crie pedidos com ele.
3. Em DELETE /products/{id}, informe esse segundo ID e execute.
4. Espere **Code 204 e resposta vazia**. Neste caso, vazio significa sucesso.
5. Se repetir DELETE com o mesmo ID, espere 404: ele já foi excluído.

## Opcional: Pendente e Cancelado

No produto do passo 4, ainda com estoque 3, envie POST /orders assim, substituindo 123:

```json
{
  "status": "Pendente",
  "items": [{ "productId": 123, "quantity": 1 }]
}
```

Repita mudando apenas status para `Cancelado`. Ambos retornam 201 e **não baixam nem
reservam estoque**. Disponibilidade é verificada nos três status. Omitir status assume
Pendente. O status é escolhido na criação: não há rota para alterar um pedido depois.

## Se algum resultado for diferente

| Código / sintoma | O que conferir |
|---|---|
| 200 | Consulta/login/alteração concluídos; veja o Response body. |
| 201 | Criado; copie o ID da resposta real, não o Example Value. |
| 204 e corpo vazio | Exclusão concluída. |
| 400 | JSON válido, campos em inglês, preço como string com ponto; IDs/quantidades como números. Não envie id/total/unitPrice em corpos que não aceitam esses campos. |
| 401 | Token completo e ainda válido no Authorize? Cole só o token, sem aspas e sem Bearer duplicado. |
| 404 | URL usa 3001/docs? Substituiu 123 por um ID existente? É ID de produto, não de pedido? |
| 409 | Estoque insuficiente ou exclusão de produto referenciado; leia a mensagem. São rejeições intencionais. |
| Failed to fetch | Confira API healthy e endereço exibido pelo iniciador. |
| 500 | Não é esperado no roteiro. Consulte logs da API/banco; não apague volumes para corrigir. |

Ao repetir tudo, comece com **um produto novo no passo 4**. As contas seguintes assumem
estoque inicial 5 e preço 19.90; reutilizar um produto já comprado muda os resultados.
