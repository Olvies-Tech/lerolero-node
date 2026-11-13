import { describe, expect, it } from 'vitest'
import {
  CATALOGO_DE_ERROS,
  Erros,
  FAMILIAS_DE_ERRO,
  type RespostaDaApi,
  ehDaFamilia,
  ehErro,
  entradaDoCatalogo,
} from '../src/v1/index.js'

const entradas = Object.entries(CATALOGO_DE_ERROS)

describe('catálogo de erros', () => {
  it('tem os 81 códigos do backend', () => {
    expect(entradas).toHaveLength(81)
  })

  it.each(entradas)('%s tem significado e como resolver', (_codigo, entrada) => {
    expect(entrada.significado.trim().length).toBeGreaterThan(10)
    expect(entrada.comoResolver.trim().length).toBeGreaterThan(5)
  })

  it('nenhum texto usa travessão', () => {
    const travessao = String.fromCharCode(0x2014)
    const textos = entradas.flatMap(([, entrada]) => [entrada.significado, entrada.comoResolver])
    expect(textos.filter((texto) => texto.includes(travessao))).toEqual([])
  })

  it('cada código fica na família do prefixo, e toda família tem nome', () => {
    for (const [codigo, entrada] of entradas) {
      expect(codigo.startsWith(`${entrada.familia}-`)).toBe(true)
      expect(FAMILIAS_DE_ERRO[entrada.familia]).toBeTruthy()
    }
  })

  it('as constantes com nome apontam para códigos do catálogo, sem repetir', () => {
    const constantes = Object.values(Erros).flatMap((grupo) => Object.values(grupo))
    expect(new Set(constantes).size).toBe(entradas.length)
    expect(Erros.Mensagens.IdempotenciaConflitante).toBe('EXM-0008')
  })

  it('marca como repetível só o que se resolve repetindo mais tarde', () => {
    expect(entradaDoCatalogo('EXA-0004')).toMatchObject({ status: 429, repetivel: true })
    expect(entradaDoCatalogo('EXMT-0001')?.repetivel).toBe(true)
    expect(entradaDoCatalogo('EXM-0002')?.repetivel).toBe(false)
    expect(entradaDoCatalogo('EXZ-0001')).toBeNull()
  })
})

describe('ehErro e ehDaFamilia', () => {
  const falhaDaJanela: RespostaDaApi<never> = {
    sucesso: false,
    dados: null,
    erro: {
      categoria: 'validacao',
      status: 422,
      code: 'EXM-0002',
      description: 'O contato não escreveu nas últimas 24h.',
      type: 2,
      field: 'texto',
      familia: 'EXM',
      significado: null,
      comoResolver: null,
      repetivel: false,
      erros: [],
    },
    detalhes: { status: 422, tentativas: 1, chaveDeIdempotencia: null, repetida: false },
  }

  it('reconhece o código e a família', () => {
    expect(ehErro(falhaDaJanela, Erros.Mensagens.JanelaFechada)).toBe(true)
    expect(ehErro(falhaDaJanela, 'EXM-0008')).toBe(false)
    expect(ehDaFamilia(falhaDaJanela, 'EXM')).toBe(true)
    expect(ehDaFamilia(falhaDaJanela, 'EXMT')).toBe(false)
  })

  it('não confunde erro sem código (rede, tempo) com erro da API', () => {
    const semRede: RespostaDaApi<never> = {
      sucesso: false,
      dados: null,
      erro: { categoria: 'rede', description: 'A requisição não chegou à API.' },
      detalhes: { status: null, tentativas: 1, chaveDeIdempotencia: null, repetida: false },
    }
    expect(ehErro(semRede, 'EXM-0002')).toBe(false)
    expect(ehDaFamilia(semRede, 'EXM')).toBe(false)
  })
})
