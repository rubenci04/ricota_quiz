// Un único tema, independiente de preferencias antiguas y del sistema.
export function aplicarApariencia() {
  document.documentElement.dataset.tema = 'oscuro'
  document.documentElement.style.colorScheme = 'dark'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b0b0c')
}
