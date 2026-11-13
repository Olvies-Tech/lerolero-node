# Publicar no npm

A publicação dos três pacotes (`@lerolero/types`, `@lerolero/rest` e `@lerolero/sdk`) sai do workflow
[`publicar.yml`](../.github/workflows/publicar.yml) quando alguém empurra uma tag `v*`. Ela só roda depois que as quatro
etapas abaixo estiverem feitas, nesta ordem.

## Como o workflow protege a publicação

- **Só o que está na `main`.** O primeiro job falha se o commit da tag não for ancestral de `origin/main`. Assim, uma
  tag num commit que não passou por revisão não publica.
- **A tag é a versão.** A tag `v1.2.3` só publica se os três `package.json` estiverem em `1.2.3`.
- **Credencial só no fim.** O job `empacotar` instala, roda lint, tipos, testes, build e o consumo, e gera os tarballs
  sem nenhuma credencial. O job `publicar` só baixa os tarballs prontos e roda `npm publish --ignore-scripts`: nada é
  instalado nem executado ali, e é o único job com `id-token: write`.
- **Aprovação de uma pessoa.** O job `publicar` usa o environment `npm`, que pede a aprovação de um revisor antes de
  rodar.
- **Proveniência.** Cada pacote sai com `--provenance`, ligando a versão no npm a este repositório e a este commit.

## 1. Organização no npm e trusted publishing

1. Crie a organização `lerolero` em [npmjs.com](https://www.npmjs.com) e ative a verificação em duas etapas da conta.
2. Para cada um dos três pacotes, em **Settings > Trusted publishing**, adicione o publicador do GitHub Actions:
   - organização ou usuário: `Olvies-Tech`;
   - repositório: `lerolero-node`;
   - workflow: `publicar.yml`;
   - environment: `npm`.
3. Com o trusted publishing, o npm aceita a publicação pelo token OIDC do GitHub, de vida curta, e não é preciso
   guardar token nenhum. Em **Settings > Publishing access**, marque "Require two-factor authentication and disallow
   tokens".

No npm, o trusted publishing só vale para um pacote que já existe. Para a primeira versão, há duas saídas:

- publicar a `1.0.0` uma vez pela linha de comando, com a conta e a verificação em duas etapas;
- ou criar um token **granular**, só de publish, só para os três pacotes e com validade curta. Guarde esse token como
  secret `NPM_TOKEN` **do environment `npm`** (não do repositório) e apague o token depois de ligar o trusted
  publishing.

## 2. Environment `npm` com revisores

Em **Settings > Environments > New environment**, crie o environment `npm`:

- **Required reviewers:** quem pode autorizar uma publicação (o Akio e mais uma pessoa de release, se houver);
- marque **Prevent self-review**, para quem empurrou a tag não aprovar sozinho;
- em **Deployment branches and tags**, escolha **Selected branches and tags** e adicione a regra de tag `v*`;
- secret `NPM_TOKEN` só se for usar o token da primeira versão (veja o passo 1).

Crie o environment antes de ligar a publicação: se ele não existir, o GitHub cria um sem revisor na primeira execução.

## 3. Ruleset das tags e da `main`

Em **Settings > Rules > Rulesets > New tag ruleset**:

- **Target:** `refs/tags/v*`;
- **Bypass list:** só os mantenedores de release;
- **Rules:** restrinja a criação, a atualização e a exclusão.

Confira também o ruleset da `main`: pull request com pelo menos uma revisão, sem push direto.

## 4. Ligar a publicação

Em **Settings > Secrets and variables > Actions > Variables**, crie a variável de repositório `PUBLICAR_NO_NPM` com o
valor `sim`. Sem ela, o workflow não roda nenhum job.

## Publicar uma versão

1. Num pull request, suba a versão dos três `package.json` e de `packages/rest/src/versao.ts`, que vai no `User-Agent`
   (o teste confere se os dois batem).
2. Depois do merge, crie a tag no commit da `main`: `git tag v1.0.1 && git push origin v1.0.1`.
3. Aprove a execução no environment `npm`, na aba Actions.
