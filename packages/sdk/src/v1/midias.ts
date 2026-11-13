import { type ClienteRest, rota } from '@lerolero/rest'
import type { IdDaMidia, Midia, RespostaDaApi } from '@lerolero/types/v1'

/** O arquivo a subir: o conteúdo, o nome (com a extensão) e o tipo do conteúdo. */
export interface ArquivoDaMidia {
  conteudo: Blob | Uint8Array | ArrayBuffer
  /** Ex.: `boleto-novembro.pdf`. */
  nome: string
  /** Ex.: `application/pdf`. Sem ele, a API decide pela extensão do nome. */
  tipo?: string
}

export interface Midias {
  /**
   * Sobe um arquivo e devolve o id `med_...` para usar no envio. Aceita imagem JPG ou PNG até 5 MB; vídeo MP4 ou 3GP e
   * áudio AAC, AMR, MP3, M4A ou OGG até 16 MB; documento até 100 MB; figurinha WEBP até 500 KB. O mesmo arquivo de novo
   * devolve a mesma mídia.
   *
   * @example
   * const pdf = await readFile('boleto-novembro.pdf')
   * const midia = await lero.midias.subir({ conteudo: pdf, nome: 'boleto-novembro.pdf', tipo: 'application/pdf' })
   */
  subir(arquivo: ArquivoDaMidia): Promise<RespostaDaApi<Midia>>

  /** A mídia pelo id: tipo, nome, tamanho e SHA-256. */
  obter(id: IdDaMidia): Promise<RespostaDaApi<Midia>>
}

export function criarMidias(rest: ClienteRest): Midias {
  return {
    subir: (arquivo) => rest.post('/media', formularioDoArquivo(arquivo)),
    obter: (id) => rest.get(rota`/media/${id}`),
  }
}

function formularioDoArquivo({ conteudo, nome, tipo }: ArquivoDaMidia): FormData {
  const formulario = new FormData()
  formulario.append('arquivo', new Blob([conteudo], tipo ? { type: tipo } : {}), nome)
  return formulario
}
