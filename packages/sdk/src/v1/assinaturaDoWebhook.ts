import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  EventoDoWebhook,
  FalhaDeConfiguracao,
  FalhaNaVerificacaoDoWebhook,
  MotivoDaRecusaDoWebhook,
  Resultado,
} from '@lerolero/types/v1'

/** Os cabeçalhos da requisição recebida: `Headers` (fetch, Next.js) ou o objeto do Node e do Express. */
export type CabecalhosRecebidos = Headers | Readonly<Record<string, string | readonly string[] | undefined>>

/** O que chegou no seu endpoint, exatamente como chegou. */
export interface EntregaDoWebhook {
  /** O corpo cru, antes de qualquer `JSON.parse`: a assinatura é do texto exato. */
  corpo: string | Uint8Array
  cabecalhos: CabecalhosRecebidos
  /** O segredo do endpoint, devolvido uma única vez em `webhooks.criar`. */
  segredo: string
  /** Quanto o timestamp pode estar longe do seu relógio. Padrão: 300 segundos (5 minutos). */
  toleranciaEmSegundos?: number
  /** O seu relógio, em milissegundos desde 1970. Padrão: `Date.now()`. */
  agora?: () => number
}

export type VerificacaoDoWebhook = Resultado<EventoDoWebhook, FalhaNaVerificacaoDoWebhook | FalhaDeConfiguracao>

const CABECALHO_DA_ASSINATURA = 'x-lero-signature'
const CABECALHO_DO_TIMESTAMP = 'x-lero-timestamp'
const PREFIXO_DA_ASSINATURA = 'sha256='
const TOLERANCIA_PADRAO_EM_SEGUNDOS = 300

/**
 * Confere que a entrega veio do LeroLero e devolve o evento tipado. A assinatura (`X-Lero-Signature`) é
 * `sha256=` + HMAC-SHA256 em hexadecimal de `{timestamp}.{corpo}` com o segredo do endpoint; o `X-Lero-Timestamp` (segundos
 * Unix) mais velho que a tolerância é recusado, para uma entrega capturada não ser reaproveitada.
 *
 * @example
 * const verificacao = verificarWebhook({ corpo, cabecalhos: req.headers, segredo: process.env.LERO_WEBHOOK_SECRET })
 * if (!verificacao.sucesso) return res.status(400).end()
 */
export function verificarWebhook(entrega: EntregaDoWebhook): VerificacaoDoWebhook {
  if (!entrega.segredo) return falhaDeConfiguracao()
  const assinatura = lerCabecalho(entrega.cabecalhos, CABECALHO_DA_ASSINATURA)
  const timestamp = lerCabecalho(entrega.cabecalhos, CABECALHO_DO_TIMESTAMP)
  if (!assinatura || !timestamp)
    return recusa('sem_cabecalhos', 'Faltam os cabeçalhos X-Lero-Signature e X-Lero-Timestamp.')
  if (!/^\d+$/.test(timestamp)) return recusa('timestamp_invalido', 'O X-Lero-Timestamp não é um número de segundos.')

  const agora = entrega.agora?.() ?? Date.now()
  const tolerancia = entrega.toleranciaEmSegundos ?? TOLERANCIA_PADRAO_EM_SEGUNDOS
  if (Math.abs(agora / 1000 - Number(timestamp)) > tolerancia) {
    return recusa('timestamp_fora_da_tolerancia', `O X-Lero-Timestamp está a mais de ${tolerancia} s do seu relógio.`)
  }
  const corpo = comoBytes(entrega.corpo)
  if (!assinaturaConfere(assinatura, assinar(entrega.segredo, timestamp, corpo))) {
    return recusa('assinatura_invalida', 'A assinatura não confere com o segredo do endpoint.')
  }
  return lerEvento(corpo)
}

/** `sha256=` + HMAC-SHA256 em hexadecimal minúsculo de `{timestamp}.{corpo}`, como o LeroLero assina. */
export function assinar(segredo: string, timestamp: string, corpo: Uint8Array): string {
  const hmac = createHmac('sha256', segredo).update(`${timestamp}.`).update(corpo)
  return PREFIXO_DA_ASSINATURA + hmac.digest('hex')
}

/** Comparação em tempo constante: o tempo da resposta não revela quantos caracteres batem. */
function assinaturaConfere(recebida: string, esperada: string): boolean {
  const a = Buffer.from(recebida.trim().toLowerCase())
  const b = Buffer.from(esperada)
  return a.length === b.length && timingSafeEqual(a, b)
}

function lerEvento(corpo: Uint8Array): VerificacaoDoWebhook {
  const evento = lerJson(Buffer.from(corpo).toString('utf8'))
  if (!ehEvento(evento)) return recusa('corpo_invalido', 'O corpo assinado não é um evento do LeroLero.')
  return { sucesso: true, dados: evento, erro: null }
}

// O corpo é do LeroLero (a assinatura confere); o campo `evento` decide o tipo, como na união EventoDoWebhook.
function ehEvento(valor: unknown): valor is EventoDoWebhook {
  return typeof valor === 'object' && valor !== null && 'evento' in valor && typeof valor.evento === 'string'
}

function lerJson(texto: string): unknown {
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

function lerCabecalho(cabecalhos: CabecalhosRecebidos, nome: string): string | null {
  if (cabecalhos instanceof Headers) return cabecalhos.get(nome)
  const encontrado = Object.entries(cabecalhos).find(([chave]) => chave.toLowerCase() === nome)?.[1]
  return (typeof encontrado === 'string' ? encontrado : encontrado?.[0]) ?? null
}

function comoBytes(corpo: string | Uint8Array): Uint8Array {
  return typeof corpo === 'string' ? Buffer.from(corpo, 'utf8') : corpo
}

function recusa(motivo: MotivoDaRecusaDoWebhook, description: string): VerificacaoDoWebhook {
  return { sucesso: false, dados: null, erro: { categoria: 'webhook', motivo, description } }
}

function falhaDeConfiguracao(): VerificacaoDoWebhook {
  const description = 'Falta o segredo do endpoint: passe segredoDoWebhook no LeroLero ou o segredo na verificação.'
  return { sucesso: false, dados: null, erro: { categoria: 'configuracao', description } }
}
