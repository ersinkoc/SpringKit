/* global process, console */
// Runtime benchmark for the core animation hot path.
//
// Usage: npm run build && npm run bench
//
// Drives the BUILT library (dist/) with the deterministic test clock so every
// frame advances exactly 1/60s, and times each frame with the real
// high-resolution clock. Reported numbers are the best of TRIALS runs of the
// average time per frame.
import { spring, createSpringValue, createMotionValue, solveSpring, globalLoop } from '../dist/index.js'
import { installTestClock } from '../dist/testing/index.js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'

const FRAMES = 300
const WARMUP_FRAMES = 30
const TRIALS = 5
const SIZES = [100, 1000, 10000]

// performance.now is virtualized by the test clock: time with hrtime instead
const nowMs = () => Number(process.hrtime.bigint()) / 1e6

// Underdamped and far from the target so nothing settles during a run
// (zeta = 0.05, ~20s to rest)
const CONFIG = { stiffness: 100, damping: 1, mass: 1 }

let sink = 0

/** Average ms per loop frame while `setup(n)` keeps n animations running */
function frameBench(n, setup) {
  const averages = []
  for (let trial = 0; trial < TRIALS; trial++) {
    const clock = installTestClock({ startTime: 0 })
    const teardown = setup(n)
    for (let f = 0; f < WARMUP_FRAMES; f++) clock.nextFrame()
    const t0 = nowMs()
    for (let f = 0; f < FRAMES; f++) clock.nextFrame()
    const avg = (nowMs() - t0) / FRAMES
    if (globalLoop.size < n) {
      throw new Error(`only ${globalLoop.size}/${n} animations still running`)
    }
    teardown()
    clock.uninstall()
    averages.push(avg)
  }
  return summarize(averages)
}

/** Average microseconds per call of fn(i) */
function opBench(iterations, setup) {
  const averages = []
  for (let trial = 0; trial < TRIALS; trial++) {
    const clock = installTestClock({ startTime: 0 })
    const { run, teardown } = setup(iterations)
    const t0 = nowMs()
    for (let i = 0; i < iterations; i++) run(i)
    const avg = ((nowMs() - t0) * 1000) / iterations
    teardown()
    clock.uninstall()
    averages.push(avg)
  }
  return summarize(averages)
}

function summarize(averages) {
  const sorted = [...averages].sort((a, b) => a - b)
  return { best: sorted[0], median: sorted[Math.floor(sorted.length / 2)], trials: averages }
}

const springs = (n) => {
  const values = new Float64Array(n)
  const anims = []
  for (let i = 0; i < n; i++) {
    anims.push(
      spring(0, 1000 + i, {
        ...CONFIG,
        onUpdate: (v) => {
          values[i] = v
        },
      }).start()
    )
  }
  return () => {
    sink += values[n - 1]
    for (const a of anims) a.destroy()
  }
}

// Every spring with its own physics (no shared per-config work)
const mixedSprings = (n) => {
  const values = new Float64Array(n)
  const anims = []
  for (let i = 0; i < n; i++) {
    anims.push(
      spring(0, 1000 + i, {
        stiffness: 100 + i * 0.01,
        damping: 1 + (i % 3) * 0.5,
        onUpdate: (v) => {
          values[i] = v
        },
      }).start()
    )
  }
  return () => {
    sink += values[n - 1]
    for (const a of anims) a.destroy()
  }
}

const springValues = (n) => {
  const values = new Float64Array(n)
  const svs = []
  for (let i = 0; i < n; i++) {
    const sv = createSpringValue(0, CONFIG)
    sv.subscribe((v) => {
      values[i] = v
    })
    sv.subscribe((v) => {
      sink += v > 1e9 ? 1 : 0
    })
    sv.set(1000 + i)
    svs.push(sv)
  }
  return () => {
    sink += values[n - 1]
    for (const sv of svs) sv.destroy()
  }
}

const motionValues = (n) => {
  const values = new Float64Array(n)
  const mvs = []
  for (let i = 0; i < n; i++) {
    const mv = createMotionValue(0, { spring: CONFIG })
    mv.subscribe((v) => {
      values[i] = v
    })
    mv.set(1000 + i)
    mvs.push(mv)
  }
  return () => {
    sink += values[n - 1]
    for (const mv of mvs) mv.destroy()
  }
}

// Retargeting a MotionValue (e.g. following the pointer): cost of one set()
const motionValueSet = () => {
  const mv = createMotionValue(0, { spring: CONFIG })
  mv.subscribe((v) => {
    sink += v
  })
  return {
    run: (i) => mv.set(i % 500),
    teardown: () => mv.destroy(),
  }
}

// Instant MotionValue update (drag / scroll path)
const motionValueJump = () => {
  const mv = createMotionValue(0, { spring: CONFIG })
  mv.subscribe((v) => {
    sink += v
  })
  return {
    run: (i) => mv.set(i, false),
    teardown: () => mv.destroy(),
  }
}

const solver = () => ({
  run: (i) => {
    sink += solveSpring({ stiffness: 170 + (i % 7), damping: 26 }, 0, 100).duration
  },
  teardown: () => {},
})

const fmt = (x, digits = 3) => x.toFixed(digits).padStart(10)

// Warm up the JIT so the first measured size isn't penalized
for (const setup of [springs, mixedSprings, springValues, motionValues]) frameBench(1000, setup)

console.log(`SpringKit benchmark — node ${process.version}, ${FRAMES} frames (best of ${TRIALS})\n`)
console.log('ms / frame          N=100      N=1000     N=10000')
const report = {
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0]?.model },
  method: { frames: FRAMES, warmupFrames: WARMUP_FRAMES, trials: TRIALS, summary: 'Best and median of trial averages; not frame percentiles or device paint time.' },
  frames: {},
  operations: {},
}
for (const [name, setup] of [
  ['spring().start()', springs],
  ['spring() mixed cfg', mixedSprings],
  ['SpringValue (2 sub)', springValues],
  ['MotionValue.set()', motionValues],
]) {
  const samples = Object.fromEntries(SIZES.map(n => [n, frameBench(n, setup)]))
  report.frames[name] = samples
  const cols = SIZES.map(n => fmt(samples[n].best))
  console.log(`${name.padEnd(19)}${cols.join(' ')}`)
}

console.log('\nµs / call')
for (const [name, iterations, setup] of [
  ['MotionValue.set retarget', 20000, motionValueSet],
  ['MotionValue.set(v,false)', 200000, motionValueJump],
  ['solveSpring()', 200, solver],
]) {
  const sample = opBench(iterations, setup)
  report.operations[name] = { iterations, unit: 'microseconds/call', ...sample }
  console.log(`${name.padEnd(26)}${fmt(sample.best)}`)
}

if (process.argv.includes('--write')) {
  const directory = new URL('../docs/metrics/', import.meta.url)
  mkdirSync(directory, { recursive: true })
  writeFileSync(new URL('benchmark.json', directory), `${JSON.stringify(report, null, 2)}\n`)
  console.log('\nWrote docs/metrics/benchmark.json (machine-specific measurements).')
}

if (Number.isNaN(sink)) console.log('unreachable')
