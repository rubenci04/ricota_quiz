import { expect, test } from '@playwright/test'

async function preparar(page) {
  await page.route('**/*', (route) => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort())
  await page.goto('/')
}

async function crear(page, alias) {
  await page.getByLabel('Crear perfil', { exact: true }).fill(alias)
  await page.getByRole('button', { name: 'Crear y jugar' }).click()
  const cerrar = page.getByRole('button', { name: 'Cerrar reproductor' })
  if (await cerrar.isVisible()) await cerrar.click()
}

async function entrar(page) {
  const saltar = page.getByRole('button', { name: 'Saltar', exact: true })
  if (await saltar.isVisible()) await saltar.click()
  await page.getByRole('button', { name: /Un jugador/ }).click()
}

async function sinDesborde(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
}

test('perfiles, niveles, edición y recarga', async ({ page }, info) => {
  await preparar(page)
  await page.getByRole('button', { name: 'Subir el volumen' }).click()
  await expect(page.getByRole('group', { name: 'Volumen de la música' })).toContainText('40%')
  await page.getByLabel('Crear perfil', { exact: true }).fill('ab')
  await page.getByRole('button', { name: 'Crear y jugar' }).click()
  await expect(page.getByRole('alert')).toContainText('3 a 18')
  await page.screenshot({ path: `qa/${info.project.name}-perfiles.png`, fullPage: true, animations: 'disabled' })
  await crear(page, 'Pogo Azul')
  await entrar(page)
  await expect(page.getByText('Jugando como Pogo Azul')).toBeVisible()
  await sinDesborde(page)
  await page.screenshot({ path: `qa/${info.project.name}-menu.png`, fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: /^Trivia/ }).click()
  await expect(page.getByRole('button', { name: /Nivel 2/ })).toBeDisabled()
  await sinDesborde(page)
  await page.screenshot({ path: `qa/${info.project.name}-niveles.png`, fullPage: true, animations: 'disabled' })
  await page.getByRole('button', { name: /Nivel 1/ }).click()
  await expect(page.getByText('1/10', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ir al menú principal' }).click()
  await page.getByRole('button', { name: 'Cambiar o editar perfil' }).click()
  await crear(page, 'Luz Roja')
  await page.getByRole('button', { name: /^Trivia/ }).click()
  await expect(page.getByRole('button', { name: /Nivel 1/ })).toContainText('Intentos: 0')
  await page.getByRole('button', { name: 'Ir al menú principal' }).click()
  await page.getByRole('button', { name: 'Cambiar o editar perfil' }).click()
  await page.getByRole('button', { name: 'Editar alias de Pogo Azul' }).click()
  await page.getByLabel('Editar alias', { exact: true }).fill('Pogo Verde')
  await page.getByRole('button', { name: 'Guardar alias' }).click()
  await page.getByRole('button', { name: 'Cambiar o editar perfil' }).click()
  await page.getByRole('button', { name: 'Pogo Verde', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await entrar(page)
  await expect(page.getByText('Jugando como Pogo Verde')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ricota_quiz')).preferencias.volumen)).toBe(40)
  await page.getByRole('button', { name: /^Trivia/ }).click()
  await expect(page.getByRole('button', { name: /Nivel 1/ })).toContainText('Intentos: 1')
})

test('otros modos, logros, temas y jugador migrado', async ({ page }, info) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('ricota_quiz')) localStorage.setItem('ricota_quiz', JSON.stringify({ v: 5, nivel: 9, partidas: 5, sopas: 3, tutorial: true, logros: { primera: '2026-10-20' } }))
  })
  await preparar(page)
  await expect(page.getByRole('note')).toContainText('progreso anterior')
  await crear(page, 'Heredero')
  await entrar(page)
  for (const nombre of [/Dicho de otra forma/, /^Reto del día/, /^Sopa de letras/, /^Crucigrama/, /^Discografía/, /^Adivinanzas por palabras/, /^La banda/]) {
    await page.getByRole('button', { name: nombre }).click()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByText('No se pudo armar un crucigrama con estos datos.')).toHaveCount(0)
    await sinDesborde(page)
    await page.getByRole('button', { name: 'Ir al menú principal' }).click()
  }
  await page.getByRole('button', { name: /^Logros/ }).click()
  await expect(page.getByText('Logros de Heredero')).toBeVisible()
  await expect(page.getByText('Primer pogo')).toBeVisible()
  await page.screenshot({ path: `qa/${info.project.name}-logros.png`, fullPage: true, animations: 'disabled' })
  expect(await page.locator('html').getAttribute('data-tema')).toBe('oscuro')
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ricota_quiz')).perfiles[0].progreso.sopas)).toBe(3)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ricota_quiz_pre_v6')).nivel)).toBe(9)
})

test('la PWA conserva perfiles y juegos al recargar sin conexión', async ({ page, context }) => {
  await preparar(page)
  await crear(page, 'Pogo Offline')
  await entrar(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }))
  })
  await context.setOffline(true)
  await page.reload()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await entrar(page)
  await expect(page.getByText('Jugando como Pogo Offline')).toBeVisible()
  await page.getByRole('button', { name: /^Trivia/ }).click()
  await page.getByRole('button', { name: /Nivel 1/ }).click()
  await expect(page.getByText('1/10', { exact: true })).toBeVisible()
})
