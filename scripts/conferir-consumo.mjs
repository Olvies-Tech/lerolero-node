// Confere os pacotes como um cliente os recebe. Dois modos:
//   pnpm test:consumo [--guardar <pasta>]
//     empacota com o pnpm, roda o "are the types wrong" em cada tarball, instala os três numa pasta vazia e usa por
//     import (ESM), por require (CommonJS) e por TypeScript (nodenext e bundler). Com --guardar, deixa os tarballs na
//     pasta (o CI guarda como artefato). Rode depois do build, num Node com as ferramentas de dev (20 ou mais novo).
//   node scripts/conferir-consumo.mjs --so-execucao <pasta com os tarballs>
//     só instala os tarballs prontos numa pasta vazia e roda o import, o require e o vetor do webhook. Usa apenas módulos
//     do Node, sem pnpm nem dependência de dev: é o que confere o Node 18, que o SDK promete.
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('..', import.meta.url))
const PACOTES = ['types', 'rest', 'sdk']
const requerer = createRequire(import.meta.url)
const pasta = mkdtempSync(join(tmpdir(), 'lerolero-consumo-'))
const opcoes = lerOpcoes(process.argv.slice(2))

try {
  if (opcoes.soExecucao) conferirExecucao(tarballsDa(opcoes.soExecucao))
  else conferirTudo()
} finally {
  rmSync(pasta, { recursive: true, force: true })
}

function conferirTudo() {
  const tarballs = empacotar(opcoes.guardar ?? join(pasta, 'tarballs'))
  for (const tarball of tarballs) {
    rodar(process.execPath, [binario('@arethetypeswrong/cli', 'attw'), tarball, '--profile', 'node16'])
  }
  const projeto = executar(tarballs)
  for (const resolucao of ['nodenext', 'bundler']) compilar(projeto, resolucao)
  console.log('Consumo conferido: attw, ESM, CommonJS, TypeScript (nodenext e bundler) e os exemplos com require.')
}

function conferirExecucao(tarballs) {
  executar(tarballs)
  console.log(`Consumo conferido no Node ${process.version}: import, require e o vetor do webhook.`)
}

function executar(tarballs) {
  const projeto = instalar(tarballs, join(pasta, 'projeto'))
  rodar(process.execPath, ['esm.mjs'], projeto)
  rodar(process.execPath, ['cjs.cjs'], projeto)
  return projeto
}

function lerOpcoes(argumentos) {
  const valorDe = (nome) => {
    const indice = argumentos.indexOf(nome)
    if (indice === -1) return undefined
    const valor = argumentos[indice + 1]
    if (!valor) throw new Error(`Falta a pasta depois de ${nome}.`)
    return resolve(valor)
  }
  return { guardar: valorDe('--guardar'), soExecucao: valorDe('--so-execucao') }
}

function empacotar(destino) {
  mkdirSync(destino, { recursive: true })
  for (const pacote of PACOTES) rodar(...pnpm('pack', '--pack-destination', destino), join(RAIZ, 'packages', pacote))
  return tarballsDa(destino)
}

function tarballsDa(pastaDosTarballs) {
  const tarballs = readdirSync(pastaDosTarballs)
    .filter((arquivo) => arquivo.endsWith('.tgz'))
    .map((arquivo) => join(pastaDosTarballs, arquivo))
  for (const pacote of PACOTES) tarballDo(pacote, tarballs)
  return tarballs
}

function tarballDo(pacote, tarballs) {
  const tarball = tarballs.find((caminho) => basename(caminho).startsWith(`lerolero-${pacote}-`))
  if (!tarball) throw new Error(`Faltou o tarball de @lerolero/${pacote}.`)
  return tarball
}

// Caminhos relativos e com barra: o tar do Git Bash lê "C:" como um computador remoto e estraga a barra invertida.
function instalar(tarballs, projeto) {
  for (const pacote of PACOTES) {
    const destino = relativo(join(projeto, 'node_modules', '@lerolero', pacote))
    mkdirSync(join(pasta, destino), { recursive: true })
    const tarball = copiarParaAPasta(tarballDo(pacote, tarballs))
    rodar('tar', ['-xzf', relativo(tarball), '-C', destino, '--strip-components=1'], pasta)
  }
  cpSync(join(RAIZ, 'test', 'consumo'), projeto, { recursive: true })
  cpSync(join(RAIZ, 'vetores', 'assinatura-do-webhook.json'), join(projeto, 'assinatura-do-webhook.json'))
  for (const [indice, codigo] of exemplosComRequire().entries()) {
    writeFileSync(join(projeto, `readme-${indice + 1}.cjs`), codigo)
  }
  return projeto
}

// O tarball vai para a pasta temporária: o caminho relativo até ele fica curto e sem sair da pasta.
function copiarParaAPasta(tarball) {
  const copia = join(pasta, basename(tarball))
  cpSync(tarball, copia)
  return copia
}

// Os exemplos com require dos READMEs, conferidos pelo TypeScript (checkJs) contra os tipos .d.cts do pacote.
function exemplosComRequire() {
  return ['README.md', 'packages/sdk/README.md'].flatMap((readme) =>
    [...readFileSync(join(RAIZ, readme), 'utf8').matchAll(/```js\r?\n([\s\S]*?)```/g)].map(([, codigo]) => codigo),
  )
}

function relativo(caminho) {
  return relative(pasta, caminho).split(sep).join('/')
}

function compilar(projeto, resolucao) {
  const tsconfig = join(projeto, `tsconfig.${resolucao}.json`)
  writeFileSync(
    tsconfig,
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: resolucao === 'bundler' ? 'ESNext' : 'NodeNext',
        moduleResolution: resolucao,
        strict: true,
        noEmit: true,
        types: ['node'],
        typeRoots: [join(RAIZ, 'node_modules', '@types')],
        allowJs: true,
        checkJs: true,
      },
      files: ['tipos.ts', ...readdirSync(projeto).filter((arquivo) => arquivo.startsWith('readme-'))],
    }),
  )
  rodar(process.execPath, [binario('typescript', 'tsc'), '-p', tsconfig], projeto)
}

// O pnpm que rodou este script (npm_execpath), sem shell: um script JavaScript roda pelo próprio Node; um binário
// (instalação standalone) roda direto. Fora do pnpm, para com a orientação de como rodar.
function pnpm(...argumentos) {
  const execucao = process.env.npm_execpath ?? ''
  if (!/pnpm/i.test(execucao)) throw new Error('Rode pelo pnpm: pnpm build && pnpm test:consumo')
  return /\.[cm]?js$/.test(execucao) ? [process.execPath, [execucao, ...argumentos]] : [execucao, argumentos]
}

function binario(pacote, nome) {
  const manifesto = requerer(`${pacote}/package.json`)
  const bin = typeof manifesto.bin === 'string' ? manifesto.bin : manifesto.bin[nome]
  return join(requerer.resolve(`${pacote}/package.json`), '..', bin)
}

function rodar(comando, argumentos, cwd = RAIZ) {
  execFileSync(comando, argumentos, { cwd, stdio: 'inherit' })
}
