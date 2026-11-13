/** Os parâmetros da query: objeto (os `undefined` ficam de fora e a lista repete o parâmetro) ou `URLSearchParams`. */
export type Consulta =
  | Readonly<Record<string, string | number | boolean | readonly string[] | undefined>>
  | URLSearchParams

/**
 * Monta o caminho de uma rota escapando cada parte variável, para um id ou telefone nunca mudar a rota.
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

function valoresDoParametro(valor: string | number | boolean | readonly string[] | undefined): readonly string[] {
  if (valor === undefined) return []
  return typeof valor === 'object' ? valor : [String(valor)]
}
