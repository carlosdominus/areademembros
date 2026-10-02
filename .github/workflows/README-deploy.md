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

Vale criar uma conta de FTP separada no cPanel (**Files → FTP Accounts**) com
acesso só à pasta do app, em vez de usar a conta principal do cPanel.

### 2. Variável

Na mesma tela, aba **Variables → New repository variable**:

| Nome          | Valor                                                         |
|---------------|---------------------------------------------------------------|
| `DEPLOY_PATH` | Caminho da raiz do app no servidor, visto pelo usuário de FTP |

É a pasta que **contém** o `dist` — a mesma que aparece em *Application Root*
no **Setup Node.js App** do cPanel. Exemplos: `/membros`, `/areademembros`,
`/public_html/membros`. Sem barra no final.

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
