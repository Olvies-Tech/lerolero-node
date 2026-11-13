// Compila num projeto TypeScript mínimo, contra os tipos do pacote empacotado (nodenext e bundler).
import { type EventoDoWebhook, LeroLero, ehErro } from '@lerolero/sdk'

declare const chave: string
declare const corpo: string
declare const cabecalhos: Headers

const lero = LeroLero({ chave })

export async function enviar(): Promise<string | null> {
  const resultado = await lero.mensagens.enviar({ to: '+5511993185520', template: 'boas_vindas' })
  if (ehErro(resultado, 'EXM-0002')) return resultado.erro.comoResolver
  return resultado.sucesso ? resultado.dados.id : resultado.erro.description
}

export function receber(): EventoDoWebhook['evento'] | null {
  const verificacao = lero.webhooks.verificar(corpo, cabecalhos, 'segredo')
  return verificacao.sucesso ? verificacao.dados.evento : null
}
