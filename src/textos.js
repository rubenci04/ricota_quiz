// Microtextos propios (humor y cercanía). Nada de versos ni citas de letras.
const FRASES = {
  acierto: [
    '¡Esa es! Se nota que hiciste la tarea.',
    'Clavaste una. Seguí así.',
    'Bien ahí, no se te escapa nada.',
    '¡Eso estuvo fino!',
    'Sabés más de lo que decís.',
    'Pum, al medio. ¡Qué puntería!',
  ],
  error: [
    'Uy, casi. La próxima sale.',
    'No era esa, pero seguimos.',
    'Tranqui, hasta los que más saben se equivocan.',
    'Eso no se lo esperaba nadie.',
    'Fallaste una, no pasa nada.',
    'Esa se te escapó. A la que viene.',
  ],
  victoria: [
    '¡Misión cumplida! Merecés un pogo virtual.',
    '¡Qué nivel! Hoy te ganás los aplausos.',
    'Terminaste con todo. ¡Bien jugado!',
    'Eso fue de otro planeta. ¡Felicitaciones!',
    '¡Ganaste! Ya podés presumir en el grupo.',
  ],
  derrota: [
    'No salió esta vez, pero la revancha es gratis.',
    'Casi. Repasá un poco y volvé con todo.',
    'A veces se gana, a veces se aprende.',
  ],
  pista: [
    'Una ayudita de parte de la casa.',
    'Ahí va un empujoncito.',
    'Pista al toque. Que no se diga.',
  ],
}

export const frase = (tipo) => {
  const lista = FRASES[tipo]
  return lista[Math.floor(Math.random() * lista.length)]
}
