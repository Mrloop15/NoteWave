import { expect, test, type APIRequestContext } from '@playwright/test'

async function emailLink(
  request: APIRequestContext,
  email: string,
  path: string,
) {
  let link = ''
  await expect
    .poll(async () => {
      const response = await request.get(
        'http://127.0.0.1:8025/api/v1/search',
        { params: { query: `to:${email}` } },
      )
      const data = (await response.json()) as { messages: { ID: string }[] }
      for (const message of data.messages) {
        const detail = (await (
          await request.get(
            `http://127.0.0.1:8025/api/v1/message/${message.ID}`,
          )
        ).json()) as { Text: string }
        const match = detail.Text.match(
          new RegExp(`http://127\\.0\\.0\\.1:5174${path}[^\\s)]+`),
        )
        if (match) {
          link = match[0]
          return true
        }
      }
      return false
    })
    .toBe(true)
  return link
}

test('register, verify, isolate sessions, recover password and log out', async ({
  page,
  request,
  browser,
}, testInfo) => {
  const email = `identity-${Date.now()}@example.test`
  const password = 'Mi primera frase privada 123'
  await page.goto('/auth/register')
  await page.getByLabel('Nombre', { exact: true }).fill('Ana de prueba')
  await page.getByLabel('Correo electrónico').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(password)
  await page.getByLabel('Confirmar contraseña').fill(password)
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click()
  await expect(page).toHaveURL(/auth\/verify-email/)
  await expect(page.getByText(email, { exact: true })).toBeVisible()
  const cookies = await page.context().cookies()
  expect(
    cookies.find((cookie) => cookie.name === 'notewave_e2e_session')?.httpOnly,
  ).toBe(true)
  expect(cookies.find((cookie) => cookie.name === 'XSRF-TOKEN')?.httpOnly).toBe(
    false,
  )
  expect(
    await page.evaluate(() => localStorage.length + sessionStorage.length),
  ).toBe(0)
  await page.goto('/app')
  await expect(page).toHaveURL(/auth\/verify-email/)
  await page.goto(await emailLink(request, email, '/auth/verify-email'))
  await expect(page).toHaveURL(/\/app$/)
  await expect(
    page.getByText('Correo verificado', { exact: true }),
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath('account.png'),
    fullPage: true,
  })

  const visitor = await browser.newContext()
  const guest = await visitor.newPage()
  await guest.goto('http://127.0.0.1:5174/app')
  await expect(guest).toHaveURL(/auth\/login/)
  const guestMe = await visitor.request.get('http://127.0.0.1:5174/api/v1/me', {
    headers: { Accept: 'application/json', Referer: 'http://127.0.0.1:5174/' },
  })
  expect(guestMe.status()).toBe(401)

  // Real middleware must reject session mutations without a CSRF token.
  const csrf = await page.request.post('/logout', {
    headers: { Accept: 'application/json' },
  })
  expect(csrf.status()).toBe(419)
  await guest.goto('http://127.0.0.1:5174/auth/forgot-password')
  await guest.getByLabel('Correo electrónico').fill(email)
  await guest.getByRole('button', { name: 'Enviar enlace' }).click()
  await expect(guest.getByRole('status')).toContainText('Si existe una cuenta')
  const resetLink = await emailLink(request, email, '/auth/reset-password')
  await guest.goto(resetLink)
  await guest
    .getByLabel('Contraseña', { exact: true })
    .fill('Mi nueva frase privada 456')
  await guest
    .getByLabel('Confirmar contraseña')
    .fill('Mi nueva frase privada 456')
  await guest.getByRole('button', { name: 'Guardar contraseña' }).click()
  await expect(guest).toHaveURL(/auth\/login/)
  await page.reload()
  await expect(page).toHaveURL(/auth\/login/)
  await guest.getByLabel('Correo electrónico').fill(email)
  await guest.getByLabel('Contraseña', { exact: true }).fill(password)
  await guest
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(guest.getByRole('alert')).toContainText('no son correctos')
  await guest
    .getByLabel('Contraseña', { exact: true })
    .fill('Mi nueva frase privada 456')
  await guest
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click()
  await expect(guest).toHaveURL(/\/app$/)
  const otherTab = await visitor.newPage()
  await otherTab.goto('http://127.0.0.1:5174/app')
  await expect(otherTab).toHaveURL(/\/app$/)
  await guest.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(guest).toHaveURL(/auth\/login/)
  await expect(otherTab).toHaveURL(/auth\/login/)
  await guest.goto('http://127.0.0.1:5174/app')
  await expect(guest).toHaveURL(/auth\/login/)
  await visitor.close()
})

test('registration form fits mobile and labels are usable', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/auth/register')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Un espacio para tus ideas',
  )
  await page.getByLabel('Nombre', { exact: true }).focus()
  await expect(page.getByLabel('Nombre', { exact: true })).toBeFocused()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  await page.screenshot({
    path: testInfo.outputPath('register-mobile.png'),
    fullPage: true,
  })
})
