import { expect, test } from '@playwright/test'

// The bundle limits' failing check (§3.6), measured as spike 4.1 measured it: Lighthouse's phone
// profile, the cache off, a fresh context per run, the median of five.
const LIMIT_MS = 2500
const RUNS = 5
const SLOW_4G = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
}

const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]

test('a cold visitor sees the welcome page paint within the limit', async ({ browser }) => {
  test.setTimeout(RUNS * 30_000)
  const samples: number[] = []

  for (let run = 0; run < RUNS; run++) {
    const context = await browser.newContext()
    const page = await context.newPage()
    // A visitor with no session; the stub stands in for one round trip through the BFF, which
    // Chromium's throttling does not delay since the request never reaches the network
    await page.route('**/auth/session', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, SLOW_4G.latency))
      await route.fulfill({ status: 401, contentType: 'application/problem+json', body: '{"status":401}' })
    })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', SLOW_4G)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

    await page.goto('/welcome')
    const firstPaint = await page.evaluate(
      () =>
        new Promise<number>((resolve) =>
          new PerformanceObserver((entries) => {
            const entry = entries.getEntriesByName('first-contentful-paint')[0]
            if (entry) {
              resolve(entry.startTime)
            }
          }).observe({ type: 'paint', buffered: true }),
        ),
    )
    samples.push(Math.round(firstPaint))
    await context.close()
  }

  const result = median(samples)
  console.log(`first paint ${result} ms, median of ${samples.join(', ')}`)
  expect(result, `first paint over ${LIMIT_MS} ms on the phone profile`).toBeLessThanOrEqual(LIMIT_MS)
})
