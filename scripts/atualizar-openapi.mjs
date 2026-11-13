// Baixa o OpenAPI da API (padrão: a local em desenvolvimento), guarda só as rotas /v1 e os esquemas que elas usam.
// Uso: node scripts/atualizar-openapi.mjs [url]
import { writeFile } from 'node:fs/promises'

const URL_PADRAO = 'http://localhost:5110/swagger/v1/swagger.json'
const DESTINO = new URL('../openapi/v1.json', import.meta.url)

const origem = process.argv[2] ?? URL_PADRAO
const resposta = await fetch(origem)
if (!resposta.ok) {
  console.error(`Não consegui baixar ${origem}: HTTP ${resposta.status}`)
  process.exit(1)
}

const documento = await resposta.json()
const rotasDaV1 = Object.fromEntries(Object.entries(documento.paths).filter(([caminho]) => caminho.startsWith('/v1/')))
const esquemas = esquemasUsados(rotasDaV1, documento.components.schemas)

const recorte = {
  openapi: documento.openapi,
  info: documento.info,
  paths: rotasDaV1,
  components: { schemas: esquemas, securitySchemes: documento.components.securitySchemes },
}
await writeFile(DESTINO, `${JSON.stringify(recorte, null, 2)}\n`)
console.log(`openapi/v1.json: ${Object.keys(rotasDaV1).length} caminhos e ${Object.keys(esquemas).length} esquemas.`)

function esquemasUsados(raiz, todos) {
  const nomes = new Set()
  const pendentes = [raiz]
  while (pendentes.length > 0) {
    const atual = pendentes.pop()
    for (const [, nome] of JSON.stringify(atual).matchAll(/#\/components\/schemas\/([\w.]+)/g)) {
      if (nomes.has(nome)) continue
      nomes.add(nome)
      pendentes.push(todos[nome])
    }
  }
  return Object.fromEntries([...nomes].sort().map((nome) => [nome, todos[nome]]))
}
