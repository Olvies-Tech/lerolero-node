import type { Ambiente } from '@lerolero/types/v1'

/** A chave da API com o ambiente que o prefixo dela define: `lero_test_` é teste e `lero_live_` é produção. */
export interface ChaveDaApi {
  readonly valor: string
  readonly ambiente: Ambiente
}

// Só letras, números, _ e -: uma chave com espaço ou caractere de controle nem chega ao cabeçalho, e assim nenhuma
// mensagem de erro do runtime ecoa a chave.
const FORMATO_DA_CHAVE = /^lero_(test|live)_[A-Za-z0-9_-]{1,256}$/

/** Lê a chave e descobre o ambiente pelo prefixo; devolve `null` quando ela não é uma chave do LeroLero. */
export function lerChave(texto: string | undefined): ChaveDaApi | null {
  const valor = texto?.trim() ?? ''
  const formato = FORMATO_DA_CHAVE.exec(valor)
  if (!formato) return null
  return { valor, ambiente: formato[1] === 'live' ? 'producao' : 'teste' }
}
