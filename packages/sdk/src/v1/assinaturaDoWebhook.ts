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
  /** Quanto o timestamp pode estar longe do seu relógio, maior que zero. Padrão: 300 segundos (5 minutos). */
  toleranciaEmSegundos?: number
  /** O seu relógio, em milissegundos desde 1970. Padrão: `Date.now()`. */
  agora?: () => number
}

export type VerificacaoDoWebhook = Resultado<EventoDoWebhook, FalhaNaVerificacaoDoWebhook | FalhaDeConfiguracao>

/** O instante de agora e quanto o timestamp pode se afastar dele, os dois em segundos. */
interface JanelaDeTempo {
  readonly agora: number
  readonly tolerancia: number
}

interface CabecalhosDaAssinatura {
  readonly assinatura: string
  readonly timestamp: string
}

const CABECALHO_DA_ASSINATURA = 'x-lero-signature'
const CABECALHO_DO_TIMESTAMP = 'x-lero-timestamp'
const PREFIXO_DA_ASSINATURA = 'sha256='
const TOLERANCIA_PADRAO_EM_SEGUNDOS = 300

/**
 * Confere que a entrega veio do LeroLero e devolve o evento tipado. A assinatura (`X-Lero-Signature`) é
 * `sha256=` + HMAC-SHA256 em hexadecimal de `{timestamp}.{corpo}` com o segredo do endpoint; o `X-Lero-Timestamp`
 * (segundos Unix) fora da tolerância é recusado, para uma entrega capturada não ser reaproveitada depois. Dentro da
 * janela, a mesma entrega pode chegar de novo: deduplique pelo `entregaId` do evento.
 *
 * @example
 * const verificacao = verificarWebhook({ corpo, cabecalhos: req.headers, segredo: process.env.LERO_WEBHOOK_SECRET })
 * if (!verificacao.sucesso) return res.status(400).end()
 */
export function verificarWebhook(entrega: EntregaDoWebhook): VerificacaoDoWebhook {
  if (!entrega.segredo) return falhaDeConfiguracao('Falta o segredo do endpoint: passe segredoDoWebhook ou o segredo.')
  const janela = janelaDeTempo(entrega)
  if (!janela) return falhaDeConfiguracao('A tolerância e o relógio precisam ser números finitos maiores que zero.')
  const corpo = comoBytes(entrega.corpo)
  if (!corpo) return recusa('corpo_invalido', 'O corpo precisa ser o texto cru ou os bytes, antes do JSON.parse.')
  const cabecalhos = cabecalhosDaAssinatura(entrega.cabecalhos)
  if (!cabecalhos) return recusa('sem_cabecalhos', 'Faltam os cabeçalhos X-Lero-Signature e X-Lero-Timestamp.')
  if (!/^\d+$/.test(cabecalhos.timestamp)) {
    return recusa('timestamp_invalido', 'O X-Lero-Timestamp não é um número de segundos.')
  }
  if (Math.abs(janela.agora - Number(cabecalhos.timestamp)) > janela.tolerancia) {
    return recusa(
      'timestamp_fora_da_tolerancia',
      `O X-Lero-Timestamp está a mais de ${janela.tolerancia} s do seu relógio.`,
    )
  }
  if (!assinaturaConfere(cabecalhos.assinatura, assinar(entrega.segredo, cabecalhos.timestamp, corpo))) {
    return recusa('assinatura_invalida', 'A assinatura não confere com o segredo do endpoint.')
  }
  return lerEvento(corpo)
}

/** `sha256=` + HMAC-SHA256 em hexadecimal minúsculo de `{timestamp}.{corpo}`, como o LeroLero assina. */
export function assinar(segredo: string, timestamp: string, corpo: Uint8Array): string {
  const hmac = createHmac('sha256', segredo).update(`${timestamp}.`).update(corpo)
  return PREFIXO_DA_ASSINATURA + hmac.digest('hex')
}

// NaN ou Infinity desligariam a janela sem aviso, e um valor negativo recusaria tudo: os dois viram configuração.
function janelaDeTempo(entrega: EntregaDoWebhook): JanelaDeTempo | null {
  const tolerancia = entrega.toleranciaEmSegundos ?? TOLERANCIA_PADRAO_EM_SEGUNDOS
  const agoraEmMilissegundos = lerRelogio(entrega.agora ?? Date.now)
  if (!positivoFinito(tolerancia) || agoraEmMilissegundos === null || !positivoFinito(agoraEmMilissegundos)) return null
  return { agora: agoraEmMilissegundos / 1000, tolerancia }
}

function lerRelogio(agora: () => number): number | null {
  try {
    return agora()
  } catch {
    return null
  }
}

function positivoFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
}

/** O backend sempre assina em hexadecimal minúsculo: a comparação é exata, em tempo constante. */
function assinaturaConfere(recebida: string, esperada: string): boolean {
  const a = Buffer.from(recebida)
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

function cabecalhosDaAssinatura(cabecalhos: unknown): CabecalhosDaAssinatura | null {
  const assinatura = lerCabecalho(cabecalhos, CABECALHO_DA_ASSINATURA)
  const timestamp = lerCabecalho(cabecalhos, CABECALHO_DO_TIMESTAMP)
  return assinatura && timestamp ? { assinatura, timestamp } : null
}

function lerCabecalho(cabecalhos: unknown, nome: string): string | null {
  if (cabecalhos instanceof Headers) return cabecalhos.get(nome)
  if (typeof cabecalhos !== 'object' || cabecalhos === null) return null
  const encontrado: unknown = Object.entries(cabecalhos).find(([chave]) => chave.toLowerCase() === nome)?.[1]
  const valor: unknown = Array.isArray(encontrado) ? encontrado[0] : encontrado
  return typeof valor === 'string' ? valor : null
}

// Em JavaScript, ou com express.raw de outro Content-Type (req.body = {}), o corpo pode chegar de outro tipo.
function comoBytes(corpo: unknown): Uint8Array | null {
  if (typeof corpo === 'string') return Buffer.from(corpo, 'utf8')
  return corpo instanceof Uint8Array ? corpo : null
}

function recusa(motivo: MotivoDaRecusaDoWebhook, description: string): VerificacaoDoWebhook {
  return { sucesso: false, dados: null, erro: { categoria: 'webhook', motivo, description } }
}

function falhaDeConfiguracao(description: string): VerificacaoDoWebhook {
  return { sucesso: false, dados: null, erro: { categoria: 'configuracao', description } }
}
