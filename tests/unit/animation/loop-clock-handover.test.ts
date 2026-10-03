import { it, expect } from 'vitest'
import { installTestClock } from '../../../src/testing/index'
import { spring } from '../../../src/core/spring'
import { globalLoop } from '../../../src/animation/loop'

it('a frame handed over to the real clock on uninstall does not start a second RAF chain', async () => {
  const first = installTestClock()
  const leaked = spring(0, 1, { stiffness: 100, damping: 5 })
  leaked.start()
  first.advance(50)
  // The loop's pending frame is re-requested on the real clock
  first.uninstall()

  const clock = installTestClock()
  const anim = spring(0, 100, { stiffness: 300, damping: 30 })
  anim.start() // moves the loop to the new clock
  try {
    // Let the handed-over (stale) real frame fire
    await new Promise((resolve) => setTimeout(resolve, 100))

    let ticks = 0
    const off = globalLoop.onFrame(() => ticks++)
    clock.nextFrame()
    clock.nextFrame()
    clock.nextFrame()
    off()
    // One loop tick per frame (it was two: the stale callback forked a chain)
    expect(ticks).toBe(3)
  } finally {
    leaked.destroy()
    anim.destroy()
    clock.uninstall()
  }
})
