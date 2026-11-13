import type { ClienteResumido, DataHora, ErroDoItem, Metadata, ReferenciaDoCliente, Telefone } from './comum.js'
import type { IdDaMidia } from './midias.js'
import type { IdDoTemplate } from './templates.js'

/** Id público de uma mensagem (`msg_...`). */
export type IdDaMensagem = `msg_${string}`

/** Situação da mensagem: segue `queued`, `sending`, `sent`, `delivered` e `read` (ou termina em `failed` ou `canceled`). */
export type StatusDaMensagem =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'played'
  | 'failed'
  | 'received'
  | 'canceled'
  | 'sent_from_app'

/** Os acontecimentos da linha do tempo: os status e também o que não muda o status. */
export type AcontecimentoDaMensagem = StatusDaMensagem | 'button_reply' | 'attempt_failed' | 'content_removed'

/** O tipo da mensagem como a API devolve. */
export type TipoDaMensagem =
  | 'template'
  | 'text'
  | 'imagem'
  | 'video'
  | 'audio'
  | 'documento'
  | 'localizacao'
  | 'respostabotao'
  | 'interativa'
  | 'reacao'
  | 'figurinha'
  | 'ecodoapp'

/** Um lugar no mapa, no envio livre ou no cabeçalho de localização do template. */
export interface Localizacao {
  latitude: number
  longitude: number
  nome?: string
  endereco?: string
}

/** O que todo envio leva, seja template ou mensagem livre. */
interface EnvioBase {
  /** O destino em E.164. */
  to: Telefone
  /** Na revenda com mais de um cliente: o id (`cli_...`) ou o id externo. Na conta direta, fica de fora. */
  cliente?: ReferenciaDoCliente
  /** O número que envia; sem ele, vai pelo padrão do cliente. */
  numero?: string
  /** Guardado com a mensagem e devolvido em todo evento dela (ex.: o id do agendamento no seu sistema). */
  metadata?: Metadata
  /** De onde veio o envio no seu sistema, para os relatórios (ex.: `agendai`). */
  origem?: string
  /** Data e hora a partir da qual o envio sai. */
  agendarPara?: DataHora
}

/** O cabeçalho de mídia ou de localização de um template, com o id de `midias.subir`. */
export interface CabecalhoDoEnvio {
  mediaId?: IdDaMidia
  nome?: string
  localizacao?: Localizacao
}

/** O valor de um botão do template, na ordem do template: um campo por tipo de botão. */
export type BotaoDoEnvio =
  | { payload: string; url?: never; codigo?: never }
  | { url: string; payload?: never; codigo?: never }
  | { codigo: string; payload?: never; url?: never }

type Conteudo = 'template' | 'texto' | 'midia' | 'interativo' | 'localizacao' | 'reacao'
type Sem<Exceto extends Conteudo> = { [Campo in Exclude<Conteudo, Exceto>]?: never }

/** Envio de um template aprovado: funciona com a janela de 24 horas fechada. */
export type EnvioDeTemplate = EnvioBase &
  Sem<'template'> & {
    template: string
    /** Idioma do template (ex.: `pt_BR`); sem ele, vai o do template com esse nome. */
    idioma?: string
    /** Todas as variáveis do template pelo nome: `{{nome}}` vira `nome`. */
    variaveis?: Readonly<Record<string, string>>
    cabecalho?: CabecalhoDoEnvio
    documento?: CabecalhoDoEnvio
    botoes?: readonly BotaoDoEnvio[]
  }

/** Mensagem livre de texto, só com a janela de 24 horas aberta (até 4096 caracteres). */
export type EnvioDeTexto = EnvioBase & Sem<'texto'> & { texto: string }

/** Mensagem livre com imagem, vídeo, áudio, documento ou figurinha, só com a janela aberta. */
export type EnvioDeMidia = EnvioBase &
  Sem<'midia'> & {
    midia: { mediaId: IdDaMidia; legenda?: string; nome?: string }
  }

/** Mensagem livre com 1 a 3 botões de resposta, só com a janela aberta. */
export type EnvioInterativo = EnvioBase &
  Sem<'interativo'> & {
    interativo: { texto: string; botoes: readonly { id: string; titulo: string }[] }
  }

/** Mensagem livre com uma localização, só com a janela aberta. */
export type EnvioDeLocalizacao = EnvioBase & Sem<'localizacao'> & { localizacao: Localizacao }

/** Reação com emoji a uma mensagem da conversa, só com a janela aberta. */
export type EnvioDeReacao = EnvioBase &
  Sem<'reacao'> & {
    reacao: { mensagemId: IdDaMensagem; emoji: string }
  }

/** Um envio: um template ou exatamente um tipo de mensagem livre. */
export type Envio = EnvioDeTemplate | EnvioDeTexto | EnvioDeMidia | EnvioInterativo | EnvioDeLocalizacao | EnvioDeReacao

/** A resposta do envio: a mensagem entrou na fila. */
export interface MensagemEnfileirada {
  id: IdDaMensagem
  status: StatusDaMensagem
}

export interface TemplateDaMensagem {
  id: IdDoTemplate
  nome: string
  idioma: string
  categoria: string | null
  modeloVersao: number | null
}

export interface EventoDaLinhaDoTempo {
  evento: AcontecimentoDaMensagem
  em: DataHora
  /** Falso para o evento que chegou atrasado e não mudou o status. */
  avancouStatus: boolean
  erro: ErroDoItem | null
}

export interface RespostaDeBotao {
  payload: string
  recebidaEm: DataHora
}

export interface CustoDaMensagem {
  categoria: string | null
  cobravel: boolean | null
  valorEstimado: number | null
  moeda: string | null
}

/** A mensagem com o status atual, a linha do tempo, o erro, a resposta de botão e o custo estimado. */
export interface Mensagem {
  id: IdDaMensagem
  status: StatusDaMensagem
  tipo: TipoDaMensagem
  cliente: ClienteResumido | null
  to: Telefone | null
  template: TemplateDaMensagem | null
  variaveis: Readonly<Record<string, string>> | null
  botoes: readonly (string | null)[] | null
  origem: string | null
  metadata: Metadata | null
  wamid: string | null
  agendadaPara: DataHora | null
  erro: ErroDoItem | null
  respostaDeBotao: RespostaDeBotao | null
  custo: CustoDaMensagem | null
  criadaEm: DataHora
  enviadaEm: DataHora | null
  entregueEm: DataHora | null
  lidaEm: DataHora | null
  respondidaEm: DataHora | null
  falhouEm: DataHora | null
  linhaDoTempo: readonly EventoDaLinhaDoTempo[] | null
}
