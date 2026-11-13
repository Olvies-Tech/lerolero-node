export type { ClienteRest, CorpoDaRequisicao, OpcoesDaRequisicao, OpcoesDoClienteRest } from './clienteRest.js'
export { criarClienteRest, recusaAntesDaChamada } from './clienteRest.js'
export type { Efeitos } from './efeitos.js'
export { variavelDeAmbiente } from './efeitos.js'
export type {
  ContextoDaRetentativa,
  ContextoDoLimite,
  MotivoDaRetentativa,
  OpcoesDeRetentativa,
} from './retentativa.js'
export type { Consulta } from './url.js'
export { consultaDoFiltro, rota } from './url.js'
