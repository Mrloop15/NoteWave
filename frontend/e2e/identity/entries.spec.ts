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
  const language = page.getByRole('combobox', { name: 'Idioma del dictado' })
  await language.click()
  await expect(page.getByRole('option', { name: 'Español' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page
    .locator('.dictation-panel')
    .screenshot({ path: testInfo.outputPath('dropdown.png') })
  await language.press('End')
  await language.press('Enter')
  await expect(language).toContainText('Inglés')
  await language.press('Home')
  await language.press('Enter')
  await expect(language).toContainText('Español')
  // A real MediaRecorder captures a synthetic stream; no physical microphone or private speech.
  await page.evaluate(() => {
    const audioContext = new AudioContext()
    const oscillator = audioContext.createOscillator()
    const destination = audioContext.createMediaStreamDestination()
    oscillator.connect(destination)
    oscillator.start()
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => destination.stream,
    })
    Object.assign(window, {
      testAudioContext: audioContext,
      testAudioStream: destination.stream,
    })
  })
  await page
    .getByLabel('Descripción', { exact: true })
    .fill('Texto escrito a mano.')
  await page
    .getByRole('button', { name: 'Grabar dictado', exact: true })
    .click()
  await expect(
    page.getByRole('status').filter({ hasText: /Grabando.*[1-9] s/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Detener grabación' }).click()
  await page.getByRole('button', { name: 'Reproducir grabación' }).click()
  await expect(
    page.getByRole('button', { name: 'Pausar grabación' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Detener reproducción' }).click()
  await page
    .locator('.dictation-panel')
    .screenshot({ path: testInfo.outputPath('audio-controls.png') })
  expect(
    await page.evaluate(() =>
      (window as unknown as { testAudioStream: MediaStream }).testAudioStream
        .getTracks()
        .every((track) => track.readyState === 'ended'),
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Enviar grabación' }).click()
  await expect(
    page.getByLabel('Revisa y edita el texto de ejemplo'),
  ).toHaveValue(/\[Demostración\]/, { timeout: 15_000 })
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Texto escrito a mano.',
  )
  await page
    .getByLabel('Revisa y edita el texto de ejemplo')
    .fill('Texto revisado del dictado.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: testInfo.outputPath('dictation-mobile.png'),
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page
    .getByRole('button', { name: 'Insertar al final de la descripción' })
    .click()
  await expect(page.getByLabel('Descripción', { exact: true })).toHaveValue(
    'Texto escrito a mano.\nTexto revisado del dictado.',
  )
  expect(
    (
      (await (
        await page.request.get('/api/v1/entries', {
          headers: {
            Accept: 'application/json',
            Referer: 'http://127.0.0.1:5174/',
          },
        })
      ).json()) as { data: unknown[] }
    ).data,
  ).toHaveLength(0)
  await page.evaluate(() =>
    (
      window as unknown as { testAudioContext: AudioContext }
    ).testAudioContext.close(),
  )
  await page.setViewportSize({ width: 1280, height: 900 })
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
