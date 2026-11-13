import { type ClienteRest, consultaDoFiltro, rota } from '@lerolero/rest'
import type {
  Cliente,
  FiltroDeClientes,
  NovoCliente,
  Pagina,
  ReferenciaDoCliente,
  RespostaDaApi,
} from '@lerolero/types/v1'

export interface Clientes {
  /**
   * Cadastra um cliente da revenda. O `idExterno` (o seu id para ele) passa a valer no lugar do `cli_...` em todo método.
   *
   * @example
   * await lero.clientes.criar({ nome: 'Clínica Sorriso', idExterno: 'clinica-sorriso', documento: '12345678000190' })
   */
  criar(cliente: NovoCliente): Promise<RespostaDaApi<Cliente>>

  /** Os clientes que a chave vê, em ordem de nome, com o resumo. A busca procura no nome e no id externo. */
  listar(filtro?: FiltroDeClientes): Promise<RespostaDaApi<Pagina<Cliente>>>

  /** O cliente pelo `cli_...` ou pelo id externo, com números, checklist, limite e o mês corrente. */
  obter(cliente: ReferenciaDoCliente): Promise<RespostaDaApi<Cliente>>
}

/** Os filtros que o `GET /v1/clientes` aceita; qualquer outro campo do objeto fica fora da query. */
const CHAVES_DO_FILTRO: readonly (keyof FiltroDeClientes)[] = ['busca', 'ambiente', 'pagina', 'limite']

export function criarClientes(rest: ClienteRest): Clientes {
  return {
    criar: (cliente) => rest.post('/clientes', cliente),
    listar: (filtro = {}) => rest.get('/clientes', { consulta: consultaDoFiltro(filtro, CHAVES_DO_FILTRO) }),
    obter: (cliente) => rest.get(rota`/clientes/${cliente}`),
  }
}
