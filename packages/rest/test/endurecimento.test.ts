import { describe, expect, it } from 'vitest'
import { CHAVE_DE_TESTE, apiSimulada, sucesso } from '../../../test/apoio/apiSimulada.js'
import { consultaDoFiltro, criarClienteRest, rota } from '../src/index.js'

describe('caminho', () => {
  it.each([
    ['id vazio', rota`/clientes/${''}`],
    ['ponto', rota`/clientes/${'.'}`],
    ['dois pontos', rota`/clientes/${'..'}/limites`],
    ['ponto codificado', '/clientes/%2e'],
    ['dois pontos codificados em maiúscula', '/clientes/.%2E'],
    ['barra dupla', '/clientes//limites'],
  ])('recusa %s no caminho sem chamar a API', async (_nome, caminho) => {
    const api = apiSimulada({ status: 200, corpo: sucesso({}) })

    const resultado = await api.cliente().get(caminho)

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
    expect(resultado.detalhes.tentativas).toBe(0)
    expect(api.chamadas).toHaveLength(0)
  })

  it('aceita id com ponto no meio, que não é segmento de ponto', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({}) })

    await api.cliente().get(rota`/clientes/${'clinica.sorriso'}`)

    expect(api.chamadas[0]?.url.pathname).toBe('/v1/clientes/clinica.sorriso')
  })
})

describe('urlBase', () => {
  it.each(['http://api.lerolero.tech', 'http://192.168.0.10:5110', 'ftp://api.lerolero.tech', 'não é url'])(
    'recusa %s como configuração, sem mandar a chave',
    async (urlBase) => {
      const api = apiSimulada({ status: 200, corpo: sucesso({}) })

      const resultado = await api.cliente({ urlBase }).get('/webhooks')

      expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
      expect(api.chamadas).toHaveLength(0)
    },
  )

  it.each(['http://localhost:5110', 'http://127.0.0.1:5110', 'http://[::1]:5110', 'https://api.lerolero.tech'])(
    'aceita %s',
    async (urlBase) => {
      const api = apiSimulada({ status: 200, corpo: sucesso([]) })

      const resultado = await api.cliente({ urlBase }).get('/webhooks')

      expect(resultado.sucesso).toBe(true)
    },
  )
})

describe('cabeçalhos de quem chama', () => {
  it('Authorization em qualquer grafia não troca a chave do cliente', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    await api
      .cliente({ cabecalhos: { authorization: 'Bearer de-outro' } })
      .get('/webhooks', { cabecalhos: { AUTHORIZATION: 'Bearer de-outro', AuThOrIzAtIoN: 'Bearer de-outro' } })

    expect(api.chamadas[0]?.cabecalhos.get('authorization')).toBe(`Bearer ${CHAVE_DE_TESTE}`)
  })

  it('Idempotency-Key de quem chama não troca a do pedido', async () => {
    const api = apiSimulada({ status: 202, corpo: sucesso({ id: 'msg_1' }) })

    const resultado = await api.cliente().post(
      '/messages',
      {},
      {
        idempotencia: { chave: 'a-certa' },
        cabecalhos: { 'idempotency-key': 'outra' },
      },
    )

    expect(api.chamadas[0]?.cabecalhos.get('idempotency-key')).toBe('a-certa')
    expect(resultado.detalhes.chaveDeIdempotencia).toBe('a-certa')
  })

  it('Content-Type de quem chama não troca o do multipart, que fica com o boundary do fetch', async () => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'med_1' }) })
    const formulario = new FormData()
    formulario.append('arquivo', new Blob(['%PDF']), 'a.pdf')

    await api.cliente().post('/media', formulario, { cabecalhos: { 'content-type': 'text/plain' } })

    expect(api.chamadas[0]?.cabecalhos.get('content-type')).toBeNull()
  })

  it('cabeçalho com quebra de linha vira falha de configuração, sem lançar', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    const resultado = await api.cliente().get('/webhooks', { cabecalhos: { 'X-Rastreio': 'a\r\nX-Injetado: 1' } })

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
    expect(api.chamadas).toHaveLength(0)
  })
})

describe('chave', () => {
  it.each(['lero_test_com espaço', 'lero_test_com\nquebra', 'lero_live_com\u0000nulo', 'lero_test_çedilha'])(
    'recusa a chave fora do formato sem ecoar a chave na mensagem',
    async (chave) => {
      const api = apiSimulada({ status: 200, corpo: sucesso([]) })

      const resultado = await api.cliente({ chave }).get('/webhooks')

      expect(resultado.erro?.categoria).toBe('configuracao')
      expect(resultado.erro?.description).not.toContain(chave)
      expect(api.chamadas).toHaveLength(0)
    },
  )
})

describe('opções de retentativa', () => {
  it.each([
    ['maximo negativo', { maximo: -1 }],
    ['maximo fracionário', { maximo: 1.5 }],
    ['maximo NaN', { maximo: Number.NaN }],
    ['esperaMaximaMs infinita', { esperaMaximaMs: Number.POSITIVE_INFINITY }],
    ['esperaMaximaMs negativa', { esperaMaximaMs: -10 }],
  ])('%s no cliente falha como configuração, sem ir à API', async (_nome, retentativa) => {
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    const resultado = await api.cliente({ retentativa }).get('/webhooks')

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
    expect(api.chamadas).toHaveLength(0)
  })

  it('valor inválido na requisição também falha como configuração', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    const resultado = await api.cliente().get('/webhooks', { retentativa: { maximo: Number.POSITIVE_INFINITY } })

    expect(resultado.erro).toMatchObject({ categoria: 'configuracao' })
  })

  it('tempo limite zero ou NaN falha como configuração', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    const noCliente = await api.cliente({ tempoLimiteMs: 0 }).get('/webhooks')
    const naRequisicao = await api.cliente().get('/webhooks', { tempoLimiteMs: Number.NaN })

    expect(noCliente.erro?.categoria).toBe('configuracao')
    expect(naRequisicao.erro?.categoria).toBe('configuracao')
  })

  it('espera que lança ou devolve NaN cai na espera padrão daquela repetição', async () => {
    const api = apiSimulada({ status: 503 }, { status: 503 }, { status: 200, corpo: sucesso([]) })
    let chamada = 0
    const espera = () => {
      chamada++
      if (chamada === 1) throw new Error('erro na espera de quem usa')
      return Number.NaN
    }

    const resultado = await api.cliente({ retentativa: { espera } }).get('/webhooks')

    expect(resultado.sucesso).toBe(true)
    expect(api.esperas).toEqual([500, 1000])
  })
})

describe('tamanho da resposta', () => {
  it('resposta acima do limite pelo Content-Length vira resposta_grande, sem repetir', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso('x'.repeat(100)), cabecalhos: { 'Content-Length': '5000' } })

    const resultado = await api.cliente({ limiteDaRespostaBytes: 1000 }).get('/webhooks')

    expect(resultado.erro).toMatchObject({ categoria: 'resposta_grande', limiteBytes: 1000 })
    expect(api.chamadas).toHaveLength(1)
  })

  it('resposta sem Content-Length é cortada ao passar do limite enquanto é lida', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso('x'.repeat(5000)) })

    const resultado = await api.cliente({ limiteDaRespostaBytes: 1000 }).get('/webhooks')

    expect(resultado.erro).toMatchObject({ categoria: 'resposta_grande' })
  })

  it('resposta dentro do limite chega inteira', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso('x'.repeat(500)) })

    const resultado = await api.cliente({ limiteDaRespostaBytes: 1000 }).get<string>('/webhooks')

    expect(resultado.dados).toHaveLength(500)
  })

  it('limite zero falha como configuração', async () => {
    const resultado = await criarClienteRest({ chave: CHAVE_DE_TESTE, limiteDaRespostaBytes: 0 }).get('/webhooks')

    expect(resultado.erro?.categoria).toBe('configuracao')
  })
})

describe('consulta a partir de um filtro', () => {
  it('leva só as chaves aceitas e só valores simples', () => {
    const filtro = {
      status: 'aprovado',
      limite: 20,
      pagina: Number.NaN,
      nome: ['a', 'b'],
      cliente: { toString: () => 'x&status=removido' },
      extra: 'nao-vai',
    }

    const consulta = consultaDoFiltro(filtro, ['status', 'limite', 'pagina', 'nome', 'cliente'])

    expect(consulta).toEqual({ status: 'aprovado', limite: 20 })
  })

  it('valor com & ou = não acrescenta parâmetro, porque vai codificado', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({ total: 0, dados: [] }) })

    await api.cliente().get('/templates', { consulta: consultaDoFiltro({ nome: 'a&status=removido' }, ['nome']) })

    expect([...(api.chamadas[0]?.url.searchParams.keys() ?? [])]).toEqual(['nome'])
    expect(api.chamadas[0]?.url.searchParams.get('nome')).toBe('a&status=removido')
  })
})
