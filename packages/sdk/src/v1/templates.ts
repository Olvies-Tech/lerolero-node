import { type ClienteRest, rota } from '@lerolero/rest'
import type {
  FiltroDeTemplates,
  IdDoTemplate,
  NovoTemplate,
  OpcoesDaCriacaoDoTemplate,
  Pagina,
  RespostaDaApi,
  Template,
  TemplateDetalhado,
  TemplatesCriados,
} from '@lerolero/types/v1'

export interface Templates {
  /**
   * Cria o template e manda para aprovação. Com `lero_test_` a aprovação é simulada em cerca de 5 segundos; com
   * `lero_live_` vai para a Meta. O que o revisor bloqueia volta como erro com o campo; o que ele avisa vem em `avisos`.
   *
   * @example
   * await lero.templates.criar({
   *   nome: 'confirmacao_agendamento',
   *   categoria: 'utility',
   *   idioma: 'pt_BR',
   *   corpo: 'Olá {{nome}}, confirma o horário de {{hora}}?',
   *   exemplos: { nome: 'Ana', hora: '14h' },
   * })
   */
  criar(template: NovoTemplate, opcoes?: OpcoesDaCriacaoDoTemplate): Promise<RespostaDaApi<TemplatesCriados>>

  /** Os templates, os atualizados por último primeiro, com filtro por cliente, status, categoria e parte do nome. */
  listar(filtro?: FiltroDeTemplates): Promise<RespostaDaApi<Pagina<Template>>>

  /** O template com o status em cada cliente, as versões e se dá para editar agora. */
  obter(id: IdDoTemplate): Promise<RespostaDaApi<TemplateDetalhado>>
}

export function criarTemplates(rest: ClienteRest): Templates {
  return {
    criar: (template, opcoes = {}) => rest.post('/templates', template, { consulta: { rascunho: opcoes.rascunho } }),
    listar: (filtro = {}) => rest.get('/templates', { consulta: { ...filtro } }),
    obter: (id) => rest.get(rota`/templates/${id}`),
  }
}
