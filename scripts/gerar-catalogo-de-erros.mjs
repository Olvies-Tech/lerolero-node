// Gera packages/types/src/v1/erros/catalogo.gerado.ts a partir das duas fontes do catálogo de erros:
//   - o backend (os códigos, o tipo e o status HTTP): CodeErroLero.cs e LeroErro.cs do repositório LeroLero;
//   - a documentação (o significado e o como resolver): erros.ts do repositório lerolero-web.
// Roda à mão, não no CI, porque as fontes estão em outros repositórios:
//   node scripts/gerar-catalogo-de-erros.mjs [pasta do LeroLero] [pasta do lerolero-web]
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const [pastaDoBackend = '../LeroLero', pastaDoSite = '../lerolero-web'] = process.argv.slice(2)
const PASTA_DOS_ERROS = 'src/LeroLero.Domain.Core/Constants/Errors'
const DESTINO = new URL('../packages/types/src/v1/erros/catalogo.gerado.ts', import.meta.url)

// ErrorType do ErrorOr, que é o "type" da API, e o status HTTP que a API dá a cada um (LeroApiController.StatusDoErro).
const TIPOS = { Failure: 0, Unexpected: 1, Validation: 2, Conflict: 3, NotFound: 4, Unauthorized: 5, Forbidden: 6 }
const TIPOS_DO_CUSTOM = { 'ErroTipo.Falha': 0, 'ErroTipo.Proibido': 6 }
const STATUS_POR_TIPO = { 0: 502, 1: 500, 2: 422, 3: 409, 4: 404, 5: 401, 6: 403 }

// Repetir o mesmo pedido mais tarde resolve: instabilidade ou limite de velocidade, sem nada a corrigir no pedido.
const REPETIVEIS = new Set(['EXA-0004', 'EXN-0007', 'EXMT-0001', 'EXMT-0002', 'EXF-0001', 'EXBV-0004'])

// Os nomes dos grupos de Erros no SDK, a partir das classes do CodeErroLero.
const GRUPOS = {
  Acesso: 'Acesso',
  Cliente: 'Clientes',
  Numero: 'Numeros',
  Mensagem: 'Mensagens',
  Template: 'Templates',
  BoasVindas: 'BoasVindas',
  Campanha: 'Campanhas',
  Webhook: 'Webhooks',
  Meta: 'Meta',
  Faturamento: 'Faturamento',
}

// As famílias que a documentação ainda não tem.
const NOMES_SEM_DOCUMENTACAO = { EXBV: 'Boas-vindas', EXF: 'Faturamento' }

// Códigos cujo texto no backend é montado na hora (sem frase fixa) e que a documentação ainda não tem.
const TEXTOS_ESCRITOS_AQUI = {
  'EXC-0010': [
    'O id externo já é de outro cliente desta conta (409, `field: idExterno`)',
    'Usar outro id externo ou abrir o cadastro existente, citado na `description` quando está no seu acesso',
  ],
  'EXBV-0001': [
    'Este celular já recebeu a mensagem de boas-vindas do LeroLero, que sai uma vez só',
    'Seguir pelo Simulador; a data do envio está na `description`',
  ],
  'EXN-0009': [
    'A Meta limita quantos clientes novos podem ser conectados por período neste começo, e o limite foi atingido (429)',
    'Tentar de novo em alguns dias; quem já tem número conectado não conta',
  ],
  'EXN-0010': [
    'O plano não permite mais números da Meta: ao conectar, a conta já chegou no total; no envio, o número está além do plano e só recebe',
    'Trocar de plano em Faturamento ou escolher em Números quais números ficam no plano',
  ],
  'EXF-0002': [
    'O serviço de pagamentos recusou o pedido; a `description` traz o motivo',
    'Corrigir o que o motivo aponta (ex.: dados do cartão) e tentar de novo',
  ],
  'EXF-0003': ['O serviço de pagamentos ainda não oferece essa operação (502)', 'Falar com o suporte'],
  'EXF-0004': [
    'O plano ainda não está à venda nessa periodicidade: falta o preço dele no serviço de pagamentos',
    'Escolher outra periodicidade ou falar com o suporte',
  ],
  'EXN-0011': [
    'A escolha dos números que ficam no plano não vale (acima do limite, número do Simulador ou conta sem plano)',
    'Escolher em Números só números da Meta, dentro do limite do plano; a `description` diz o motivo',
  ],
  'EXTP-0009': [
    'O template não pode ser editado agora; a `description` diz o motivo',
    'Seguir o motivo da `description` ou criar uma versão nova do template',
  ],
  'EXTP-0010': [
    'A Meta limita as edições de um template aprovado e o limite foi atingido',
    'Esperar a data de `edicao.liberaEm` em `GET /v1/templates/{id}` ou criar uma versão nova',
  ],
  'EXTP-0012': [
    'Falta um dado do cliente para criar a cópia do modelo; a `description` diz qual',
    'Completar o cadastro do cliente com o dado citado e tentar de novo',
  ],
}

const codigos = lerCodigos(await lerArquivo(pastaDoBackend, PASTA_DOS_ERROS, 'CodeErroLero.cs'))
const erros = lerErrosDoBackend(await lerArquivo(pastaDoBackend, PASTA_DOS_ERROS, 'LeroErro.cs'), codigos)
const documentacao = lerDocumentacao(await lerArquivo(pastaDoSite, 'src/paginas/docs/conteudo', 'erros.ts'))

const catalogo = codigos.map((codigo) =>
  montarEntrada(codigo, erros.get(codigo.code), documentacao.linhas.get(codigo.code)),
)
await writeFile(DESTINO, gerarArquivo(catalogo, documentacao))
relatar(catalogo, documentacao)

function lerArquivo(pasta, ...caminho) {
  return readFile(join(pasta, ...caminho), 'utf8')
}

function lerCodigos(fonte) {
  const resultado = []
  let classe = null
  for (const linha of fonte.split(/\r?\n/)) {
    const novaClasse = linha.match(/public static class (\w+)/)?.[1]
    if (novaClasse && novaClasse !== 'CodeErroLero') classe = novaClasse
    const constante = linha.match(/public const string (\w+)\s*=\s*"(EX[A-Z]+-\d{4})"/)
    if (constante) resultado.push({ classe, nome: constante[1], code: constante[2] })
  }
  return resultado
}

function lerErrosDoBackend(fonte, codigos) {
  const porCodigo = new Map()
  for (const trecho of fonte.split(/public static (?:readonly Error|Error) /).slice(1)) {
    const codigo = trecho.match(/CodeErroLero\.(\w+)\.(\w+)/)
    if (!codigo) continue
    const tipo = tipoDoErro(trecho)
    const status = Number(trecho.match(/ErroMetadados\.Status\((\d+)\)/)?.[1] ?? STATUS_POR_TIPO[tipo])
    porCodigo.set(`${codigo[1]}.${codigo[2]}`, { tipo, status, descricao: primeiraFrase(trecho) })
  }
  return new Map(codigos.map((c) => [c.code, porCodigo.get(`${c.classe}.${c.nome}`)]))
}

function tipoDoErro(trecho) {
  const custom = trecho.match(/Error\.Custom\((ErroTipo\.\w+)/)?.[1]
  if (custom) return TIPOS_DO_CUSTOM[custom]
  return TIPOS[trecho.match(/Error\.(\w+)\(/)?.[1]]
}

// A frase fixa do erro. A interpolada ($"...{valor}...") não serve de catálogo: o código vai para TEXTOS_ESCRITOS_AQUI.
function primeiraFrase(trecho) {
  const literal = trecho.match(/(\$?)"((?:[^"\\]|\\.)*)"/)
  if (!literal || literal[1] === '$' || !/^[A-ZÀ-Ú]/.test(literal[2])) return null
  return literal[2].replace(/\\"/g, '"')
}

function lerDocumentacao(fonte) {
  const linhas = new Map()
  const familias = new Map()
  for (const [, nome, sigla] of fonte.matchAll(/h: '([^']+) · (EX[A-Z]+)'/g)) familias.set(sigla, nome)
  for (const [, code, corpo] of fonte.matchAll(/\[\s*'(EX[A-Z]+-\d{4})',((?:\s*'(?:[^'\\]|\\.)*',?)+)\s*\]/g)) {
    const textos = [...corpo.matchAll(/'((?:[^'\\]|\\.)*)'/g)].map(([, texto]) => texto.replace(/\\'/g, "'"))
    const [significado, comoResolver] = textos.slice(-2)
    const anterior = linhas.get(code)
    linhas.set(
      code,
      anterior
        ? {
            significado: `${anterior.significado}. Ou: ${significado}`,
            comoResolver: `${anterior.comoResolver}. Ou: ${comoResolver}`,
          }
        : { significado, comoResolver },
    )
  }
  return { linhas, familias }
}

function montarEntrada(codigo, backend, documentado) {
  const textos = documentado ?? textosSemDocumentacao(codigo.code, backend?.descricao)
  return {
    code: codigo.code,
    grupo: GRUPOS[codigo.classe],
    constante: codigo.nome,
    familia: codigo.code.split('-')[0],
    status: backend?.status ?? null,
    type: backend?.tipo ?? null,
    significado: textos.significado,
    comoResolver: textos.comoResolver,
    repetivel: REPETIVEIS.has(codigo.code),
    fonteDoTexto: documentado ? 'documentacao' : 'backend',
  }
}

function textosSemDocumentacao(code, descricao) {
  const escrito = TEXTOS_ESCRITOS_AQUI[code]
  if (escrito) return { significado: escrito[0], comoResolver: escrito[1] }
  if (!descricao)
    throw new Error(`${code} não tem texto na documentação nem frase fixa no backend: escreva em TEXTOS_ESCRITOS_AQUI.`)
  const [primeira, ...resto] = descricao.split(/(?<=\.)\s+/)
  return {
    significado: (primeira ?? '').replace(/\.$/, ''),
    comoResolver: resto.join(' ').replace(/\.$/, '') || 'Seguir o que a `description` do erro diz',
  }
}

function gerarArquivo(entradas, documentacaoLida) {
  const familias = [...new Set(entradas.map((e) => e.familia))]
  const nomeDaFamilia = (sigla) => documentacaoLida.familias.get(sigla) ?? NOMES_SEM_DOCUMENTACAO[sigla]
  return `// Gerado por scripts/gerar-catalogo-de-erros.mjs a partir do backend e da documentação. Não edite à mão.
import type { EntradaDoCatalogo } from './entrada.js'

/** As famílias de erro: \`EX\` + a sigla do assunto. */
export type FamiliaDoErro = ${familias.map((f) => `'${f}'`).join(' | ')}

/** O nome de cada família, como na documentação. */
export const FAMILIAS_DE_ERRO: Readonly<Record<FamiliaDoErro, string>> = {
${familias.map((f) => `  ${f}: ${JSON.stringify(nomeDaFamilia(f))},`).join('\n')}
}

/** Todos os códigos que a API devolve hoje. */
export type CodigoConhecido =
${entradas.map((e) => `  | '${e.code}'`).join('\n')}

/** O catálogo: família, status HTTP, \`type\`, o significado e como resolver de cada código. */
export const CATALOGO_DE_ERROS: Readonly<Record<CodigoConhecido, EntradaDoCatalogo>> = {
${entradas.map(gerarEntrada).join('\n')}
}

/**
 * Os códigos com nome, por assunto, para comparar sem decorar o número.
 *
 * @example
 * if (resultado.erro?.code === Erros.Mensagens.JanelaFechada) enviarTemplate()
 */
export const Erros = {
${Object.values(GRUPOS)
  .map((grupo) =>
    gerarGrupo(
      grupo,
      entradas.filter((e) => e.grupo === grupo),
    ),
  )
  .join('\n')}
} as const
`
}

function gerarEntrada(e) {
  const campos = [
    `familia: '${e.familia}'`,
    `status: ${e.status}`,
    `type: ${e.type}`,
    `significado: ${JSON.stringify(e.significado)}`,
    `comoResolver: ${JSON.stringify(e.comoResolver)}`,
    `repetivel: ${e.repetivel}`,
  ]
  return `  '${e.code}': { ${campos.join(', ')} },`
}

function gerarGrupo(grupo, entradas) {
  const constantes = entradas.map(
    (e) => `    /** ${e.code} · ${jsdoc(e.significado)}. Como resolver: ${jsdoc(e.comoResolver)}. */
    ${e.constante}: '${e.code}',`,
  )
  return `  ${grupo}: {\n${constantes.join('\n')}\n  },`
}

function jsdoc(texto) {
  return texto.replace(/\*\//g, '*\\/').replace(/\.$/, '')
}

function relatar(entradas, documentacaoLida) {
  const doBackend = new Set(entradas.map((e) => e.code))
  const semDocumentacao = entradas.filter((e) => e.fonteDoTexto === 'backend').map((e) => e.code)
  const soNaDocumentacao = [...documentacaoLida.linhas.keys()].filter((code) => !doBackend.has(code))
  console.log(`catalogo.gerado.ts: ${entradas.length} códigos.`)
  console.log(
    `No backend e fora da documentação (${semDocumentacao.length}): ${semDocumentacao.join(', ') || 'nenhum'}`,
  )
  console.log(
    `Na documentação e fora do backend (${soNaDocumentacao.length}): ${soNaDocumentacao.join(', ') || 'nenhum'}`,
  )
}
