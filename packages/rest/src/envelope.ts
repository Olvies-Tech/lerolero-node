import {
  type CategoriaDoErroDaApi,
  type ErroDaApi,
  type FalhaDaApi,
  type TipoDoErroDaApi,
  entradaDoCatalogo,
} from '@lerolero/types/v1'

/** O corpo da resposta já lido: os dados ou a falha, como a API mandou no envelope `{ data, errors }`. */
export type RespostaInterpretada = { sucesso: true; dados: unknown } | { sucesso: false; erro: FalhaDaApi }

/** Lê o envelope da API. Erro de validação às vezes vem como a lista `errors` sem o envelope: as duas formas valem. */
export function interpretarResposta(status: number, texto: string): RespostaInterpretada {
  const corpo = lerJson(texto)
  const erros = errosDoCorpo(corpo)
  if (status >= 200 && status < 300 && erros.length === 0) return { sucesso: true, dados: dadosDoCorpo(corpo) }
  return { sucesso: false, erro: falhaDaApi(status, erros) }
}

function falhaDaApi(status: number, erros: readonly ErroDaApi[]): FalhaDaApi {
  const primeiro = erros[0]
  const code = primeiro?.code ?? `HTTP-${status}`
  const catalogo = entradaDoCatalogo(code)
  return {
    categoria: categoriaDoStatus(status),
    status,
    code,
    description: primeiro?.description ?? `A API respondeu ${status} sem a lista de erros.`,
    type: primeiro?.type ?? null,
    field: primeiro?.field ?? null,
    familia: catalogo?.familia ?? null,
    significado: catalogo?.significado ?? null,
    comoResolver: catalogo?.comoResolver ?? null,
    repetivel: catalogo?.repetivel ?? null,
    erros,
  }
}

const CATEGORIAS_POR_STATUS: ReadonlyMap<number, CategoriaDoErroDaApi> = new Map([
  [400, 'validacao'],
  [422, 'validacao'],
  [401, 'autenticacao'],
  [403, 'permissao'],
  [404, 'nao_encontrado'],
  [409, 'conflito'],
  [429, 'limite'],
  [408, 'indisponivel'],
  [502, 'indisponivel'],
  [503, 'indisponivel'],
  [504, 'indisponivel'],
])

function categoriaDoStatus(status: number): CategoriaDoErroDaApi {
  const categoria = CATEGORIAS_POR_STATUS.get(status)
  if (categoria) return categoria
  return status >= 500 ? 'inesperado' : 'validacao'
}

function lerJson(texto: string): unknown {
  if (texto.trim() === '') return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

function dadosDoCorpo(corpo: unknown): unknown {
  return ehObjeto(corpo) && 'data' in corpo ? corpo['data'] : null
}

function errosDoCorpo(corpo: unknown): ErroDaApi[] {
  const lista = Array.isArray(corpo) ? corpo : ehObjeto(corpo) ? corpo['errors'] : null
  return Array.isArray(lista) ? lista.filter(ehErroDaApi) : []
}

function ehErroDaApi(valor: unknown): valor is ErroDaApi {
  return (
    ehObjeto(valor) &&
    typeof valor['code'] === 'string' &&
    typeof valor['description'] === 'string' &&
    ehTipoDoErro(valor['type'])
  )
}

function ehTipoDoErro(valor: unknown): valor is TipoDoErroDaApi {
  return typeof valor === 'number' && Number.isInteger(valor) && valor >= 0 && valor <= 6
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
