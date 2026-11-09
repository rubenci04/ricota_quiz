// Migración editorial de noviembre de 2026. No descarga ni guarda letras completas.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const leer = nombre => JSON.parse(readFileSync(`src/data/${nombre}.json`, 'utf8'))
const guardar = (nombre, valor) => writeFileSync(`src/data/${nombre}.json`, JSON.stringify(valor, null, nombre === 'adivinanzas' ? 1 : 2) + '\n')
const datos = leer('datos-ricotero')
const retiradas = new Set(['Alien duce', 'Las increíbles andanzas del Capitán Buscapina en Cybersiberia', 'Morta punto com'])
// Los desafíos de Trivia v1/v2 ya compartidos necesitan el orden y contenido anteriores.
if (!existsSync('src/data/catalogo-legado.json')) guardar('catalogo-legado', {
  titulos: datos.canciones.map(c => c.titulo),
  retiradas: datos.canciones.filter(c => retiradas.has(c.titulo)),
})
const raiz = 'https://redondossubtitulados.com/patriciorey/'
const entradas = [
  ['Semen-Up', 'oktubre', 'oktubre/semen-up/', 'Una bebida imaginaria cuyo nombre mezcla biología y una marca de gaseosa', ['Amor y desamor'], {
    manzana: 'Fruta redonda que crece en el manzano', demonio: 'Ser sobrenatural asociado al mal', alfombra: 'Tejido que cubre el piso', saludable: 'Que favorece la salud', católica: 'Perteneciente a la Iglesia de Roma', nariz: 'Órgano del olfato', fruta: 'Producto comestible de ciertas plantas', estilo: 'Manera particular de hacer algo',
  }],
  ['Rock para los dientes', 'bang', 'bangbang/rock-para-los-dientes/', 'Música eléctrica destinada a las piezas con las que mordemos', ['Rock y música', 'Política y sociedad'], {
    empresa: 'Organización dedicada a una actividad económica', cabeza: 'Parte del cuerpo que contiene el cerebro', línea: 'Trazo continuo o sucesión en una dirección', trabajo: 'Actividad realizada como ocupación', fiero: 'De aspecto feroz o temible', prontuariado: 'Registrado con antecedentes policiales', infierno: 'Lugar de castigo o sufrimiento extremo', caldero: 'Recipiente grande para calentar líquidos', fatalidad: 'Desgracia considerada inevitable', tieso: 'Rígido, sin flexibilidad',
  }],
  ['Maldición, va a ser un día hermoso', 'bang', 'bangbang/maldicion-va-a-ser-un-dia-hermoso/', 'Una queja ante el anuncio de una jornada espléndida', ['Vida, muerte y existencia'], {
    moscardón: 'Insecto parecido a una mosca grande', imaginario: 'Que existe solamente en la imaginación', testigo: 'Persona que presencia un hecho', caricias: 'Gestos suaves de afecto con las manos', guardia: 'Estado de vigilancia o protección', aventura: 'Experiencia arriesgada o poco habitual', rufián: 'Persona que actúa con vileza', balanza: 'Instrumento para comparar pesos', risotadas: 'Carcajadas fuertes y ruidosas', avalancha: 'Masa que se precipita de manera repentina',
  }],
  ['Yo no me caí del cielo', 'gulp', 'gulp/yo-no-me-cai-del-cielo/', 'Niego haber aterrizado desde las alturas celestes', ['Amor y desamor', 'Noche y bajos fondos'], {
    nena: 'Forma afectuosa de llamar a una chica', perderte: 'Dejar de tenerte cerca', cielo: 'Espacio visible sobre la Tierra', triste: 'Que siente pena o melancolía', gato: 'Felino doméstico', apostar: 'Arriesgar algo confiando en un resultado', alegrías: 'Sentimientos de felicidad', vino: 'Bebida obtenida de la fermentación de uvas', malicioso: 'Que encierra mala intención', mejor: 'De calidad superior a otra cosa',
  }],
  ['Superlógico', 'gulp', 'gulp/superlogico/', 'Más que razonable: un adjetivo llevado al grado máximo', ['Personajes y relatos'], {
    machos: 'Animales de sexo masculino', consumar: 'Llevar una acción a su realización completa', hermosa: 'Que posee belleza', dotación: 'Conjunto de recursos con los que se cuenta', vital: 'Relacionado con la vida', mantis: 'Insecto de patas delanteras plegadas y cazadoras', nervioso: 'Que muestra inquietud o agitación', hembras: 'Animales de sexo femenino', rostro: 'Cara de una persona', devorar: 'Comer de manera voraz',
  }],
  ['Ñam fi frufi fali fru', 'gulp', 'gulp/nam-fi-frufi-fali-fru/', 'Una cadena de sonidos juguetones que empieza como si alguien saboreara comida', ['Amor y desamor', 'Noche y bajos fondos'], {
    cuidar: 'Atender y proteger a alguien', amorcito: 'Diminutivo cariñoso de un ser querido', borracha: 'Que está bajo los efectos del alcohol', doctor: 'Profesional que atiende enfermedades', cabalgar: 'Montar y desplazarse a caballo', vidrio: 'Material duro y transparente de las ventanas', sifón: 'Recipiente que sirve agua con gas a presión', muerde: 'Aprieta algo con los dientes', alocada: 'Que actúa con poco juicio o mucha exaltación',
  }],
  ['Sorpresa de Shangai', 'lobo', 'lobosuelto/sorpresa-de-shangai/', 'Un hecho inesperado asociado a una gran ciudad de China', ['Noche y bajos fondos', 'Personajes y relatos'], {
    hocico: 'Parte saliente de la cara de un animal', acalorado: 'Que siente mucho calor', lengua: 'Órgano de la boca que interviene en el habla', misiles: 'Proyectiles dirigidos hacia un objetivo', veneno: 'Sustancia capaz de intoxicar', pellejo: 'Piel de una persona o animal', ultravioletas: 'Radiaciones situadas más allá del violeta visible', terciopelos: 'Tejidos suaves de pelo corto y denso', premio: 'Recompensa por un logro', piedras: 'Fragmentos sólidos de roca',
  }],
  ['Susanita', 'lobo', 'lobosuelto/susanita/', 'El diminutivo de Susana convertido en canción', ['Amor y desamor', 'Personajes y relatos'], {
    bonita: 'Que resulta agradable a la vista', nena: 'Forma afectuosa de llamar a una chica', padre: 'Progenitor masculino', gato: 'Felino doméstico', festejó: 'Celebró un acontecimiento', televisión: 'Medio que transmite imágenes y sonido a distancia', pelo: 'Conjunto de cabellos', pañuelo: 'Trozo de tela para el bolsillo o el cuello', dulce: 'Que tiene sabor parecido al azúcar', amarga: 'Produce un sabor opuesto al dulce',
  }],
  ['Rock para el negro Atila', 'lobo', 'lobosuelto/rock-para-el-negro-atila/', 'Dedicatoria eléctrica a un personaje con el nombre de un rey de los hunos', ['Personajes y relatos', 'Noche y bajos fondos'], {
    ladrón: 'Persona que se apodera de lo ajeno', atrapar: 'Capturar a alguien o algo', bolsillo: 'Pequeña bolsa cosida en una prenda', metálico: 'Hecho de metal o parecido a él', brillo: 'Luz reflejada por una superficie', ratón: 'Roedor pequeño de cola larga', peligro: 'Riesgo de sufrir daño', sirena: 'Dispositivo que emite una alarma sonora', matraca: 'Instrumento de madera que produce un ruido seco', gabán: 'Abrigo largo y grueso', marginal: 'Que vive al margen de las normas sociales',
  }],
  ['Luzbelito y las sirenas', 'luzbelito', 'luzbelito/luzbelito-y-las-sirenas/', 'Un pequeño ángel caído acompañado por criaturas marinas de canto irresistible', ['Personajes y relatos', 'Vida, muerte y existencia'], {
    destino: 'Curso de acontecimientos que se considera predeterminado', soledad: 'Ausencia de compañía', risa: 'Manifestación de alegría con sonidos y gestos', lealtad: 'Fidelidad a una persona o una causa', nazareno: 'Natural de Nazaret o figura religiosa de Jesús', lágrima: 'Gota que brota de los ojos', problemas: 'Situaciones que requieren solución', tiempo: 'Magnitud con la que se mide la duración', insomnio: 'Dificultad para conciliar el sueño', deseos: 'Anhelos de conseguir o experimentar algo',
  }],
]
datos.canciones = datos.canciones.filter(c => !retiradas.has(c.titulo) && !entradas.some(([t]) => t === c.titulo))
for (const [titulo, disco, ruta, titulo_parafraseado, temas, definiciones] of entradas) datos.canciones.push({
  titulo, disco, palabras: Object.keys(definiciones), verificar: false, definiciones, titulo_parafraseado,
  palabras_verificadas: true, disco_verificado: true,
  autores: ['Carlos "Indio" Solari', 'Eduardo "Skay" Beilinson'], temas, fuente: raiz + ruta,
})
guardar('datos-ricotero', datos)
const acertijos = leer('adivinanzas').filter(a => !retiradas.has(a.respuesta) && !entradas.some(([t]) => a.tipo === 'cancion' && a.respuesta === t))
entradas.forEach(([titulo, disco, , texto], i) => {
  acertijos.push({ id: `catalogo-2026-${i + 1}`, tipo: 'cancion', respuesta: titulo, nivel: 'medio', texto, revisada: true, descartada: false })
})
guardar('adivinanzas', acertijos)
const alias = { 'Yo No Me Caí Del Cielo': 'Yo no me caí del cielo', 'Ñam fri frufi fali fru': 'Ñam fi frufi fali fru', 'Sorpresa en Shangai': 'Sorpresa de Shangai' }
const iconicas = leer('frases-iconicas').filter(f => !retiradas.has(f.cancion) && !f.id?.startsWith('catalogo-2026-'))
for (const f of iconicas) {
  f.cancion = alias[f.cancion] ?? f.cancion
  if (entradas.some(([t]) => t === f.cancion)) {
    f.catalogada = true
    f.fuente = datos.canciones.find(c => c.titulo === f.cancion).fuente
  }
  if (f.aporte?.lista === 1 && f.aporte.numero === 39) f.fragmento = 'Pero sí de un bar muy triste'
  if (f.aporte?.lista === 2 && f.aporte.numero === 44) {
    f.fragmento = 'Y llorará en su corazón'
    f.huecos = [{ indice: 1, clase: 'verbo', distractores: ['cantará', 'soñará', 'bailará'] }, { indice: 4, clase: 'sustantivo', distractores: ['destino', 'pasado', 'cabeza'] }]
  }
}
const curar = (cancion, fragmento, huecos) => {
  let f = iconicas.find(f => f.cancion === cancion && f.fragmento === fragmento)
  if (!f) { f = { id: `catalogo-2026-${entradas.findIndex(([t]) => t === cancion) + 1}`, cancion, fragmento }; iconicas.push(f) }
  Object.assign(f, { catalogada: true, aprobada: true, revisionOpciones: true, fuente: datos.canciones.find(c => c.titulo === cancion).fuente,
    huecos: huecos.map(([indice, clase, ...distractores]) => ({ indice, clase, distractores })) })
}
curar('Semen-Up', 'Su estilo desprecia mi soñar', [[1, 'sustantivo', 'gesto', 'ritmo', 'acento'], [2, 'verbo', 'domina', 'reclama', 'despierta'], [4, 'verbo', 'vivir', 'sentir', 'pensar']])
curar('Rock para los dientes', 'Voy cumpliendo como puedo', [[1, 'verbo', 'trabajando', 'resistiendo', 'aprendiendo'], [3, 'verbo', 'quiero', 'siento', 'debo']])
curar('Maldición, va a ser un día hermoso', 'Impecable testigo de caricias', [[0, 'adjetivo', 'invisible', 'incansable', 'implacable'], [1, 'sustantivo', 'guardián', 'cómplice', 'heredero'], [3, 'sustantivo', 'promesas', 'mentiras', 'miradas']])
curar('Yo no me caí del cielo', 'Nena, no quiero perderte, no pases de todo, que no está tan mal', [[2, 'verbo', 'puedo', 'debo', 'suelo'], [3, 'verbo', 'tenerte', 'buscarte', 'llamarte'], [5, 'verbo', 'huyas', 'dudes', 'vivas']])
curar('Superlógico', 'El club de Mantis muy nervioso está', [[3, 'sustantivo', 'grillos', 'moscas', 'avispas'], [5, 'adjetivo', 'tranquilo', 'contento', 'cansado']])
curar('Ñam fi frufi fali fru', 'Yo no la cambio por nada cuando empieza a cabalgar', [[3, 'verbo', 'busco', 'pierdo', 'dejo'], [7, 'verbo', 'termina', 'regresa', 'aprende'], [9, 'verbo', 'caminar', 'navegar', 'patinar']])
curar('Susanita', 'Su pelo endulza su pañuelo', [[1, 'sustantivo', 'risa', 'voz', 'piel'], [2, 'verbo', 'perfuma', 'adorna', 'calienta'], [4, 'sustantivo', 'vestido', 'abrigo', 'sombrero']])
curar('Rock para el negro Atila', 'Quiero verte huir como un ladrón al que nunca pueden atrapar', [[1, 'verbo', 'tenerte', 'sentirte', 'buscarte'], [5, 'sustantivo', 'bandido', 'testigo', 'soldado'], [10, 'verbo', 'encontrar', 'alcanzar', 'detener']])
curar('Luzbelito y las sirenas', 'La vida sin problemas es matar el tiempo a lo bobo', [[1, 'sustantivo', 'suerte', 'noche', 'calle'], [3, 'sustantivo', 'recuerdos', 'preguntas', 'secretos'], [7, 'sustantivo', 'miedo', 'dolor', 'sueño']])
guardar('frases-iconicas', iconicas)
console.log(`${datos.canciones.length} canciones; ${iconicas.length} frases en colección.`)
