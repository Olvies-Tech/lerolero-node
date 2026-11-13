import type { OpcoesDeRetentativa } from './retentativa.js'

/** Os endereços em que o http sem TLS é aceito: só a própria máquina, para desenvolvimento. */
const LOOPBACK: ReadonlySet<string> = new Set(['localhost', '127.0.0.1', '[::1]'])

/**
 * Por que a `urlBase` não vale, ou `null` quando vale. Ela precisa ser https, porque leva a chave da API em todo pedido;
 * o http só vale na própria máquina.
 */
export function problemaNaUrlBase(urlBase: string): string | null {
  const url = lerUrl(urlBase)
  if (!url) return 'A urlBase não é um endereço válido.'
  if (url.protocol === 'https:') return null
  if (url.protocol === 'http:' && LOOPBACK.has(url.hostname)) return null
  return 'A urlBase precisa ser https: a chave da API vai em todo pedido. O http só vale para localhost, 127.0.0.1 e ::1.'
}

/**
 * Por que as opções de retentativa não valem. Valor inválido não vira o padrão em silêncio: a chamada falha como
 * configuração, para quem escreveu `maximo: -1` ou `esperaMaximaMs: NaN` descobrir na primeira chamada.
 */
export function problemaNaRetentativa(opcoes: OpcoesDeRetentativa | undefined): string | null {
  if (!opcoes) return null
  if (opcoes.maximo !== undefined && !inteiroNaoNegativo(opcoes.maximo)) {
    return 'retentativa.maximo precisa ser um número inteiro de 0 para cima.'
  }
  if (opcoes.esperaMaximaMs !== undefined && !finitoNaoNegativo(opcoes.esperaMaximaMs)) {
    return 'retentativa.esperaMaximaMs precisa ser um número finito de 0 para cima.'
  }
  if (opcoes.espera !== undefined && typeof opcoes.espera !== 'function') {
    return 'retentativa.espera precisa ser uma função que recebe a repetição e devolve os milissegundos.'
  }
  return null
}

/** Por que um número de milissegundos ou de bytes não vale (precisa ser finito e maior que zero). */
export function problemaNoPositivo(nome: string, valor: number | undefined): string | null {
  if (valor === undefined || (Number.isFinite(valor) && valor > 0)) return null
  return `${nome} precisa ser um número finito maior que zero.`
}

/** O primeiro problema da lista, ou `null` quando nenhum. */
export function primeiroProblema(...problemas: readonly (string | null)[]): string | null {
  return problemas.find((problema) => problema !== null) ?? null
}

export function finitoNaoNegativo(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0
}

function inteiroNaoNegativo(valor: unknown): valor is number {
  return finitoNaoNegativo(valor) && Number.isInteger(valor)
}

function lerUrl(texto: string): URL | null {
  try {
    return new URL(texto)
  } catch {
    return null
  }
}
