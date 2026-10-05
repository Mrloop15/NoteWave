import { expect, test } from '@playwright/test'

test('private content persists, filters, handles conflicts and works on mobile', async ({
  page,
  context,
  request,
}, testInfo) => {
  test.setTimeout(60_000)
  const email = `entries-${Date.now()}@example.test`
  await page.goto('/auth/register')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana de contenido')
  await page.getByLabel('Correo electrónico').fill(email)
  await page
    .getByLabel('Contraseña', { exact: true })
    .fill('Frase de pruebas privada 123')
  await page
    .getByLabel('Confirmar contraseña')
    .fill('Frase de pruebas privada 123')
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/auth\/verify-email/, { timeout: 15_000 })
  let link = ''
  await expect
    .poll(async () => {
      const result = (await (
        await request.get('http://127.0.0.1:8025/api/v1/search', {
          params: { query: `to:${email}` },
        })
      ).json()) as { messages: { ID: string }[] }
      for (const message of result.messages) {
        const detail = (await (
          await request.get(
            `http://127.0.0.1:8025/api/v1/message/${message.ID}`,
          )
        ).json()) as { Text: string }
        link =
          detail.Text.match(
            /http:\/\/127\.0\.0\.1:5174\/auth\/verify-email[^\s)]+/,
          )?.[0] ?? ''
        if (link) return true
      }
      return false
    })
    .toBe(true)
  await page.goto(link)
  await expect(page).toHaveURL(/\/app$/)
  await page.getByRole('button', { name: 'Nueva nota', exact: true }).click()
  await page.getByLabel('Título', { exact: true }).fill('Ideas del viaje')
  await page
    .getByLabel('Descripción', { exact: true })
    .fill('Llevar cámara\n<script>window.unwanted = true</script>')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.locator('.entry-open')).toContainText('Ideas del viaje')
  await page.reload()
  await page.locator('.entry-open').click()
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Llevar cámara\n<script>window.unwanted = true</script>',
  )
  expect(await page.evaluate(() => 'unwanted' in window)).toBe(false)

  const other = await context.newPage()
  await other.goto('/app')
  await other.locator('.entry-open').click()
  await expect(other.getByLabel('Título', { exact: true })).toBeEnabled()
  await page.getByLabel('Descripción', { exact: true }).fill('Versión guardada')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Guardar', exact: true }),
  ).toBeDisabled()
  await other
    .getByLabel('Descripción', { exact: true })
    .fill('Borrador de otra pestaña')
  await other.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(other.getByRole('alert')).toContainText('cambió en otra pestaña')
  await expect(other.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Borrador de otra pestaña',
  )
  other.once('dialog', (dialog) => dialog.accept())
  await other.getByRole('button', { name: 'Cargar versión guardada' }).click()
  await expect(other.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Versión guardada',
  )
  await other.close()

  await page
    .getByRole('button', { name: 'Nueva actividad', exact: true })
    .click()
  await page.getByLabel('Título', { exact: true }).fill('Reservar hotel')
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('checkbox')).toHaveAttribute(
    'aria-checked',
    'false',
  )
  await page.getByRole('checkbox').click()
  await expect(page.getByRole('checkbox')).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await page.getByRole('button', { name: 'Completadas', exact: true }).click()
  await expect(page.locator('.entry-open')).toHaveCount(1)
  await page.getByRole('button', { name: 'Notas', exact: true }).click()
  await expect(page.locator('.entry-open')).toContainText('Ideas del viaje')
  await page.getByLabel('Buscar en título y descripción').fill('ausente')
  await page.getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByText('No encontramos resultados')).toBeVisible()
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click()
  await expect(page.locator('.entry-open')).toHaveCount(1)
  await page.locator('.entry-open').click()
  await expect(page.getByLabel('Título', { exact: true })).toBeEnabled()
  await page.screenshot({
    path: testInfo.outputPath('entries-desktop.png'),
    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByLabel('Descripción', { exact: true })
    .fill('Borrador sin conexión')
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Guardar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('conectar')
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Borrador sin conexión',
  )
  await context.setOffline(false)
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Cerrar editor' }).click()
  await expect(page.getByLabel('Descripción', { exact: true })).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('entries-mobile.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click()
  await expect(page.getByText('No encontramos resultados')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Cerrar sesión' }),
  ).toBeVisible()
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0)
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/auth\/login/)
})
