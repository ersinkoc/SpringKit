import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'

const { GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: request, RELEASE_TAG: tag, RELEASE_COMMIT: commit } = process.env
assert(/^[\w.-]+\/[\w.-]+$/.test(repo), 'Expected owner/repository')
assert(/^\d+$/.test(request) && /^v\d+\.\d+\.\d+$/.test(tag) && /^[a-f0-9]{40}$/.test(commit), 'Invalid release identity')
const gh = (...args) => execFileSync('gh', [...args, '--repo', repo], { encoding: 'utf8', timeout: 2_100_000, maxBuffer: 16e6 })
const find = () => JSON.parse(gh('run', 'list', '--workflow', 'release.yml', '--commit', commit, '--event', 'workflow_dispatch', '--limit', '100', '--json', 'databaseId,displayTitle,headBranch,status,conclusion,url'))
  .find(run => run.headBranch === tag && run.displayTitle === `Release ${tag} · request ${request}`)
let run = find()
if (!run) {
  // GITHUB_TOKEN pushes intentionally do not start other workflows. Dispatch
  // explicitly on the tag so npm signs that tag's real GITHUB_SHA and ref.
  gh('workflow', 'run', 'release.yml', '--ref', tag, '-f', `request_id=${request}`)
  const deadline = Date.now() + 120000
  do {
    await new Promise(done => setTimeout(done, 5000))
    run = find()
  } while (!run && Date.now() < deadline)
  assert(run, 'Timed out locating the dispatched release; retry this same preparation run')
} else if (run.status === 'completed' && run.conclusion !== 'success') {
  const previous = JSON.parse(gh('run', 'view', String(run.databaseId), '--json', 'attempt')).attempt
  gh('run', 'rerun', String(run.databaseId), '--failed')
  // GitHub can briefly report the completed old attempt after accepting rerun.
  const deadline = Date.now() + 120000
  let attempt
  do {
    await new Promise(done => setTimeout(done, 5000))
    attempt = JSON.parse(gh('run', 'view', String(run.databaseId), '--json', 'attempt')).attempt
  } while (attempt <= previous && Date.now() < deadline)
  assert(attempt > previous, 'Timed out waiting for the retried release attempt')
}
const links = `Release ${tag}: ${run.url}\n\n- npm: https://www.npmjs.com/package/@oxog/springkit/v/${tag.slice(1)}\n- GitHub Release: https://github.com/${repo}/releases/tag/${tag}\n- Website: https://springkit.oxog.dev/\n`
appendFileSync(process.env.GITHUB_STEP_SUMMARY, links)
console.log(links)
// A rerun reuses the request commit/tag and its existing child, never bumps again.
gh('run', 'watch', String(run.databaseId), '--exit-status', '--interval', '15')
console.log('PASS complete version → npm → GitHub Release → website pipeline')
