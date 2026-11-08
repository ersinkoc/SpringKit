import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appendFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expectedPublication } from './verify-published.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export function siteManifest(dist, expected) {
  writeFileSync(join(dist, 'release.json'), JSON.stringify({ version: expected.version, commit: expected.commit }) + '\n')
  const names = readdirSync(dist, { recursive: true }).map(name => name.replaceAll('\\', '/'))
    .filter(name => name !== '404.html' && /\.(html|js|css|svg|ico|txt|json)$/.test(name))
  const home = names.find(name => /^assets\/Home-[^/]+\.js$/.test(name))
  const versionLiteral = new RegExp('(["\'`])' + expected.version.replaceAll('.', '\\.') + '\\1')
  assert(home && versionLiteral.test(readFileSync(join(dist, home), 'utf8')), 'Website bundle does not contain the release version')
  const files = names.map(name => ({
    path: name === 'index.html' ? '/' : name.endsWith('/index.html') ? '/' + name.slice(0, -'/index.html'.length) : '/' + name,
    sha256: hash(readFileSync(join(dist, name))),
  })).sort((a, b) => a.path.localeCompare(b.path))
  return { version: expected.version, commit: expected.commit, origin: 'https://springkit.oxog.dev', files }
}

export async function verifySite(manifest, { fetcher = fetch, sleep = ms => new Promise(done => setTimeout(done, ms)), now = Date.now, timeoutMs = 300000 } = {}) {
  assert.equal(manifest.origin, 'https://springkit.oxog.dev', 'Unexpected website origin')
  assert(manifest.files?.length > 0, 'Empty site verification manifest')
  for (const item of manifest.files) assert(/^\/[\w./-]*$/.test(item.path) && !item.path.includes('..') && !item.path.startsWith('//'), 'Unsafe site verification path')
  const deadline = now() + timeoutMs
  let results
  do {
    results = []
    let cursor = 0
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (cursor < manifest.files.length) {
        const item = manifest.files[cursor++]
        try {
          const response = await fetcher(manifest.origin + item.path, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(Math.max(1, Math.min(15000, deadline - now()))) })
          const matches = response.status === 200 && hash(Buffer.from(await response.arrayBuffer())) === item.sha256
          results.push({ path: item.path, status: response.status, matches })
        } catch (error) { results.push({ path: item.path, error: String(error), matches: false }) }
      }
    }))
    const failed = results.filter(item => !item.matches)
    if (!failed.length) return results
    if (failed.some(item => item.status >= 400 && item.status < 500 && ![404, 429].includes(item.status))) throw new Error('Website access failed: ' + JSON.stringify(failed))
    if (now() >= deadline) break
    console.log(`Waiting for Pages/CDN propagation (${failed.length}/${results.length} files pending)...`)
    await sleep(5000)
  } while (now() <= deadline)
  throw new Error('Live website does not match the release artifact: ' + JSON.stringify(results.filter(item => !item.matches)))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const manifestPath = '.temp_files/site-release-manifest.json'
  if (process.argv[2] === 'manifest') {
    const manifest = siteManifest(resolve('website/dist'), expectedPublication())
    mkdirSync('.temp_files', { recursive: true })
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
    console.log(`Prepared ${manifest.files.length} site content checks for ${manifest.version} / ${manifest.commit}`)
  } else {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const expected = expectedPublication()
    assert.equal(manifest.version, expected.version, 'Wrong website release version')
    assert.equal(manifest.commit, expected.commit, 'Wrong website source commit')
    const results = await verifySite(manifest)
    writeFileSync('.temp_files/site-release-result.json', JSON.stringify({ ...manifest, results }, null, 2) + '\n')
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `Website ${manifest.version}: ${results.length}/${results.length} live HTTP/SHA-256 checks passed at ${manifest.origin}. Source: ${manifest.commit}.\n`)
    console.log(`PASS live website ${manifest.version}: ${results.length} exact artifact content checks`)
  }
}
