import { type ClienteRest, type OpcoesDoClienteRest, criarClienteRest, variavelDeAmbiente } from '@lerolero/rest'
import type { Ambiente } from '@lerolero/types/v1'
import { type Clientes, criarClientes } from './clientes.js'
import { type Conversas, criarConversas } from './conversas.js'
import { type Mensagens, criarMensagens } from './mensagens.js'
import { type Midias, criarMidias } from './midias.js'
import { type OptOuts, criarOptOuts } from './optOuts.js'
import { type Templates, criarTemplates } from './templates.js'
import { type Webhooks, criarWebhooks } from './webhooks.js'

export interface OpcoesDoLeroLero extends Omit<OpcoesDoClienteRest, 'versao'> {
  /** O segredo dos seus endpoints de webhook, para `webhooks.verificar`. Sem ele, lê `LERO_WEBHOOK_SECRET`. */
  segredoDoWebhook?: string | undefined
}

/** O cliente do LeroLero: um módulo por recurso da API e o `rest` para qualquer outra rota. */
export interface LeroLero {
  /** `teste` com chave `lero_test_` (Simulador, nada sai de verdade), `producao` com `lero_live_`. */
  readonly ambiente: Ambiente | null
  readonly mensagens: Mensagens
  readonly midias: Midias
  readonly templates: Templates
  readonly conversas: Conversas
  readonly optOuts: OptOuts
  readonly clientes: Clientes
  readonly webhooks: Webhooks
  /** Chama qualquer rota da `/v1`, inclusive as que os módulos ainda não cobrem. */
  readonly rest: ClienteRest
}

/**
 * Cria o cliente. Teste ou produção pela própria chave, sem configuração. Nenhum método lança exceção.
 *
 * @example
 * import { LeroLero } from '@lerolero/sdk'
 *
 * const lero = LeroLero({ chave: process.env.LERO_API_KEY })
 * const envio = await lero.mensagens.enviar({ to: '+5511993185520', template: 'boas_vindas' })
 */
export function LeroLero(opcoes: OpcoesDoLeroLero = {}): LeroLero {
  const { segredoDoWebhook, ...opcoesDoRest } = opcoes
  const rest = criarClienteRest({ ...opcoesDoRest, versao: 1 })
  return Object.freeze({
    ambiente: rest.ambiente,
    mensagens: criarMensagens(rest),
    midias: criarMidias(rest),
    templates: criarTemplates(rest),
    conversas: criarConversas(rest),
    optOuts: criarOptOuts(rest),
    clientes: criarClientes(rest),
    webhooks: criarWebhooks({
      rest,
      segredoPadrao: segredoDoWebhook ?? variavelDeAmbiente('LERO_WEBHOOK_SECRET'),
      agora: opcoes.efeitos?.agora ?? Date.now,
    }),
    rest,
  })
}
