import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const vetor = JSON.parse(readFileSync(new URL('./assinatura-do-webhook.json', import.meta.url), 'utf8'))

/** Os casos do vetor compartilhado com o SDK C#, contra o pacote empacotado. */
export function conferirVetor(verificarWebhook) {
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
