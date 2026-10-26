export function luminancia(hex) {
  const c = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255).map((x) => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722
}

export function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (claro + .05) / (oscuro + .05)
}

export const textoSobre = (fondo) => contraste('#000000', fondo) >= contraste('#ffffff', fondo) ? '#000000' : '#ffffff'
