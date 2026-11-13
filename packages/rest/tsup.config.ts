import { defineConfig } from 'tsup'
import { buildDoPacote } from '../../tsup.comum.js'

export default defineConfig(buildDoPacote({ index: 'src/index.ts' }))
