import { expect, test } from '@playwright/test'

test('welcome connects through the proxy and fits the viewport', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Dale espacio a lo que tienes en mente.',
  )
  await expect(page.getByRole('status')).toHaveText('Servicio disponible')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({
    path: testInfo.outputPath('welcome.png'),
    fullPage: true,
  })
})

test('unknown page offers navigation home', async ({ page }) => {
  await page.goto('/missing-page')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Esta página no existe',
  )
  await page.getByRole('link', { name: 'Volver al inicio' }).click()
  await expect(page.getByRole('status')).toHaveText('Servicio disponible')
})

test('connection error can be retried', async ({ page }) => {
  await page.route('**/health/live', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText(
    'No pudimos conectar con el servicio.',
  )
  await page.unroute('**/health/live')
  await page.getByRole('button', { name: 'Volver a intentar' }).click()
  await expect(page.getByRole('status')).toHaveText('Servicio disponible')
})
