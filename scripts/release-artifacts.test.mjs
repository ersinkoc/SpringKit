import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { publicationExists, publishGitHubRelease, releaseAssets, releaseNotes } from './release-artifacts.mjs'

const expected = { name: '@oxog/springkit', version: '2.1.3', commit: 'a'.repeat(40), repository: 'https://github.com/ersinkoc/SpringKit' }
const metadata = () => ({ name: expected.name, version: expected.version, gitHead: expected.commit, repository: { url: expected.repository } })
test('publication retries reuse only the exact source and fail closed on registry errors', async () => {
  assert.equal(await publicationExists(expected, async () => new Response('', { status: 404 })), false)
  assert.equal(await publicationExists(expected, async () => Response.json(metadata())), true)
  const wrong = metadata(); wrong.gitHead = 'b'.repeat(40)
  await assert.rejects(publicationExists(expected, async () => Response.json(wrong)), /source commit/)
  await assert.rejects(publicationExists(expected, async () => new Response('', { status: 503 })), /HTTP 503/)
})
test('release assets use the npm bytes and reject corrupted archives', () => {
  const bytes = Buffer.from('published package')
  const meta = { version: expected.version, dist: { integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') } }
  const assets = releaseAssets(bytes, meta)
  assert.equal(assets[0].bytes, bytes)
  assert(assets[1].bytes.toString().endsWith('  oxog-springkit-2.1.3.tgz\n'))
  assert.throws(() => releaseAssets(Buffer.from('corrupt'), meta), /integrity mismatch/)
})
test('release notes contain only the selected version and verified source link', () => {
  const notes = releaseNotes('## [Unreleased]\n\n## [2.1.3] - 2026-11-09\n\n### Added\n- Unified release.\n\n## [2.1.2] - 2026-11-08\n- Old change.\n', expected, 'https://github.com/ersinkoc/SpringKit/actions/runs/123')
  assert(notes.includes('Unified release.'))
  assert(notes.includes(expected.commit))
  assert(!notes.includes('Old change.'))
  assert.throws(() => releaseNotes('## [Unreleased]\n', expected, ''), /Missing release changelog/)
})
test('GitHub release is drafted, assets verified, published once and safe to retry', async () => {
  let release = null
  let creates = 0
  let uploads = 0
  const assets = [{ name: 'package.tgz', bytes: Buffer.from('published npm bytes') }]
  const fetcher = async (url, options) => {
    if (url.includes('uploads.github.com')) {
      uploads++
      const asset = { name: 'package.tgz', state: 'uploaded', digest: 'sha256:' + createHash('sha256').update(options.body).digest('hex') }
      release.assets.push(asset)
      return Response.json(asset)
    }
    if (options.method === 'POST') {
      creates++
      const body = JSON.parse(options.body)
      assert.equal(body.draft, true)
      assert.equal(body.target_commitish, expected.commit)
      release = { ...body, id: 123, assets: [], html_url: 'https://github.com/ersinkoc/SpringKit/releases/tag/v2.1.3' }
    } else if (options.method === 'PATCH') {
      assert.equal(release.assets.length, 1)
      release.draft = false
    } else if (!release) return new Response('', { status: 404 })
    return Response.json(release)
  }
  const options = { expected, assets, notes: 'notes', token: 'test-token', fetcher }
  const first = await publishGitHubRelease(options)
  assert.equal(await publishGitHubRelease(options), first)
  assert.equal(creates, 1); assert.equal(uploads, 1)
  release.assets[0].digest = 'sha256:wrong'
  await assert.rejects(publishGitHubRelease(options), /refusing to overwrite/)
})
