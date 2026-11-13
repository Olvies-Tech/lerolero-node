import type { DataHora, ErroDoItem, Metadata, Telefone } from './comum.js'
import type { IdDaMensagem, StatusDaMensagem } from './mensagens.js'
import type { CategoriaDoTemplate, IdDoTemplate, QualidadeDoTemplate, StatusDoTemplate } from './templates.js'

/** Id de uma entrega de webhook (`evt_...`): o mesmo em todas as tentativas, para ignorar repetidos. */
export type IdDaEntrega = `evt_${string}`

/** O que todo evento traz: o nome, o id da entrega e o cliente (id externo, ou o `cli_...` sem id externo). */
interface EventoBase<Nome extends string> {
  evento: Nome
  entregaId: IdDaEntrega
  cliente: string | null
}

interface ContatoDoEvento {
  telefone: Telefone
  nome?: string | null
}

interface NumeroDoEvento {
  telefone: Telefone
}

/** A mensagem foi enviada, entregue, lida ou falhou. */
export interface MensagemStatusAtualizado extends EventoBase<'message.status_updated'> {
  mensagem: {
    id: IdDaMensagem
    status: StatusDaMensagem
    em: DataHora
    erro: ErroDoItem | null
    metadata: Metadata | null
  }
}

/** O contato tocou num botão de resposta de um template. */
export interface RespostaDeBotaoRecebida extends EventoBase<'message.button_reply'> {
  contato: ContatoDoEvento
  resposta: {
    payload: string | null
    texto: string | null
    /** Verdadeiro quando o contato escreveu em vez de tocar e o LeroLero entendeu qual botão era. */
    interpretado: boolean
    recebidaEm: DataHora
    optOut: boolean
  }
  mensagemOriginal: {
    id: IdDaMensagem
    template: string | null
    enviadaEm: DataHora | null
    metadata: Metadata | null
  }
}

/** O contato escreveu para o número. */
export interface MensagemRecebida extends EventoBase<'message.received'> {
  contato: ContatoDoEvento
  mensagem: {
    id: IdDaMensagem
    tipo: string
    texto: string | null
    midiaId: string | null
    recebidaEm: DataHora
    optOut: boolean
    optIn: boolean
  }
}

/** Alguém respondeu pelo app do WhatsApp Business no número em coexistência. */
export interface MensagemEnviadaPeloApp extends EventoBase<'message.sent_from_app'> {
  contato: ContatoDoEvento
  mensagem: {
    id: IdDaMensagem
    tipo: string
    texto: string | null
    enviadaEm: DataHora
  }
}

/** Muitas falhas de envio em pouco tempo num número. */
export interface PicoDeFalhas extends EventoBase<'message.failure_spike'> {
  numero: NumeroDoEvento
  falhas: number
  enviadas: number
  periodo: { de: DataHora; ate: DataHora }
  codigoMaisComum: string | null
}

/** O template mudou de status, de categoria ou de qualidade. */
export interface TemplateAtualizado extends EventoBase<'template.updated'> {
  template: { id: IdDoTemplate; nome: string; idioma: string }
  motivo: string
  statusAnterior: StatusDoTemplate | null
  status: StatusDoTemplate
  categoriaAnterior: CategoriaDoTemplate | null
  categoria: CategoriaDoTemplate
  qualidade: QualidadeDoTemplate | null
  motivoDaMeta: string | null
}

/** A qualidade do número mudou na Meta, com o limite diário de conversas. */
export interface QualidadeDoNumeroAtualizada extends EventoBase<'number.quality_updated'> {
  numero: NumeroDoEvento
  qualidade: string
  limiteDiario: number | null
}

/** O número foi conectado, desconectado ou teve a coexistência alterada. */
export interface StatusDoNumeroAtualizado extends EventoBase<'number.status'> {
  numero: NumeroDoEvento
  status: string
  coexistencia: string | null
  motivo: string | null
}

/** A Meta decidiu sobre o nome de exibição do número. */
export interface NomeDoNumeroAtualizado extends EventoBase<'number.name_status'> {
  numero: NumeroDoEvento
  nome: string
  status: string
  motivo: string | null
}

/** A Meta recusou a cobrança de um envio do cliente. */
export interface ProblemaDePagamento extends EventoBase<'account.payment_issue'> {
  codigo: string
  mensagemId: IdDaMensagem | null
  em: DataHora
}

/** O contato saiu da lista do cliente. */
export interface ContatoSaiu extends EventoBase<'contact.opted_out'> {
  contato: ContatoDoEvento
  origem: string
  motivo: string | null
  em: DataHora
  mensagemId: IdDaMensagem | null
}

/** O contato voltou a receber do cliente. */
export interface ContatoVoltou extends EventoBase<'contact.opted_in'> {
  contato: ContatoDoEvento
  origem: string
  em: DataHora
}

/** O uso chegou ao aviso do limite de mensagens (ex.: 80%). */
export interface AvisoDeLimite extends EventoBase<'limit.warning'> {
  alvo: string
  percentual: number
  consumido: number
  limite: number
}

/** O limite de mensagens acabou: novos envios devolvem erro até subir o limite. */
export interface LimiteAtingido extends EventoBase<'limit.reached'> {
  alvo: string
  consumido: number
  limite: number
}

/**
 * Todo evento que o LeroLero entrega aos webhooks. Use o campo `evento` no `switch` e o TypeScript estreita o tipo.
 *
 * @example
 * switch (evento.evento) {
 *   case 'message.status_updated':
 *     console.log(evento.mensagem.status)
 *     break
 *   case 'message.button_reply':
 *     console.log(evento.resposta.payload)
 *     break
 * }
 */
export type EventoDoWebhook =
  | MensagemStatusAtualizado
  | RespostaDeBotaoRecebida
  | MensagemRecebida
  | MensagemEnviadaPeloApp
  | PicoDeFalhas
  | TemplateAtualizado
  | QualidadeDoNumeroAtualizada
  | StatusDoNumeroAtualizado
  | NomeDoNumeroAtualizado
  | ProblemaDePagamento
  | ContatoSaiu
  | ContatoVoltou
  | AvisoDeLimite
  | LimiteAtingido

/** Os nomes do catálogo de eventos, no padrão `recurso.acontecimento`. */
export type NomeDoEvento = EventoDoWebhook['evento']
