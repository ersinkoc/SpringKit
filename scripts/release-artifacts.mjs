import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { appendFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expectedPublication, registryReady, waitForPublication } from './verify-published.mjs'

export async function publicationExists(expected, fetcher = fetch) {
  const response = await fetcher(`https://registry.npmjs.org/${expected.name.replace('/', '%2f')}/${expected.version}`, { signal: AbortSignal.timeout(15000) })
  if (response.status === 404) return false
  assert.equal(response.status, 200, `Cannot inspect existing publication: HTTP ${response.status}`)
  registryReady(await response.json(), expected) // Fail on different source; provenance may still be propagating.
  return true
}

export function releaseAssets(bytes, metadata) {
  assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), metadata.dist.integrity, 'Published archive integrity mismatch')
  const name = `oxog-springkit-${metadata.version}.tgz`
  const sum = createHash('sha256').update(bytes).digest('hex')
  return [{ name, bytes }, { name: 'SHA256SUMS', bytes: Buffer.from(`${sum}  ${name}\n`) }]
}

export function releaseNotes(changelog, expected, runUrl) {
  const start = `## [${expected.version}] - `
  const normalized = changelog.replace(/\r\n/g, '\n')
  const position = normalized.indexOf(start)
  assert(position >= 0, 'Missing release changelog entry')
  const entry = normalized.slice(position).split('\n').slice(1).join('\n').split('\n## [')[0].trim()
  assert(entry, 'Release notes are empty')
  return `${entry}\n\nVerified source: \`${expected.commit}\`.\n\n[Publication and verification](${runUrl}) · [npm package](https://www.npmjs.com/package/${expected.name}/v/${expected.version})\n\nThe attached archive is the published npm package, verified against its SHA-512 integrity. SHA256SUMS covers the same archive. The workflow also deploys and verifies https://springkit.oxog.dev/ after creating this release.\n`
}

export async function publishGitHubRelease({ expected, assets, notes, token, fetcher = fetch }) {
  assert(token, 'GitHub release requires the job token')
  const repo = expected.repository.replace('https://github.com/', '')
  assert(/^[\w.-]+\/[\w.-]+$/.test(repo), 'Invalid release repository')
  const base = `https://api.github.com/repos/${repo}`
  const request = async (url, options = {}) => {
    const response = await fetcher(url, { ...options, headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(30000) })
    if (response.status === 404 && !options.method) return null
    assert(response.ok, `GitHub release request failed: HTTP ${response.status}`)
    return response.json()
  }
  const tag = `v${expected.version}`
  let release = await request(`${base}/releases/tags/${tag}`)
  if (!release) release = await request(`${base}/releases`, { method: 'POST', body: JSON.stringify({ tag_name: tag, target_commitish: expected.commit, name: `SpringKit ${expected.version}`, body: notes, draft: true, prerelease: false }) })
  assert.equal(release.tag_name, tag, 'Wrong GitHub release tag')
  assert.equal(release.prerelease, false, 'Stable version cannot reuse a prerelease')
  for (const asset of assets) {
    const digest = 'sha256:' + createHash('sha256').update(asset.bytes).digest('hex')
    const existing = release.assets?.find(item => item.name === asset.name)
    if (existing) {
      assert.equal(existing.digest, digest, 'Existing release asset differs; refusing to overwrite')
      assert.equal(existing.state, 'uploaded', 'Release asset upload is incomplete')
    } else {
      const uploaded = await request(`https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(asset.name)}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: asset.bytes })
      assert.equal(uploaded.digest, digest, 'Uploaded GitHub asset integrity mismatch')
    }
  }
  if (release.draft) release = await request(`${base}/releases/${release.id}`, { method: 'PATCH', body: JSON.stringify({ draft: false, make_latest: 'true' }) })
  return release.html_url
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const expected = expectedPublication()
  if (process.argv[2] === 'exists') {
    const exists = await publicationExists(expected)
    appendFileSync(process.env.GITHUB_OUTPUT, `published=${exists}\n`)
    console.log(exists ? 'Matching npm version already exists; verification is still required' : 'npm version is not yet published')
  } else {
    const metadata = await waitForPublication(expected)
    assert.equal(new URL(metadata.dist.tarball).origin, 'https://registry.npmjs.org', 'Untrusted package archive origin')
    const response = await fetch(metadata.dist.tarball, { signal: AbortSignal.timeout(30000) })
    assert.equal(response.status, 200, 'Cannot download the published npm archive')
    const assets = releaseAssets(Buffer.from(await response.arrayBuffer()), metadata)
    const runUrl = `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    const notes = releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), expected, runUrl)
    const url = await publishGitHubRelease({ expected, assets, notes, token: process.env.GH_TOKEN })
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `GitHub Release: ${url}\n\nPublished archive integrity and GitHub asset digests verified.\n`)
    console.log(`PASS ${url}: verified npm archive and release assets`)
  }
}
