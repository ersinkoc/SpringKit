import { describe, it, expect } from 'vitest'
import * as v8 from 'node:v8'
import * as vm from 'node:vm'
import { globalLoop, type Animatable } from '../../../src/animation/loop'
import { spring } from '../../../src/core/spring'

// Obtain a gc() function without requiring --expose-gc on the CLI
v8.setFlagsFromString('--expose-gc')
const gc = vm.runInNewContext('gc') as () => void

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

describe('AnimationLoop strong references (regression)', () => {
  it('keeps a running fire-and-forget animation alive across GC', async () => {
    let updates = 0
    let completed = false

    // Fire-and-forget: the returned controller is discarded immediately
    ;(() => {
      spring(0, 100, {
        stiffness: 300,
        damping: 30,
        onUpdate: () => {
          updates++
        },
        onComplete: () => {
          completed = true
        },
      }).start()
    })()

    await wait(50)
    gc()
    await wait(50)
    gc()
    const updatesAfterGc = updates
    await wait(100)

    // The animation must still be ticking after a GC
    expect(updates).toBeGreaterThan(updatesAfterGc)

    // ...and must eventually complete
    for (let i = 0; i < 100 && !completed; i++) {
      gc()
      await wait(50)
    }
    expect(completed).toBe(true)
    expect(globalLoop.size).toBe(0)
  }, 10000)

  it('holds running animations strongly and releases them on completion', async () => {
    let done = false
    const anim: Animatable = { update: () => {}, isComplete: () => done }
    globalLoop.add(anim)
    gc()
    expect(globalLoop.getAliveCount()).toBeGreaterThanOrEqual(1)
    done = true
    await wait(50)
    expect(globalLoop.size).toBe(0)
  })
})
