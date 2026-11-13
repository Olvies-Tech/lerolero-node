import { describe, expect, it } from 'vitest'
import { CHAVE_DE_TESTE, apiSimulada, sucesso } from '../../../test/apoio/apiSimulada.js'
import { LeroLero } from '../src/v1/index.js'

type Cliente = ReturnType<typeof LeroLero>

interface Caso {
  nome: string
  chamar: (lero: Cliente) => Promise<unknown>
  esperado: { metodo: string; caminho: string; corpo?: unknown }
}

const CASOS: Caso[] = [
  {
    nome: 'midias.obter',
    chamar: (lero) => lero.midias.obter('med_1'),
    esperado: { metodo: 'GET', caminho: '/v1/media/med_1' },
  },
  {
    nome: 'templates.criar como rascunho',
    chamar: (lero) =>
      lero.templates.criar(
        {
          nome: 'boas_vindas',
          categoria: 'utility',
          idioma: 'pt_BR',
          corpo: 'Olá {{nome}}',
          exemplos: { nome: 'Ana' },
        },
        { rascunho: true },
      ),
    esperado: {
      metodo: 'POST',
      caminho: '/v1/templates?rascunho=true',
      corpo: {
        nome: 'boas_vindas',
        categoria: 'utility',
        idioma: 'pt_BR',
        corpo: 'Olá {{nome}}',
        exemplos: { nome: 'Ana' },
      },
    },
  },
  {
    nome: 'templates.listar com filtro',
    chamar: (lero) => lero.templates.listar({ status: 'aprovado', cliente: 'clinica-sorriso', limite: 20 }),
    esperado: { metodo: 'GET', caminho: '/v1/templates?status=aprovado&cliente=clinica-sorriso&limite=20' },
  },
  {
    nome: 'templates.obter',
    chamar: (lero) => lero.templates.obter('tpl_1'),
    esperado: { metodo: 'GET', caminho: '/v1/templates/tpl_1' },
  },
  {
    nome: 'conversas.janela',
    chamar: (lero) => lero.conversas.janela({ telefones: ['+5511993185520'], cliente: 'clinica-sorriso' }),
    esperado: {
      metodo: 'POST',
      caminho: '/v1/conversas/janela',
      corpo: { telefones: ['+5511993185520'], cliente: 'clinica-sorriso' },
    },
  },
  {
    nome: 'optOuts.adicionar',
    chamar: (lero) => lero.optOuts.adicionar({ telefone: '+5511984213307', motivo: 'Pediu por e-mail' }),
    esperado: {
      metodo: 'POST',
      caminho: '/v1/opt-outs',
      corpo: { telefone: '+5511984213307', motivo: 'Pediu por e-mail' },
    },
  },
  {
    nome: 'optOuts.remover com o + escapado',
    chamar: (lero) => lero.optOuts.remover('+5511984213307', { cliente: 'clinica-sorriso' }),
    esperado: { metodo: 'DELETE', caminho: '/v1/opt-outs/%2B5511984213307?cliente=clinica-sorriso' },
  },
  {
    nome: 'clientes.criar',
    chamar: (lero) => lero.clientes.criar({ nome: 'Clínica Sorriso', idExterno: 'clinica-sorriso' }),
    esperado: {
      metodo: 'POST',
      caminho: '/v1/clientes',
      corpo: { nome: 'Clínica Sorriso', idExterno: 'clinica-sorriso' },
    },
  },
  {
    nome: 'clientes.listar',
    chamar: (lero) => lero.clientes.listar({ busca: 'sorriso', pagina: 0 }),
    esperado: { metodo: 'GET', caminho: '/v1/clientes?busca=sorriso&pagina=0' },
  },
  {
    nome: 'clientes.obter pelo id externo',
    chamar: (lero) => lero.clientes.obter('clinica-sorriso'),
    esperado: { metodo: 'GET', caminho: '/v1/clientes/clinica-sorriso' },
  },
  {
    nome: 'webhooks.criar',
    chamar: (lero) => lero.webhooks.criar({ url: 'https://exemplo.com.br/lero', eventos: ['message.status_updated'] }),
    esperado: {
      metodo: 'POST',
      caminho: '/v1/webhooks',
      corpo: { url: 'https://exemplo.com.br/lero', eventos: ['message.status_updated'] },
    },
  },
  {
    nome: 'webhooks.listar',
    chamar: (lero) => lero.webhooks.listar(),
    esperado: { metodo: 'GET', caminho: '/v1/webhooks' },
  },
  {
    nome: 'webhooks.remover',
    chamar: (lero) => lero.webhooks.remover('whk_1'),
    esperado: { metodo: 'DELETE', caminho: '/v1/webhooks/whk_1' },
  },
  {
    nome: 'rest.get numa rota fora dos módulos (GET /v1/contatos)',
    chamar: (lero) => lero.rest.get('/contatos', { consulta: { limite: 5 } }),
    esperado: { metodo: 'GET', caminho: '/v1/contatos?limite=5' },
  },
]

describe('cada método chama a rota certa da API', () => {
  it.each(CASOS)('$nome', async ({ chamar, esperado }) => {
    const api = apiSimulada({ status: 200, corpo: sucesso({}) })

    const resultado = await chamar(LeroLero({ chave: CHAVE_DE_TESTE, efeitos: api.efeitos }))

    const chamada = api.chamadas[0]
    expect(resultado).toMatchObject({ sucesso: true })
    expect(`${chamada?.metodo} ${chamada?.url.pathname}${chamada?.url.search}`).toBe(
      `${esperado.metodo} ${esperado.caminho}`,
    )
    if (esperado.corpo !== undefined) expect(JSON.parse(String(chamada?.corpo))).toEqual(esperado.corpo)
  })
})

describe('midias.subir', () => {
  it('manda o arquivo em multipart no campo arquivo, com o nome e o tipo', async () => {
    const api = apiSimulada({ status: 201, corpo: sucesso({ id: 'med_1' }) })
    const lero = LeroLero({ chave: CHAVE_DE_TESTE, efeitos: api.efeitos })

    await lero.midias.subir({
      conteudo: new TextEncoder().encode('%PDF-1.4'),
      nome: 'boleto.pdf',
      tipo: 'application/pdf',
    })

    const formulario = api.chamadas[0]?.corpo
    if (!(formulario instanceof FormData)) throw new Error('o corpo deveria ser FormData')
    const arquivo = formulario.get('arquivo')
    if (!(arquivo instanceof Blob)) throw new Error('o campo arquivo deveria ser um arquivo')
    expect(api.chamadas[0]?.cabecalhos.get('content-type')).toBeNull()
    expect(arquivo.type).toBe('application/pdf')
    expect(await arquivo.text()).toBe('%PDF-1.4')
  })
})

describe('ambiente', () => {
  it('teste ou produção pela própria chave, sem configuração', () => {
    expect(LeroLero({ chave: 'lero_test_x' }).ambiente).toBe('teste')
    expect(LeroLero({ chave: 'lero_live_x' }).ambiente).toBe('producao')
    expect(LeroLero({ chave: 'outra' }).ambiente).toBeNull()
  })
})
