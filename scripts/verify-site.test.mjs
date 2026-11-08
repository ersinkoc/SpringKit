import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { siteManifest, verifySite } from './verify-site.mjs'

const bytes = Buffer.from('expected release content')
const manifest = () => ({ origin: 'https://springkit.oxog.dev', files: [{ path: '/', sha256: createHash('sha256').update(bytes).digest('hex') }] })
test('site manifest binds live routes, dynamic chunks and release metadata to the source', t => {
  const dist = mkdtempSync(join(tmpdir(), 'springkit-site-release-'))
  t.after(() => { const target = realpathSync(dist); assert.equal(dirname(target), realpathSync(tmpdir())); assert(basename(target).startsWith('springkit-site-release-')); rmSync(target, { recursive: true, force: true }) })
  mkdirSync(join(dist, 'assets')); mkdirSync(join(dist, 'docs/start'), { recursive: true })
  writeFileSync(join(dist, 'assets/Home-test.js'), 'const version="2.1.3";')
  writeFileSync(join(dist, 'index.html'), 'home')
  writeFileSync(join(dist, 'docs/start/index.html'), 'docs')
  writeFileSync(join(dist, '404.html'), 'missing')
  const expected = { version: '2.1.3', commit: 'a'.repeat(40) }
  const result = siteManifest(dist, expected)
  assert.deepEqual(JSON.parse(readFileSync(join(dist, 'release.json'), 'utf8')), expected)
  assert.deepEqual(result.files.map(item => item.path).sort(), ['/', '/assets/Home-test.js', '/docs/start', '/release.json'])
  writeFileSync(join(dist, 'assets/Home-test.js'), 'const metrics={version:`2.1.3`};')
  assert.equal(siteManifest(dist, expected).version, '2.1.3', 'Vite may emit backtick string literals for version metadata')
  assert.throws(() => siteManifest(dist, { ...expected, version: '2.1.4' }), /does not contain/)
})
test('live verification waits for stale CDN content and accepts only matching bytes', async () => {
  let requests = 0
  let sleeps = 0
  const result = await verifySite(manifest(), { fetcher: async () => new Response(++requests === 1 ? 'old release' : bytes), sleep: async () => { sleeps++ } })
  assert.equal(sleeps, 1); assert.equal(requests, 2); assert.equal(result[0].matches, true)
})
test('live verification fails when the release never propagates', async () => {
  await assert.rejects(verifySite(manifest(), { fetcher: async () => new Response('old release'), timeoutMs: 0 }), /does not match/)
})
test('live verification rejects cross-origin paths and authorization errors', async () => {
  const unsafe = manifest(); unsafe.files[0].path = '//example.invalid'
  await assert.rejects(verifySite(unsafe), /Unsafe/)
  await assert.rejects(verifySite(manifest(), { fetcher: async () => new Response('', { status: 403 }), sleep: async () => assert.fail('must not retry') }), /access failed/)
})
