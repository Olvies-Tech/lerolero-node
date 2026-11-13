import { type ClienteRest, rota } from '@lerolero/rest'
import type { Envio, IdDaMensagem, Mensagem, MensagemEnfileirada, RespostaDaApi } from '@lerolero/types/v1'

export interface OpcoesDoEnvio {
  /**
   * A `Idempotency-Key` do envio (até 255 caracteres), de preferência ligada ao seu evento (ex.: `agendamento-123-lembrete`).
   * Sem ela o SDK gera uma; ela vem em `detalhes.chaveDeIdempotencia` para você repetir o envio sem duplicar.
   */
  chaveDeIdempotencia?: string
}

export interface Mensagens {
  /**
   * Envia um template aprovado ou uma mensagem livre (com a janela de 24 horas aberta). Responde com o id `msg_...` e o
   * status `queued`; o envio segue pela fila. Repetir com a mesma `chaveDeIdempotencia` devolve a mesma mensagem.
   *
   * @example
   * const resultado = await lero.mensagens.enviar({
   *   to: '+5511993185520',
   *   template: 'confirmacao_agendamento',
   *   variaveis: { nome: 'Ana', data: '24/10', hora: '14h' },
   * })
   */
  enviar(envio: Envio, opcoes?: OpcoesDoEnvio): Promise<RespostaDaApi<MensagemEnfileirada>>

  /** A mensagem com o status atual, a linha do tempo, o erro, a resposta de botão e o custo. */
  obter(id: IdDaMensagem): Promise<RespostaDaApi<Mensagem>>

  /**
   * Cancela a mensagem que ainda está na fila, inclusive a agendada: ela não sai e não gera custo. Depois que saiu da
   * fila a API devolve `EXM-0011`. Cancelar de novo devolve a mesma mensagem.
   */
  cancelar(id: IdDaMensagem): Promise<RespostaDaApi<Mensagem>>
}

export function criarMensagens(rest: ClienteRest): Mensagens {
  return {
    enviar: (envio, opcoes = {}) =>
      rest.post('/messages', envio, { idempotencia: chaveInformada(opcoes.chaveDeIdempotencia) }),
    obter: (id) => rest.get(rota`/messages/${id}`),
    cancelar: (id) => rest.delete(rota`/messages/${id}`),
  }
}

function chaveInformada(chave: string | undefined): { chave?: string } {
  return chave === undefined ? {} : { chave }
}
