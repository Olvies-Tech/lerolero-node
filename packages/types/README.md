<p>
  <a href="https://lerolero.tech">
    <img alt="LeroLero" src="https://raw.githubusercontent.com/Olvies-Tech/lerolero-node/main/assets/simbolo.svg" width="44" height="44">
  </a>
</p>

# @lerolero/types

Os tipos da API do [LeroLero](https://lerolero.tech), por versão: mensagens, templates, mídias, clientes, opt-outs,
webhooks, os eventos que chegam no seu endpoint e o catálogo dos códigos de erro, com o significado e o que fazer em
cada um. O [`@lerolero/sdk`](https://www.npmjs.com/package/@lerolero/sdk) já traz tudo isto; instale só os tipos quando
não for usar o SDK.

```bash
npm install @lerolero/types
```

```ts
import { CATALOGO_DE_ERROS, type EventoDoWebhook } from '@lerolero/types/v1'

export function aoReceber(evento: EventoDoWebhook): string | null {
  if (evento.evento !== 'message.status_updated') return null
  const erro = evento.mensagem.erro?.code
  return erro === 'EXMT-0004' ? CATALOGO_DE_ERROS[erro].comoResolver : evento.mensagem.status
}
```

Mais no [README do repositório](https://github.com/Olvies-Tech/lerolero-node#readme).

Apache-2.0, [OliveS Tech](https://github.com/Olvies-Tech).
