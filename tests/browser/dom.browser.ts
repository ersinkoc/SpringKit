import { expect, test } from 'vitest'
import { animate, animateNative, createMorph, shapes, createMotionValue } from '../../src/index'
import { bindStyle } from '../../src/dom'
import { installTestClock } from '../../src/testing'
import { commands } from 'vitest/browser'
import { createDragSpring, createScrollSpring, createFlip, measureElement } from '../../src/index'

declare module 'vitest/browser' {
  interface BrowserCommands {
    pointerGesture(selector: string, loseCapture: boolean): Promise<void>
  }
}

test('real CSS: string channels, units and binding cleanup', async () => {
  const element = document.createElement('div')
  document.body.appendChild(element)
  element.style.width = '0%'
  element.style.backgroundColor = 'rgb(255, 0, 0)'
  const clock = installTestClock()
  const controls = animate(element, { width: '50%', backgroundColor: '#0000ff' })
  try {
    for (let i = 0; i < 240 && controls.isAnimating(); i++) { clock.nextFrame(); await Promise.resolve() }
    await controls.finished
    expect(element.style.width).toBe('50%')
    expect(element.style.backgroundColor).toBe('rgb(0, 0, 255)')
    const opacity = createMotionValue(0.2)
    const detach = bindStyle(element, { opacity })
    opacity.jump(0.6)
    expect(element.style.opacity).toBe('0.6')
    detach(); opacity.destroy()
  } finally { controls.stop(); clock.uninstall(); element.remove() }
})

test('real WAAPI commits the final frame and releases the animation', async () => {
  const element = document.createElement('div')
  document.body.appendChild(element)
  const controls = animateNative(element, { opacity: [0, 1] }, { respectReducedMotion: false })
  try {
    expect(controls.animation).not.toBeNull()
    controls.finish()
    await controls.finished
    expect(element.style.opacity).toBe('1')
    expect(controls.animation?.playState).toBe('idle')
  } finally { controls.cancel(); element.remove() }
})

test('real SVG geometry is sampled and morphs without invalid coordinates', () => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const path = document.createElementNS(svg.namespaceURI, 'path') as SVGPathElement
  svg.appendChild(path); document.body.appendChild(svg)
  path.setAttribute('d', shapes.circle(50, 50, 30))
  expect(path.getTotalLength()).toBeGreaterThan(180)
  const morph = createMorph(shapes.circle(50, 50, 30))
  const clock = installTestClock()
  const unsubscribe = morph.subscribe(d => path.setAttribute('d', d))
  try {
    morph.morphTo(shapes.star(50, 50, 30, 15, 5))
    clock.runAll()
    expect(path.getAttribute('d')).not.toMatch(/NaN|Infinity/)
    expect(path.getTotalLength()).toBeGreaterThan(100)
  } finally { unsubscribe(); morph.destroy(); clock.uninstall(); svg.remove() }
})

test.each([false, true])('pointer capture preserves an out-of-box drag and ends once (lost capture: %s)', async loseCapture => {
  const element = document.createElement('div')
  element.id = 'pointer-target'
  element.style.cssText = 'width:50px;height:50px;touch-action:pan-y;background:red'
  document.body.appendChild(element)
  let ended = 0
  let captured = false
  element.addEventListener('pointerdown', event => { element.dataset.pointerId = String(event.pointerId) })
  const drag = createDragSpring(element, {
    momentum: false,
    constraints: { lockAxis: 'x' },
    onDrag: (_x, _y, event) => { captured ||= element.hasPointerCapture(event.pointerId) },
    onDragEnd: () => { ended++ },
  })
  try {
    await commands.pointerGesture('#pointer-target', loseCapture)
    expect(captured).toBe(true)
    expect(drag.getPosition().x).toBeGreaterThan(80)
    expect(drag.getPosition().y).toBe(0)
    expect(drag.isDragging()).toBe(false)
    expect(ended).toBe(1)
    expect(element.style.touchAction).toBe('pan-y')
  } finally { drag.destroy(); element.remove() }
})

test('scroll container measurements clamp wheel input to its actual content range', () => {
  const container = document.createElement('div')
  container.style.cssText = 'height:100px;width:100px;overflow:auto'
  container.innerHTML = '<div style="height:500px;width:100px"></div>'
  document.body.appendChild(container)
  const clock = installTestClock()
  const scroll = createScrollSpring(container, { bounce: false, direction: 'vertical' })
  try {
    container.dispatchEvent(new WheelEvent('wheel', { deltaY: 10000, cancelable: true }))
    clock.runAll()
    expect(scroll.getScroll().y).toBe(container.scrollHeight - container.clientHeight)
    expect(scroll.getScroll().x).toBe(0)
  } finally { scroll.destroy(); clock.uninstall(); container.remove() }
})

test('FLIP uses real layout boxes and restores the original inline transform', async () => {
  const element = document.createElement('div')
  element.style.cssText = 'position:absolute;left:10px;top:10px;width:80px;height:40px;transform:rotate(5deg)'
  document.body.appendChild(element)
  const first = measureElement(element)
  element.style.left = '150px'
  element.style.width = '160px'
  const last = measureElement(element)
  const clock = installTestClock()
  const flip = createFlip(element, first, last)
  try {
    const finished = flip.play()
    expect(element.style.transform).not.toBe('rotate(5deg)')
    clock.runAll()
    await finished
    expect(element.style.transform).toBe('rotate(5deg)')
    expect(measureElement(element).x).toBeCloseTo(last.x, 4)
  } finally { flip.cancel(); clock.uninstall(); element.remove() }
})
