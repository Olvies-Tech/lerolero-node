<p>
  <a href="https://lerolero.tech">
    <img alt="LeroLero" src="https://raw.githubusercontent.com/Olvies-Tech/lerolero-node/main/assets/simbolo.svg" width="44" height="44">
  </a>
</p>

# @lerolero/sdk

O SDK oficial do [LeroLero](https://lerolero.tech), a API oficial do WhatsApp para quem desenvolve. Envia templates e
mensagens, sobe mídias, cuida de clientes e opt-outs e verifica os webhooks, com tipos em tudo e sem lançar exceção.

```bash
npm install @lerolero/sdk
```

```ts
import { LeroLero } from '@lerolero/sdk'

const lero = LeroLero({ chave: process.env.LERO_API_KEY })
const envio = await lero.mensagens.enviar({ to: '+5511993185520', template: 'pedido_saiu' })
```

Com `require` (CommonJS) também funciona:

```js
const { LeroLero } = require('@lerolero/sdk')
```

Exemplos, webhooks em Express e Next.js, erros, retentativa e tudo o que a v1 cobre estão no
[README do repositório](https://github.com/Olvies-Tech/lerolero-node#readme) e na
[documentação](https://lerolero.tech/docs).

Apache-2.0, [OliveS Tech](https://github.com/Olvies-Tech).
