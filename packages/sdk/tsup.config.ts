import { defineConfig } from 'tsup'
import { buildDoPacote } from '../../tsup.comum.js'

export default defineConfig(buildDoPacote({ 'v1/index': 'src/v1/index.ts' }))
