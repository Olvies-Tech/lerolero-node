import { type ClienteRest, recusaAntesDaChamada, rota } from '@lerolero/rest'
import type { IdDaMidia, Midia, RespostaDaApi } from '@lerolero/types/v1'

/** O arquivo a subir: o conteúdo, o nome (com a extensão) e o tipo do conteúdo. */
export interface ArquivoDaMidia {
  conteudo: Blob | Uint8Array | ArrayBuffer
  /** Ex.: `boleto-novembro.pdf`. Até 255 caracteres, sem quebra de linha, aspas nem barra invertida. */
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

// O nome e o tipo vão no cabeçalho da parte do multipart: quebra de linha, aspas ou barra invertida poderiam abrir um
// cabeçalho novo ou fechar o filename antes da hora, então nem chegam ao FormData.
const NOME_SEGURO = /^[^\p{Cc}"\\]{1,255}$/u
const TIPO_DE_CONTEUDO = /^[\w!#$&^.+-]+\/[\w!#$&^.+-]+$/

export function criarMidias(rest: ClienteRest): Midias {
  return {
    subir: async (arquivo) => {
      const problema = problemaNoArquivo(arquivo)
      return problema ? recusaAntesDaChamada(problema) : rest.post('/media', formularioDoArquivo(arquivo))
    },
    obter: (id) => rest.get(rota`/media/${id}`),
  }
}

function problemaNoArquivo({ conteudo, nome, tipo }: ArquivoDaMidia): string | null {
  if (!(conteudo instanceof Blob || conteudo instanceof Uint8Array || conteudo instanceof ArrayBuffer)) {
    return 'O conteúdo do arquivo precisa ser Blob, Uint8Array (Buffer) ou ArrayBuffer.'
  }
  if (typeof nome !== 'string' || !NOME_SEGURO.test(nome)) {
    return 'O nome do arquivo precisa ter de 1 a 255 caracteres, sem quebra de linha, aspas nem barra invertida.'
  }
  if (tipo !== undefined && !TIPO_DE_CONTEUDO.test(tipo)) {
    return 'O tipo do arquivo precisa ser um tipo de conteúdo como application/pdf ou image/png.'
  }
  return null
}

function formularioDoArquivo({ conteudo, nome, tipo }: ArquivoDaMidia): FormData {
  const formulario = new FormData()
  formulario.append('arquivo', new Blob([conteudo], tipo ? { type: tipo } : {}), nome)
  return formulario
}
