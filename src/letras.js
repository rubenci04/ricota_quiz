// Quita tildes pero conserva la Ñ como letra propia.
export function normalizarLetras(t) {
  return t
    .replace(/ñ/gi, '\u0001')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\u0001/g, 'Ñ')
}
