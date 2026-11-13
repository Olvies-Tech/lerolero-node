import { randomUUID } from 'node:crypto'
import { setTimeout as aguardar } from 'node:timers/promises'

/**
 * Tudo o que o cliente faz fora da memória. Os testes trocam cada um por uma versão controlada: sem rede, sem espera de
 * verdade, com sorteio e ids previsíveis.
 */
export interface Efeitos {
  /** A requisição HTTP; o padrão é o `fetch` nativo do Node. */
  readonly buscar: typeof fetch
  /** A espera entre as tentativas. */
  readonly esperar: (milissegundos: number) => Promise<void>
  /** O relógio, em milissegundos desde 1970, para ler o `Retry-After` em forma de data. */
  readonly agora: () => number
  /** Um número entre 0 e 1, para variar a espera entre as tentativas. */
  readonly aleatorio: () => number
  /** A `Idempotency-Key` gerada quando quem chama não passa uma. */
  readonly gerarChaveDeIdempotencia: () => string
}

export const EFEITOS_DO_NODE: Efeitos = {
  buscar: (endereco, inicio) => fetch(endereco, inicio),
  esperar: async (milissegundos) => {
    await aguardar(milissegundos)
  },
  agora: () => Date.now(),
  aleatorio: () => Math.random(),
  gerarChaveDeIdempotencia: () => `lero-node-${randomUUID()}`,
}

/** Uma variável de ambiente, quando o ambiente tem `process` (no edge e no navegador, não tem). */
export function variavelDeAmbiente(nome: string): string | undefined {
  return temProcess() ? process.env[nome] : undefined
}

/** A versão do Node, para o `User-Agent`; vazia fora do Node. */
export function versaoDoNode(): string | null {
  return temProcess() ? process.version : null
}

function temProcess(): boolean {
  return typeof process !== 'undefined'
}
