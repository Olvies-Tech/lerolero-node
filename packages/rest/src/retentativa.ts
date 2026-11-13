/** Por que a tentativa não deu certo, do ponto de vista de repetir ou não. */
export type MotivoDaRetentativa = 'status' | 'rede' | 'timeout'

/** O que o `aoTentarDeNovo` recebe antes de cada nova tentativa. */
export interface ContextoDaRetentativa {
  readonly metodo: string
  readonly caminho: string
  /** 1 na primeira repetição, 2 na segunda, e assim por diante. */
  readonly repeticao: number
  readonly motivo: MotivoDaRetentativa
  /** Status da tentativa que falhou; `null` em erro de rede ou tempo esgotado. */
  readonly status: number | null
  readonly esperaMs: number
}

/** O que o `aoBaterLimite` recebe quando a API responde 429. */
export interface ContextoDoLimite {
  readonly metodo: string
  readonly caminho: string
  /** Quanto a API pediu para esperar (`Retry-After`), quando pediu. */
  readonly retryAfterMs: number | null
}

export interface OpcoesDeRetentativa {
  /** Quantas vezes repetir depois da primeira tentativa. `0` desliga. Padrão: 3. */
  maximo?: number
  /** A espera antes de cada repetição. Padrão: exponencial a partir de 500 ms, com variação aleatória e teto. */
  espera?: (repeticao: number) => number
  /** Teto da espera. Um `Retry-After` maior que isto encerra as tentativas e devolve o erro. Padrão: 30 segundos. */
  esperaMaximaMs?: number
  /** Chamado antes de cada repetição (log, métrica). Um erro lançado aqui é ignorado. */
  aoTentarDeNovo?: (contexto: ContextoDaRetentativa) => void | Promise<void>
}

export const RETENTATIVA_PADRAO = { maximo: 3, esperaInicialMs: 500, esperaMaximaMs: 30_000 } as const

/** O que aconteceu na tentativa, para decidir se repete. */
export type DesfechoDaTentativa =
  | { tipo: 'resposta'; status: number; retryAfter: string | null }
  | { tipo: 'rede' }
  | { tipo: 'timeout' }

const STATUS_PASSAGEIROS: ReadonlySet<number> = new Set([408, 425, 429, 500, 502, 503, 504])
const STATUS_COM_RETRY_AFTER: ReadonlySet<number> = new Set([429, 503])
const METODOS_SEGUROS: ReadonlySet<string> = new Set(['GET', 'HEAD'])

/**
 * Uma requisição é segura para repetir quando o método não muda nada (GET, HEAD) ou quando leva `Idempotency-Key`:
 * com a mesma chave a API devolve o resultado do pedido anterior em vez de fazer de novo.
 */
export function ehSeguraParaRepetir(metodo: string, chaveDeIdempotencia: string | null): boolean {
  return METODOS_SEGUROS.has(metodo) || chaveDeIdempotencia !== null
}

/**
 * Requisição segura repete em 408, 425, 429, 500, 502, 503, 504, erro de rede e tempo esgotado. As outras só repetem
 * em 429, que a API devolve antes de processar o pedido.
 */
export function deveRepetir(desfecho: DesfechoDaTentativa, segura: boolean): boolean {
  if (desfecho.tipo !== 'resposta') return segura
  if (desfecho.status === 429) return true
  return segura && STATUS_PASSAGEIROS.has(desfecho.status)
}

/** Quanto a API pediu para esperar no 429 e no 503, em milissegundos; `null` quando não pediu. */
export function esperaPedidaPelaApi(desfecho: DesfechoDaTentativa, agora: number): number | null {
  if (desfecho.tipo !== 'resposta' || !STATUS_COM_RETRY_AFTER.has(desfecho.status)) return null
  return lerRetryAfter(desfecho.retryAfter, agora)
}

/** Espera exponencial com variação aleatória ("full jitter"): evita que muitos clientes repitam no mesmo instante. */
export function esperaExponencial(aleatorio: () => number, esperaMaximaMs: number): (repeticao: number) => number {
  return (repeticao) => {
    const teto = Math.min(RETENTATIVA_PADRAO.esperaInicialMs * 2 ** (repeticao - 1), esperaMaximaMs)
    return Math.round(teto / 2 + aleatorio() * (teto / 2))
  }
}

/** `Retry-After` vem em segundos (`120`) ou como data HTTP (`Wed, 21 Oct 2026 07:28:00 GMT`). */
function lerRetryAfter(valor: string | null, agora: number): number | null {
  const texto = valor?.trim()
  if (!texto) return null
  if (/^\d+$/.test(texto)) return Number(texto) * 1000
  const instante = Date.parse(texto)
  return Number.isNaN(instante) ? null : Math.max(0, instante - agora)
}
