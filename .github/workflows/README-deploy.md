# Deploy automático para o cPanel

A cada push na branch `main`, o GitHub gera o build e envia a pasta `dist`
para o servidor por FTPS, depois reinicia o app Node. Não é preciso baixar
nada nem abrir o painel.

## Configuração (uma vez só)

### 1. Segredos

Em **Settings → Secrets and variables → Actions → aba Secrets → New repository secret**:

| Nome           | Valor                                                        |
|----------------|--------------------------------------------------------------|
| `FTP_HOST`     | Host de FTP do cPanel (ex.: `ftp.dominus.site`)              |
| `FTP_USER`     | Usuário de FTP                                               |
| `FTP_PASSWORD` | Senha desse usuário                                          |

Crie uma conta de FTP separada em **Arquivos → Contas de FTP**, com acesso
só à pasta do app, em vez de usar a conta principal do cPanel:

1. **Login:** `deploy` (vira `deploy@dominus.site`, que é o `FTP_USER`).
2. **Diretório:** `membros.dominus.site`

   Essa é a raiz do app neste servidor — a pasta que contém `dist`, `tmp`,
   `package.json` e `node_modules`. O caminho absoluto é
   `/home/dominussite/membros.dominus.site`, mas o campo do cPanel é
   relativo à home, então basta `membros.dominus.site`.

   Atenção: existe também uma pasta `membros` na home. **Não é essa.**
3. **Senha:** gere uma forte e guarde no gerenciador de senhas.
4. Depois de criar, clique em **Configurar cliente FTP** na linha da conta:
   o campo *Servidor FTP* é o `FTP_HOST`.

Com a conta apontando para essa pasta, `DEPLOY_PATH` é só `/`.

### 2. Variável

Na mesma tela, aba **Variables → New repository variable**:

| Nome          | Valor                                                         |
|---------------|---------------------------------------------------------------|
| `DEPLOY_PATH` | Caminho da raiz do app no servidor, visto pelo usuário de FTP |

É a pasta que **contém** o `dist`, **vista pelo usuário de FTP** (e não o
caminho absoluto do servidor).

- Conta de FTP criada como no passo acima (apontando para
  `membros.dominus.site`): o valor é **`/`**.
- Conta de FTP que enxerga a home inteira: use **`/membros.dominus.site`**.

Se o caminho estiver errado, o deploy para com erro antes de enviar qualquer
arquivo — existe uma trava que confere se `DEPLOY_PATH/dist/index.html` já
existe no servidor.

### 3. Opcional: `DOTENV`

Se o build do servidor precisar de chaves diferentes das que estão em
`firebase-applet-config.json`, crie um segredo `DOTENV` com o conteúdo
completo do seu arquivo `.env`. Sem esse segredo, o build usa o
`firebase-applet-config.json` do repositório.

## Uso no dia a dia

1. A alteração é feita em uma branch e vai para a `main` (merge do Pull Request).
2. O deploy roda sozinho. Acompanhe na aba **Actions**.
3. Em ~2 minutos está no ar.

Para subir sem alterar código (refazer o deploy da `main`), use
**Actions → Deploy para o cPanel → Run workflow**.

## Detalhes que valem saber

- **O `--delete` age só dentro de `DEPLOY_PATH/dist`.** Ele remove os bundles
  antigos (os arquivos com hash no nome, como `index-DkGYJXcW.js`), para a
  pasta não crescer sem limite. Nada fora de `dist` é tocado.
- **O restart** é feito gravando `DEPLOY_PATH/tmp/restart.txt`, que é como o
  Passenger (usado pelo cPanel) recarrega o app. Se em algum deploy o app não
  recarregar, basta o botão **Restart** em *Setup Node.js App*.
- **Certificado do FTP:** o workflow está com `ssl:verify-certificate no`,
  porque em servidor cPanel o certificado do FTP costuma não bater com o nome
  do host. A conexão continua criptografada, mas sem validar a identidade do
  servidor. Se o seu `FTP_HOST` tiver certificado válido, troque as três
  ocorrências para `yes` no `deploy.yml` — fica mais seguro.

## O que o deploy NÃO toca

Na raiz do app existem arquivos fora do `dist` — `images/`, `dist.zip`,
`package.json`, `node_modules/`, `.htaccess`, `stderr.log`. O workflow só
espelha o `dist` e grava `tmp/restart.txt`. Nada mais é alterado ou removido.
