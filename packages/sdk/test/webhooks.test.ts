import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assinar } from '../src/v1/assinaturaDoWebhook.js'
import { LeroLero, verificarWebhook } from '../src/v1/index.js'

const vetor: {
  segredo: string
  timestamp: number
  corpo: string
  assinatura: string
  casos: { nome: string; agora: number; assinatura: string; aceita: boolean; motivo?: string }[]
} = JSON.parse(readFileSync(new URL('../../../vetores/assinatura-do-webhook.json', import.meta.url), 'utf8'))

const cabecalhosDoVetor = (assinatura = vetor.assinatura) => ({
  'X-Lero-Signature': assinatura,
  'X-Lero-Timestamp': String(vetor.timestamp),
  'X-Lero-Event-Id': 'evt_789',
})
const umMinutoDepois = () => (vetor.timestamp + 60) * 1000

describe('vetor de teste compartilhado com o SDK C#', () => {
  it('assina como o backend', () => {
    expect(assinar(vetor.segredo, String(vetor.timestamp), Buffer.from(vetor.corpo))).toBe(vetor.assinatura)
  })

  it.each(vetor.casos)('$nome', (caso) => {
    const resultado = verificarWebhook({
      corpo: vetor.corpo,
      cabecalhos: cabecalhosDoVetor(caso.assinatura),
      segredo: vetor.segredo,
      agora: () => caso.agora * 1000,
    })

    expect(resultado.sucesso).toBe(caso.aceita)
    if (caso.motivo) expect(resultado.erro).toMatchObject({ categoria: 'webhook', motivo: caso.motivo })
  })
})

describe('webhooks.verificar', () => {
  it('aceita o webhook real e devolve o evento tipado', () => {
    const lero = LeroLero({ chave: 'lero_test_x', segredoDoWebhook: vetor.segredo, efeitos: { agora: umMinutoDepois } })

    const verificacao = lero.webhooks.verificar(vetor.corpo, cabecalhosDoVetor())

    if (!verificacao.sucesso) throw new Error(verificacao.erro.description)
    if (verificacao.dados.evento !== 'message.button_reply') throw new Error('evento inesperado')
    expect(verificacao.dados.resposta.payload).toBe('CONFIRMAR:123')
    expect(verificacao.dados.contato.nome).toBe('Ana Lúcia')
  })

  it('aceita o corpo em bytes e os cabeçalhos como Headers ou como lista do Node', () => {
    const comHeaders = verificarWebhook({
      corpo: Buffer.from(vetor.corpo),
      cabecalhos: new Headers(cabecalhosDoVetor()),
      segredo: vetor.segredo,
      agora: umMinutoDepois,
    })
    const comLista = verificarWebhook({
      corpo: vetor.corpo,
      cabecalhos: { 'x-lero-signature': [vetor.assinatura], 'x-lero-timestamp': String(vetor.timestamp) },
      segredo: vetor.segredo,
      agora: umMinutoDepois,
    })

    expect(comHeaders.sucesso).toBe(true)
    expect(comLista.sucesso).toBe(true)
  })

  it('recusa o corpo alterado depois de assinado', () => {
    const resultado = verificarWebhook({
      corpo: vetor.corpo.replace('CONFIRMAR', 'CANCELAR'),
      cabecalhos: cabecalhosDoVetor(),
      segredo: vetor.segredo,
      agora: umMinutoDepois,
    })

    expect(resultado.erro).toMatchObject({ categoria: 'webhook', motivo: 'assinatura_invalida' })
  })

  it('recusa o timestamp do futuro além da tolerância', () => {
    const resultado = verificarWebhook({
      corpo: vetor.corpo,
      cabecalhos: cabecalhosDoVetor(),
      segredo: vetor.segredo,
      agora: () => (vetor.timestamp - 301) * 1000,
    })

    expect(resultado.erro).toMatchObject({ motivo: 'timestamp_fora_da_tolerancia' })
  })

  it('recusa sem os cabeçalhos, com timestamp que não é número e com corpo que não é evento', () => {
    const semCabecalhos = verificarWebhook({ corpo: vetor.corpo, cabecalhos: {}, segredo: vetor.segredo })
    const timestampTorto = verificarWebhook({
      corpo: vetor.corpo,
      cabecalhos: { 'x-lero-signature': vetor.assinatura, 'x-lero-timestamp': 'ontem' },
      segredo: vetor.segredo,
    })
    const naoEvento = '{"ola":"mundo"}'
    const corpoInvalido = verificarWebhook({
      corpo: naoEvento,
      cabecalhos: {
        'x-lero-signature': assinar(vetor.segredo, String(vetor.timestamp), Buffer.from(naoEvento)),
        'x-lero-timestamp': String(vetor.timestamp),
      },
      segredo: vetor.segredo,
      agora: umMinutoDepois,
    })

    expect(semCabecalhos.erro).toMatchObject({ motivo: 'sem_cabecalhos' })
    expect(timestampTorto.erro).toMatchObject({ motivo: 'timestamp_invalido' })
    expect(corpoInvalido.erro).toMatchObject({ motivo: 'corpo_invalido' })
  })

  it('sem segredo, avisa a configuração em vez de aceitar', () => {
    const lero = LeroLero({ chave: 'lero_test_x', segredoDoWebhook: '' })

    const verificacao = lero.webhooks.verificar(vetor.corpo, cabecalhosDoVetor())

    expect(verificacao.erro).toMatchObject({ categoria: 'configuracao' })
  })
})
