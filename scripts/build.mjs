// Builds each tsup target sequentially. See the note in tsup.config.ts for why
// the targets must not be built in parallel.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const tsupCli = require.resolve('tsup/dist/cli-default.js')

for (const target of ['core', 'react']) {
  const result = spawnSync(process.execPath, [tsupCli], {
    stdio: 'inherit',
    env: { ...process.env, SPRINGKIT_BUILD: target },
  })
  if (result.status !== 0) {
    console.error(
      `[build] "${target}" failed (exit ${result.status ?? result.signal})`
    )
    process.exit(1)
  }
}
