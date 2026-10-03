import { describe, it, expect } from 'vitest'
import * as springkit from '@oxog/springkit'

describe('public entry', () => {
  it('exports the physics helpers listed as added in 2.0.0', () => {
    expect(springkit.simulateSpring).toBeTypeOf('function')
    expect(springkit.stepSpring).toBeTypeOf('function')
    expect(springkit.springMotion).toBeTypeOf('function')
  })
})
