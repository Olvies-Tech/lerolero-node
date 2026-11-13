import type { CodigoConhecido, FamiliaDoErro } from './catalogo.gerado.js'
import type { ErroDoLeroLero, FalhaDaApi } from './resultado.js'

interface ComErro {
  readonly erro: ErroDoLeroLero | null
}

/**
 * A chamada falhou com este código da API? Estreita o tipo para você ler `erro.field`, `erro.comoResolver` e o resto.
 *
 * @example
 * if (ehErro(resultado, Erros.Mensagens.JanelaFechada)) return enviarTemplate()
 */
export function ehErro<R extends ComErro, Codigo extends CodigoConhecido>(
  resultado: R,
  codigo: Codigo,
): resultado is R & { erro: FalhaDaApi & { code: Codigo } } {
  return falhaDaApi(resultado.erro)?.code === codigo
}

/**
 * A chamada falhou com um código desta família? Ex.: `EXM` (mensagem), `EXTP` (template) e `EXMT` (Meta).
 *
 * @example
 * if (ehDaFamilia(resultado, 'EXMT')) avisarQueAMetaRecusou(resultado.erro.description)
 */
export function ehDaFamilia<R extends ComErro>(
  resultado: R,
  familia: FamiliaDoErro,
): resultado is R & { erro: FalhaDaApi & { familia: FamiliaDoErro } } {
  return falhaDaApi(resultado.erro)?.familia === familia
}

function falhaDaApi(erro: ErroDoLeroLero | null): FalhaDaApi | null {
  return erro !== null && 'code' in erro ? erro : null
}
