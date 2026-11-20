import type { VaticanNewsQuizItem } from '@/types/trivia';

/**
 * Sección "Nuevas noticias" multimedios católicos (Vatican News, ACI Prensa y Aleteia)
 * con mini-quiz de 3 preguntas cada una.
 * Cuando la Edge Function `sync-vatican-news` esté desplegada en Supabase,
 * se sincronizan automáticamente las últimas noticias de estos medios.
 */
export const LOCAL_VATICAN_NEWS: VaticanNewsQuizItem[] = [
  {
    id: 'vn-leon-xiv-america',
    sourceName: 'Vatican News',
    sectionLabel: 'El Papa',
    title: 'La Semana del Papa León XIV: viaje apostólico por América Latina',
    summary:
      'León XIV concluye su recorrido por Uruguay, Argentina y Perú con un llamado a la fe, la fraternidad y el servicio pastoral.',
    url: 'https://www.vaticannews.va/es/papa/news/2026-11/viaje-apostolico-peru-uruguay-argentina-papa-leon-xiv.html',
    imageUrl:
      'https://www.vaticannews.va/content/dam/vaticannews/agenzie/images/ansa/2026/11/12/09/1794471622295.jpg/_jcr_content/renditions/cq5dam.thumbnail.cropped.750.422.jpeg',
    publishedAt: '2026-11-19T12:05:00.000Z',
    questions: [
      {
        id: 'vn-q-1-1',
        topicId: 'vatican-news',
        topicSlug: 'nuevo-testamento',
        difficulty: 1,
        prompt: '¿Qué tres países de América Latina recorrió el Papa León XIV en este viaje apostólico?',
        options: [
          'Brasil, Chile y Colombia',
          'Uruguay, Argentina y Perú',
          'México, Paraguay y Bolivia',
          'Ecuador, Venezuela y Panamá',
        ],
        correctIndex: 1,
        explanation:
          'El viaje apostólico de León XIV abarcó Uruguay, Argentina y Perú, concluyendo con un mensaje de gratitud y esperanza.',
        sourceRef: 'Vatican News · CIC 882',
      },
      {
        id: 'vn-q-1-2',
        topicId: 'vatican-news',
        topicSlug: 'nuevo-testamento',
        difficulty: 1,
        prompt: '¿Por qué tuvo un valor especial la despedida del Papa en Perú según Vatican News?',
        options: [
          'Porque allí se celebró el primer Concilio Vaticano',
          'Porque en Perú desarrolló gran parte de su misión pastoral',
          'Porque fue su primera visita fuera de Europa',
          'Porque inauguró la Jornada Mundial de la Juventud',
        ],
        correctIndex: 1,
        explanation:
          'El Santo Padre se despidió con profunda gratitud de Perú, tierra donde ejerció gran parte de su servicio misionero y pastoral.',
        sourceRef: 'Vatican News · 19 nov 2026',
      },
      {
        id: 'vn-q-1-3',
        topicId: 'vatican-news',
        topicSlug: 'liturgia',
        difficulty: 2,
        prompt: '¿Cuál es la misión principal del Papa como sucesor de san Pedro según el Catecismo?',
        options: [
          'Ser principio y fundamento perpetuo y visible de unidad en la Iglesia',
          'Dirigir exclusivamente la diócesis de Jerusalén',
          'Redactar nuevos libros de la Sagrada Escritura',
          'Sustituir la autoridad de los obispos locales en cada parroquia',
        ],
        correctIndex: 0,
        explanation:
          'El Romano Pontífice, obispo de Roma y sucesor de Pedro, es el principio y fundamento visible de unidad de los obispos y de los fieles.',
        sourceRef: 'CIC 882',
      },
    ],
  },
  {
    id: 'aci-belen-esperanza',
    sourceName: 'ACI Prensa',
    sectionLabel: 'Tierra Santa',
    title: 'Custodiar la esperanza en Belén: visita pastoral a la Basílica de la Natividad',
    summary:
      'El prefecto del Dicasterio para las Iglesias Orientales ingresó solemnemente en la Basílica de la Natividad llevando la cercanía del Papa a las familias cristianas.',
    url: 'https://www.aciprensa.com/',
    imageUrl:
      'https://www.vaticannews.va/content/dam/vaticannews/multimedia/2026/novembre/19/img-4012.jpg/_jcr_content/renditions/cq5dam.thumbnail.cropped.750.422.jpeg',
    publishedAt: '2026-11-19T14:53:00.000Z',
    questions: [
      {
        id: 'vn-q-2-1',
        topicId: 'vatican-news',
        topicSlug: 'liturgia',
        difficulty: 1,
        prompt: '¿En qué templo de Belén realizó su entrada solemne el prefecto del Dicasterio para las Iglesias Orientales?',
        options: [
          'Basílica del Santo Sepulcro',
          'Basílica de la Natividad',
          'Basílica de la Anunciación',
          'Basílica de San Juan de Letrán',
        ],
        correctIndex: 1,
        explanation:
          'En su visita pastoral a Tierra Santa, ingresó en la Basílica de la Natividad en Belén llevando el abrazo cercano del Papa.',
        sourceRef: 'ACI Prensa · Lc 2,4-7',
      },
      {
        id: 'vn-q-2-2',
        topicId: 'vatican-news',
        topicSlug: 'nuevo-testamento',
        difficulty: 1,
        prompt: '¿Qué misterio central de la fe cristiana conmemora la ciudad de Belén?',
        options: [
          'El Bautismo de Jesús en el Jordán',
          'La Transfiguración del Señor',
          'El nacimiento (Encarnación) de Jesucristo',
          'La Ascensión al cielo',
        ],
        correctIndex: 2,
        explanation:
          'En Belén de Judea nació Jesús de la Virgen María, cumpliendo las profecías de la Escritura.',
        sourceRef: 'Lc 2,4-7',
      },
      {
        id: 'vn-q-2-3',
        topicId: 'vatican-news',
        topicSlug: 'liturgia',
        difficulty: 2,
        prompt: '¿Qué lugar ocupan las Iglesias Orientales católicas dentro de la Iglesia universal?',
        options: [
          'Son Iglesias autónomas en plena comunión con el Papa y con sus propios ritos litúrgicos',
          'Solo pueden celebrar en latín',
          'No comparten los siete sacramentos',
          'Son asociaciones laicales recientes',
        ],
        correctIndex: 0,
        explanation:
          'Las Iglesias católicas orientales viven en plena comunión con el Obispo de Roma y enriquecen a toda la Iglesia con sus tradiciones litúrgicas.',
        sourceRef: 'CIC 1202-1203',
      },
    ],
  },
  {
    id: 'aleteia-deporte-virtud',
    sourceName: 'Aleteia',
    sectionLabel: 'Fe y cultura',
    title: 'El abrazo del Papa al mundo del ciclismo: deporte, esfuerzo y fraternidad',
    summary:
      'El Dicasterio para la Cultura y la Educación junto a la UCI promueven una audiencia con León XIV destacando los valores cristianos en el deporte.',
    url: 'https://es.aleteia.org/',
    imageUrl:
      'https://www.vaticannews.va/content/dam/vaticannews/multimedia/2026/novembre/19/sfdg.jpg/_jcr_content/renditions/cq5dam.thumbnail.cropped.750.422.jpeg',
    publishedAt: '2026-11-19T13:19:00.000Z',
    questions: [
      {
        id: 'vn-q-3-1',
        topicId: 'vatican-news',
        topicSlug: 'santos',
        difficulty: 1,
        prompt: '¿Qué organismo de la Santa Sede coorganiza junto a la UCI la audiencia con el mundo del ciclismo?',
        options: [
          'Dicasterio para la Cultura y la Educación',
          'Tribunal de la Rota Romana',
          'Biblioteca Apostólica Vaticana',
          'Guardia Suiza Pontificia',
        ],
        correctIndex: 0,
        explanation:
          'El encuentro en el Palacio Apostólico es promovido por el Dicasterio para la Cultura y la Educación junto a la Unión Ciclista Internacional.',
        sourceRef: 'Aleteia · 1 Cor 9,24-25',
      },
      {
        id: 'vn-q-3-2',
        topicId: 'vatican-news',
        topicSlug: 'nuevo-testamento',
        difficulty: 2,
        prompt: '¿Qué apóstol empleó con frecuencia metáforas deportivas (como correr la carrera) para hablar de la vida cristiana?',
        options: ['San Mateo', 'San Pablo', 'San Judas Tadeo', 'San Felipe'],
        correctIndex: 1,
        explanation:
          'San Pablo comparó la perseverancia en la fe con el entrenamiento de los atletas que corren hacia una corona incorruptible.',
        sourceRef: '1 Cor 9,24-25',
      },
      {
        id: 'vn-q-3-3',
        topicId: 'vatican-news',
        topicSlug: 'sacramentos',
        difficulty: 2,
        prompt: '¿Qué virtud cardinal ayuda especialmente a sostener el esfuerzo, el respeto y la constancia en el deporte y en la fe?',
        options: ['La fortaleza', 'La indiferencia', 'La ostentación', 'La prisa'],
        correctIndex: 0,
        explanation:
          'La fortaleza asegura firmeza en las dificultades y constancia en la búsqueda del bien.',
        sourceRef: 'CIC 1808',
      },
    ],
  },
];
