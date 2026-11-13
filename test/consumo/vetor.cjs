const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const vetor = JSON.parse(readFileSync(join(__dirname, 'assinatura-do-webhook.json'), 'utf8'))

/** Os casos do vetor compartilhado com o SDK C#, contra o pacote empacotado. */
function conferirVetor(verificarWebhook) {
  for (const caso of vetor.casos) {
    const resultado = verificarWebhook({
      corpo: vetor.corpo,
      cabecalhos: { 'x-lero-signature': caso.assinatura, 'x-lero-timestamp': String(vetor.timestamp) },
      segredo: vetor.segredo,
      agora: () => caso.agora * 1000,
    })
    assert.equal(resultado.sucesso, caso.aceita, caso.nome)
  }
}

module.exports = { conferirVetor }
