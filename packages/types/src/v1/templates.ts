import type { ClienteResumido, CodigoDoAmbiente, DataHora, FiltroDePagina, ReferenciaDoCliente } from './comum.js'

/** Id público de um template (`tpl_...`). */
export type IdDoTemplate = `tpl_${string}`

export type StatusDoTemplate =
  | 'rascunho'
  | 'aguardando_numero'
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'pausado'
  | 'desativado'
  | 'substituido'
  | 'removido'

export type CategoriaDoTemplate = 'utility' | 'marketing' | 'authentication'

export type QualidadeDoTemplate = 'alta' | 'media' | 'baixa'

export type TipoDoCabecalho = 'texto' | 'imagem' | 'video' | 'documento' | 'localizacao'

export type TipoDoBotao = 'resposta' | 'link' | 'telefone' | 'copiar'

export interface CabecalhoDoTemplate {
  tipo: TipoDoCabecalho
  texto?: string
  /** Na mídia: o handle do upload de exemplo na Meta. */
  exemplo?: string
}

export interface BotaoDoTemplate {
  tipo: TipoDoBotao
  texto: string
  /** No botão de link; o final pode ser dinâmico com `{{variavel}}`. */
  url?: string
  telefone?: string
  /** Exemplo do final dinâmico do link ou do código do botão de copiar. */
  exemplo?: string
  payload?: string
}

/** Um template novo. Na revenda, `clientes` ou `todosOsClientes` cria um template por cliente. */
export interface NovoTemplate {
  /** Minúsculas, números e `_` (ex.: `confirmacao_agendamento`). */
  nome: string
  categoria: CategoriaDoTemplate
  /** Ex.: `pt_BR`. */
  idioma: string
  /** O texto, com as variáveis pelo nome: `Olá {{nome}}`. */
  corpo: string
  cabecalho?: CabecalhoDoTemplate
  rodape?: string
  botoes?: readonly BotaoDoTemplate[]
  /** Um exemplo para cada variável, pelo nome. */
  exemplos?: Readonly<Record<string, string>>
  clientes?: readonly ReferenciaDoCliente[]
  todosOsClientes?: boolean
  incluirNovos?: boolean
  personalizavel?: boolean
  ambiente?: CodigoDoAmbiente
}

export interface OpcoesDaCriacaoDoTemplate {
  /** Verdadeiro para só guardar, sem mandar para aprovação. */
  rascunho?: boolean
}

export interface FiltroDeTemplates extends FiltroDePagina {
  cliente?: ReferenciaDoCliente
  /** Os removidos só aparecem pedindo `removido`. */
  status?: StatusDoTemplate
  categoria?: CategoriaDoTemplate
  /** Parte do nome. */
  nome?: string
}

/** O template de um cliente: os componentes seguem o formato da Meta. */
export interface Template {
  id: IdDoTemplate
  nome: string
  idioma: string
  categoria: CategoriaDoTemplate
  /** Só quando a Meta reclassificou. */
  categoriaFinal: CategoriaDoTemplate | null
  status: StatusDoTemplate
  qualidade: QualidadeDoTemplate | null
  motivo: string | null
  trechoProvavel: unknown
  cliente: ClienteResumido | null
  /** Aprovação simulada (chave `lero_test_`). */
  simulado: boolean
  vigente: boolean
  componentes: unknown
  metaTemplateId: string | null
  criadoEm: DataHora
  atualizadoEm: DataHora
  submetidoEm: DataHora | null
  aprovadoEm: DataHora | null
  versao: number
  criadoPor: string | null
  doModelo: boolean
}

/** O que o revisor de templates achou: os avisos não bloqueiam a criação. */
export interface AchadoDoRevisor {
  regra: string
  severidade: string
  codigo: string | null
  field: string
  trecho: string | null
  posicao: number | null
  porque: string
  sugestao: string | null
}

export interface RecusaDoTemplate {
  cliente: ClienteResumido
  code: string
  description: string
}

/** O resultado da criação: um template por cliente, os avisos do revisor e as recusas da Meta por cliente. */
export interface TemplatesCriados {
  templates: Template[]
  avisos: AchadoDoRevisor[]
  recusados: RecusaDoTemplate[]
  modelo: string | null
}

export interface StatusDoTemplateNoCliente {
  id: IdDoTemplate
  cliente: ClienteResumido | null
  status: StatusDoTemplate
  simulado: boolean
  vigente: boolean
  motivo: string | null
  categoria: CategoriaDoTemplate
  categoriaFinal: CategoriaDoTemplate | null
  qualidade: QualidadeDoTemplate | null
  submetidoEm: DataHora | null
  versao: number
}

export interface VersaoDoTemplate {
  numero: number
  atual: boolean
  status: StatusDoTemplate
  categoria: CategoriaDoTemplate
  motivo: string | null
  autor: string | null
  criadaEm: DataHora
  componentes: unknown
}

/** Se dá para editar agora; a Meta limita as edições de um template aprovado. */
export interface EdicaoDoTemplate {
  permitida: boolean
  motivo: string | null
  noLimite: boolean
  liberaEm: DataHora | null
}

/** O template com o status em cada cliente, as versões e se dá para editar. */
export interface TemplateDetalhado {
  template: Template
  porCliente: StatusDoTemplateNoCliente[]
  versoes: VersaoDoTemplate[]
  edicao: EdicaoDoTemplate
  /** Quando o template é cópia de um modelo da revenda. */
  modelo: unknown
}
