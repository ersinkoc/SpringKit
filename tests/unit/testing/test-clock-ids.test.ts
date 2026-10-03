import { describe, it, expect, afterEach } from 'vitest'
import { installTestClock, type TestClock } from '../../../src/testing/index'

let clock: TestClock | null = null
afterEach(() => {
  clock?.uninstall()
  clock = null
})

const waitReal = () => new Promise<void>((resolve) => setTimeout(resolve, 60))

/**
 * Code often cancels the last id it was given in cleanup, even if that frame
 * or timer already ran. After the clock is uninstalled those virtual ids go
 * to the real cancel functions and must not hit unrelated real callbacks.
 */
describe('test clock ids after uninstall()', () => {
  it('cancelling a stale virtual frame id never cancels a real frame', async () => {
    clock = installTestClock()
    const virtualIds: number[] = []
    for (let i = 0; i < 200; i++) virtualIds.push(requestAnimationFrame(() => {}))
    clock.nextFrame() // they all ran: nothing is handed over
    clock.uninstall()
    clock = null

    let fired = 0
    for (let i = 0; i < 20; i++) requestAnimationFrame(() => fired++)
    for (const id of virtualIds) cancelAnimationFrame(id)
    await waitReal()
    expect(fired).toBe(20)
  })

  it('clearing a stale virtual timer id never clears a real timer', async () => {
    // Real numeric timer ids (Node: async ids) the virtual range must not reach
    const probe = setTimeout(() => {}, 0)
    const realBase = Number(probe)
    clearTimeout(probe)

    clock = installTestClock({ timers: true })
    const virtualIds: unknown[] = []
    for (let i = 0; i < realBase + 500; i++) virtualIds.push(setTimeout(() => {}, 0))
    clock.runAll()
    clock.uninstall()
    clock = null

    let fired = 0
    for (let i = 0; i < 20; i++) Number(setTimeout(() => fired++, 0))
    for (const id of virtualIds) clearTimeout(id as number)
    await waitReal()
    expect(fired).toBe(20)
  })
})
