import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
export function expectedPublication() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  return {
    name: pkg.name,
    version: pkg.version,
    commit: process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    repository: pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, ''),
    workflow: '.github/workflows/release.yml',
  }
}

// Metadata availability is separate from the cryptographic npm audit below.
export function registryReady(metadata, expected) {
  assert.equal(metadata.name, expected.name, 'Wrong published package')
  assert.equal(metadata.version, expected.version, 'Wrong published version')
  assert.equal(metadata.gitHead, expected.commit, 'Published source commit does not match the release')
  assert.equal(metadata.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, ''), expected.repository, 'Wrong source repository')
  const attestation = metadata.dist?.attestations
  if (!attestation) return false
  const url = new URL(attestation.url)
  assert.equal(url.origin, 'https://registry.npmjs.org', 'Untrusted attestation registry')
  assert(url.pathname.startsWith('/-/npm/v1/attestations/'), 'Invalid attestation endpoint')
  assert.equal(attestation.provenance?.predicateType, 'https://slsa.dev/provenance/v1', 'Missing SLSA provenance')
  return true
}

// Only pass the JSON returned by a SUCCESSFUL `npm audit signatures` process.
export function verifyAuditedProvenance(report, expected) {
  assert(Array.isArray(report.invalid) && report.invalid.length === 0, 'Invalid npm signatures or attestations')
  assert(Array.isArray(report.missing) && report.missing.length === 0, 'Missing npm registry signatures')
  const verified = report.verified?.find(item => item.name === expected.name && item.version === expected.version)
  assert(verified, 'The installed release has no verified attestation')
  const statements = (verified.attestationBundles ?? []).map(item => {
    const envelope = item.bundle?.dsseEnvelope
    return envelope?.payload ? JSON.parse(Buffer.from(envelope.payload, 'base64').toString('utf8')) : null
  }).filter(item => item?.predicateType === 'https://slsa.dev/provenance/v1')
  assert(statements.length > 0, 'No verified SLSA statement')
  const ref = `refs/tags/v${expected.version}`
  const statement = statements.find(item => {
    const definition = item.predicate?.buildDefinition
    const workflow = definition?.externalParameters?.workflow
    return workflow?.repository === expected.repository && workflow.path === expected.workflow && workflow.ref === ref
      && definition.resolvedDependencies?.some(dependency => dependency.uri === `git+${expected.repository}@${ref}` && dependency.digest?.gitCommit === expected.commit)
      && item.predicate?.runDetails?.builder?.id === 'https://github.com/actions/runner/github-hosted'
  })
  assert(statement, 'Provenance is not bound to the expected GitHub repository, workflow, tag and commit')
  return statement
}

async function readRegistry(url, fetcher, accept = 'application/json') {
  const response = await fetcher(url, { headers: { Accept: accept, 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(15000) })
  if (response.status === 200) return response.json()
  if (response.status !== 404 && response.status !== 429 && response.status < 500) {
    throw new Error(`Registry verification failed: HTTP ${response.status}`)
  }
  return null
}

export async function waitForPublication(expected, { fetcher = fetch, sleep = ms => new Promise(done => setTimeout(done, ms)), timeoutMs = 600000 } = {}) {
  const deadline = Date.now() + timeoutMs
  // Match npm's canonical package URL and abbreviated install Accept header:
  // this CDN representation can lag behind the per-version metadata endpoint.
  const url = `https://registry.npmjs.org/${expected.name.replace('/', '%2f')}`
  do {
    const [metadata, index] = await Promise.all([
      readRegistry(`${url}/${encodeURIComponent(expected.version)}`, fetcher),
      readRegistry(url, fetcher, 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'),
    ])
    if (metadata && registryReady(metadata, expected)) {
      const installed = index?.versions?.[expected.version]
      if (installed) {
        assert.equal(index.name, expected.name, 'Wrong npm install index package')
        assert.equal(installed.name, expected.name, 'Wrong npm install index entry')
        assert.equal(installed.version, expected.version, 'Wrong npm install index version')
        assert(metadata.dist.integrity && installed.dist?.integrity === metadata.dist.integrity, 'npm install index integrity does not match the published artifact')
        assert(metadata.dist.tarball && installed.dist?.tarball === metadata.dist.tarball, 'npm install index tarball does not match the published artifact')
        return metadata
      }
    }
    if (Date.now() >= deadline) break
    console.log('Waiting for the published version, provenance and npm install index to become available...')
    await sleep(5000)
  } while (Date.now() <= deadline)
  throw new Error('Timed out waiting for registry publication and provenance')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const expected = expectedPublication()
  const metadata = await waitForPublication(expected)
  console.log(`PASS ${expected.name}@${expected.version}: registry source ${metadata.gitHead}, SLSA provenance available`)
}
