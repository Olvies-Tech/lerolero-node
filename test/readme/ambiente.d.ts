// O que os exemplos dos READMEs usam e não vem do SDK: o mínimo do Express e as funções do sistema de quem integra.

declare module 'express' {
  interface Requisicao {
    body: Buffer
    headers: Record<string, string | string[] | undefined>
  }
  interface Resposta {
    status(codigo: number): Resposta
    send(corpo?: string): Resposta
    sendStatus(codigo: number): Resposta
  }
  type Rota = (req: Requisicao, res: Resposta) => unknown
  interface Aplicacao {
    post(caminho: string, ...rotas: Rota[]): void
  }
  interface Express {
    (): Aplicacao
    raw(opcoes: { type: string }): Rota
  }
  const express: Express
  export default express
}

declare function atualizarStatus(mensagemId: string, status: string): void
declare function registrarResposta(metadata: unknown, payload: string | null): void
declare function tirarDaLista(telefone: string): void
