import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: [
      { find: '@oxog/springkit/dom', replacement: fileURLToPath(new URL('./src/dom/index.ts', import.meta.url)) },
      { find: '@oxog/springkit/react', replacement: fileURLToPath(new URL('./src/adapters/react/index.ts', import.meta.url)) },
      { find: '@oxog/springkit/testing', replacement: fileURLToPath(new URL('./src/testing/index.ts', import.meta.url)) },
      { find: '@oxog/springkit', replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) },
    ],
  },
  test: {
    maxWorkers: 3,
    include: ['tests/browser/**/*.browser.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      commands: {
        async pointerGesture({ page, iframe }, selector: string, loseCapture: boolean) {
          const target = iframe.locator(selector)
          const box = await target.boundingBox()
          if (!box) throw new Error(`No pointer target: ${selector}`)
          await page.mouse.move(box.x + 10, box.y + 10)
          await page.mouse.down()
          try {
            await page.mouse.move(box.x + box.width + 60, box.y + 35, { steps: 5 })
            if (loseCapture) await target.evaluate(element => {
              element.releasePointerCapture(Number((element as HTMLElement).dataset.pointerId))
            })
          } finally { await page.mouse.up() }
        },
      },
      instances: [{ browser: 'chromium' }, { browser: 'firefox' }, { browser: 'webkit' }],
    },
  },
})
