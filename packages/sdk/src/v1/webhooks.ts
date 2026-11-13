import { type ClienteRest, rota } from '@lerolero/rest'
import type { IdDoWebhook, NovoWebhook, RespostaDaApi, Webhook, WebhookCriado } from '@lerolero/types/v1'
import { type CabecalhosRecebidos, type VerificacaoDoWebhook, verificarWebhook } from './assinaturaDoWebhook.js'

export interface Webhooks {
  /**
   * Cadastra um endpoint (URL https pública) e devolve o segredo da assinatura, que a API mostra uma única vez.
   *
   * @example
   * const criado = await lero.webhooks.criar({ url: 'https://api.seusistema.com.br/webhooks/lero', eventos: ['message.status_updated'] })
   */
  criar(webhook: NovoWebhook): Promise<RespostaDaApi<WebhookCriado>>

  /** Os endpoints do ambiente da chave, os mais novos primeiro, com o segredo mascarado. */
  listar(): Promise<RespostaDaApi<Webhook[]>>

  /** Apaga o endpoint; ele para de receber na hora. */
  remover(id: IdDoWebhook): Promise<RespostaDaApi<boolean>>

  /**
   * Confere a assinatura de uma entrega e devolve o evento tipado. Passe o corpo cru, antes do `JSON.parse`. O segredo
   * vem de `segredoDoWebhook`, nas opções do `LeroLero`, ou do terceiro parâmetro.
   *
   * @example
   * const verificacao = lero.webhooks.verificar(corpoCru, req.headers)
   * if (!verificacao.sucesso) return res.status(400).end()
   * if (verificacao.dados.evento === 'message.button_reply') confirmar(verificacao.dados.resposta.payload)
   */
  verificar(corpo: string | Uint8Array, cabecalhos: CabecalhosRecebidos, segredo?: string): VerificacaoDoWebhook
}

export interface DependenciasDosWebhooks {
  readonly rest: ClienteRest
  readonly segredoPadrao: string | undefined
  readonly agora: () => number
}

export function criarWebhooks({ rest, segredoPadrao, agora }: DependenciasDosWebhooks): Webhooks {
  return {
    criar: (webhook) => rest.post('/webhooks', webhook),
    listar: () => rest.get('/webhooks'),
    remover: (id) => rest.delete(rota`/webhooks/${id}`),
    verificar: (corpo, cabecalhos, segredo) =>
      verificarWebhook({ corpo, cabecalhos, segredo: segredo ?? segredoPadrao ?? '', agora }),
  }
}
