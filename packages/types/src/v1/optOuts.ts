import type { ClienteResumido, DataHora, ReferenciaDoCliente, Telefone } from './comum.js'

/** Como a saída foi pedida: pela API (padrão), por palavra ou por botão no seu canal. */
export type OrigemDoOptOut = 'api' | 'palavra' | 'botao'

/** A saída de um telefone num cliente: sair de um cliente não tira dos outros. */
export interface NovoOptOut {
  telefone: Telefone
  cliente?: ReferenciaDoCliente
  motivo?: string
  origem?: OrigemDoOptOut
}

export interface OpcoesDaRemocaoDoOptOut {
  cliente?: ReferenciaDoCliente
}

export interface OptOut {
  telefone: Telefone
  cliente: ClienteResumido | null
  origem: OrigemDoOptOut
  motivo: string | null
  em: DataHora
}
