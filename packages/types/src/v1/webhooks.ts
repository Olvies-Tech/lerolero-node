import type { ClienteResumido, CodigoDoAmbiente, DataHora, ReferenciaDoCliente } from './comum.js'
import type { NomeDoEvento } from './eventos.js'

/** Id público de um endpoint de webhook (`whk_...`). */
export type IdDoWebhook = `whk_${string}`

/** Um endpoint novo. A URL precisa ser https e pública (sem localhost nem IP de rede interna). */
export interface NovoWebhook {
  url: string
  descricao?: string
  /** Vazio: todos os clientes. A chave de um cliente só cadastra endpoint desse cliente. */
  clientes?: readonly ReferenciaDoCliente[]
  incluirClientesNovos?: boolean
  /** Vazio: todos os eventos, inclusive os que entrarem depois. */
  eventos?: readonly NomeDoEvento[]
  ambiente?: CodigoDoAmbiente
}

export interface Webhook {
  id: IdDoWebhook
  url: string
  descricao: string | null
  ambiente: CodigoDoAmbiente
  todosOsClientes: boolean
  incluirClientesNovos: boolean
  clientes: ClienteResumido[]
  todosOsEventos: boolean
  eventos: NomeDoEvento[]
  ativo: boolean
  /** Mascarado na listagem; inteiro só na criação. */
  segredo: string
  criadoEm: DataHora
  clientesAlcancados: number
  ultimaEntregaEm: DataHora | null
  /** Percentual de entregas com sucesso nas últimas 24 horas. */
  sucesso24h: number | null
}

/** O endpoint criado e o segredo da assinatura, que a API mostra uma única vez: guarde no seu cofre. */
export interface WebhookCriado {
  endpoint: Webhook
  segredo: string
}
