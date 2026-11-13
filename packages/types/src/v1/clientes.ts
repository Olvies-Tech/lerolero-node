import type { CodigoDoAmbiente, DataHora, FiltroDePagina, IdDoCliente } from './comum.js'

export type StatusDoCliente = 'ativo' | 'pausado' | 'suspenso'

/** Período do limite: `1` dia e `2` mês. */
export type PeriodoDoLimite = 1 | 2
/** Quando o limite renova: `1` no início do mês, `2` no aniversário e `3` em janela móvel. */
export type RenovacaoDoLimite = 1 | 2 | 3
/** O que acontece ao atingir o limite: `1` bloqueia os envios e `2` só avisa. */
export type AcaoDoLimite = 1 | 2
/** O que conta no limite: `1` as enviadas e `2` as cobradas pela Meta. */
export type ContagemDoLimite = 1 | 2
/** A quem o limite se aplica: `1` conta, `2` cliente e `3` origem. */
export type AlvoDoLimite = 1 | 2 | 3
/** Quem definiu o limite: `1` a OliveS Tech e `2` a própria conta. */
export type DefinidoPor = 1 | 2

/** O limite opcional de mensagens do cliente, no cadastro. */
export interface LimiteNoCadastro {
  ativo: boolean
  valor?: number
  periodo?: PeriodoDoLimite
  renovacao?: RenovacaoDoLimite
  diaRenovacao?: number
  acao?: AcaoDoLimite
  percentuaisAviso?: readonly number[]
  oQueConta?: ContagemDoLimite
  autenticacaoForaDoLimite?: boolean
  marketing?: number
  custoMeta?: number
}

/** Um cliente novo da revenda. Na conta direta a API recusa com `EXA-0005`. */
export interface NovoCliente {
  nome: string
  /** Seu id para o cliente, único na conta (ex.: `clinica-sorriso`): serve no lugar do `cli_...`. */
  idExterno?: string
  /** CPF ou CNPJ. */
  documento?: string
  telefone?: string
  site?: string
  /** Ausente: todos os modelos ativos; lista de `mdl_...`; vazia: nenhum. */
  replicarModelos?: readonly string[]
  limite?: LimiteNoCadastro
}

export interface FiltroDeClientes extends FiltroDePagina {
  /** Parte do nome ou do id externo. */
  busca?: string
  ambiente?: CodigoDoAmbiente
}

export interface PassoDoCliente {
  passo: string
  titulo: string
  feito: boolean
  detalhe: string | null
  parcial: boolean
}

/** O resumo do cliente no ambiente: números, templates, checklist e o que pede atenção. */
export interface ResumoDoCliente {
  numerosConectados: number
  modelosAguardandoNumero: number
  modelosEmAnalise: number
  pendencia: string | null
  passosFeitos: number
  checklist: PassoDoCliente[]
  telefone: string | null
  coexistencia: boolean
  /** Cartão na Meta: `cadastrado`, `pendente` ou `problema`. */
  cartao: string
  templatesAprovados: number
  templatesTotal: number
  ultimaMensagemEm: DataHora | null
  atencao: string[] | null
  qualidade: string | null
  templatesRejeitados: number
}

export interface ConsumoDoLimite {
  usado: number
  saldo: number
  percentual: number
  atingido: boolean
  inicio: DataHora
  renovaEm: DataHora
}

export interface LimiteDaCategoria {
  valor: number
  consumo: ConsumoDoLimite
}

export interface Limite {
  id: string
  alvo: AlvoDoLimite
  definidoPor: DefinidoPor
  ativo: boolean
  valor: number
  periodo: PeriodoDoLimite
  renovacao: RenovacaoDoLimite
  diaRenovacao: number | null
  acao: AcaoDoLimite
  percentuaisAviso: number[] | null
  oQueConta: ContagemDoLimite
  autenticacaoForaDoLimite: boolean
  editavel: boolean
  consumo: ConsumoDoLimite
  marketing: LimiteDaCategoria | null
  custoMeta: LimiteDaCategoria | null
}

/** O mês corrente do cliente (horário de Brasília): enviadas, falhas e custo estimado da Meta. */
export interface MesDoCliente {
  inicio: DataHora
  enviadas: number
  falhas: number
  taxaDeFalhas: number
  taxaDaConta: number
  custoEstimado: number | null
  moeda: string | null
}

export interface AtividadeDoCliente {
  evento: string
  titulo: string
  texto: string
  link: string | null
  em: DataHora
}

/** Um cliente da revenda (ou o cliente da conta direta). */
export interface Cliente {
  clienteId: string
  idPublico: IdDoCliente
  idExterno: string | null
  nome: string
  documento: string | null
  telefone: string | null
  site: string | null
  status: StatusDoCliente
  criadoEm: DataHora
  resumo: ResumoDoCliente
  limite: Limite | null
  mes: MesDoCliente | null
  atividade: AtividadeDoCliente[] | null
}
