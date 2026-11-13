import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHAVE_DE_TESTE, apiSimulada, erro, sucesso } from '../../../test/apoio/apiSimulada.js'
import { lerChave } from '../src/chave.js'
import { criarClienteRest, rota } from '../src/index.js'
import { VERSAO_DO_SDK } from '../src/versao.js'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('chave da API', () => {
  it('descobre o ambiente pelo prefixo', () => {
    expect(lerChave('lero_test_abc')?.ambiente).toBe('teste')
    expect(lerChave('lero_live_abc')?.ambiente).toBe('producao')
    expect(lerChave('sk_live_abc')).toBeNull()
    expect(lerChave('lero_test_')).toBeNull()
  })

  it('sem chave, devolve falha de configuração sem chamar a API', async () => {
    vi.stubEnv('LERO_API_KEY', '')
    const api = apiSimulada({ status: 200, corpo: sucesso(true) })

    const resultado = await api.cliente({ chave: '' }).get('/webhooks')

    expect(resultado.sucesso).toBe(false)
    expect(resultado.erro?.categoria).toBe('configuracao')
    expect(resultado.detalhes.tentativas).toBe(0)
    expect(api.chamadas).toHaveLength(0)
  })

  it('lê a chave de LERO_API_KEY quando ela não vem nas opções', async () => {
    vi.stubEnv('LERO_API_KEY', 'lero_live_do_ambiente')
    const api = apiSimulada({ status: 200, corpo: sucesso([]) })

    const cliente = criarClienteRest({ efeitos: api.efeitos })
    await cliente.get('/webhooks')

    expect(cliente.ambiente).toBe('producao')
    expect(api.chamadas[0]?.cabecalhos.get('authorization')).toBe('Bearer lero_live_do_ambiente')
  })

  it('comAChave devolve um cliente novo e não muda o original', () => {
    const original = criarClienteRest({ chave: 'lero_test_a' })
    const outro = original.comAChave('lero_live_b')

    expect(original.ambiente).toBe('teste')
    expect(outro.ambiente).toBe('producao')
  })
})

describe('requisição', () => {
  it('manda a chave, a versão no caminho, o JSON e o User-Agent com a versão do pacote', async () => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'whk_1' }) })

    await api.cliente().post('/webhooks', { url: 'https://exemplo.com.br/lero' })

    const chamada = api.chamadas[0]
    expect(chamada?.url.toString()).toBe('https://api.lerolero.tech/v1/webhooks')
    expect(chamada?.metodo).toBe('POST')
    expect(chamada?.cabecalhos.get('authorization')).toBe(`Bearer ${CHAVE_DE_TESTE}`)
    expect(chamada?.cabecalhos.get('content-type')).toBe('application/json')
    expect(chamada?.cabecalhos.get('user-agent')).toContain(`lerolero-node/${VERSAO_DO_SDK}`)
    expect(chamada?.corpo).toBe('{"url":"https://exemplo.com.br/lero"}')
  })

  it('a versão do User-Agent é a do package.json', () => {
    const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
    expect(VERSAO_DO_SDK).toBe(pacote.version)
  })

  it('monta a query a partir de objeto ou URLSearchParams, sem os undefined', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({ total: 0, dados: [] }) })
    const cliente = api.cliente({ urlBase: 'http://localhost:5110/' })

    await cliente.get('/templates', { consulta: { status: 'aprovado', cliente: undefined, pagina: 0 } })
    await cliente.get('/templates', { consulta: new URLSearchParams({ nome: 'boleto' }) })

    expect(api.chamadas[0]?.url.toString()).toBe('http://localhost:5110/v1/templates?status=aprovado&pagina=0')
    expect(api.chamadas[1]?.url.searchParams.get('nome')).toBe('boleto')
  })

  it('rota escapa as partes variáveis, para um telefone não mudar o caminho', () => {
    expect(rota`/opt-outs/${'+5511984213307'}`).toBe('/opt-outs/%2B5511984213307')
    expect(rota`/clientes/${'a/b'}/limites`).toBe('/clientes/a%2Fb/limites')
  })

  it('a Authorization não pode ser trocada pelos cabeçalhos extras', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso(true) })

    await api.cliente({ cabecalhos: { Authorization: 'Bearer outra' } }).get('/webhooks', {
      cabecalhos: { 'X-Rastreio': 'abc' },
    })

    expect(api.chamadas[0]?.cabecalhos.get('authorization')).toBe(`Bearer ${CHAVE_DE_TESTE}`)
    expect(api.chamadas[0]?.cabecalhos.get('x-rastreio')).toBe('abc')
  })
})

describe('resposta', () => {
  it('devolve o data do envelope em dados', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({ id: 'msg_1', status: 'queued' }) })

    const resultado = await api.cliente().get<{ id: string }>('/messages/msg_1')

    expect(resultado).toEqual({
      sucesso: true,
      dados: { id: 'msg_1', status: 'queued' },
      erro: null,
      detalhes: { status: 200, tentativas: 1, chaveDeIdempotencia: null, repetida: false },
    })
  })

  it('204 vira sucesso sem dados', async () => {
    const api = apiSimulada({ status: 204 })

    const resultado = await api.cliente().delete('/webhooks/whk_1')

    expect(resultado.sucesso).toBe(true)
    expect(resultado.dados).toBeNull()
  })

  it('devolve o erro tipado da API, com a categoria e o como resolver do catálogo', async () => {
    const api = apiSimulada({
      status: 422,
      corpo: erro('EXM-0002', 'O contato não escreveu nas últimas 24h.', 2, 'texto'),
    })

    const resultado = await api.cliente().post('/messages', { to: '+5511993185520', texto: 'Oi' })

    expect(resultado.erro).toMatchObject({
      categoria: 'validacao',
      status: 422,
      code: 'EXM-0002',
      description: 'O contato não escreveu nas últimas 24h.',
      type: 2,
      field: 'texto',
      familia: 'EXM',
      comoResolver: 'Iniciar a conversa com um template aprovado',
      repetivel: false,
    })
  })

  it('código que o SDK ainda não conhece passa sem quebrar, sem os textos do catálogo', async () => {
    const api = apiSimulada({ status: 409, corpo: erro('EXZ-0001', 'Algo novo.', 3) })

    const resultado = await api.cliente().get('/novidade')

    expect(resultado.erro).toMatchObject({ categoria: 'conflito', code: 'EXZ-0001', familia: null, comoResolver: null })
  })

  it('aceita a lista de erros sem o envelope, como em algumas validações', async () => {
    const api = apiSimulada({ status: 400, corpo: [{ code: 'EXM-0001', description: 'Telefone inválido.', type: 2 }] })

    const resultado = await api.cliente().post('/messages', {})

    expect(resultado.erro).toMatchObject({ categoria: 'validacao', code: 'EXM-0001' })
  })

  it('resposta sem JSON (ex.: página do proxy) vira falha com o status', async () => {
    const api = apiSimulada({ status: 403, corpo: undefined })

    const resultado = await api.cliente({ retentativa: { maximo: 0 } }).get('/webhooks')

    expect(resultado.erro).toMatchObject({ categoria: 'permissao', code: 'HTTP-403' })
  })
})

describe('retentativa', () => {
  it('repete o GET em 503 com espera crescente', async () => {
    const api = apiSimulada({ status: 503 }, { status: 503 }, { status: 200, corpo: sucesso(true) })

    const resultado = await api.cliente().get('/webhooks')

    expect(resultado.sucesso).toBe(true)
    expect(resultado.detalhes.tentativas).toBe(3)
    expect(api.esperas).toEqual([500, 1000])
  })

  it('não repete POST em 500', async () => {
    const api = apiSimulada({ status: 500, corpo: erro('EXI-0001', 'Erro interno.', 1) })

    const resultado = await api.cliente().post('/clientes', { nome: 'Clínica Sorriso' })

    expect(api.chamadas).toHaveLength(1)
    expect(resultado.erro).toMatchObject({ categoria: 'inesperado' })
  })

  it('repete POST em 429 respeitando o Retry-After em segundos', async () => {
    const api = apiSimulada(
      { status: 429, corpo: erro('EXA-0004', 'Muitas requisições.', 0), cabecalhos: { 'Retry-After': '2' } },
      { status: 201, corpo: sucesso({ id: 'cli_1' }) },
    )

    const resultado = await api.cliente().post('/clientes', { nome: 'Clínica Sorriso' })

    expect(resultado.sucesso).toBe(true)
    expect(api.esperas).toEqual([2000])
  })

  it('lê o Retry-After em forma de data no 503', async () => {
    const api = apiSimulada(
      { status: 503, cabecalhos: { 'Retry-After': 'Fri, 13 Nov 2026 12:00:05 GMT' } },
      { status: 200, corpo: sucesso(true) },
    )

    await api.cliente().get('/webhooks')

    expect(api.esperas).toEqual([5000])
  })

  it('desiste e devolve o 429 quando o Retry-After passa do teto da espera', async () => {
    const api = apiSimulada({
      status: 429,
      corpo: erro('EXA-0004', 'Muitas requisições.', 0),
      cabecalhos: { 'Retry-After': '900' },
    })

    const resultado = await api.cliente().get('/webhooks')

    expect(api.chamadas).toHaveLength(1)
    expect(resultado.erro).toMatchObject({ categoria: 'limite', code: 'EXA-0004', repetivel: true })
  })

  it('repete POST com Idempotency-Key em 503 e mantém a mesma chave nas tentativas', async () => {
    const api = apiSimulada({ status: 503 }, { falha: 'timeout' }, { status: 202, corpo: sucesso({ id: 'msg_1' }) })

    const resultado = await api.cliente().post('/messages', { to: '+5511993185520' }, { idempotencia: {} })

    const chaves = api.chamadas.map((chamada) => chamada.cabecalhos.get('idempotency-key'))
    expect(chaves).toEqual(['chave-gerada-1', 'chave-gerada-1', 'chave-gerada-1'])
    expect(resultado.detalhes).toMatchObject({ tentativas: 3, chaveDeIdempotencia: 'chave-gerada-1' })
  })

  it('timeout em POST sem chave de idempotência não repete e avisa que pode ter sido processado', async () => {
    const api = apiSimulada({ falha: 'timeout' })

    const resultado = await api.cliente({ tempoLimiteMs: 1500 }).post('/clientes', { nome: 'Clínica Sorriso' })

    expect(api.chamadas).toHaveLength(1)
    expect(resultado.erro).toEqual({
      categoria: 'timeout',
      possivelmenteProcessada: true,
      description:
        'A API não respondeu em 1500 ms. O pedido pode ter sido processado: confira antes de tentar de novo.',
    })
  })

  it('timeout em GET repete até o máximo e devolve timeout sem efeito', async () => {
    const api = apiSimulada({ falha: 'timeout' })

    const resultado = await api.cliente({ retentativa: { maximo: 2 } }).get('/webhooks')

    expect(api.chamadas).toHaveLength(3)
    expect(resultado.erro).toMatchObject({ categoria: 'timeout', possivelmenteProcessada: false })
  })

  it('erro de rede vira falha de rede, com a causa', async () => {
    const api = apiSimulada({ falha: 'rede' })

    const resultado = await api.cliente({ retentativa: { maximo: 0 } }).get('/webhooks')

    expect(resultado.erro?.categoria).toBe('rede')
    expect(resultado.erro?.description).toContain('ECONNREFUSED')
  })

  it('as opções da requisição valem por cima das do cliente', async () => {
    const api = apiSimulada({ status: 503 })

    await api.cliente({ retentativa: { maximo: 5 } }).get('/webhooks', { retentativa: { maximo: 1, espera: () => 42 } })

    expect(api.chamadas).toHaveLength(2)
    expect(api.esperas).toEqual([42])
  })

  it('avisa aoTentarDeNovo e aoBaterLimite, e um erro neles não derruba a chamada', async () => {
    const api = apiSimulada({ status: 429, cabecalhos: { 'Retry-After': '1' } }, { status: 200, corpo: sucesso(true) })
    const tentativas: unknown[] = []
    const limites: unknown[] = []

    const resultado = await api
      .cliente({
        aoBaterLimite: (contexto) => {
          limites.push(contexto)
          throw new Error('erro no gancho de quem usa')
        },
        retentativa: { aoTentarDeNovo: (contexto) => void tentativas.push(contexto) },
      })
      .get('/webhooks')

    expect(resultado.sucesso).toBe(true)
    expect(limites).toEqual([{ metodo: 'GET', caminho: '/webhooks', retryAfterMs: 1000 }])
    expect(tentativas).toEqual([
      { metodo: 'GET', caminho: '/webhooks', repeticao: 1, motivo: 'status', status: 429, esperaMs: 1000 },
    ])
  })
})
