// Consumo como CommonJS (require), do pacote empacotado. Roda em scripts/conferir-consumo.mjs.
const assert = require('node:assert/strict')
const { criarClienteRest } = require('@lerolero/rest')
const { Erros, LeroLero, verificarWebhook } = require('@lerolero/sdk')
const { LeroLero: LeroLeroV1 } = require('@lerolero/sdk/v1')
const { CATALOGO_DE_ERROS } = require('@lerolero/types/v1')
const { conferirVetor } = require('./vetor.cjs')

assert.equal(LeroLero, LeroLeroV1)
assert.equal(LeroLero({ chave: 'lero_test_consumo' }).ambiente, 'teste')
assert.equal(criarClienteRest({ chave: 'lero_live_consumo' }).ambiente, 'producao')
assert.equal(Erros.Mensagens.IdempotenciaConflitante, 'EXM-0008')
assert.equal(CATALOGO_DE_ERROS['EXM-0008'].familia, 'EXM')

LeroLero({ chave: 'chave-errada' })
  .mensagens.obter('msg_1')
  .then((semChave) => {
    assert.equal(semChave.erro?.categoria, 'configuracao')
    conferirVetor(verificarWebhook)
    console.log('CommonJS (require): ok')
  })
