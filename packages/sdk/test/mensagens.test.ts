import { describe, expect, it } from 'vitest'
import { CHAVE_DE_TESTE, apiSimulada, erro, sucesso } from '../../../test/apoio/apiSimulada.js'
import { Erros, LeroLero, ehErro } from '../src/v1/index.js'

const ENFILEIRADA = sucesso({ id: 'msg_4kd8s2m9x7q3w5e1r6t2y8u4', status: 'queued' })

function lero(api: ReturnType<typeof apiSimulada>) {
  return LeroLero({ chave: CHAVE_DE_TESTE, efeitos: api.efeitos })
}

describe('mensagens.enviar', () => {
  it('envia o template em POST /v1/messages com o corpo exato da API', async () => {
    const api = apiSimulada({ status: 202, corpo: ENFILEIRADA })

    const resultado = await lero(api).mensagens.enviar({
      to: '+5511993185520',
      template: 'confirmacao_agendamento',
      variaveis: { nome: 'Ana', hora: '14h' },
      botoes: [{ payload: 'CONFIRMAR:123' }],
      metadata: { agendamentoId: '123' },
    })

    expect(resultado.dados).toEqual({ id: 'msg_4kd8s2m9x7q3w5e1r6t2y8u4', status: 'queued' })
    expect(api.chamadas[0]?.url.pathname).toBe('/v1/messages')
    expect(JSON.parse(String(api.chamadas[0]?.corpo))).toEqual({
      to: '+5511993185520',
      template: 'confirmacao_agendamento',
      variaveis: { nome: 'Ana', hora: '14h' },
      botoes: [{ payload: 'CONFIRMAR:123' }],
      metadata: { agendamentoId: '123' },
    })
  })

  it('gera a Idempotency-Key quando o dev não passa e devolve em detalhes', async () => {
    const api = apiSimulada({ status: 202, corpo: ENFILEIRADA })

    const resultado = await lero(api).mensagens.enviar({ to: '+5511993185520', texto: 'Seu pedido saiu.' })

    expect(api.chamadas[0]?.cabecalhos.get('idempotency-key')).toBe('chave-gerada-1')
    expect(resultado.detalhes.chaveDeIdempotencia).toBe('chave-gerada-1')
  })

  it('usa a chaveDeIdempotencia do dev', async () => {
    const api = apiSimulada({ status: 202, corpo: ENFILEIRADA })

    await lero(api).mensagens.enviar(
      { to: '+5511993185520', template: 'lembrete' },
      { chaveDeIdempotencia: 'agendamento-123-lembrete' },
    )

    expect(api.chamadas[0]?.cabecalhos.get('idempotency-key')).toBe('agendamento-123-lembrete')
  })

  it('repete o envio após timeout com a mesma Idempotency-Key, sem duplicar', async () => {
    const api = apiSimulada(
      { falha: 'timeout' },
      { status: 202, corpo: ENFILEIRADA, cabecalhos: { 'Idempotent-Replayed': 'true' } },
    )

    const resultado = await lero(api).mensagens.enviar({ to: '+5511993185520', template: 'lembrete' })

    expect(resultado.sucesso).toBe(true)
    expect(api.chamadas.map((chamada) => chamada.cabecalhos.get('idempotency-key'))).toEqual([
      'chave-gerada-1',
      'chave-gerada-1',
    ])
    expect(resultado.detalhes).toMatchObject({ tentativas: 2, repetida: true })
  })

  it('depois de esgotar o tempo, o dev reenvia com a chave de detalhes e recebe a mesma mensagem', async () => {
    const api = apiSimulada(
      { falha: 'timeout' },
      { falha: 'timeout' },
      { falha: 'timeout' },
      { falha: 'timeout' },
      { status: 202, corpo: ENFILEIRADA, cabecalhos: { 'Idempotent-Replayed': 'true' } },
    )
    const cliente = lero(api)

    const primeira = await cliente.mensagens.enviar({ to: '+5511993185520', template: 'lembrete' })
    const chave = primeira.detalhes.chaveDeIdempotencia ?? ''
    const segunda = await cliente.mensagens.enviar(
      { to: '+5511993185520', template: 'lembrete' },
      { chaveDeIdempotencia: chave },
    )

    expect(primeira.erro).toMatchObject({ categoria: 'timeout', possivelmenteProcessada: true })
    expect(segunda.dados?.id).toBe('msg_4kd8s2m9x7q3w5e1r6t2y8u4')
    expect(segunda.detalhes.repetida).toBe(true)
    expect(new Set(api.chamadas.map((chamada) => chamada.cabecalhos.get('idempotency-key')))).toEqual(new Set([chave]))
  })

  it('a janela fechada volta como EXM-0002, com o campo e o como resolver', async () => {
    const api = apiSimulada({
      status: 422,
      corpo: erro('EXM-0002', 'O contato não escreveu nas últimas 24h.', 2, 'texto'),
    })

    const resultado = await lero(api).mensagens.enviar({ to: '+5511993185520', texto: 'Oi' })

    expect(ehErro(resultado, Erros.Mensagens.JanelaFechada)).toBe(true)
    if (!ehErro(resultado, 'EXM-0002')) throw new Error('o erro deveria ser EXM-0002')
    expect(resultado.erro.field).toBe('texto')
    expect(resultado.erro.comoResolver).toBe('Iniciar a conversa com um template aprovado')
  })
})

describe('mensagens.obter e cancelar', () => {
  it('obter faz GET na mensagem e cancelar faz DELETE, com o id escapado', async () => {
    const api = apiSimulada({ status: 200, corpo: sucesso({ id: 'msg_1', status: 'canceled' }) })
    const cliente = lero(api)

    await cliente.mensagens.obter('msg_1')
    await cliente.mensagens.cancelar('msg_1')

    expect(api.chamadas.map((chamada) => `${chamada.metodo} ${chamada.url.pathname}`)).toEqual([
      'GET /v1/messages/msg_1',
      'DELETE /v1/messages/msg_1',
    ])
  })
})
