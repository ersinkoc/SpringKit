import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const releaseFiles = ['package.json', 'package-lock.json', 'docs/metrics/bundle-size.json', 'CHANGELOG.md']

export function planRelease(files, bump, date) {
  assert(['patch', 'minor', 'major'].includes(bump), 'Choose patch, minor or major')
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 'Expected an ISO release date')
  const pkg = JSON.parse(files['package.json'])
  const lock = JSON.parse(files['package-lock.json'])
  const metrics = JSON.parse(files['docs/metrics/bundle-size.json'])
  assert(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(pkg.version), 'Only stable semantic versions can be released')
  assert.equal(lock.version, pkg.version, 'Lockfile version is out of sync')
  assert.equal(lock.packages?.['']?.version, pkg.version, 'Lockfile root version is out of sync')
  assert.equal(metrics.version, pkg.version, 'Bundle metrics version is out of sync')
  const parts = pkg.version.split('.').map(Number)
  const index = { major: 0, minor: 1, patch: 2 }[bump]
  parts[index]++
  for (let i = index + 1; i < parts.length; i++) parts[i] = 0
  assert(parts.every(Number.isSafeInteger), 'Semantic version exceeds safe integer range')
  const version = parts.join('.')
  const changelog = files['CHANGELOG.md'].replace(/\r\n/g, '\n')
  const pending = /(^## \[Unreleased\]\n)([\s\S]*?)(?=^## \[|$(?![\s\S]))/m.exec(changelog)
  assert(pending && /^\s*### .+\n[\s\S]*^- .+/m.test(pending[2]), 'Add release notes under CHANGELOG.md [Unreleased] before releasing')
  assert(!changelog.includes(`## [${version}]`), 'The next release already exists in the changelog')
  pkg.version = lock.version = lock.packages[''].version = metrics.version = version
  const json = value => JSON.stringify(value, null, 2) + '\n'
  return { version, files: {
    'package.json': json(pkg),
    'package-lock.json': json(lock),
    'docs/metrics/bundle-size.json': json(metrics),
    'CHANGELOG.md': changelog.replace(pending[0], `## [Unreleased]\n\n## [${version}] - ${date}\n\n${pending[2].trim()}\n\n`),
  } }
}

export function prepareRelease({ cwd, bump, date, requestId, repository }) {
  assert(/^\d+$/.test(requestId), 'Expected the GitHub run ID')
  assert(/^[\w.-]+\/[\w.-]+$/.test(repository), 'Expected owner/repository')
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  assert.equal(git('status', '--porcelain'), '', 'Release preparation requires a clean checkout')
  git('fetch', 'origin', 'main', '--tags')
  const marker = `Release-Request: ${repository}#${requestId}`
  const matches = git('log', 'origin/main', '--format=%H', '--fixed-strings', `--grep=${marker}`).split('\n').filter(Boolean)
    .filter(sha => git('show', '-s', '--format=%B', sha).split('\n').includes(marker))
  assert(matches.length <= 1, 'Multiple release commits belong to the same request')
  if (matches.length) {
    const commit = matches[0]
    git('checkout', '--detach', commit)
    const version = JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8')).version
    const tag = `v${version}`
    assert.equal(git('rev-parse', `${tag}^{commit}`), commit, 'The existing release tag moved')
    return { version, tag, commit, reused: true }
  }
  git('checkout', '--detach', 'origin/main')
  const files = Object.fromEntries(releaseFiles.map(name => [name, readFileSync(resolve(cwd, name), 'utf8')]))
  const plan = planRelease(files, bump, date)
  for (const [name, content] of Object.entries(plan.files)) writeFileSync(resolve(cwd, name), content)
  git('add', '--', ...releaseFiles)
  git('commit', '-m', `chore(release): v${plan.version}\n\n${marker}`)
  const commit = git('rev-parse', 'HEAD')
  const tag = `v${plan.version}`
  git('tag', '-a', tag, '-m', `SpringKit ${plan.version}`)
  // A concurrent main update rejects both refs: never leave a tag without its main commit.
  git('push', '--atomic', 'origin', 'HEAD:refs/heads/main', `refs/tags/${tag}`)
  return { version: plan.version, tag, commit, reused: false }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run release preparation in GitHub Actions')
  assert.equal(process.env.GITHUB_REF, 'refs/heads/main', 'Start releases from main')
  const result = prepareRelease({ cwd: process.cwd(), bump: process.env.RELEASE_BUMP, date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kyiv' }).format(new Date()), requestId: process.env.GITHUB_RUN_ID, repository: process.env.GITHUB_REPOSITORY })
  for (const [key, value] of Object.entries(result)) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
  console.log(JSON.stringify(result))
}
