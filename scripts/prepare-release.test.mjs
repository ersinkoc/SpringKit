import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { planRelease, prepareRelease } from './prepare-release.mjs'

const files = () => ({
  'package.json': JSON.stringify({ name: '@oxog/springkit', version: '2.1.2', private: false }),
  'package-lock.json': JSON.stringify({ version: '2.1.2', packages: { '': { version: '2.1.2' } } }),
  'docs/metrics/bundle-size.json': JSON.stringify({ version: '2.1.2', results: { core: 123 } }),
  'CHANGELOG.md': '# Changelog\n\n## [Unreleased]\n\n### Added\n- Unified release workflow.\n\n## [2.1.2] - 2026-11-08\n\n### Fixed\n- Previous change.\n',
})
for (const [bump, version] of [['patch', '2.1.3'], ['minor', '2.2.0'], ['major', '3.0.0']]) {
  test(`${bump} updates all versions and moves only the Unreleased notes`, () => {
    const input = files()
    const plan = planRelease(input, bump, '2026-11-09')
    assert.equal(plan.version, version)
    assert.equal(JSON.parse(plan.files['package.json']).version, version)
    assert.equal(JSON.parse(plan.files['package-lock.json']).packages[''].version, version)
    assert.equal(JSON.parse(plan.files['docs/metrics/bundle-size.json']).version, version)
    assert.equal(JSON.parse(plan.files['docs/metrics/bundle-size.json']).results.core, 123)
    assert(plan.files['CHANGELOG.md'].includes(`## [Unreleased]\n\n## [${version}] - 2026-11-09\n\n### Added\n- Unified release workflow.`))
    assert(plan.files['CHANGELOG.md'].endsWith('## [2.1.2] - 2026-11-08\n\n### Fixed\n- Previous change.\n'))
    assert.equal(JSON.parse(input['package.json']).version, '2.1.2')
  })
}
test('refuses empty release notes, unsupported inputs and inconsistent versions', () => {
  const empty = files(); empty['CHANGELOG.md'] = '# Changelog\n\n## [Unreleased]\n\n## [2.1.2] - 2026-11-08\n'
  assert.throws(() => planRelease(empty, 'patch', '2026-11-09'), /Add release notes/)
  assert.throws(() => planRelease(files(), 'patch; echo unsafe', '2026-11-09'), /Choose/)
  const wrong = files(); wrong['package-lock.json'] = JSON.stringify({ version: '1.0.0' })
  assert.throws(() => planRelease(wrong, 'patch', '2026-11-09'), /out of sync/)
  const prerelease = files(); prerelease['package.json'] = JSON.stringify({ version: '2.1.3-beta.1' })
  assert.throws(() => planRelease(prerelease, 'patch', '2026-11-09'), /stable semantic/)
})

function fixture(t) {
  const parent = mkdtempSync(join(tmpdir(), 'springkit-release-git-'))
  t.after(() => {
    const target = realpathSync(parent)
    assert.equal(dirname(target), realpathSync(tmpdir()))
    assert(basename(target).startsWith('springkit-release-git-'))
    rmSync(target, { recursive: true, force: true })
  })
  const cwd = join(parent, 'work'); mkdirSync(cwd)
  const remote = join(parent, 'remote.git')
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  git('init', '--bare', remote)
  git('init', '-b', 'main')
  git('config', 'user.name', 'Release test')
  git('config', 'user.email', 'release-test@example.invalid')
  git('config', 'core.autocrlf', 'false')
  for (const [name, content] of Object.entries(files())) { mkdirSync(dirname(join(cwd, name)), { recursive: true }); writeFileSync(join(cwd, name), content) }
  git('add', '.'); git('commit', '-m', 'Initial')
  git('remote', 'add', 'origin', remote); git('push', '-u', 'origin', 'main')
  return { cwd, git, options: { cwd, bump: 'patch', date: '2026-11-09', requestId: '12345', repository: 'ersinkoc/SpringKit' } }
}
test('a real git release pushes matching main/tag and reruns reuse the same commit', t => {
  const { cwd, git, options } = fixture(t)
  const first = prepareRelease(options)
  assert.equal(first.version, '2.1.3')
  assert.equal(first.reused, false)
  assert.equal(git('rev-parse', 'origin/main'), first.commit)
  assert.equal(git('rev-parse', 'v2.1.3^{commit}'), first.commit)
  assert(git('ls-remote', 'origin', 'refs/tags/v2.1.3^{}').startsWith(first.commit))
  const count = git('rev-list', '--count', 'origin/main')
  const second = prepareRelease(options)
  assert.deepEqual(second, { ...first, reused: true })
  assert.equal(git('rev-list', '--count', 'origin/main'), count)
  assert.equal(JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).version, '2.1.3')
  git('checkout', '-B', 'main', 'origin/main')
  writeFileSync(join(cwd, 'later-change.txt'), 'a subsequent main update')
  git('add', '.'); git('commit', '-m', 'Later main change'); git('push', 'origin', 'main')
  const laterMain = git('rev-parse', 'origin/main')
  assert.deepEqual(prepareRelease(options), { ...first, reused: true })
  assert.equal(git('rev-parse', 'origin/main'), laterMain, 'retry must preserve later main commits')
})
test('a dirty checkout cannot modify the remote release state', t => {
  const { cwd, git, options } = fixture(t)
  const before = git('rev-parse', 'origin/main')
  writeFileSync(join(cwd, 'unrelated.txt'), 'user work')
  assert.throws(() => prepareRelease(options), /clean checkout/)
  assert.equal(git('rev-parse', 'origin/main'), before)
  assert.equal(git('ls-remote', '--tags', 'origin'), '')
})
