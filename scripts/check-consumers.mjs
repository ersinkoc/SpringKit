import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { statSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { expectedPublication, verifyAuditedProvenance } from './verify-published.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const npmCli = process.env.npm_execpath
const web = process.argv.includes('--web')
const registry = process.argv.includes('--registry')
const provenance = process.argv.includes('--provenance')
if (provenance && !registry) throw new Error('Provenance checks require registry-installed consumers')
const packageInfo = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
if (!npmCli) throw new Error('Run through npm run test:consumers')
const run = (args, cwd) => {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', timeout: 180_000, maxBuffer: 8e6 })
  if (result.status !== 0) throw new Error(`${args.join(' ')}\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`)
  return result.stdout
}
const artifactDir = join(root, '.temp_files', 'packages')
mkdirSync(artifactDir, { recursive: true })
let tarball = registry ? `${packageInfo.name}@${packageInfo.version}` : process.env.SPRINGKIT_TARBALL
if (!tarball) {
  run([npmCli, 'pack', '--ignore-scripts', '--pack-destination', artifactDir], root)
  const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version
  tarball = join(artifactDir, `oxog-springkit-${version}.tgz`)
}
if (!registry) tarball = resolve(tarball)
if (!registry && statSync(tarball).isDirectory()) {
  const matches = readdirSync(tarball).filter(name => name.startsWith('oxog-springkit-') && name.endsWith('.tgz'))
  if (matches.length !== 1) throw new Error(`Expected one package archive in ${tarball}`)
  tarball = join(tarball, matches[0])
}
const temp = mkdtempSync(join(tmpdir(), 'springkit-consumers-'))
let success = false
try {
  for (const version of [null, '18', '19']) {
    const cwd = join(temp, version ? `react-${version}` : 'core')
    mkdirSync(cwd)
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
    const dependencies = version ? [tarball, `react@${version}`, `react-dom@${version}`, `@types/react@${version}`, `@types/react-dom@${version}`, 'typescript@^5.9.3'] : [tarball]
    run([npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', ...(registry ? ['--prefer-online'] : []), ...dependencies], cwd)
    if (registry) {
      const installed = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8')).packages[`node_modules/${packageInfo.name}`]
      if (installed?.version !== packageInfo.version || !installed.resolved?.startsWith('https://registry.npmjs.org/')) {
        throw new Error(`Consumer did not install ${tarball} from the public npm registry`)
      }
      console.log(`PASS installed ${tarball} from npm into clean ${version ? `React ${version}` : 'core'} project`)
    }
    const body = version ? `
      import * as React from 'react';
      import {renderToString} from 'react-dom/server';
      import * as adapter from '@oxog/springkit/react';
      const cjsAdapter = require('@oxog/springkit/react');
      assert.equal(core.MotionValue, adapter.MotionValue);
      assert.equal(cjsCore.MotionValue, cjsAdapter.MotionValue);
      assert.match(renderToString(React.createElement(adapter.Animated.div, {initial: {opacity: 0}, animate: {opacity: 1}}, 'server')), /server/);
      assert.equal(React.version.split('.')[0], '${version}');
    ` : `assert.throws(() => require.resolve('react'));`
    writeFileSync(join(cwd, 'runtime.mjs'), `
      import assert from 'node:assert/strict';
      import {createRequire} from 'node:module';
      import * as core from '@oxog/springkit';
      import * as dom from '@oxog/springkit/dom';
      import {installTestClock} from '@oxog/springkit/testing';
      const require = createRequire(import.meta.url);
      const cjsCore = require('@oxog/springkit');
      assert.equal(require('@oxog/springkit/package.json').version, '${packageInfo.version}');
      assert.equal(typeof dom.bindStyle, 'function');
      assert.equal(typeof require('@oxog/springkit/dom').bindStyle, 'function');
      const clock = installTestClock();
      const animation = core.spring(0, 100).start(); clock.runAll();
      assert.equal(animation.getValue(), 100); animation.destroy(); clock.uninstall();
      ${body}
    `)
    run([join(cwd, 'runtime.mjs')], cwd)
    if (provenance && !version) {
      const report = JSON.parse(run([npmCli, 'audit', 'signatures', '--json', '--include-attestations'], cwd))
      verifyAuditedProvenance(report, expectedPublication())
      console.log('PASS npm cryptographic signatures and provenance bound to the release repository, workflow, tag and commit')
    }
    if (version) {
      const source = `import * as React from 'react'; import {Animated} from '@oxog/springkit/react'; import {animate, createMotionValue} from '@oxog/springkit'; import {bindStyle} from '@oxog/springkit/dom';
        export const svg = <Animated.svg ref={React.createRef<SVGSVGElement>()} />;
        export const html = <Animated.div style={{opacity: createMotionValue(0)}} />;
        animate(document.createElement('div'), {x: 100}, {onUpdate: values => values.x.toFixed(2)});
        bindStyle(document.createElement('div'), {opacity: createMotionValue(1)});
      `
      writeFileSync(join(cwd, 'types.tsx'), source)
      const tsc = join(cwd, 'node_modules', 'typescript', 'bin', 'tsc')
      for (const mode of ['NodeNext', 'Bundler']) run([tsc, 'types.tsx', '--noEmit', '--strict', '--skipLibCheck', '--jsx', 'react-jsx', '--target', 'es2021', '--module', mode === 'NodeNext' ? 'NodeNext' : 'esnext', '--moduleResolution', mode], cwd)
    }
    console.log(`PASS ${version ? `React ${version}: SSR, ESM/CJS singleton, SVG/style types (NodeNext + bundler)` : 'Core: ESM/CJS + DOM/testing, with no React installed'}`)
    if (web && version === '19') {
      run([npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', 'vite@8.3.6', 'next@16.4.5'], cwd)
      writeFileSync(join(cwd, 'index.html'), '<div id="root"></div><script type="module" src="/main.jsx"></script>')
      writeFileSync(join(cwd, 'main.jsx'), `import * as React from 'react'; import {createRoot} from 'react-dom/client'; import {Animated, createMotionValue} from '@oxog/springkit/react'; createRoot(document.getElementById('root')).render(<Animated.div style={{opacity:createMotionValue(1)}}>vite-ready</Animated.div>);`)
      run([join(cwd, 'node_modules/vite/bin/vite.js'), 'build'], cwd)
      if (!readFileSync(join(cwd, 'dist/index.html'), 'utf8').includes('/assets/')) throw new Error('Vite did not emit a bundled entry')
      console.log('PASS Vite 8: production build from the packed React entry')
      mkdirSync(join(cwd, 'app'))
      writeFileSync(join(cwd, 'next.config.mjs'), `export default {output:'export', experimental:{cpus:2}}`)
      writeFileSync(join(cwd, 'app/layout.jsx'), `export default function Layout({children}) { return <html lang="en"><body>{children}</body></html> }`)
      writeFileSync(join(cwd, 'app/client.jsx'), `'use client'; import {Animated, useMotionValue} from '@oxog/springkit/react'; export default function Client() { const opacity=useMotionValue(1); return <Animated.div animate={{x:20}} style={{opacity}}>client-ready</Animated.div> }`)
      writeFileSync(join(cwd, 'app/page.jsx'), `import {solveSpring} from '@oxog/springkit'; import Client from './client'; export default function Page() { return <main>solver={solveSpring({stiffness:100,damping:10}).duration}<Client /></main> }`)
      run([join(cwd, 'node_modules/next/dist/bin/next'), 'build', '--webpack'], cwd)
      const rendered = readFileSync(join(cwd, 'out/index.html'), 'utf8')
      if (!rendered.includes('client-ready') || !rendered.includes('solver=')) throw new Error('Next did not prerender both server and client components')
      console.log('PASS Next 16 App Router: server/core + client/React boundary, production build and static prerender')
    }
  }
  success = true
} finally {
  // Only delete the unique directory created above, directly below the OS temp directory.
  const target = realpathSync(temp)
  if (success && dirname(target) === realpathSync(tmpdir()) && basename(target).startsWith('springkit-consumers-')) rmSync(target, { recursive: true, force: true })
  else console.log(`Consumer fixtures retained: ${temp}`)
}
