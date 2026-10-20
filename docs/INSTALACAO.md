# Instalação e execução — Windows e Linux

## Caminho recomendado para avaliar

Você precisa apenas de **Git e Docker com Compose v2**. Não precisa instalar Node,
npm, PostgreSQL, Prisma ou OpenCode no computador: o Docker prepara a aplicação.
É possível baixar o ZIP do repositório em vez de instalar Git.

Os iniciadores criam `.env` somente se ainda não existir, constroem as aplicações,
iniciam o banco, aplicam migrations, carregam 48 produtos e aguardam os serviços.
Eles **não reinstalam Docker, alteram permissões do sistema ou apagam dados**.
Se algum passo falhar, exibem erro e retornam código diferente de zero. É seguro
executá-los novamente depois de corrigir o problema.

### Antes de começar

- Internet para baixar imagens e dependências na primeira execução.
- Docker usando **containers Linux**, não Windows containers.
- Compose **v2**, com `--wait` e `--wait-timeout` (verificado com 2.31.0).
- Portas locais livres: **3000** (interface), **3001** (API), **5433** (banco).
- Como margem prática, reserve cerca de **15 GB livres no disco que armazena os dados
  do Docker** e 4 GB de memória disponíveis para os builds. Isso é uma recomendação
  de operação, não um mínimo medido. Vários builds/testes podem consumir mais disco.
- Não execute cópias simultâneas do mesmo projeto nas mesmas portas.

## Opção 1 — Windows 10/11

### 1. Instalar as ferramentas

1. Instale [Git para Windows](https://git-scm.com/downloads/win), se usar o clone.
2. Instale [Docker Desktop para Windows](https://docs.docker.com/desktop/setup/install/windows-install/).
3. Siga os requisitos do instalador: virtualização habilitada e WSL2 quando solicitado.
   Reinicie o Windows se o instalador pedir. Os scripts deste projeto não fazem essa instalação.
4. Abra o **Docker Desktop** pelo menu Iniciar e aguarde o motor ficar em execução.
   Use o backend WSL2/containers Linux.
5. Abra um **novo PowerShell** para reconhecer os programas instalados e confira:

   ```powershell
   git --version
   docker --version
   docker compose version
   docker info --format '{{.OSType}}'
   ```

   O último comando deve mostrar `linux`, sem erro de conexão.

### 2. Obter o código

No PowerShell, dentro da pasta onde deseja guardar o projeto:

```powershell
git clone https://github.com/SergioRPAguiar/teste-tecnico-suzano.git
cd teste-tecnico-suzano
```

Alternativa: no GitHub, **Code → Download ZIP**, extraia completamente e abra a
pasta que contém `compose.yaml` e `iniciar.cmd`. Não execute de dentro do ZIP.

### 3. Iniciar

**Mais fácil:** dê dois cliques em **`iniciar.cmd`**. A janela permanece aberta ao
terminar, inclusive se houver erro, para permitir a leitura da mensagem.

Ou, no PowerShell da pasta do projeto:

```powershell
.\iniciar.cmd
```

Para terminal/automação sem pausa no final:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar.ps1
```

`Bypass` vale somente para esse processo; não muda a política permanente da máquina.
Não é necessário executar o projeto como administrador se o Docker já estiver acessível.

Para apenas conferir requisitos/configuração, sem subir serviços:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\iniciar.ps1 -Verificar
```

## Opção 2 — Linux

### 1. Instalar as ferramentas

Instale Git, Docker Engine e o plugin Compose v2 seguindo a documentação oficial
da sua distribuição:

- [Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Debian](https://docs.docker.com/engine/install/debian/)
- [Outras distribuições](https://docs.docker.com/engine/install/)
- [Permissões após instalação](https://docs.docker.com/engine/install/linux-postinstall/)

Em distribuições que usam systemd, confira/inicie o serviço se necessário:

```bash
sudo systemctl status docker
sudo systemctl start docker
```

Verifique com seu usuário:

```bash
git --version
docker --version
docker compose version
docker info --format '{{.OSType}}'
```

Se houver `permission denied` no socket, configure o acesso conforme a documentação
oficial e inicie uma nova sessão. O grupo `docker` concede privilégios elevados no
host. Não use `chmod 777` no socket. Instalações rootless também funcionam se o
contexto Docker do usuário estiver corretamente configurado.

### 2. Obter e iniciar

```bash
git clone https://github.com/SergioRPAguiar/teste-tecnico-suzano.git
cd teste-tecnico-suzano
bash iniciar.sh
```

Não precisa executar `chmod +x`: chamar `bash iniciar.sh` funciona mesmo vindo de ZIP.
O script resolve os arquivos pela própria localização, não pela pasta atual do terminal.

Verificação sem iniciar:

```bash
bash iniciar.sh --verificar
```

## Quando a inicialização terminar

A primeira execução pode levar vários minutos. Não interrompa enquanto aparecerem
downloads ou compilação. As próximas reutilizam camadas e dependências já baixadas.

| Acesso | URL padrão |
|---|---|
| **Interface** | **http://localhost:3000** |
| **Swagger da API** | **http://localhost:3001/docs** |
| Lista pública JSON | http://localhost:3001/products |

**Conta demo:** usuário `admin`, senha `Suzano@123`.

O Swagger fica na porta **3001**. `http://localhost:3000/docs` é uma rota do frontend
e retorna 404. O script mostra as portas efetivas, inclusive se personalizadas.

O serviço `migrate` com **Exited (0)** é normal: ele aplica migrations/seed e termina.
Banco (`db`), API (`api`) e interface (`web`) devem ficar **healthy**.
Você pode fechar o terminal depois: os containers continuam em segundo plano.

## Roteiro de teste manual — interface

1. Abra a interface: o catálogo deve conter os 48 produtos do seed.
2. Busque `Papel`, combine com preço mínimo/máximo e altere a ordenação.
3. Mude produtos por página entre 10, 20, 50 e 100.
4. Clique em **Novo produto**, faça login e preencha o formulário. Exemplo:
   - Nome: `Produto de avaliação`;
   - Categoria: `Papelaria`;
   - Preço: `19,90`;
   - Estoque inicial: `5`;
   - Descrição: `Produto criado durante a avaliação`;
   - URL da imagem: mantenha a URL de demonstração já preenchida.
5. Salve: deve aparecer confirmação, os filtros são limpos e a página do novo
   produto é mostrada, preservando a ordenação e o tamanho de página.
6. Recarregue: o produto continua no banco. O login fica em memória, então pode ser
   necessário entrar novamente para outra operação protegida.
7. No cartão do produto escolhido, clique em **Editar** e faça login se solicitado.
   O formulário abre preenchido. Altere nome, categoria, preço, estoque, descrição
   ou URL da imagem e clique em **Salvar alterações**.
8. Confira a confirmação e o selo **Atualizado** no mesmo produto. Os filtros são
   limpos para mostrar sua nova posição; ordenação e tamanho de página são mantidos.
   Recarregue e busque o nome atualizado para confirmar a persistência. **Cancelar**
   fecha o formulário sem salvar. Se a sessão expirar, o novo login preserva o rascunho.

## Roteiro de teste manual — Swagger

**[Abra o roteiro completo: Swagger do primeiro clique ao pedido concluído](SWAGGER.md).**

Ele explica os botões da tela, onde colar cada JSON, como copiar/autorizar o token,
como criar um produto próprio e usar seu ID real, como conferir total/estoque e
como interpretar cada resultado. Inclui exemplos completos e contas esperadas.

Endereço: **http://localhost:3001/docs**. Não use 3000/docs.
Siga os passos na ordem: o pedido usa o produto criado durante o próprio roteiro.

## Parar, voltar e consultar logs

Na raiz, Windows e Linux usam os mesmos comandos:

```sh
docker compose ps -a
docker compose logs --tail 100 migrate api web
docker compose down
```

`down` preserva o volume. Para voltar, execute o iniciador novamente. Não use
`down --volumes` para uma parada comum: ele remove os dados deste projeto.
O seed adiciona somente produtos ausentes e não duplica a carga a cada inicialização.

Se já construiu as imagens e não alterou o código, pode evitar reconstruí-las:

- Windows: `.\iniciar.cmd -SemBuild`
- Linux: `bash iniciar.sh --sem-build`

Na primeira execução e após mudanças no código, use o iniciador normal, sem essa opção.

## Problemas comuns

| Sintoma | Como resolver |
|---|---|
| `docker` não encontrado | Instale Docker e abra um terminal novo. |
| Motor/pipe indisponível | Windows: abra Docker Desktop e aguarde; Linux: confira serviço/contexto/permissão. |
| Containers Windows | Selecione **Switch to Linux containers** no Docker Desktop. |
| `unknown flag: --wait` | Atualize Compose v2; o antigo comando `docker-compose` v1 não atende este roteiro. |
| Porta ocupada / `address already in use` | Encerre sua instância local antiga ou personalize as portas como abaixo. Não é preciso apagar volumes. |
| Falha de download / `ECONNRESET` | Confira internet, proxy/VPN e acesso ao registro npm/Docker; repita o iniciador. |
| Build lento, disco cheio ou Docker travado | Confira espaço no disco **do Docker** e memória disponível. Um projeto no D: pode ter Docker armazenado no C:. Use as configurações oficiais do Docker para realocar se necessário. |
| Build muito lento no WSL usando `/mnt/c` ou `/mnt/d` | Prefira o iniciador Windows para um clone no Windows, ou clone dentro de `~/projetos` no Linux e use o iniciador Bash. A travessia de arquivos entre os sistemas pode ficar muito lenta. |
| Erro WSL ao iniciar Docker | Salve trabalho WSL; encerre Docker, execute `wsl --shutdown` e reabra. Isso encerra todas as distros. Se persistir, siga diagnóstico oficial; não apague VHDX/distribuições nem use Factory Reset como primeira tentativa. |
| `migrate` termina com erro | Leia `docker compose logs --tail 100 migrate db`; valide `.env`. Não edite migration aplicada. |
| Senha do banco não muda ao editar `.env` | O volume já tinha credenciais. Restaure a configuração anterior ou altere a credencial dentro do PostgreSQL; preservando dados, recriar container não troca senha. |
| Swagger com 404 do Next | Use porta **3001/docs**, não 3000/docs. |
| Interface abre, mas API não conecta | Confira `/products` na API, serviço healthy, URL pública compilada e `CORS_ORIGINS`. |
| Modificou URL/modo e nada mudou | `NEXT_PUBLIC_*` é configuração de build. Reexecute iniciador para recompilar, ou reinicie o dev server local. |
| API devolve `[]` | Confirme seed/migrate e banco corretos. Em instalação normal o seed cria48 produtos. |
| Dados diferentes no mock | O mock usa localStorage por origem do navegador. Ele não é o banco real; limpar dados do site reinicia apenas sua demonstração local. |

### Personalizar portas sem perder a correspondência de URLs

Abra `.env` na raiz (criado pelo iniciador) e altere o conjunto correspondente. Exemplo:

```dotenv
WEB_PORT=3010
API_PORT=3011
POSTGRES_PORT=5434
NEXT_PUBLIC_API_URL=http://localhost:3011
FRONTEND_PUBLIC_URL=http://localhost:3010
CORS_ORIGINS=http://localhost:3010,http://127.0.0.1:3010,http://web:3000
```

Mantenha `NEXT_PUBLIC_API_MODE=real`. Reexecute o iniciador. Acesse a interface na
3010 e Swagger na3011/docs. Portas internas dos containers permanecem3000/3001/5432.
Este roteiro é para avaliação local; acesso a partir de outro computador exige URLs,
publicação de portas e CORS apropriados, não apenas substituir localhost no navegador.

## Testes automatizados e modo mock separado

O [README](../README.md#testes) contém comandos e resultados. Os scripts de início
sobem a aplicação, **não executam as suítes automaticamente**.

Para backend unitário sem instalar Node no host, com o ambiente já construído:

```sh
docker compose run --rm --no-deps migrate npm run test:unit
```

Para desenvolvimento com npm, modo mock independente, integração no banco `_test`
e testes Playwright/snapshot, siga as seções específicas do README. O teste real de
navegador usa a conta demo ou as credenciais que você exportar para o runner.

Se precisar reportar uma falha, envie o comando usado, sistema operacional, saída
de `docker compose ps -a` e os logs do serviço afetado. Não envie seu `.env` com segredos.
