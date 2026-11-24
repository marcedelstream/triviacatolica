import type { Question } from '@/types/trivia';

const TOPIC_VD = '11111111-1111-4111-8111-111111111109';

export const DAILY_LIFE_QUESTIONS: Question[] = [
  // ============================================================================
  // FE EN LA VIDA DIARIA · Nivel 1: Ante las adversidades y la ansiedad (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444449101',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222901',
    levelSlug: 'vida-diaria-adversidades-ansiedad',
    difficulty: 1,
    prompt:
      'Tenés la cabeza llena de preocupaciones por el mes que viene y no podés dormir. ¿Qué propone Jesús para bajar la ansiedad del día a día?',
    options: [
      'Vivir hoy confiando en Dios, porque a cada día le basta su propio afán',
      'Dejar de planificar y no volver a trabajar',
      'Ocultar lo que sentís para que nadie note tu cansancio',
      'Resolver todo solo antes de pedir ayuda',
    ],
    correctIndex: 0,
    explanation:
      'Jesús no pide irresponsabilidad, sino soltar la angustia paralizante: hacer lo que nos toca hoy y confiar el mañana al Padre.',
    sourceRef: 'Mt 6,34 · CIC 2633',
  },
  {
    id: '44444444-4444-4444-8444-444444449102',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222901',
    levelSlug: 'vida-diaria-adversidades-ansiedad',
    difficulty: 1,
    prompt:
      'Sentís que la carga del trabajo, la casa y los problemas te superan por completo. ¿Qué invitación concreta hace Jesús a quienes están agotados?',
    options: [
      'Aumentar el esfuerzo hasta no sentir nada',
      'Venir a Él con ese cansancio para encontrar descanso y alivio',
      'Esperar a estar perfecto para acercarse a rezar',
      'Alejarse de la familia hasta resolver todo',
    ],
    correctIndex: 1,
    explanation:
      'En el Evangelio Jesús llama a los cansados y agobiados: la fe no es una carga extra, sino el lugar donde se recupera el aliento.',
    sourceRef: 'Mt 11,28-30 · CIC 2559',
  },
  {
    id: '44444444-4444-4444-8444-444444449103',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222901',
    levelSlug: 'vida-diaria-adversidades-ansiedad',
    difficulty: 1,
    prompt:
      'Alguien cercano te hirió con un comentario injusto y te dan ganas de responderle el doble de fuerte. ¿Cuál es el camino que enseña Jesús?',
    options: [
      'Devolver el golpe rápido para marcar territorio',
      'Cortar el trato y hablar mal de esa persona con otros',
      'No devolver mal por mal y responder con serenidad y bien',
      'Fingir que no dolió y guardar resentimiento en silencio',
    ],
    correctIndex: 2,
    explanation:
      'Responder con calma y verdad rompe la cadena de agresión; perdonar no es justificar la ofensa, sino negarse a vivir atrapado en el rencor.',
    sourceRef: 'Rm 12,17-21 · CIC 2844',
  },
  {
    id: '44444444-4444-4444-8444-444444449104',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222901',
    levelSlug: 'vida-diaria-adversidades-ansiedad',
    difficulty: 2,
    prompt:
      'Atravesás una mala racha personal y sentís que Dios está lejos o en silencio. ¿Qué escena del Evangelio recuerda que Jesús sigue en tu barca?',
    options: [
      'La multiplicación de los panes en la montaña',
      'La entrada en Jerusalén con palmas',
      'Las bodas de Caná',
      'La tempestad calmada mientras los discípulos creían que Jesús dormía',
    ],
    correctIndex: 3,
    explanation:
      'Aunque en medio de la tormenta parezca que Dios duerme, Él va en la misma barca y sostiene a quien le pide ayuda con sinceridad.',
    sourceRef: 'Mc 4,35-41 · CIC 2734',
  },
  {
    id: '44444444-4444-4444-8444-444444449105',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222901',
    levelSlug: 'vida-diaria-adversidades-ansiedad',
    difficulty: 2,
    prompt:
      'Recibís una mala noticia que te desarma los planes. ¿Qué promete Jesús a sus amigos ante las dificultades del mundo?',
    options: [
      'Que nunca tendrán problemas ni enfermedades',
      'Que tengan valor y paz, porque Él ha vencido al mundo',
      'Que todo se arreglará automáticamente sin esfuerzo',
      'Que el dolor significa que Dios está enojado',
    ],
    correctIndex: 1,
    explanation:
      'Jesús es realista: no oculta que en la vida habrá pruebas, pero asegura su presencia y una paz más honda que las circunstancias.',
    sourceRef: 'Jn 16,33 · CIC 1820',
  },

  // ============================================================================
  // FE EN LA VIDA DIARIA · Nivel 2: Noviazgo, amistad y amor real (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444449201',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222902',
    levelSlug: 'vida-diaria-noviazgo-amistad',
    difficulty: 1,
    prompt:
      'Estás conociendo a alguien en un noviazgo y te preguntás si es un amor sano. Según san Pablo, ¿cómo se reconoce el amor verdadero?',
    options: [
      'Es paciente, servicial, no es celoso ni busca solo su propio interés',
      'Controla cada mensaje y cada salida de la otra persona',
      'Se basa solo en emociones intensas sin compromiso',
      'Evita hablar de límites para no incomodar',
    ],
    correctIndex: 0,
    explanation:
      'El amor cristiano cuida la libertad y la dignidad del otro; los celos posesivos y el egoísmo no son señales de amor, sino de inseguridad.',
    sourceRef: '1 Co 13,4-7 · CIC 1822',
  },
  {
    id: '44444444-4444-4444-8444-444444449202',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222902',
    levelSlug: 'vida-diaria-noviazgo-amistad',
    difficulty: 1,
    prompt:
      'En una relación de noviazgo, ¿por qué la Iglesia valora el cuidado y el respeto mutuo en el afecto y el cuerpo?',
    options: [
      'Porque el cariño humano es algo negativo',
      'Porque enseña a amar a la persona entera y no usarla para el propio placer',
      'Para que los novios no se conozcan a fondo',
      'Solo por una costumbre antigua sin sentido hoy',
    ],
    correctIndex: 1,
    explanation:
      'La castidad en el noviazgo no es represión, sino aprendizaje del amor fiel: valorar a la otra persona como un don y nunca como un objeto.',
    sourceRef: '1 Ts 4,3-5 · CIC 2350',
  },
  {
    id: '44444444-4444-4444-8444-444444449203',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222902',
    levelSlug: 'vida-diaria-noviazgo-amistad',
    difficulty: 1,
    prompt:
      'Un amigo está tomando malas decisiones que lo lastiman y todos prefieren callar para no quedar mal. ¿Qué propone Jesús ante un hermano que se equivoca?',
    options: [
      'Exponerlo delante de todos en un grupo de chat',
      'Ignorarlo para no meterse en problemas',
      'Hablarle a solas con respeto y cariño para ayudarlo a reaccionar',
      'Cortar la amistad sin explicarle nada',
    ],
    correctIndex: 2,
    explanation:
      'La corrección fraterna que enseña Jesús busca siempre recuperar al amigo en privado, con humildad y sin humillarlo.',
    sourceRef: 'Mt 18,15 · CIC 1829',
  },
  {
    id: '44444444-4444-4444-8444-444444449204',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222902',
    levelSlug: 'vida-diaria-noviazgo-amistad',
    difficulty: 2,
    prompt:
      '¿Cuál es la regla de oro que dejó Jesús para tratar a tu pareja, a tus amigos y a cualquier persona cada día?',
    options: [
      'Tratar a los demás según cómo te traten primero',
      'Ayudar solo a quienes puedan devolverte el favor',
      'Poner tus gustos por encima de todo',
      'Hacer con los demás lo que querés que hagan con vos',
    ],
    correctIndex: 3,
    explanation:
      'La regla de oro resume el Evangelio en lo cotidiano: ponerse en el lugar del otro antes de hablar, decidir o exigir.',
    sourceRef: 'Mt 7,12 · CIC 1789',
  },
  {
    id: '44444444-4444-4444-8444-444444449205',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222902',
    levelSlug: 'vida-diaria-noviazgo-amistad',
    difficulty: 2,
    prompt:
      'Un amigo te falló varias veces y ahora viene a pedirte perdón sinceramente. Cuando Pedro preguntó cuántas veces perdonar, ¿qué respondió Jesús?',
    options: [
      'Hasta tres veces como máximo',
      'Setenta veces siete: tener un corazón siempre dispuesto a perdonar',
      'Solo si nunca más vuelve a equivocarse',
      'Una sola vez para que aprenda la lección',
    ],
    correctIndex: 1,
    explanation:
      '«Setenta veces siete» simboliza un perdón sin calculadora. Perdonar libera el corazón, aun cuando también sea sano poner límites claros.',
    sourceRef: 'Mt 18,21-22 · CIC 2840',
  },

  // ============================================================================
  // FE EN LA VIDA DIARIA · Nivel 3: Matrimonio y vida en familia (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444449301',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222903',
    levelSlug: 'vida-diaria-matrimonio-familia',
    difficulty: 1,
    prompt:
      'Hubo una discusión fuerte en pareja y el clima en casa quedó helado. ¿Qué consejo práctico de san Pablo ayuda a cuidar el matrimonio?',
    options: [
      'Que no se ponga el sol sobre tu enojo: buscar la paz antes de terminar el día',
      'Dejar pasar semanas en silencio hasta olvidar el tema',
      'Ganar la discusión recordando errores de años atrás',
      'Contar la pelea a terceros antes de hablar con tu cónyuge',
    ],
    correctIndex: 0,
    explanation:
      'Resolver el malentendido pronto —con un gesto de humildad o un «hablemos con calma»— evita que el orgullo construya muros en casa.',
    sourceRef: 'Ef 4,26-27 · CIC 2302',
  },
  {
    id: '44444444-4444-4444-8444-444444449302',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222903',
    levelSlug: 'vida-diaria-matrimonio-familia',
    difficulty: 2,
    prompt:
      'En el matrimonio, las diferencias de carácter y los cansancios son inevitables. ¿Sobre qué imagen dice Jesús que se construye una casa que resiste las tormentas?',
    options: [
      'Sobre evitar cualquier problema económico',
      'Sobre la roca de escuchar su Palabra y ponerla en práctica juntos',
      'Sobre tener siempre la misma opinión en todo',
      'Sobre vivir aislados del resto de la familia',
    ],
    correctIndex: 1,
    explanation:
      'Todas las familias pasan lluvias y vientos; lo que sostiene la casa es edificar sobre la fidelidad, el diálogo y los valores del Evangelio.',
    sourceRef: 'Mt 7,24-25 · CIC 1644',
  },
  {
    id: '44444444-4444-4444-8444-444444449303',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222903',
    levelSlug: 'vida-diaria-matrimonio-familia',
    difficulty: 2,
    prompt:
      '¿Qué enseña la Escritura sobre la forma de educar y corregir a los hijos en la vida familiar?',
    options: [
      'No poner nunca límites para que no se enojen',
      'Exigir perfección constante sin felicitar sus logros',
      'Educarlos con amor, paciencia y firmeza, sin exasperarlos ni herirlos',
      'Delegar toda la formación solo en la escuela',
    ],
    correctIndex: 2,
    explanation:
      'Educar con cariño y límites claros da seguridad a los hijos; el Catecismo recuerda que el hogar es la primera escuela de amor y fe.',
    sourceRef: 'Ef 6,4 · CIC 2223',
  },
  {
    id: '44444444-4444-4444-8444-444444449304',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222903',
    levelSlug: 'vida-diaria-matrimonio-familia',
    difficulty: 2,
    prompt:
      'En una cena familiar surge un tema tenso y todos hablan a la vez. ¿Qué actitud propone la carta de Santiago para conversar mejor?',
    options: [
      'Hablar más fuerte para imponer tu punto de vista',
      'Irse de la mesa sin despedirse',
      'Cambiar de tema con ironía',
      'Ser pronto para escuchar, lento para hablar y lento para enojarse',
    ],
    correctIndex: 3,
    explanation:
      'Escuchar de verdad antes de contestar baja la tensión en cualquier familia y demuestra respeto por quien tenemos enfrente.',
    sourceRef: 'St 1,19 · CIC 2219',
  },
  {
    id: '44444444-4444-4444-8444-444444449305',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222903',
    levelSlug: 'vida-diaria-matrimonio-familia',
    difficulty: 1,
    prompt:
      'Al pensar en la unidad del matrimonio, ¿por qué la Iglesia llama a la familia cristiana «Iglesia doméstica»?',
    options: [
      'Porque reemplaza la Misa del domingo',
      'Porque en el hogar se aprende a amar, perdonar, rezar y servirse mutuamente cada día',
      'Porque solo pueden vivir en ella personas consagradas',
      'Porque hay que hacer sermones largos en casa',
    ],
    correctIndex: 1,
    explanation:
      'Dios habita en los gestos sencillos del hogar: compartir la mesa, pedir disculpas, cuidar a los mayores y rezar juntos en lo cotidiano.',
    sourceRef: 'Mt 19,6 · CIC 1656',
  },

  // ============================================================================
  // FE EN LA VIDA DIARIA · Nivel 4: Trabajo, dinero y decisiones de hoy (5)
  // ============================================================================
  {
    id: '44444444-4444-4444-8444-444444449401',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222904',
    levelSlug: 'vida-diaria-trabajo-decisiones',
    difficulty: 1,
    prompt:
      'Te ofrecen hacer un «atajo» deshonesto en el trabajo o en un cobro donde nadie se daría cuenta. ¿Qué enseña Jesús sobre las cosas pequeñas?',
    options: [
      'Quien es fiel en lo poco también será fiel en lo mucho',
      'Si el monto es pequeño no tiene importancia moral',
      'La honestidad solo cuenta si alguien está mirando',
      'En los negocios vale cualquier regla con tal de ganar',
    ],
    correctIndex: 0,
    explanation:
      'La integridad se construye en las decisiones chicas que nadie ve: ser honesto en lo cotidiano trae paz de conciencia y confianza.',
    sourceRef: 'Lc 16,10 · CIC 2409',
  },
  {
    id: '44444444-4444-4444-8444-444444449402',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222904',
    levelSlug: 'vida-diaria-trabajo-decisiones',
    difficulty: 1,
    prompt:
      'Ves en redes sociales la vida y los logros de otros y empezás a sentir envidia o que lo tuyo no vale nada. ¿Qué advierte Jesús sobre dónde poner el corazón?',
    options: [
      'Que el valor de una persona depende de cuántos bienes acumula',
      'Que la vida de una persona no depende de la abundancia de sus bienes',
      'Que está mal disfrutar del fruto del propio trabajo',
      'Que hay que compararse siempre para superarse',
    ],
    correctIndex: 1,
    explanation:
      'Compararnos todo el tiempo roba la alegría. Jesús recuerda que nuestra dignidad no se mide por lo que mostramos o tenemos, sino por cómo amamos.',
    sourceRef: 'Lc 12,15 · CIC 2539',
  },
  {
    id: '44444444-4444-4444-8444-444444449403',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222904',
    levelSlug: 'vida-diaria-trabajo-decisiones',
    difficulty: 2,
    prompt:
      'Trabajás de lunes a lunes sin parar, con el celular encendido todo el domingo. ¿Por qué Dios nos regala el descanso dominical?',
    options: [
      'Para prohibir toda actividad recreativa en familia',
      'Porque trabajar es algo malo',
      'Porque el ser humano no es una máquina: necesita descansar, celebrar y reencontrarse con Dios y los suyos',
      'Solo para quienes no tienen responsabilidades',
    ],
    correctIndex: 2,
    explanation:
      'El domingo recuerda que somos más que lo que producimos: un día para frenar, agradecer, compartir la mesa y renovar el alma.',
    sourceRef: 'Mc 2,27 · CIC 2184',
  },
  {
    id: '44444444-4444-4444-8444-444444449404',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222904',
    levelSlug: 'vida-diaria-trabajo-decisiones',
    difficulty: 1,
    prompt:
      'En una charla con compañeros empiezan a circular chismes sobre alguien que no está presente. ¿Cuál es la actitud cristiana más coherente?',
    options: [
      'Sumarse al comentario para encajar en el grupo',
      'Escuchar todo y después contárselo a otros en privado',
      'Grabar la conversación para tener pruebas',
      'No alimentar el chisme y cuidar la buena fama de quien no puede defenderse',
    ],
    correctIndex: 3,
    explanation:
      'El Catecismo señala que la maledicencia y la calumnia hieren la dignidad del prójimo; cuidar las palabras construye ambientes sanos.',
    sourceRef: 'Ef 4,29 · CIC 2477',
  },
  {
    id: '44444444-4444-4444-8444-444444449405',
    topicId: TOPIC_VD,
    topicSlug: 'vida-diaria',
    levelId: '22222222-2222-4222-8222-222222222904',
    levelSlug: 'vida-diaria-trabajo-decisiones',
    difficulty: 2,
    prompt:
      'Cuando ayudás a alguien que lo necesita, ¿qué detalle pide Jesús respecto a presumir de nuestras buenas obras?',
    options: [
      'Publicarlo siempre para recibir aplausos',
      'Ayudar con sencillez y sin buscar fama, porque el Padre ve en lo secreto',
      'Hacerlo solo si te agradecen en público',
      'Esperar a tener mucho dinero sobrante para ayudar',
    ],
    correctIndex: 1,
    explanation:
      'La generosidad auténtica busca el bien del otro y no el aplauso propio; «hay más alegría en dar que en recibir».',
    sourceRef: 'Mt 6,3-4 · CIC 2447',
  },
];
