import { type Efeitos, type OpcoesDoClienteRest, criarClienteRest } from '@lerolero/rest'

/** Uma resposta da API simulada, ou uma falha do `fetch` (rede ou tempo esgotado). */
export type Roteiro =
  | { status: number; corpo?: unknown; cabecalhos?: Record<string, string> }
  | { falha: 'timeout' | 'rede' }

export interface ChamadaRegistrada {
  url: URL
  metodo: string
  cabecalhos: Headers
  corpo: string | FormData | null
}

export const CHAVE_DE_TESTE = 'lero_test_chave_do_teste'

/**
 * A API do LeroLero em memória: responde o roteiro na ordem, guarda cada chamada e as esperas pedidas, sem rede e sem
 * esperar de verdade.
 */
export function apiSimulada(...roteiro: Roteiro[]) {
  const chamadas: ChamadaRegistrada[] = []
  const esperas: number[] = []
  let idsGerados = 0

  const buscar: typeof fetch = async (endereco, inicio = {}) => {
    chamadas.push({
      url: new URL(String(endereco)),
      metodo: inicio.method ?? 'GET',
      cabecalhos: new Headers(inicio.headers),
      corpo: typeof inicio.body === 'string' || inicio.body instanceof FormData ? inicio.body : null,
    })
    const passo = roteiro[Math.min(chamadas.length - 1, roteiro.length - 1)]
    if (!passo) throw new Error('A API simulada ficou sem roteiro.')
    if ('falha' in passo) throw falhaDoFetch(passo.falha)
    const corpo = passo.corpo === undefined ? null : JSON.stringify(passo.corpo)
    return new Response(corpo, { status: passo.status, headers: passo.cabecalhos ?? {} })
  }

  const efeitos: Efeitos = {
    buscar,
    esperar: async (milissegundos) => {
      esperas.push(milissegundos)
    },
    agora: () => Date.parse('2026-11-13T12:00:00Z'),
    aleatorio: () => 1,
    gerarChaveDeIdempotencia: () => `chave-gerada-${++idsGerados}`,
  }

  const cliente = (opcoes: OpcoesDoClienteRest = {}) => criarClienteRest({ chave: CHAVE_DE_TESTE, ...opcoes, efeitos })

  return { cliente, chamadas, esperas, efeitos }
}

function falhaDoFetch(tipo: 'timeout' | 'rede'): Error {
  if (tipo === 'timeout') return new DOMException('The operation was aborted due to timeout', 'TimeoutError')
  return new TypeError('fetch failed', { cause: new Error('connect ECONNREFUSED 127.0.0.1:443') })
}

export function sucesso(data: unknown) {
  return { data, errors: [] }
}

export function erro(code: string, description: string, type: number, field?: string) {
  return { data: null, errors: [{ code, description, type, ...(field ? { field } : {}) }] }
}
