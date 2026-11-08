import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const targets = {
  spring: "import {spring} from '@oxog/springkit';globalThis.sample=spring",
  native: "import {animateNative} from '@oxog/springkit';globalThis.sample=animateNative",
  motionValue: "import {createMotionValue} from '@oxog/springkit';globalThis.sample=createMotionValue",
  animated: "import {Animated} from '@oxog/springkit/react';globalThis.sample=Animated.div",
  dom: "import {bindStyle} from '@oxog/springkit/dom';globalThis.sample=bindStyle",
  core: "import * as kit from '@oxog/springkit';globalThis.sample=kit",
  react: "import * as kit from '@oxog/springkit/react';globalThis.sample=kit",
  all: "import * as kit from '@oxog/springkit';import * as react from '@oxog/springkit/react';globalThis.sample={kit,react}",
}
const results = {}
for (const [name, contents] of Object.entries(targets)) {
  const result = await build({ stdin: { contents, resolveDir: root }, bundle: true, minify: true, write: false, format: 'esm', target: 'es2021', external: ['react', 'react-dom'], logLevel: 'silent' })
  const bytes = result.outputFiles[0].contents
  results[name] = { minifiedBytes: bytes.length, gzipBytes: gzipSync(bytes).length }
}
const report = { version: JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version, method: 'esbuild; ESM browser ES2021; React external; gzipSync defaults; bytes', results }
mkdirSync(new URL('../docs/metrics/', import.meta.url), { recursive: true })
if (process.argv.includes('--write')) {
  writeFileSync(new URL('../docs/metrics/bundle-size.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
  const readmeUrl = new URL('../README.md', import.meta.url)
  const table = ['| Import | Minify + gzip |', '| --- | ---: |', ...Object.entries(results).map(([name, value]) => `| ${name} | ${(value.gzipBytes / 1000).toFixed(2)} KB |`)].join('\n')
  const readme = readFileSync(readmeUrl, 'utf8').replace(/<!-- springkit:bundle-sizes:start -->[\s\S]*?<!-- springkit:bundle-sizes:end -->/, `<!-- springkit:bundle-sizes:start -->\n${table}\n<!-- springkit:bundle-sizes:end -->`)
  writeFileSync(readmeUrl, readme)
}
console.table(results)
if (process.argv.includes('--check')) {
  const budgets = JSON.parse(readFileSync(new URL('./size-budgets.json', import.meta.url), 'utf8'))
  for (const [name, limit] of Object.entries(budgets)) {
    if (results[name].gzipBytes > limit) throw new Error(`${name}: ${results[name].gzipBytes} gzip bytes exceeds budget ${limit}`)
  }
  console.log('Bundle size budgets passed')
}
