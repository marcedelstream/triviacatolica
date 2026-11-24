import type { Question } from '@/types/trivia';

const TOPIC_MOV = '11111111-1111-4111-8111-111111111107';
const TOPIC_HIS = '11111111-1111-4111-8111-111111111108';

export const MOVEMENTS_AND_HISTORY_QUESTIONS: Question[] = [
  // =========================================================================
  // MOVIMIENTOS Y CARISMAS — Nivel 1: Grandes órdenes religiosas
  // =========================================================================
  {
    id: 'q-mv-1',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222701',
    levelSlug: 'movimientos-ordenes-clasicas',
    difficulty: 1,
    prompt: '¿Qué santo del siglo VI escribió la regla monástica resumida en el lema "Ora et labora" (Reza y trabaja)?',
    options: ['San Benito de Nursia', 'San Francisco de Asís', 'San Ignacio de Loyola', 'San Bruno'],
    correctIndex: 0,
    explanation:
      'San Benito fundó la Orden Benedictina y los monasterios que preservaron la fe, la liturgia y la cultura en Europa; es patrono de Europa.',
    sourceRef: '1 Tes 5,17 · CIC 927',
  },
  {
    id: 'q-mv-2',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222701',
    levelSlug: 'movimientos-ordenes-clasicas',
    difficulty: 1,
    prompt: '¿Quién fundó la Compañía de Jesús (los jesuitas) y redactó los célebres "Ejercicios Espirituales"?',
    options: [
      'San Vicente de Paúl',
      'San Ignacio de Loyola',
      'Santo Domingo de Guzmán',
      'San Juan de la Cruz',
    ],
    correctIndex: 1,
    explanation:
      'San Ignacio de Loyola (1491-1556) fundó la Compañía de Jesús con el lema "Ad maiorem Dei gloriam" (Para mayor gloria de Dios).',
    sourceRef: '1 Cor 10,31 · CIC 931',
  },
  {
    id: 'q-mv-3',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222701',
    levelSlug: 'movimientos-ordenes-clasicas',
    difficulty: 1,
    prompt: '¿Qué santo español fundó en el siglo XIII la Orden de Predicadores (dominicos) dedicada al estudio y la predicación de la verdad?',
    options: [
      'Santo Domingo de Guzmán',
      'San Francisco de Sales',
      'San Bernardo de Claraval',
      'San José de Calasanz',
    ],
    correctIndex: 0,
    explanation:
      'Santo Domingo de Guzmán dio a su orden el carisma de "contemplar y dar a los demás lo contemplado", formando grandes teólogos como santo Tomás de Aquino.',
    sourceRef: 'Rm 10,14-15 · CIC 927',
  },
  {
    id: 'q-mv-4',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222701',
    levelSlug: 'movimientos-ordenes-clasicas',
    difficulty: 1,
    prompt: '¿Qué santa, discípula espiritual de san Francisco de Asís, fundó la Orden de las Hermanas Pobres (Clarisas)?',
    options: ['Santa Clara de Asís', 'Santa Escolástica', 'Santa Rosa de Viterbo', 'Santa Rita de Casia'],
    correctIndex: 0,
    explanation:
      'Santa Clara vivió el privilegio de la pobreza radical y una ardiente devoción eucarística en el monasterio de San Damián.',
    sourceRef: 'Mt 19,21 · CIC 916',
  },
  {
    id: 'q-mv-5',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222701',
    levelSlug: 'movimientos-ordenes-clasicas',
    difficulty: 1,
    prompt: '¿Qué familia religiosa, vinculada al monte Carmelo y a la devoción del Escapulario, fue renovada por santa Teresa de Ávila y san Juan de la Cruz?',
    options: ['Los Cartujos', 'La Orden del Carmelo (carmelitas)', 'Los Agustinos', 'Los Mercedarios'],
    correctIndex: 1,
    explanation:
      'El carisma carmelita une contemplación silenciosa, fraternidad y amor a la Virgen del Carmen como guía hacia Cristo.',
    sourceRef: '1 Re 19,11-13 · CIC 2684',
  },

  // =========================================================================
  // MOVIMIENTOS Y CARISMAS — Nivel 2: Movimientos del siglo XX
  // =========================================================================
  {
    id: 'q-mv-6',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222702',
    levelSlug: 'movimientos-eclesiales-siglo-xx',
    difficulty: 2,
    prompt: '¿Qué santo fundó el Opus Dei en 1928 recordando que todos los bautizados están llamados a la santidad en el trabajo ordinario?',
    options: [
      'San Josemaría Escrivá de Balaguer',
      'San Pío de Pietrelcina',
      'San Manuel González',
      'San Pedro Poveda',
    ],
    correctIndex: 0,
    explanation:
      'San Josemaría predicó la santificación del trabajo profesional y de la vida cotidiana mucho antes de que el Vaticano II proclamara la llamada universal a la santidad.',
    sourceRef: 'Col 3,23 · CIC 2013',
  },
  {
    id: 'q-mv-7',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222702',
    levelSlug: 'movimientos-eclesiales-siglo-xx',
    difficulty: 2,
    prompt: '¿Qué movimiento apostólico internacional fundó el padre José Kentenich en 1914 en torno a la Alianza de Amor con María en un santuario?',
    options: [
      'Movimiento de Schoenstatt',
      'Acción Católica',
      'Regnum Christi',
      'Comunidad de Taizé',
    ],
    correctIndex: 0,
    explanation:
      'Schoenstatt promueve la educación de la libertad, la santidad en la vida diaria y la Alianza de Amor con la Madre Tres Veces Admirable.',
    sourceRef: 'Jn 19,25-27 · CIC 900',
  },
  {
    id: 'q-mv-8',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222702',
    levelSlug: 'movimientos-eclesiales-siglo-xx',
    difficulty: 2,
    prompt: '¿Qué laica italiana inició en Trento durante la Segunda Guerra Mundial el Movimiento de los Focolares centrado en la unidad ("Que todos sean uno")?',
    options: ['Chiara Lubich', 'Carmen Hernández', 'Adrienne von Speyr', 'Concepción Cabrera'],
    correctIndex: 0,
    explanation:
      'Chiara Lubich (1920-2008) impulsó la espiritualidad de la comunión, el amor recíproco y el diálogo ecuménico e interreligioso.',
    sourceRef: 'Jn 17,21 · CIC 813',
  },
  {
    id: 'q-mv-9',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222702',
    levelSlug: 'movimientos-eclesiales-siglo-xx',
    difficulty: 2,
    prompt: '¿Qué sacerdote italiano fundó el movimiento Comunión y Liberación proponiendo el cristianismo como un encuentro vivo que responde al deseo del corazón?',
    options: ['Siervo de Dios Luigi Giussani', 'San Luis Orione', 'Don Primo Mazzolari', 'San José Moscati'],
    correctIndex: 0,
    explanation:
      'Don Luigi Giussani (1922-2005) educó a generaciones de estudiantes y laicos en la razonabilidad de la fe y la presencia cristiana en la cultura.',
    sourceRef: 'Jn 1,39 · CIC 900',
  },
  {
    id: 'q-mv-10',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222702',
    levelSlug: 'movimientos-eclesiales-siglo-xx',
    difficulty: 2,
    prompt: '¿Cómo describe el Catecismo a los carismas y movimientos suscitados por el Espíritu Santo en la Iglesia?',
    options: [
      'Grupos independientes de los obispos',
      'Gracias ordenadas a la edificación y utilidad común de toda la Iglesia',
      'Asociaciones reservadas solo a consagrados',
      'Costumbres temporales sin valor eclesial',
    ],
    correctIndex: 1,
    explanation:
      'Los carismas, extraordinarios o sencillos, son dones del Espíritu Santo para el bien de los hombres y la edificación de la Iglesia, siempre en comunión con los pastores.',
    sourceRef: '1 Cor 12,7 · CIC 799-800',
  },

  // =========================================================================
  // MOVIMIENTOS Y CARISMAS — Nivel 3: Renovación y evangelización
  // =========================================================================
  {
    id: 'q-mv-11',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222703',
    levelSlug: 'movimientos-renovacion-mision',
    difficulty: 2,
    prompt: '¿Qué corriente de gracia surgida en 1967 promueve la experiencia personal de Pentecostés, la oración de alabanza y los dones del Espíritu Santo?',
    options: [
      'Renovación Carismática Católica',
      'Orden del Císter',
      'Caballeros de Colón',
      'Cofradía del Santo Entierro',
    ],
    correctIndex: 0,
    explanation:
      'La Renovación Carismática nació tras un retiro universitario en Duquesne (EE. UU.) y hoy reúne millones de fieles en todo el mundo bajo el servicio CHARIS.',
    sourceRef: 'Hch 2,1-4 · CIC 799-800',
  },
  {
    id: 'q-mv-12',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222703',
    levelSlug: 'movimientos-renovacion-mision',
    difficulty: 2,
    prompt: '¿Qué itinerario de formación católica postbautismal nació en las barracas de Madrid en 1964 por iniciativa de Kiko Argüello y Carmen Hernández?',
    options: [
      'El Camino Neocatecumenal',
      'La Obra de Kolping',
      'Los Equipos de Nuestra Señora',
      'El Movimiento Juvenil Salesiano',
    ],
    correctIndex: 0,
    explanation:
      'Aprobado por la Santa Sede, el Camino Neocatecumenal ayuda a redescubrir el Bautismo en pequeñas comunidades parroquiales y envía familias en misión.',
    sourceRef: 'Mt 28,19-20 · CIC 1231',
  },
  {
    id: 'q-mv-13',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222703',
    levelSlug: 'movimientos-renovacion-mision',
    difficulty: 2,
    prompt: '¿Qué movimiento nacido en Mallorca (España) en 1949 anuncia el primer anuncio cristiano a través de un retiro de tres días y el lema "¡De colores!"?',
    options: [
      'Cursillos de Cristiandad',
      'Comunidad de Sant’Egidio',
      'Legión de María',
      'Encuentro Matrimonial',
    ],
    correctIndex: 0,
    explanation:
      'Los Cursillos de Cristiandad buscan renovar los ambientes cotidianos con el Evangelio mediante la amistad, la piedad, el estudio y la acción.',
    sourceRef: 'Mc 16,15 · CIC 905',
  },
  {
    id: 'q-mv-14',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222703',
    levelSlug: 'movimientos-renovacion-mision',
    difficulty: 2,
    prompt: '¿Qué movimiento de espiritualidad conyugal fundó el padre Henri Caffarel en Francia para ayudar a los matrimonios a caminar juntos hacia la santidad?',
    options: [
      'Equipos de Nuestra Señora',
      'Juventud Obrera Cristiana',
      'Talleres de Oración y Vida',
      'Adoración Nocturna',
    ],
    correctIndex: 0,
    explanation:
      'Los Equipos de Nuestra Señora acompañan a parejas de esposos mediante la oración en común, el diálogo conyugal y el apoyo mutuo en pequeños equipos.',
    sourceRef: 'Ef 5,31-32 · CIC 1641',
  },
  {
    id: 'q-mv-15',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222703',
    levelSlug: 'movimientos-renovacion-mision',
    difficulty: 2,
    prompt: '¿Qué sacerdote capuchino fundó los "Talleres de Oración y Vida" para enseñar de modo práctico a orar y tratar con Dios como amigo?',
    options: ['Padre Ignacio Larrañaga', 'Padre Pío', 'San Leopoldo Mandic', 'Padre Cantalamessa'],
    correctIndex: 0,
    explanation:
      'El padre Ignacio Larrañaga (1928-2013) difundió los Talleres de Oración y Vida en decenas de países, acercando la oración contemplativa a miles de laicos.',
    sourceRef: 'Lc 11,1 · CIC 2709',
  },

  // =========================================================================
  // MOVIMIENTOS Y CARISMAS — Nivel 4: Apostolado y caridad
  // =========================================================================
  {
    id: 'q-mv-16',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222704',
    levelSlug: 'movimientos-apostolado-caridad',
    difficulty: 3,
    prompt: '¿Qué organización laical mariana fue fundada por Frank Duff en Dublín en 1921 para evangelizar puerta a puerta y acompañar a enfermos y alejados?',
    options: ['La Legión de María', 'La Milicia de la Inmaculada', 'El Apostolado de la Oración', 'Las Hijas de María'],
    correctIndex: 0,
    explanation:
      'La Legión de María reúne semanalmente a sus miembros en "praesidia" para rezar el Rosario y realizar un trabajo apostólico concreto en la parroquia.',
    sourceRef: 'Lc 1,39-45 · CIC 900',
  },
  {
    id: 'q-mv-17',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222704',
    levelSlug: 'movimientos-apostolado-caridad',
    difficulty: 3,
    prompt: '¿Qué movimiento laical nacido en Roma en 1968 se distingue por la oración vespertina, la amistad con los pobres y la mediación por la paz?',
    options: [
      'Comunidad de Sant’Egidio',
      'Orden de Malta',
      'Movimiento Palestra',
      'Vida Ascendente',
    ],
    correctIndex: 0,
    explanation:
      'Iniciada por jóvenes estudiantes en Trastevere, Sant’Egidio une escucha diaria del Evangelio, servicio a ancianos y pobres, y trabajo diplomático por la paz.',
    sourceRef: 'Mt 5,9 · CIC 2443',
  },
  {
    id: 'q-mv-18',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222704',
    levelSlug: 'movimientos-apostolado-caridad',
    difficulty: 3,
    prompt: '¿Qué joven laico francés fundó en 1833 la Sociedad de San Vicente de Paúl (Conferencias Vicentinas) para visitar y socorrer personalmente a familias pobres?',
    options: ['Beato Federico Ozanam', 'San Juan María Vianney', 'San Luis de Montfort', 'Beato Carlos de Foucauld'],
    correctIndex: 0,
    explanation:
      'Federico Ozanam, con solo 20 años, respondió a quienes cuestionaban la fe mostrando una caridad activa y cercana inspirada en san Vicente de Paúl.',
    sourceRef: 'Sant 2,14-17 · CIC 2447',
  },
  {
    id: 'q-mv-19',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222704',
    levelSlug: 'movimientos-apostolado-caridad',
    difficulty: 3,
    prompt: '¿Qué organización oficial de la Iglesia coordina la acción caritativa y social en diócesis y parroquias de todo el mundo?',
    options: ['Cáritas', 'Propaganda Fide', 'Rota Romana', 'Academia Pontificia'],
    correctIndex: 0,
    explanation:
      'Cáritas (del latín "caridad / amor") expresa el compromiso concreto de toda la Iglesia por la dignidad humana y los más vulnerables.',
    sourceRef: '1 Cor 13,4-13 · CIC 2443',
  },
  {
    id: 'q-mv-20',
    topicId: TOPIC_MOV,
    topicSlug: 'movimientos',
    levelId: '22222222-2222-4222-8222-222222222704',
    levelSlug: 'movimientos-apostolado-caridad',
    difficulty: 3,
    prompt: '¿Qué institución laical promueve desde el siglo XIX la formación integral de los laicos y su colaboración directa con los pastores en parroquias y diócesis?',
    options: ['Acción Católica', 'Orden Teutónica', 'Congregación del Oratorio', 'Hermanos Maristas'],
    correctIndex: 0,
    explanation:
      'El Concilio Vaticano II destacó el valor de la Acción Católica como escuela de apostolado laical en comunión directa con la diócesis y la parroquia.',
    sourceRef: '1 P 2,9 · CIC 900',
  },

  // =========================================================================
  // HISTORIA DE LA IGLESIA — Nivel 1: Primeros cristianos
  // =========================================================================
  {
    id: 'q-hi-1',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222801',
    levelSlug: 'historia-iglesia-primeros-cristianos',
    difficulty: 1,
    prompt: '¿En qué ciudad fueron llamados "cristianos" por primera vez los discípulos de Jesús?',
    options: ['Jerusalén', 'Roma', 'Antioquía', 'Alejandría'],
    correctIndex: 2,
    explanation:
      'Los Hechos de los Apóstoles narran que en Antioquía de Siria, donde predicaron Bernabé y Pablo, se usó por primera vez el nombre de "cristianos".',
    sourceRef: 'Hch 11,26 · CIC 1289',
  },
  {
    id: 'q-hi-2',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222801',
    levelSlug: 'historia-iglesia-primeros-cristianos',
    difficulty: 1,
    prompt: '¿Qué documento promulgado en el año 313 por el emperador Constantino concedió libertad religiosa a los cristianos tras siglos de persecución?',
    options: ['Edicto de Milán', 'Paz de Westfalia', 'Concordato de Worms', 'Carta Magna'],
    correctIndex: 0,
    explanation:
      'El Edicto de Milán puso fin a las persecuciones romanas y permitió a los cristianos construir templos y celebrar la fe públicamente.',
    sourceRef: '1 Tim 2,1-2 · CIC 2106',
  },
  {
    id: 'q-hi-3',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222801',
    levelSlug: 'historia-iglesia-primeros-cristianos',
    difficulty: 1,
    prompt: '¿Qué obispo mártir del siglo II usó por primera vez por escrito la expresión "Iglesia Católica" en su carta a los de Esmirna?',
    options: ['San Ignacio de Antioquía', 'San Ireneo de Lyon', 'San Justino', 'San Clemente Romano'],
    correctIndex: 0,
    explanation:
      'San Ignacio escribió rumbo al martirio en Roma: "Donde está Cristo Jesús, allí está la Iglesia Católica", mostrando su universalidad desde el inicio.',
    sourceRef: 'Mt 28,19 · CIC 830',
  },
  {
    id: 'q-hi-4',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222801',
    levelSlug: 'historia-iglesia-primeros-cristianos',
    difficulty: 1,
    prompt: '¿Por qué eran usados los peces ("Ichthys") como símbolo secreto entre los primeros cristianos?',
    options: [
      'Porque solo pescaban los domingos',
      'Porque sus letras griegas formaban el acrónimo "Jesucristo, Hijo de Dios, Salvador"',
      'Porque era el escudo de Roma',
      'Porque recordaba el mar Rojo',
    ],
    correctIndex: 1,
    explanation:
      'Las iniciales griegas I-Ch-Th-Y-S significan Iesous Christos Theou Yios Soter, una breve profesión de fe cristiana grabada en las catacumbas.',
    sourceRef: 'Mt 16,16 · CIC 452',
  },
  {
    id: 'q-hi-5',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222801',
    levelSlug: 'historia-iglesia-primeros-cristianos',
    difficulty: 1,
    prompt: '¿Qué primer gran encuentro de los apóstoles en Jerusalén (hacia el año 49) decidió que los gentiles no debían circuncidarse para ser cristianos?',
    options: ['Concilio de Jerusalén', 'Concilio de Nicea', 'Sínodo de Cartago', 'Concilio de Éfeso'],
    correctIndex: 0,
    explanation:
      'Narrado en Hechos 15, el Concilio de Jerusalén inauguró el discernimiento colegial de la Iglesia bajo la guía del Espíritu Santo.',
    sourceRef: 'Hch 15,28 · CIC 884',
  },

  // =========================================================================
  // HISTORIA DE LA IGLESIA — Nivel 2: Concilios y Padres de la Iglesia
  // =========================================================================
  {
    id: 'q-hi-6',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222802',
    levelSlug: 'historia-iglesia-concilios-padres',
    difficulty: 2,
    prompt: '¿Qué primer concilio ecuménico del año 325 afirmó que Jesús es "consustancial al Padre" frente a la herejía de Arrio?',
    options: ['Concilio de Nicea I', 'Concilio de Calcedonia', 'Concilio de Letrán IV', 'Concilio de Constanza'],
    correctIndex: 0,
    explanation:
      'El Concilio de Nicea formuló la base del Credo que rezamos los domingos, confesando a Jesucristo como "Dios verdadero de Dios verdadero".',
    sourceRef: 'Jn 10,30 · CIC 465',
  },
  {
    id: 'q-hi-7',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222802',
    levelSlug: 'historia-iglesia-concilios-padres',
    difficulty: 2,
    prompt: '¿Qué definió el Concilio de Calcedonia en el año 451 sobre la persona de Jesucristo?',
    options: [
      'Que Jesús tiene dos naturalezas (divina y humana) unidas en una sola Persona divina',
      'Que Jesús era solo un profeta humano',
      'Que el Espíritu Santo procede solo del Padre',
      'Que los Evangelios eran tres',
    ],
    correctIndex: 0,
    explanation:
      'Calcedonia confesó que Cristo es verdadero Dios y verdadero hombre, en dos naturalezas "sin confusión, sin cambio, sin división, sin separación".',
    sourceRef: 'Jn 1,14 · CIC 467',
  },
  {
    id: 'q-hi-8',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222802',
    levelSlug: 'historia-iglesia-concilios-padres',
    difficulty: 2,
    prompt: '¿Qué Padre de la Iglesia, obispo de Alejandría, defendió incansablemente la divinidad de Cristo contra el arrianismo y sufrió cinco destierros?',
    options: ['San Atanasio', 'San Ambrosio', 'San León Magno', 'San Cipriano'],
    correctIndex: 0,
    explanation:
      'San Atanasio (295-373) resumió la Encarnación con una frase célebre: "El Hijo de Dios se hizo hombre para hacernos Dios".',
    sourceRef: '2 P 1,4 · CIC 460',
  },
  {
    id: 'q-hi-9',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222802',
    levelSlug: 'historia-iglesia-concilios-padres',
    difficulty: 2,
    prompt: '¿En qué siglo se produjo el Gran Cisma de Oriente (1054) que lamentablemente separó a la Iglesia católica y a las Iglesias ortodoxas?',
    options: ['Siglo IV', 'Siglo XI', 'Siglo XVI', 'Siglo XIX'],
    correctIndex: 1,
    explanation:
      'Desde 1965, con el abrazo entre san Pablo VI y el patriarca Atenágoras, católicos y ortodoxos rezan y dialogan activamente por la plena unidad.',
    sourceRef: 'Jn 17,21 · CIC 817',
  },
  {
    id: 'q-hi-10',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222802',
    levelSlug: 'historia-iglesia-concilios-padres',
    difficulty: 2,
    prompt: '¿Qué gran obispo de Milán del siglo IV fue maestro y bautizador de san Agustín?',
    options: ['San Ambrosio', 'San Hilario', 'San Gregorio Nacianceno', 'San Efrén'],
    correctIndex: 0,
    explanation:
      'La predicación bíblica y el testimonio valiente de san Ambrosio tocaron el corazón de san Agustín, quien recibió de él el Bautismo en el año 387.',
    sourceRef: 'Rm 10,17 · CIC 1236',
  },

  // =========================================================================
  // HISTORIA DE LA IGLESIA — Nivel 3: De Trento al Vaticano II
  // =========================================================================
  {
    id: 'q-hi-11',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222803',
    levelSlug: 'historia-iglesia-trento-vaticano-ii',
    difficulty: 3,
    prompt: '¿Qué concilio del siglo XVI (1545-1563) impulsó la reforma católica, creó los seminarios y clarificó la doctrina sobre los sacramentos y el canon bíblico?',
    options: ['Concilio de Trento', 'Concilio de Lyon', 'Concilio de Florencia', 'Concilio Vaticano I'],
    correctIndex: 0,
    explanation:
      'El Concilio de Trento renovó profundamente la vida pastoral, la formación de los sacerdotes y la predicación doctrinal de la Iglesia.',
    sourceRef: '2 Tim 1,14 · CIC 120',
  },
  {
    id: 'q-hi-12',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222803',
    levelSlug: 'historia-iglesia-trento-vaticano-ii',
    difficulty: 3,
    prompt: '¿Qué encíclica del papa León XIII (1891) inauguró la Doctrina Social de la Iglesia moderna defendiendo los derechos de los trabajadores?',
    options: ['Rerum Novarum', 'Lumen Gentium', 'Dei Verbum', 'Humanae Vitae'],
    correctIndex: 0,
    explanation:
      'Rerum Novarum ("De las cosas nuevas") defendió el salario justo, el descanso dominical y el derecho de asociación de los obreros.',
    sourceRef: 'Sant 5,4 · CIC 2421',
  },
  {
    id: 'q-hi-13',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222803',
    levelSlug: 'historia-iglesia-trento-vaticano-ii',
    difficulty: 3,
    prompt: '¿Qué papa convocó el Concilio Vaticano II (1962-1965) para abrir la Iglesia al diálogo pastoral con el mundo contemporáneo?',
    options: ['Pío XII', 'San Juan XXIII', 'San Pío X', 'Benedicto XV'],
    correctIndex: 1,
    explanation:
      'San Juan XXIII inauguró el Vaticano II en 1962 y san Pablo VI lo clausuró en 1965, renovando la liturgia, el protagonismo de los laicos y el ecumenismo.',
    sourceRef: 'Hch 15,28 · CIC 884',
  },
  {
    id: 'q-hi-14',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222803',
    levelSlug: 'historia-iglesia-trento-vaticano-ii',
    difficulty: 3,
    prompt: '¿Cuál de estas constituciones del Concilio Vaticano II trata sobre la Iglesia como Pueblo de Dios y la llamada universal a la santidad?',
    options: ['Lumen Gentium', 'Sacrosanctum Concilium', 'Dei Verbum', 'Gaudium et Spes'],
    correctIndex: 0,
    explanation:
      'Lumen Gentium ("Luz de las gentes") recuerda que todos los fieles, en cualquier estado de vida, están llamados a la plenitud de la caridad.',
    sourceRef: '1 P 2,9 · CIC 2013',
  },
  {
    id: 'q-hi-15',
    topicId: TOPIC_HIS,
    topicSlug: 'historia-iglesia',
    levelId: '22222222-2222-4222-8222-222222222803',
    levelSlug: 'historia-iglesia-trento-vaticano-ii',
    difficulty: 3,
    prompt: '¿En qué año se publicó el actual Catecismo de la Iglesia Católica, fruto del Sínodo de 1985 y promulgado por san Juan Pablo II?',
    options: ['1965', '1978', '1992', '2005'],
    correctIndex: 2,
    explanation:
      'Promulgado en 1992 mediante la constitución Fidei Depositum, el CIC expone de modo orgánico el Credo, los Sacramentos, la Moral y la Oración.',
    sourceRef: '2 Tim 1,14 · CIC 11',
  },
];
