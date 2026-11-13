// Conferência em tempo de compilação (`pnpm tipos`): os tipos escritos no SDK têm exatamente os campos dos esquemas do
// OpenAPI e cabem neles. Os tipos do SDK são mais estritos (campo obrigatório, união de status, id com prefixo) porque o
// OpenAPI da API marca tudo como opcional e anulável; se a API renomear, tirar ou mudar o tipo de um campo, isto quebra.
import type {
  AchadoDoRevisor,
  Cliente,
  Envio,
  EventoDaLinhaDoTempo,
  JanelaDoTelefone,
  Janelas,
  Mensagem,
  MensagemEnfileirada,
  Midia,
  NovoCliente,
  NovoOptOut,
  NovoTemplate,
  NovoWebhook,
  OptOut,
  ResumoDoCliente,
  Template,
  TemplateDetalhado,
  TemplatesCriados,
  Webhook,
  WebhookCriado,
} from '../src/v1/index.js'
import type { components } from './openapi.gerado.js'

type Esquemas = components['schemas']

type Diferenca<Gerado, DoSdk> = {
  faltamNoSdk: Exclude<keyof Gerado, keyof DoSdk>
  sobramNoSdk: Exclude<keyof DoSdk, keyof Gerado>
}
type MesmosCampos<Gerado, DoSdk> = [keyof Gerado] extends [keyof DoSdk]
  ? [keyof DoSdk] extends [keyof Gerado]
    ? true
    : Diferenca<Gerado, DoSdk>
  : Diferenca<Gerado, DoSdk>
// O OpenAPI não marca como anulável o campo que aponta para outro esquema ($ref), mas a API manda null nele.
type ObjetoAnulavel<T> = NonNullable<T> extends object ? T | null : T
type SoLeitura<T> = T extends readonly (infer Item)[]
  ? readonly SoLeitura<Item>[]
  : T extends object
    ? { readonly [Campo in keyof T]: ObjetoAnulavel<SoLeitura<T[Campo]>> }
    : T
type CabeNoGerado<Gerado, DoSdk> = DoSdk extends SoLeitura<Gerado> ? true : { naoCabe: DoSdk }
type Confere<Resultado extends true> = Resultado

type Respostas = [
  Confere<MesmosCampos<Esquemas['MensagemEnfileiradaResponse'], MensagemEnfileirada>>,
  Confere<CabeNoGerado<Esquemas['MensagemEnfileiradaResponse'], MensagemEnfileirada>>,
  Confere<MesmosCampos<Esquemas['MensagemResponse'], Mensagem>>,
  // botoes: a API manda null no lugar do botão sem valor (IReadOnlyList<string?>), o OpenAPI diz string[].
  Confere<CabeNoGerado<Omit<Esquemas['MensagemResponse'], 'botoes'>, Omit<Mensagem, 'botoes'>>>,
  Confere<MesmosCampos<Esquemas['EventoDaMensagemResponse'], EventoDaLinhaDoTempo>>,
  Confere<MesmosCampos<Esquemas['MidiaResponse'], Midia>>,
  Confere<CabeNoGerado<Esquemas['MidiaResponse'], Midia>>,
  Confere<MesmosCampos<Esquemas['TemplateResponse'], Template>>,
  Confere<CabeNoGerado<Esquemas['TemplateResponse'], Template>>,
  Confere<MesmosCampos<Esquemas['TemplatesCriadosResponse'], TemplatesCriados>>,
  Confere<MesmosCampos<Esquemas['AchadoDoRevisorResponse'], AchadoDoRevisor>>,
  Confere<MesmosCampos<Esquemas['TemplateDetalhadoResponse'], TemplateDetalhado>>,
  Confere<MesmosCampos<Esquemas['JanelasResponse'], Janelas>>,
  Confere<MesmosCampos<Esquemas['JanelaDoTelefoneResponse'], JanelaDoTelefone>>,
  Confere<CabeNoGerado<Esquemas['JanelaDoTelefoneResponse'], JanelaDoTelefone>>,
  Confere<MesmosCampos<Esquemas['OptOutResponse'], OptOut>>,
  Confere<CabeNoGerado<Esquemas['OptOutResponse'], OptOut>>,
  Confere<MesmosCampos<Esquemas['ClienteResponse'], Cliente>>,
  Confere<MesmosCampos<Esquemas['ResumoDoClienteResponse'], ResumoDoCliente>>,
  Confere<MesmosCampos<Esquemas['WebhookEndpointResponse'], Webhook>>,
  Confere<CabeNoGerado<Esquemas['WebhookEndpointResponse'], Webhook>>,
  Confere<MesmosCampos<Esquemas['WebhookComSegredoResponse'], WebhookCriado>>,
]

type Pedidos = [
  Confere<CabeNoGerado<Esquemas['EnviarMensagemRequest'], Envio>>,
  Confere<MesmosCampos<Esquemas['CriarTemplateRequest'], NovoTemplate>>,
  Confere<CabeNoGerado<Esquemas['CriarTemplateRequest'], NovoTemplate>>,
  Confere<MesmosCampos<Esquemas['RegistrarOptOutRequest'], NovoOptOut>>,
  Confere<CabeNoGerado<Esquemas['RegistrarOptOutRequest'], NovoOptOut>>,
  Confere<MesmosCampos<Esquemas['CriarClienteRequest'], NovoCliente>>,
  Confere<MesmosCampos<Esquemas['CriarWebhookRequest'], NovoWebhook>>,
  Confere<CabeNoGerado<Esquemas['CriarWebhookRequest'], NovoWebhook>>,
]

export type Conformidade = [Respostas, Pedidos]
