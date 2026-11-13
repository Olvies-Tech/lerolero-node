type ValorDaConsulta = string | number | boolean | readonly string[] | undefined

/** Os parâmetros da query: objeto (os `undefined` ficam de fora e a lista repete o parâmetro) ou `URLSearchParams`. */
export type Consulta = Readonly<Record<string, ValorDaConsulta>> | URLSearchParams

/**
 * Monta o caminho de uma rota escapando cada parte variável, para um id ou telefone nunca mudar a rota. Um valor vazio,
 * `.` ou `..` não chega à API: a chamada falha como configuração (ver `problemaNoCaminho`).
 *
 * @example
 * rota`/opt-outs/${'+5511984213307'}` // '/opt-outs/%2B5511984213307'
 */
export function rota(partes: TemplateStringsArray, ...valores: readonly string[]): string {
  return partes.reduce((caminho, parte, indice) => {
    const valor = valores[indice - 1]
    return caminho + (valor === undefined ? '' : encodeURIComponent(valor)) + parte
  })
}

const SEGMENTOS_DE_PONTO: ReadonlySet<string> = new Set(['.', '..'])

/**
 * Por que o caminho não vale, ou `null` quando vale. O `new URL` resolve os segmentos `.` e `..` (inclusive escritos como
 * `%2e`) e assim mudaria a rota: `clientes.obter('.')` viraria a listagem. Segmento vazio (`//` ou `/` no fim) também
 * muda a rota, então os dois são recusados antes da chamada.
 */
export function problemaNoCaminho(caminho: string): string | null {
  const segmentos = caminho.replace(/^\/+/, '').split('/')
  const invalido = segmentos.some((segmento) => segmento === '' || SEGMENTOS_DE_PONTO.has(decodificar(segmento)))
  return invalido ? `O caminho ${caminho} tem um trecho vazio, "." ou "..": confira o id que foi passado.` : null
}

/**
 * Leva para a query só as chaves que a rota aceita, e só valores simples (texto, número finito ou verdadeiro e falso):
 * um campo a mais ou um valor de outro tipo, vindo de JavaScript sem tipos, não acrescenta nem repete parâmetro.
 */
export function consultaDoFiltro<Filtro extends object>(
  filtro: Filtro,
  chaves: readonly (keyof Filtro & string)[],
): Consulta {
  const pares = chaves.flatMap((chave): [string, string | number | boolean][] => {
    const valor: unknown = filtro[chave]
    return valorSimples(valor) ? [[chave, valor]] : []
  })
  return Object.fromEntries(pares)
}

/** `https://api.lerolero.tech` + `/v1` + `/messages` + `?...`. */
export function montarUrl(base: string, versao: number, caminho: string, consulta?: Consulta): string {
  const url = new URL(`${base.replace(/\/+$/, '')}/v${versao}${caminho.replace(/^\/*/, '/')}`)
  for (const [nome, valor] of paresDaConsulta(consulta)) url.searchParams.append(nome, valor)
  return url.toString()
}

function paresDaConsulta(consulta: Consulta | undefined): [string, string][] {
  if (consulta === undefined) return []
  if (consulta instanceof URLSearchParams) return [...consulta.entries()]
  return Object.entries(consulta).flatMap(([nome, valor]) =>
    valoresDoParametro(valor).map((item): [string, string] => [nome, item]),
  )
}

function valoresDoParametro(valor: ValorDaConsulta): readonly string[] {
  if (Array.isArray(valor)) return valor.filter((item): item is string => typeof item === 'string')
  return valorSimples(valor) ? [String(valor)] : []
}

function valorSimples(valor: unknown): valor is string | number | boolean {
  if (typeof valor === 'number') return Number.isFinite(valor)
  return typeof valor === 'string' || typeof valor === 'boolean'
}

function decodificar(segmento: string): string {
  try {
    return decodeURIComponent(segmento)
  } catch {
    return segmento
  }
}
