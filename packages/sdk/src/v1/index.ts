export type * from '@lerolero/types/v1'
export {
  CATALOGO_DE_ERROS,
  Erros,
  FAMILIAS_DE_ERRO,
  ehCodigoConhecido,
  ehDaFamilia,
  ehErro,
  entradaDoCatalogo,
} from '@lerolero/types/v1'
export type {
  ClienteRest,
  ContextoDaRetentativa,
  ContextoDoLimite,
  OpcoesDaRequisicao,
  OpcoesDeRetentativa,
} from '@lerolero/rest'
export type { CabecalhosRecebidos, EntregaDoWebhook, VerificacaoDoWebhook } from './assinaturaDoWebhook.js'
export { verificarWebhook } from './assinaturaDoWebhook.js'
export type { Clientes } from './clientes.js'
export type { Conversas } from './conversas.js'
export type { OpcoesDoLeroLero } from './lerolero.js'
export { LeroLero } from './lerolero.js'
export type { Mensagens, OpcoesDoEnvio } from './mensagens.js'
export type { ArquivoDaMidia, Midias } from './midias.js'
export type { OptOuts } from './optOuts.js'
export type { Templates } from './templates.js'
export type { Webhooks } from './webhooks.js'
