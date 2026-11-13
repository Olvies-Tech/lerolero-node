import type { DataHora } from './comum.js'

/** Id público de uma mídia (`med_...`), para usar no envio. */
export type IdDaMidia = `med_${string}`

/** O tipo da mídia, decidido pelo conteúdo do arquivo. */
export type TipoDaMidia = 'image' | 'video' | 'audio' | 'sticker' | 'document'

/** Uma mídia guardada no LeroLero: o mesmo arquivo enviado de novo devolve a mesma mídia. */
export interface Midia {
  id: IdDaMidia
  tipo: TipoDaMidia
  tipoConteudo: string
  nome: string | null
  /** Tamanho em bytes. */
  tamanho: number
  sha256: string
  criadaEm: DataHora
}
