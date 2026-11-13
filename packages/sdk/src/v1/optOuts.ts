import { type ClienteRest, rota } from '@lerolero/rest'
import type { NovoOptOut, OpcoesDaRemocaoDoOptOut, OptOut, RespostaDaApi, Telefone } from '@lerolero/types/v1'

export interface OptOuts {
  /**
   * Registra a saída do telefone num cliente e entrega o evento `contact.opted_out`. Repetir devolve a saída que já vale.
   *
   * @example
   * await lero.optOuts.adicionar({ telefone: '+5511984213307', motivo: 'Pediu por e-mail' })
   */
  adicionar(optOut: NovoOptOut): Promise<RespostaDaApi<OptOut>>

  /**
   * Tira o telefone da lista de saída (opt-in manual) e entrega o evento `contact.opted_in`. Só para saída registrada
   * pela API ou pelo painel: a pedida pelo contato no WhatsApp devolve conflito, porque só ele pode voltar.
   */
  remover(telefone: Telefone, opcoes?: OpcoesDaRemocaoDoOptOut): Promise<RespostaDaApi<boolean>>
}

export function criarOptOuts(rest: ClienteRest): OptOuts {
  return {
    adicionar: (optOut) => rest.post('/opt-outs', optOut),
    remover: (telefone, opcoes = {}) =>
      rest.delete(rota`/opt-outs/${telefone}`, { consulta: { cliente: opcoes.cliente } }),
  }
}
