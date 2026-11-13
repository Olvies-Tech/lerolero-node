import type { Ambiente } from '@lerolero/types/v1'

/** A chave da API com o ambiente que o prefixo dela define: `lero_test_` é teste e `lero_live_` é produção. */
export interface ChaveDaApi {
  readonly valor: string
  readonly ambiente: Ambiente
}

/** Lê a chave e descobre o ambiente pelo prefixo; devolve `null` quando ela não é uma chave do LeroLero. */
export function lerChave(texto: string | undefined): ChaveDaApi | null {
  const valor = texto?.trim() ?? ''
  const ambiente = ambienteDoPrefixo(valor)
  return ambiente ? { valor, ambiente } : null
}

function ambienteDoPrefixo(valor: string): Ambiente | null {
  if (comecaCom(valor, 'lero_test_')) return 'teste'
  if (comecaCom(valor, 'lero_live_')) return 'producao'
  return null
}

function comecaCom(valor: string, prefixo: string): boolean {
  return valor.startsWith(prefixo) && valor.length > prefixo.length
}
