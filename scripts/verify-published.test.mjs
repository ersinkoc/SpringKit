import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registryReady, verifyAuditedProvenance, waitForPublication } from './verify-published.mjs'

const expected = { name: '@oxog/springkit', version: '2.1.1', commit: 'a'.repeat(40), repository: 'https://github.com/ersinkoc/SpringKit', workflow: '.github/workflows/release.yml' }
const metadata = () => ({ name: expected.name, version: expected.version, gitHead: expected.commit, repository: { url: `git+${expected.repository}.git` }, dist: { integrity: 'sha512-release', tarball: `https://registry.npmjs.org/@oxog/springkit/-/springkit-${expected.version}.tgz`, attestations: { url: `https://registry.npmjs.org/-/npm/v1/attestations/${expected.name}@${expected.version}`, provenance: { predicateType: 'https://slsa.dev/provenance/v1' } } } })
const statement = () => ({
  predicateType: 'https://slsa.dev/provenance/v1',
  predicate: {
    buildDefinition: {
      externalParameters: { workflow: { repository: expected.repository, path: expected.workflow, ref: 'refs/tags/v2.1.1' } },
      resolvedDependencies: [{ uri: `git+${expected.repository}@refs/tags/v2.1.1`, digest: { gitCommit: expected.commit } }],
    },
    runDetails: { builder: { id: 'https://github.com/actions/runner/github-hosted' } },
  },
})
const report = (value = statement()) => ({ invalid: [], missing: [], verified: [{ name: expected.name, version: expected.version, attestationBundles: [{ bundle: { dsseEnvelope: { payload: Buffer.from(JSON.stringify(value)).toString('base64') } } }] }] })

test('accepts only the expected registry release and SLSA metadata', () => {
  assert.equal(registryReady(metadata(), expected), true)
  const pending = metadata(); delete pending.dist.attestations
  assert.equal(registryReady(pending, expected), false)
})
test('rejects a release from a different source commit before considering provenance', () => {
  const wrong = metadata(); wrong.gitHead = 'b'.repeat(40)
  assert.throws(() => registryReady(wrong, expected), /source commit/)
})
test('rejects a different registry for attestation retrieval', () => {
  const wrong = metadata(); wrong.dist.attestations.url = 'https://example.invalid/attestations'
  assert.throws(() => registryReady(wrong, expected), /Untrusted attestation registry/)
})
test('accepts the exact repository, workflow, tag, commit and hosted builder after npm audit', () => {
  assert.deepEqual(verifyAuditedProvenance(report(), expected), statement())
})
for (const [name, mutate] of [
  ['repository', value => { value.predicate.buildDefinition.externalParameters.workflow.repository = 'https://github.com/other/repo' }],
  ['workflow', value => { value.predicate.buildDefinition.externalParameters.workflow.path = '.github/workflows/other.yml' }],
  ['tag', value => { value.predicate.buildDefinition.externalParameters.workflow.ref = 'refs/heads/main' }],
  ['commit', value => { value.predicate.buildDefinition.resolvedDependencies[0].digest.gitCommit = 'b'.repeat(40) }],
  ['builder', value => { value.predicate.runDetails.builder.id = 'https://example.invalid/self-hosted' }],
]) {
  test(`rejects verified provenance with the wrong ${name}`, () => {
    const wrong = statement(); mutate(wrong)
    assert.throws(() => verifyAuditedProvenance(report(wrong), expected), /not bound/)
  })
}
test('registry signatures alone do not count as verified provenance', () => {
  assert.throws(() => verifyAuditedProvenance({ invalid: [], missing: [], verified: [] }, expected), /no verified attestation/)
  const missing = report(); missing.missing.push({ name: expected.name })
  assert.throws(() => verifyAuditedProvenance(missing, expected), /Missing npm registry signatures/)
})
test('waits through registry propagation and delayed provenance, then accepts the correct release', async () => {
  const pending = metadata(); delete pending.dist.attestations
  const responses = [{ status: 404 }, { status: 200, json: async () => pending }, { status: 200, json: async () => metadata() }]
  let sleeps = 0
  const result = await waitForPublication(expected, { fetcher: async url => url.endsWith('/2.1.1') ? responses.shift() : { status: 200, json: async () => ({ name: expected.name, versions: { [expected.version]: metadata() } }) }, sleep: async () => { sleeps++ } })
  assert.equal(result.gitHead, expected.commit)
  assert.equal(sleeps, 2)
})
test('does not hide authorization failures as registry propagation', async () => {
  await assert.rejects(waitForPublication(expected, { fetcher: async () => ({ status: 403 }), sleep: async () => assert.fail('must not retry') }), /HTTP 403/)
})
test('bounds the wait when provenance never appears', async () => {
  await assert.rejects(waitForPublication(expected, { fetcher: async () => ({ status: 404 }), timeoutMs: 0 }), /Timed out/)
})

test('waits for the npm install index even when version metadata and provenance are already visible', async () => {
  let installQueries = 0
  let sleeps = 0
  const ready = metadata()
  ready.dist.integrity = 'sha512-release'
  ready.dist.tarball = 'https://registry.npmjs.org/@oxog/springkit/-/springkit-2.1.1.tgz'
  const result = await waitForPublication(expected, {
    fetcher: async (url, options) => {
      if (url.endsWith('/2.1.1')) return { status: 200, json: async () => ready }
      assert.equal(url, 'https://registry.npmjs.org/@oxog%2fspringkit')
      assert.match(options.headers.Accept, /application\/vnd\.npm\.install-v1\+json/)
      installQueries++
      return { status: 200, json: async () => ({ name: expected.name, versions: installQueries === 1 ? {} : { [expected.version]: ready } }) }
    },
    sleep: async () => { sleeps++ },
  })
  assert.equal(result, ready)
  assert.equal(installQueries, 2, 'the install index must include the release before consumers start')
  assert.equal(sleeps, 1)
})

test('rejects an install index pointing to a different artifact', async () => {
  const ready = metadata()
  ready.dist.integrity = 'sha512-release'
  const wrong = structuredClone(ready)
  wrong.dist.integrity = 'sha512-other'
  await assert.rejects(waitForPublication(expected, {
    fetcher: async url => ({ status: 200, json: async () => url.endsWith('/2.1.1') ? ready : { name: expected.name, versions: { [expected.version]: wrong } } }),
    sleep: async () => assert.fail('artifact mismatches must fail immediately'),
  }), /install index.*integrity/)
})
