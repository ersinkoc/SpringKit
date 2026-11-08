import { globalLoop, type Animatable } from './loop.js'
import type { SpringValue } from '../core/spring-value.js'
import { validateAnimationValue } from '../utils/warnings.js'

/** Numeric timed driver using the same clock and completion contract as springs. */
export interface TimedValue extends SpringValue { pause(): void; resume(): void }

export function createTweenValue(initial: number, duration: number, ease: (progress: number) => number = p => p): TimedValue {
  let value = initial
  let from = initial
  let to = initial
  let elapsed = 0
  let running = false
  let paused = false
  let destroyed = false
  let generation = 0
  let resolve: (() => void) | undefined
  let finished = Promise.resolve()
  const subscribers = new Set<(value: number) => void>()
  const notify = () => {
    for (const callback of subscribers) {
      try { callback(value) } catch (error) { console.error('[SpringKit] Tween subscriber error:', error) }
    }
  }
  const stop = () => {
    generation++
    running = paused = false
    globalLoop.remove(driver)
    resolve?.(); resolve = undefined
  }
  const driver: Animatable = {
    update(_now, delta = 0) {
      if (!running) return
      const run = generation
      elapsed += delta
      const progress = duration > 0 && elapsed + 1e-6 < duration ? elapsed / duration : 1
      let eased = progress
      try { const result = ease(progress); if (Number.isFinite(result)) eased = result }
      catch (error) { console.error('[SpringKit] Tween easing error:', error) }
      value = progress >= 1 ? to : from + (to - from) * eased
      notify()
      if (progress >= 1 && run === generation) stop()
    },
    isComplete: () => !running && !paused,
  }
  return {
    get: () => value,
    getVelocity: () => 0,
    get finished() { return finished },
    set(target) {
      if (destroyed) return
      stop()
      from = value; to = validateAnimationValue(target, 'tween.target'); elapsed = 0
      finished = new Promise(done => { resolve = done })
      running = true
      globalLoop.add(driver)
    },
    jump(target) { if (!destroyed) { stop(); value = validateAnimationValue(target, 'tween.value'); notify() } },
    stop,
    pause() { if (running) { paused = true; running = false; globalLoop.remove(driver) } },
    resume() { if (paused && !destroyed) { paused = false; running = true; globalLoop.add(driver) } },
    isAnimating: () => running,
    isDestroyed: () => destroyed,
    setConfig: () => {},
    subscribe(callback) {
      const entry = (v: number) => callback(v)
      subscribers.add(entry)
      try { callback(value) } catch (error) { console.error('[SpringKit] Tween subscriber error:', error) }
      return () => { subscribers.delete(entry) }
    },
    destroy() { if (!destroyed) { stop(); destroyed = true; subscribers.clear() } },
  }
}
