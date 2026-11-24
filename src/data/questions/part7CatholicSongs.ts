import type { Question } from '@/types/trivia';

const TOPIC_CC = '11111111-1111-4111-8111-111111111111';

export const CATHOLIC_SONGS_QUESTIONS: Question[] = [
  // ============================================================================
  // CANCIONES CATÓLICAS · Nivel 1: Clásicos de la Misa (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444451101',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223101',
    levelSlug: 'canciones-catolicas-clasicos-misa',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Tú has venido a la orilla, no has buscado ni a sabios ni a ricos, tan solo quieres que yo te siga.»',
    options: [
      'Pescador de hombres',
      'Alma misionera',
      'Cristo te necesita para amar',
      'Junto a ti, María',
    ],
    correctIndex: 0,
    explanation:
      '«Pescador de hombres» (Cesáreo Gabaráin) evoca la llamada de Jesús a los primeros discípulos junto al lago de Galilea.',
    sourceRef: 'Mc 1,17 · CIC 1156',
  },
  {
    id: '44444444-4444-4444-8444-444444451102',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223101',
    levelSlug: 'canciones-catolicas-clasicos-misa',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Hoy, Señor, te damos gracias, por la vida, la tierra y el sol...»',
    options: [
      'Dios está aquí',
      'Hoy, Señor, te damos gracias',
      'Tan cerca de mí',
      'Entre tus manos',
    ],
    correctIndex: 1,
    explanation:
      'Este canto de acción de gracias de Cesáreo Gabaráin celebra los dones cotidianos de la creación y la vida.',
    sourceRef: 'Sal 118,1 · CIC 2637',
  },
  {
    id: '44444444-4444-4444-8444-444444451103',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223101',
    levelSlug: 'canciones-catolicas-clasicos-misa',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Tan cerca de mí, que hasta lo puedo tocar, Jesús está aquí.»',
    options: [
      'Dios está aquí',
      'Cerca de ti, Señor',
      'Tan cerca de mí',
      'Milagro de amor',
    ],
    correctIndex: 2,
    explanation:
      '«Tan cerca de mí» nos recuerda que Cristo camina junto a nosotros en la Eucaristía y en cada hermano con quien nos cruzamos.',
    sourceRef: 'Mt 28,20 · CIC 1373',
  },
  {
    id: '44444444-4444-4444-8444-444444451104',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223101',
    levelSlug: 'canciones-catolicas-clasicos-misa',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Entre tus manos está mi vida, Señor; entre tus manos pongo mi existir.»',
    options: [
      'Nadie te ama como yo',
      'Renuévame',
      'Sáname, Señor',
      'Entre tus manos',
    ],
    correctIndex: 3,
    explanation:
      'Inspirada en las palabras de entrega confiada a Dios y en el grano de trigo que muere para dar fruto abundante.',
    sourceRef: 'Lc 23,46 · CIC 1157',
  },
  {
    id: '44444444-4444-4444-8444-444444451105',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223101',
    levelSlug: 'canciones-catolicas-clasicos-misa',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Dios está aquí, tan cierto como el aire que respiro, tan cierto como la mañana se levanta...»',
    options: [
      'Dios está aquí',
      'Tan cerca de mí',
      'Ven, Espíritu Santo',
      'Tu fidelidad es grande',
    ],
    correctIndex: 0,
    explanation:
      'Uno de los cantos de alabanza más cantados en Hispanoamérica para reconocer la presencia cercana de Dios en la asamblea.',
    sourceRef: 'Mt 18,20 · CIC 1156',
  },

  // ============================================================================
  // CANCIONES CATÓLICAS · Nivel 2: Cantos a la Virgen María (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444451201',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223102',
    levelSlug: 'canciones-catolicas-cantos-maria',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Mientras recorres la vida, tú nunca solo estás; contigo por el camino Santa María va.»',
    options: [
      'Junto a ti, María',
      'Santa María del Camino',
      'María mírame',
      'Quién será la mujer',
    ],
    correctIndex: 1,
    explanation:
      '«Santa María del Camino» (Juan Antonio Espinosa) canta la compañía maternal de María junto al pueblo peregrino.',
    sourceRef: 'Jn 19,27 · CIC 969',
  },
  {
    id: '44444444-4444-4444-8444-444444451202',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223102',
    levelSlug: 'canciones-catolicas-cantos-maria',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Junto a ti, María, como un niño quiero estar; tómame en tus brazos, guíame en mi caminar.»',
    options: [
      'Santa María del Camino',
      'María de Nazaret',
      'Junto a ti, María',
      'Diario de María',
    ],
    correctIndex: 2,
    explanation:
      'Este canto de la congregación Kairoi expresa la confianza filial de ponerse bajo el cuidado de la Madre de Jesús.',
    sourceRef: 'Lc 1,48 · CIC 971',
  },
  {
    id: '44444444-4444-4444-8444-444444451203',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223102',
    levelSlug: 'canciones-catolicas-cantos-maria',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«María mírame, si tú me miras Él también me mirará; Madre mía, mírame, de la mano llévame...»',
    options: [
      'Dulce Muchacha Humilde',
      'Hoy he vuelto, Madre',
      'Santa María del Amén',
      'María mírame',
    ],
    correctIndex: 3,
    explanation:
      '«María mírame» (Betsaida) recuerda que el camino mariano siempre conduce más cerca del corazón de Jesús.',
    sourceRef: 'Jn 2,5 · CIC 2677',
  },
  {
    id: '44444444-4444-4444-8444-444444451204',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223102',
    levelSlug: 'canciones-catolicas-cantos-maria',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Te miro a los ojos y entre tanto llanto parece mentira que te hayan clavado...»',
    options: [
      'Diario de María',
      'Junto a ti, María',
      'Dolorosa',
      'María mírame',
    ],
    correctIndex: 0,
    explanation:
      '«Diario de María» (Martín Valverde) contempla con ternura el dolor y la fidelidad de la Virgen al pie de la Cruz.',
    sourceRef: 'Jn 19,25 · CIC 964',
  },
  {
    id: '44444444-4444-4444-8444-444444451205',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223102',
    levelSlug: 'canciones-catolicas-cantos-maria',
    difficulty: 2,
    prompt:
      '¿Qué canción católica dice?\n«Cuántas veces siendo niño te recé, con mis besos te decía que te amaba...»',
    options: [
      'Santa María del Camino',
      'Hoy he vuelto, Madre',
      'María de Nazaret',
      'Madre de los pobres',
    ],
    correctIndex: 1,
    explanation:
      '«Hoy he vuelto, Madre» (Cesáreo Gabaráin) expresa la alegría de regresar a la fe de la infancia y al abrazo de María.',
    sourceRef: 'Lc 1,38 · CIC 968',
  },

  // ============================================================================
  // CANCIONES CATÓLICAS · Nivel 3: Adoración y oración (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444451301',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223103',
    levelSlug: 'canciones-catolicas-adoracion-oracion',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Cuánto he esperado este momento, cuánto he esperado que estuvieras así...»',
    options: [
      'Sáname, Señor',
      'Milagro de amor',
      'Nadie te ama como yo',
      'Renuévame',
    ],
    correctIndex: 2,
    explanation:
      '«Nadie te ama como yo» (Martín Valverde) pone en labios de Jesús la cercanía de su Cruz y su amor incondicional.',
    sourceRef: 'Jn 15,13 · CIC 609',
  },
  {
    id: '44444444-4444-4444-8444-444444451302',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223103',
    levelSlug: 'canciones-catolicas-adoracion-oracion',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Jesús, aquí presente en forma real, te pido un poco más de fe y de humildad...»',
    options: [
      'Pescador de hombres',
      'Dios está aquí',
      'Sumérgeme',
      'Milagro de amor',
    ],
    correctIndex: 3,
    explanation:
      '«Milagro de amor» es uno de los cantos eucarísticos más queridos para el momento de la Comunión y la adoración al Santísimo.',
    sourceRef: 'Jn 6,51 · CIC 1374',
  },
  {
    id: '44444444-4444-4444-8444-444444451303',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223103',
    levelSlug: 'canciones-catolicas-adoracion-oracion',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Renuévame, Señor Jesús, ya no quiero ser igual; pon en mí tu corazón...»',
    options: [
      'Renuévame',
      'Entre tus manos',
      'Sáname, Señor',
      'Cerca de ti, Señor',
    ],
    correctIndex: 0,
    explanation:
      '«Renuévame» recoge el deseo de conversión interior: pedirle a Cristo un corazón nuevo semejante al suyo.',
    sourceRef: 'Sal 51,12 · CIC 1431',
  },
  {
    id: '44444444-4444-4444-8444-444444451304',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223103',
    levelSlug: 'canciones-catolicas-adoracion-oracion',
    difficulty: 2,
    prompt:
      '¿Qué canción católica dice?\n«Hoy, Señor Jesús, vengo ante ti para alabarte; hoy, Señor Jesús, con tu poder puedes cambiarme.»',
    options: [
      'Tu fidelidad es grande',
      'Sáname, Señor',
      'Nadie te ama como yo',
      'Mi pensamiento eres Tú',
    ],
    correctIndex: 1,
    explanation:
      '«Sáname, Señor» (Rafael Moreno) es una oración de sanación interior y entrega confiada a la misericordia de Jesús.',
    sourceRef: 'Mt 11,28-30 · CIC 2559',
  },
  {
    id: '44444444-4444-4444-8444-444444451305',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223103',
    levelSlug: 'canciones-catolicas-adoracion-oracion',
    difficulty: 2,
    prompt:
      '¿Qué canción católica dice?\n«Cansado del camino, sediento de ti, un desierto he cruzado, sin fuerzas he quedado, vengo a ti.»',
    options: [
      'Entre tus manos',
      'Pescador de hombres',
      'Sumérgeme',
      'Vasijas de barro',
    ],
    correctIndex: 2,
    explanation:
      '«Sumérgeme» invita a descansar en la presencia del Espíritu cuando el cansancio y la aridez pesan en la vida.',
    sourceRef: 'Jn 7,37-38 · CIC 2652',
  },

  // ============================================================================
  // CANCIONES CATÓLICAS · Nivel 4: Misión y juventud (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444451401',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223104',
    levelSlug: 'canciones-catolicas-mision-juventud',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Señor, toma mi vida nueva antes de que la espera desgaste años en mí...»',
    options: [
      'Pescador de hombres',
      'Cristo te necesita para amar',
      'Canción del misionero',
      'Alma misionera',
    ],
    correctIndex: 3,
    explanation:
      '«Alma misionera» es un himno juvenil de disponibilidad generosa para llevar el Evangelio allí donde más falta hace.',
    sourceRef: 'Is 6,8 · CIC 849',
  },
  {
    id: '44444444-4444-4444-8444-444444451402',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223104',
    levelSlug: 'canciones-catolicas-mision-juventud',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Cristo te necesita para amar, para amar; no te importe la raza ni el color de la piel...»',
    options: [
      'Cristo te necesita para amar',
      'Alma misionera',
      'Juntos como hermanos',
      'Id y enseñad',
    ],
    correctIndex: 0,
    explanation:
      'Este canto de Cesáreo Gabaráin recuerda que el amor cristiano no hace distinciones y nos llama a ser manos de Cristo hoy.',
    sourceRef: 'Jn 13,34 · CIC 1823',
  },
  {
    id: '44444444-4444-4444-8444-444444451403',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223104',
    levelSlug: 'canciones-catolicas-mision-juventud',
    difficulty: 1,
    prompt:
      '¿Qué canción católica dice?\n«Juntos como hermanos, miembros de una Iglesia, vamos caminando al encuentro del Señor.»',
    options: [
      'Vienen con alegría',
      'Juntos como hermanos',
      'Pescador de hombres',
      'Iglesia peregrina',
    ],
    correctIndex: 1,
    explanation:
      'Canto de entrada clásico que expresa la alegría de ser comunidad y caminar unidos hacia el altar.',
    sourceRef: 'Hch 2,42 · CIC 752',
  },
  {
    id: '44444444-4444-4444-8444-444444451404',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223104',
    levelSlug: 'canciones-catolicas-mision-juventud',
    difficulty: 2,
    prompt:
      '¿Qué canción católica dice?\n«Sois la semilla que ha de crecer, sois estrella que ha de brillar; sois levadura, sois grano de sal...»',
    options: [
      'Alma misionera',
      'Juntos como hermanos',
      'Id y enseñad',
      'Hoy, Señor, te damos gracias',
    ],
    correctIndex: 2,
    explanation:
      '«Id y enseñad» (Cesáreo Gabaráin) recoge las imágenes evangélicas de la semilla, la sal y la luz para el envío misionero.',
    sourceRef: 'Mt 5,13 · CIC 782',
  },
  {
    id: '44444444-4444-4444-8444-444444451405',
    topicId: TOPIC_CC,
    topicSlug: 'canciones-catolicas',
    levelId: '22222222-2222-4222-8222-222222223104',
    levelSlug: 'canciones-catolicas-mision-juventud',
    difficulty: 2,
    prompt:
      '¿Qué canción católica dice?\n«Vienen con alegría, Señor, cantando vienen con alegría, Señor, los que caminan por la vida...»',
    options: [
      'Juntos como hermanos',
      'Dios está aquí',
      'Cristo te necesita para amar',
      'Vienen con alegría',
    ],
    correctIndex: 3,
    explanation:
      '«Vienen con alegría» (Cesáreo Gabaráin) celebra la esperanza de quienes siembran paz y amor en medio de la vida diaria.',
    sourceRef: 'Flp 4,4 · CIC 1156',
  },
];
