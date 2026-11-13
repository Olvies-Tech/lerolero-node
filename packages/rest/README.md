<p>
  <a href="https://lerolero.tech">
    <img alt="LeroLero" src="https://raw.githubusercontent.com/Olvies-Tech/lerolero-node/main/assets/simbolo.svg" width="44" height="44">
  </a>
</p>

# @lerolero/rest

O cliente HTTP da API do [LeroLero](https://lerolero.tech), para chamar qualquer rota: chave no cabeçalho, tempo limite,
retentativa com espera crescente (respeitando o `Retry-After`), `Idempotency-Key` e resultado sem exceção. É o que o
[`@lerolero/sdk`](https://www.npmjs.com/package/@lerolero/sdk) usa por baixo; para integrar, prefira o SDK.

```bash
npm install @lerolero/rest
```

```ts
import { criarClienteRest } from '@lerolero/rest'

const rest = criarClienteRest({ chave: process.env.LERO_API_KEY })
const contatos = await rest.get<{ total: number }>('/contatos', { consulta: { limite: 20 } })

if (contatos.sucesso) console.log(contatos.dados.total)
else console.error(contatos.erro.categoria, contatos.erro.description)
```

Mais no [README do repositório](https://github.com/Olvies-Tech/lerolero-node#readme).

Apache-2.0, [OliveS Tech](https://github.com/Olvies-Tech).
