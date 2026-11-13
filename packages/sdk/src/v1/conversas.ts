import type { ClienteRest } from '@lerolero/rest'
import type { ConsultaDaJanela, Janelas, RespostaDaApi } from '@lerolero/types/v1'

export interface Conversas {
  /**
   * Diz se a janela de 24 horas está aberta para cada telefone (até 200 por vez), para decidir entre mensagem livre e
   * template antes de enviar. A janela conta da última mensagem do contato e é por número.
   *
   * @example
   * const { dados } = await lero.conversas.janela({ telefones: ['+5511993185520'] })
   * const aberta = dados?.telefones[0]?.aberta ?? false
   */
  janela(consulta: ConsultaDaJanela): Promise<RespostaDaApi<Janelas>>
}

export function criarConversas(rest: ClienteRest): Conversas {
  return {
    janela: (consulta) => rest.post('/conversas/janela', consulta),
  }
}
