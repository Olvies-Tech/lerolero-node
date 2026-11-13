import type { DataHora, ErroDoItem, ReferenciaDoCliente, Telefone } from './comum.js'

/** Id público de uma conversa (`cnv_...`). */
export type IdDaConversa = `cnv_${string}`

/** Quais telefones consultar: até 200 por vez. */
export interface ConsultaDaJanela {
  telefones: readonly Telefone[]
  cliente?: ReferenciaDoCliente
  /** O número do envio, quando não é o padrão do cliente: a janela é por número. */
  numero?: string
}

/** A janela de 24 horas de um telefone: aberta, a mensagem livre pode sair; fechada, só template. */
export interface JanelaDoTelefone {
  telefone: string
  aberta: boolean
  fechaEm: DataHora | null
  horasRestantes: number
  /** Nulo quando o contato nunca escreveu. */
  conversaId: IdDaConversa | null
  /** Telefone fora do E.164 volta com `EXM-0001` e não conta como consultado. */
  erro: ErroDoItem | null
}

export interface Janelas {
  telefones: JanelaDoTelefone[]
  /** Verdadeiro quando vieram mais de 200 telefones e só os primeiros 200 foram consultados. */
  truncado: boolean
}
