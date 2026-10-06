import { expect, test } from '@playwright/test'

test('preferences persist and password change revokes a separate device', async ({
  page,
  request,
  browser,
}, testInfo) => {
  test.setTimeout(70_000)
  const email = `account-${Date.now()}@example.test`,
    original = 'Frase de cuenta privada 123',
    updated = 'Nueva frase de cuenta privada 456'
  await page.goto('/auth/register')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana de cuenta')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(original)
  await page.getByLabel('Confirmar contraseña').fill(original)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/auth\/verify-email/, { timeout: 15_000 })
  let link = ''
  await expect
    .poll(async () => {
      const data = (await (
        await request.get('http://127.0.0.1:8025/api/v1/search', {
          params: { query: `to:${email}` },
        })
      ).json()) as { messages: { ID: string }[] }
      for (const message of data.messages) {
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
  await page.getByRole('link', { name: 'Mi cuenta' }).click()
  await page.getByLabel('Nombre', { exact: true }).fill('Ana personalizada')
  const language = page.getByRole('combobox', {
    name: 'Idioma predeterminado del dictado',
  })
  await language.press('End')
  await language.press('Enter')
  const timezone = page.getByRole('combobox', {
    name: 'Zona horaria',
    exact: true,
  })
  await timezone.click()
  await page.getByRole('option', { name: 'Asia / Tokyo', exact: true }).click()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('link', { name: 'Volver a mis notas' }).click()
  await expect(page).toHaveURL(/app\/account/)
  await page.getByRole('button', { name: 'Guardar preferencias' }).click()
  await expect(page.getByRole('status')).toContainText('Preferencias guardadas')
  await page.reload()
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(
    'Ana personalizada',
  )
  await expect(language).toContainText('Inglés')
  await expect(timezone).toContainText('Asia / Tokyo')
  await page.screenshot({
    path: testInfo.outputPath('account-desktop.png'),
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('account-mobile.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.getByRole('link', { name: 'Volver a mis notas' }).click()
  await page.getByRole('button', { name: 'Nueva nota', exact: true }).click()
  await expect(
    page.getByRole('combobox', { name: 'Idioma del dictado', exact: true }),
  ).toContainText('Inglés')
  await page.getByRole('button', { name: 'Cerrar editor' }).click()
  await page.getByRole('link', { name: 'Mi cuenta' }).click()

  const otherTab = await page.context().newPage()
  await otherTab.goto('/app/account')
  await expect(otherTab.getByLabel('Nombre', { exact: true })).toHaveValue(
    'Ana personalizada',
  )
  await page.getByLabel('Nombre', { exact: true }).fill('Ana versión nueva')
  await page.getByRole('button', { name: 'Guardar preferencias' }).click()
  await expect(page.getByRole('status')).toContainText('Preferencias guardadas')
  await otherTab.getByLabel('Nombre', { exact: true }).fill('Borrador anterior')
  await otherTab.getByRole('button', { name: 'Guardar preferencias' }).click()
  await expect(otherTab.getByRole('alert')).toContainText(
    'cambió en otra pestaña',
  )
  await expect(otherTab.getByLabel('Nombre', { exact: true })).toHaveValue(
    'Borrador anterior',
  )
  otherTab.once('dialog', (dialog) => dialog.accept())
  await otherTab.getByRole('button', { name: 'Cargar perfil guardado' }).click()
  await expect(otherTab.getByLabel('Nombre', { exact: true })).toHaveValue(
    'Ana versión nueva',
  )
  await otherTab.close()

  const device = await browser.newContext()
  const second = await device.newPage()
  await second.goto('http://127.0.0.1:5174/auth/login')
  await second.getByLabel('Correo electrónico').fill(email)
  await second.getByLabel('Contraseña', { exact: true }).fill(original)
  await second
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(second).toHaveURL(/\/app$/)
  await page.getByLabel('Contraseña actual', { exact: true }).fill(original)
  await page.getByLabel('Nueva contraseña', { exact: true }).fill(updated)
  await page
    .getByLabel('Confirmar nueva contraseña', { exact: true })
    .fill(updated)
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click()
  await expect(
    page.getByRole('status').filter({ hasText: 'Contraseña actualizada' }),
  ).toBeVisible()
  await expect(
    page.getByLabel('Contraseña actual', { exact: true }),
  ).toHaveValue('')
  await page.reload()
  await expect(page).toHaveURL(/app\/account/)
  await second.reload()
  await expect(second).toHaveURL(/auth\/login/)
  await second.getByLabel('Correo electrónico').fill(email)
  await second.getByLabel('Contraseña', { exact: true }).fill(original)
  await second
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(second.getByRole('alert')).toBeVisible()
  await second.getByLabel('Contraseña', { exact: true }).fill(updated)
  await second
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(second).toHaveURL(/\/app$/)
  await device.close()
})
