// Roteiro de integração contra a API LOCAL, com uma chave lero_test_ (Simulador: nada sai de verdade). Nunca no CI.
//   LERO_API_KEY=lero_test_... pnpm test:integracao
// Opcional: LERO_API_URL (padrão http://localhost:5110). Recusa chave lero_live_ e endereço que não seja local.
import { randomUUID } from 'node:crypto'
import { rota } from '@lerolero/rest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Erros, type IdDoTemplate, LeroLero, type RespostaDaApi, ehErro } from '../packages/sdk/src/v1/index.js'

const chave = process.env['LERO_API_KEY'] ?? ''
const urlBase = process.env['LERO_API_URL'] ?? 'http://localhost:5110'
const TELEFONE = '+5511990000269'

const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/.test(urlBase)
if (chave.startsWith('lero_live_')) throw new Error('O roteiro de integração só roda com chave lero_test_ (Simulador).')
if (chave && !local) throw new Error('O roteiro de integração só roda contra a API local.')

const lero = LeroLero({ chave, urlBase })

async function medir<T>(nome: string, chamada: () => Promise<RespostaDaApi<T>>): Promise<RespostaDaApi<T>> {
  const inicio = performance.now()
  const resultado = await chamada()
  const ms = Math.round(performance.now() - inicio)
  const situacao = resultado.sucesso
    ? 'ok'
    : `${resultado.erro.categoria} ${'code' in resultado.erro ? resultado.erro.code : ''}`
  console.log(
    `${nome.padEnd(44)} ${String(resultado.detalhes.status).padEnd(4)} ${String(ms).padStart(5)} ms  ${situacao}`,
  )
  return resultado
}

function dadosDe<T>(resultado: RespostaDaApi<T>): T {
  if (!resultado.sucesso) throw new Error(`${resultado.erro.categoria}: ${resultado.erro.description}`)
  return resultado.dados
}

/** As variáveis nomeadas do template (`{{nome}}`), cada uma com um valor de teste. */
function variaveisDo(componentes: unknown): Record<string, string> {
  const nomes = [...JSON.stringify(componentes).matchAll(/\{\{(\w+)\}\}/g)].map(([, nome]) => nome ?? '')
  return Object.fromEntries(nomes.map((nome) => [nome, 'Teste SDK']))
}

describe.skipIf(!chave)('SDK contra a API local (Simulador)', () => {
  // A conta de exemplo está em modo teste: o template novo fica como rascunho e o envio usa um utility já aprovado.
  const rascunho = `sdk_269_rascunho_${Date.now().toString(36)}`
  let template = ''
  let variaveis: Record<string, string> = {}
  let idDoRascunho: IdDoTemplate | null = null

  beforeAll(async () => {
    expect(lero.ambiente).toBe('teste')
    const criados = dadosDe(
      await medir('templates.criar (rascunho)', () =>
        lero.templates.criar(
          {
            nome: rascunho,
            categoria: 'utility',
            idioma: 'pt_BR',
            corpo: 'Olá {{nome}}, seu pedido foi separado e sai para entrega hoje.',
            exemplos: { nome: 'Ana' },
          },
          { rascunho: true },
        ),
      ),
    )
    idDoRascunho = criados.templates[0]?.id ?? null
    const detalhado = dadosDe(await medir('templates.obter', () => lero.templates.obter(idDoRascunho ?? 'tpl_')))
    expect(detalhado.template.status).toBe('rascunho')

    const aprovados = dadosDe(
      await medir('templates.listar (utility aprovados)', () =>
        lero.templates.listar({ status: 'aprovado', categoria: 'utility', limite: 100 }),
      ),
    )
    const semMidia = aprovados.dados.find((t) => !/IMAGE|VIDEO|DOCUMENT|LOCATION/.test(JSON.stringify(t.componentes)))
    expect(semMidia, 'a conta precisa de um template utility aprovado sem cabeçalho de mídia').toBeDefined()
    template = semMidia?.nome ?? ''
    variaveis = variaveisDo(semMidia?.componentes)
  })

  afterAll(async () => {
    if (!idDoRascunho) return
    await medir('rest.delete /templates (limpeza)', () => lero.rest.delete(rota`/templates/${idDoRascunho ?? ''}`))
  })

  it('envia um template e repete com a mesma Idempotency-Key sem duplicar', async () => {
    const chaveDeIdempotencia = `sdk-269-${randomUUID()}`
    const envio = { to: TELEFONE, template, variaveis, metadata: { origem: 'sdk-269' } } as const

    const primeiro = await medir('mensagens.enviar (template)', () =>
      lero.mensagens.enviar(envio, { chaveDeIdempotencia }),
    )
    const repetido = await medir('mensagens.enviar (mesma chave)', () =>
      lero.mensagens.enviar(envio, { chaveDeIdempotencia }),
    )

    if (!primeiro.sucesso && ehErro(primeiro, Erros.Mensagens.VariavelInvalida)) {
      throw new Error(`O template ${template} pede variáveis: ${primeiro.erro.description}`)
    }
    expect(dadosDe(primeiro).status).toBe('queued')
    expect(dadosDe(repetido).id).toBe(dadosDe(primeiro).id)
    expect(repetido.detalhes.repetida).toBe(true)

    const mensagem = dadosDe(await medir('mensagens.obter', () => lero.mensagens.obter(dadosDe(primeiro).id)))
    expect(mensagem.template?.nome).toBe(template)
    expect(mensagem.metadata).toEqual({ origem: 'sdk-269' })
  })

  it('agenda e cancela uma mensagem', async () => {
    const amanha = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    const agendada = dadosDe(
      await medir('mensagens.enviar (agendada)', () =>
        lero.mensagens.enviar({ to: TELEFONE, template, variaveis, agendarPara: amanha }),
      ),
    )

    const cancelada = dadosDe(await medir('mensagens.cancelar', () => lero.mensagens.cancelar(agendada.id)))

    expect(cancelada.status).toBe('canceled')
  })

  it('a janela fechada recusa texto livre com EXM-0002 e o como resolver', async () => {
    const janela = dadosDe(await medir('conversas.janela', () => lero.conversas.janela({ telefones: [TELEFONE] })))
    const texto = await medir('mensagens.enviar (texto livre)', () =>
      lero.mensagens.enviar({ to: TELEFONE, texto: 'Oi' }),
    )

    if (janela.telefones[0]?.aberta) return expect(texto.sucesso).toBe(true)
    expect(ehErro(texto, Erros.Mensagens.JanelaFechada)).toBe(true)
    expect(texto.erro).toMatchObject({
      categoria: 'validacao',
      comoResolver: 'Iniciar a conversa com um template aprovado',
    })
  })

  it('telefone inválido volta tipado, sem exceção', async () => {
    const resultado = await medir('mensagens.enviar (telefone inválido)', () =>
      lero.mensagens.enviar({ to: '+55119', template, variaveis }),
    )

    expect(resultado.erro).toMatchObject({ code: 'EXM-0001', familia: 'EXM' })
  })

  it('sobe uma mídia e consulta', async () => {
    const pdf = new TextEncoder().encode(`%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n${randomUUID()}`)
    const midia = dadosDe(
      await medir('midias.subir (pdf)', () =>
        lero.midias.subir({ conteudo: pdf, nome: 'sdk-269.pdf', tipo: 'application/pdf' }),
      ),
    )

    const consultada = dadosDe(await medir('midias.obter', () => lero.midias.obter(midia.id)))

    expect(consultada).toMatchObject({ id: midia.id, tipo: 'document', nome: 'sdk-269.pdf' })
  })

  it('registra e remove um opt-out', async () => {
    const telefone = '+5511990002691'
    const optOut = dadosDe(
      await medir('optOuts.adicionar', () => lero.optOuts.adicionar({ telefone, motivo: 'Teste do SDK 269' })),
    )

    const removido = await medir('optOuts.remover', () => lero.optOuts.remover(telefone))

    expect(optOut).toMatchObject({ telefone, origem: 'api' })
    expect(removido.dados).toBe(true)
  })

  it('lista e obtém o cliente', async () => {
    const clientes = dadosDe(await medir('clientes.listar', () => lero.clientes.listar({ limite: 5 })))
    const primeiro = clientes.dados[0]
    if (!primeiro) return

    const cliente = dadosDe(await medir('clientes.obter', () => lero.clientes.obter(primeiro.idPublico)))

    expect(cliente.idPublico).toBe(primeiro.idPublico)
  })

  it('cria, lista e remove um webhook', async () => {
    const criado = dadosDe(
      await medir('webhooks.criar', () =>
        lero.webhooks.criar({ url: 'https://example.com/lerolero-sdk-269', eventos: ['message.status_updated'] }),
      ),
    )
    const lista = dadosDe(await medir('webhooks.listar', () => lero.webhooks.listar()))
    const removido = await medir('webhooks.remover', () => lero.webhooks.remover(criado.endpoint.id))

    expect(criado.segredo.length).toBeGreaterThan(10)
    expect(lista.map((webhook) => webhook.id)).toContain(criado.endpoint.id)
    expect(removido.dados).toBe(true)
  })

  it('lero.rest chama uma rota fora dos módulos (GET /v1/contatos)', async () => {
    const contatos = await medir('rest.get /contatos', () =>
      lero.rest.get<{ total: number }>('/contatos', { consulta: { limite: 5 } }),
    )

    expect(dadosDe(contatos).total).toBeGreaterThanOrEqual(0)
  })

  it('chave revogada ou errada volta como autenticação (EXA-0001)', async () => {
    const resultado = await medir('chave errada', () =>
      lero.rest.comAChave('lero_test_chave_que_nao_existe').get('/webhooks'),
    )

    expect(resultado.erro).toMatchObject({ categoria: 'autenticacao', code: 'EXA-0001' })
  })
})
