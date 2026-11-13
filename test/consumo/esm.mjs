// Consumo como ESM (import), do pacote empacotado. Roda em scripts/conferir-consumo.mjs.
import assert from 'node:assert/strict'
import { criarClienteRest } from '@lerolero/rest'
import { Erros, LeroLero, verificarWebhook } from '@lerolero/sdk'
import { LeroLero as LeroLeroV1 } from '@lerolero/sdk/v1'
import { CATALOGO_DE_ERROS } from '@lerolero/types/v1'
import { conferirVetor } from './vetor.mjs'

assert.equal(LeroLero, LeroLeroV1)
assert.equal(LeroLero({ chave: 'lero_test_consumo' }).ambiente, 'teste')
assert.equal(criarClienteRest({ chave: 'lero_live_consumo' }).ambiente, 'producao')
assert.equal(Erros.Mensagens.IdempotenciaConflitante, 'EXM-0008')
assert.equal(CATALOGO_DE_ERROS['EXM-0008'].familia, 'EXM')

const semChave = await LeroLero({ chave: 'chave-errada' }).mensagens.obter('msg_1')
assert.equal(semChave.erro?.categoria, 'configuracao')

conferirVetor(verificarWebhook)
console.log('ESM (import): ok')
