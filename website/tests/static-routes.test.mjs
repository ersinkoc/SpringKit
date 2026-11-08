import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const dist = new URL('../dist/', import.meta.url)
test('the root application shell remains available', () => {
  assert(existsSync(new URL('index.html', dist)))
  assert.match(readFileSync(new URL('index.html', dist), 'utf8'), /<div id="root"><\/div>/)
})

for (const route of ['docs/getting-started', 'docs/spring/values', 'examples/native-springs']) {
  test(`direct ${route} requests have an HTML entry on a static host`, () => {
    const entry = new URL(`${route}/index.html`, dist)
    assert(existsSync(entry), `Missing deployable HTML entry for /${route}`)
    assert.equal(readFileSync(entry, 'utf8'), readFileSync(new URL('index.html', dist), 'utf8'))
    assert.match(readFileSync(entry, 'utf8'), /src="\/assets\/[^" ]+\.js"/)
  })
}
