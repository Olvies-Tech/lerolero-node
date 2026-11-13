import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CHAVE_DE_TESTE, apiSimulada, sucesso } from '../../../test/apoio/apiSimulada.js'
import { type EntregaDoWebhook, LeroLero, verificarWebhook } from '../src/v1/index.js'

const vetor: { segredo: string; timestamp: number; corpo: string; assinatura: string } = JSON.parse(
  readFileSync(new URL('../../../vetores/assinatura-do-webhook.json', import.meta.url), 'utf8'),
)

function entrega(mudancas: Partial<Record<keyof EntregaDoWebhook, unknown>> = {}): EntregaDoWebhook {
  return {
    corpo: vetor.corpo,
    cabecalhos: { 'x-lero-signature': vetor.assinatura, 'x-lero-timestamp': String(vetor.timestamp) },
    segredo: vetor.segredo,
    agora: () => (vetor.timestamp + 60) * 1000,
    ...mudancas,
  } as EntregaDoWebhook
}

describe('verificação do webhook: configuração', () => {
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['negativa', -1],
    ['zero', 0],
  ])('tolerância %s falha como configuração em vez de desligar ou travar a janela', (_nome, toleranciaEmSegundos) => {
    const resultado = verificarWebhook(entrega({ toleranciaEmSegundos }))

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
  })

  it.each([
    ['devolve NaN', () => Number.NaN],
    ['devolve Infinity', () => Number.POSITIVE_INFINITY],
    [
      'lança',
      () => {
        throw new Error('relógio quebrado')
      },
    ],
  ])('relógio que %s falha como configuração, sem lançar', (_nome, agora) => {
    const resultado = verificarWebhook(entrega({ agora }))

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
  })
})

describe('verificação do webhook: entrada de outro tipo', () => {
  it.each([
    ['objeto vazio (express.raw com outro Content-Type)', {}],
    ['número', 42],
    ['null', null],
    ['corpo já parseado', { evento: 'message.status_updated' }],
  ])('corpo %s vira corpo_invalido, nunca exceção', (_nome, corpo) => {
    const resultado = verificarWebhook(entrega({ corpo }))

    expect(resultado.erro).toMatchObject({ categoria: 'webhook', motivo: 'corpo_invalido' })
  })

  it('cabeçalhos ausentes viram sem_cabecalhos, nunca exceção', () => {
    const resultado = verificarWebhook(entrega({ cabecalhos: undefined }))

    expect(resultado.erro).toMatchObject({ motivo: 'sem_cabecalhos' })
  })
})

describe('verificação do webhook: comparação exata', () => {
  it.each([
    ['em maiúsculas', vetor.assinatura.toUpperCase()],
    ['com espaço em volta', ` ${vetor.assinatura} `],
    ['com prefixo em maiúscula', vetor.assinatura.replace('sha256=', 'SHA256=')],
  ])('recusa a assinatura %s, porque o LeroLero sempre assina em hexadecimal minúsculo', (_nome, assinatura) => {
    const resultado = verificarWebhook(
      entrega({ cabecalhos: { 'x-lero-signature': assinatura, 'x-lero-timestamp': String(vetor.timestamp) } }),
    )

    expect(resultado.erro).toMatchObject({ motivo: 'assinatura_invalida' })
  })

  it('aceita a mesma entrega duas vezes dentro da janela: quem recebe deduplica pelo entregaId', () => {
    const primeira = verificarWebhook(entrega())
    const segunda = verificarWebhook(entrega())

    expect(primeira.sucesso && segunda.sucesso).toBe(true)
    expect(primeira.dados?.entregaId).toBe(segunda.dados?.entregaId)
  })
})

describe('midias.subir', () => {
  const lero = (api: ReturnType<typeof apiSimulada>) => LeroLero({ chave: CHAVE_DE_TESTE, efeitos: api.efeitos })

  it.each([
    ['quebra de linha', 'boleto.pdf\r\nContent-Type: text/html'],
    ['aspas', 'boleto".pdf'],
    ['barra invertida', 'boleto\\.pdf'],
    ['vazio', ''],
    ['grande demais', `${'a'.repeat(256)}.pdf`],
  ])('recusa nome com %s sem montar o multipart nem chamar a API', async (_nome, nome) => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'med_1' }) })

    const resultado = await lero(api).midias.subir({ conteudo: new Uint8Array([1]), nome })

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
    expect(api.chamadas).toHaveLength(0)
  })

  it.each(['application/pdf\r\nX: 1', 'pdf', 'text/"html"'])('recusa o tipo %j fora do formato', async (tipo) => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'med_1' }) })

    const resultado = await lero(api).midias.subir({ conteudo: new Uint8Array([1]), nome: 'a.pdf', tipo })

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
    expect(api.chamadas).toHaveLength(0)
  })

  it('recusa conteúdo que não é Blob, Uint8Array nem ArrayBuffer', async () => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'med_1' }) })
    const arquivo = { conteudo: 'texto' as unknown as Uint8Array, nome: 'a.pdf' }

    const resultado = await lero(api).midias.subir(arquivo)

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
  })
})

describe('filtros das listagens', () => {
  it('campo desconhecido, lista ou objeto no filtro não acrescenta nem repete parâmetro', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({ total: 0, dados: [] }) })
    const cliente = LeroLero({ chave: CHAVE_DE_TESTE, efeitos: api.efeitos })
    const filtroDeJavaScript = { status: ['aprovado', 'removido'], nome: 'boleto', ambiente: { a: 1 }, escondido: '1' }

    await cliente.templates.listar(filtroDeJavaScript as unknown as Parameters<typeof cliente.templates.listar>[0])
    await cliente.clientes.listar(filtroDeJavaScript as unknown as Parameters<typeof cliente.clientes.listar>[0])

    expect(api.chamadas[0]?.url.search).toBe('?nome=boleto')
    expect(api.chamadas[1]?.url.search).toBe('')
  })
})
