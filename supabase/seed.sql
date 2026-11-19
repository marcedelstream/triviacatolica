-- ============================================================================
-- Trivia Católica — Seed inicial
-- 5 categorías (Línea Gráfica Lienzo), 15 niveles, 30 preguntas doctrinales
-- y 3 banners de novedades.
-- ============================================================================

-- 1. Tópicos (UUIDs deterministas para idempotencia)
insert into public.topics (id, slug, title, description, icon, color_token, sort_order, is_premium)
values
  ('11111111-1111-4111-8111-111111111101', 'antiguo-testamento', 'Antiguo Testamento', 'Creación, patriarcas, éxodo, salmos y profetas.', 'scroll', 'cat-at', 1, false),
  ('11111111-1111-4111-8111-111111111102', 'nuevo-testamento', 'Nuevo Testamento', 'Evangelios, milagros de Jesús, parábolas y cartas apostólicas.', 'book-open-text', 'cat-nt', 2, false),
  ('11111111-1111-4111-8111-111111111103', 'santos', 'Santos', 'Testigos de la fe a lo largo de la historia de la Iglesia.', 'hands-praying', 'cat-sa', 3, false),
  ('11111111-1111-4111-8111-111111111104', 'sacramentos', 'Sacramentos', 'Los siete signos eficaces de la gracia instituidos por Cristo.', 'drop', 'cat-sc', 4, false),
  ('11111111-1111-4111-8111-111111111105', 'liturgia', 'Liturgia', 'La Santa Misa, los tiempos litúrgicos y la oración de la Iglesia.', 'church', 'cat-li', 5, false)
on conflict (slug) do nothing;

-- 2. Niveles (3 niveles por categoría: 1 y 2 gratuitos, 3 Pro) con slugs compartibles para triviacatolica.com
insert into public.levels (id, slug, topic_id, level_number, global_order, title, subtitle, difficulty, questions_per_round, is_premium)
values
  -- Antiguo Testamento
  ('22222222-2222-4222-8222-222222222101', 'antiguo-testamento-comienzos-patriarcas', '11111111-1111-4111-8111-111111111101', 1, 1, 'Los comienzos y patriarcas', 'Creación, Noé, Abraham y Moisés', 1, 5, false),
  ('22222222-2222-4222-8222-222222222102', 'antiguo-testamento-reyes-profetas', '11111111-1111-4111-8111-111111111101', 2, 2, 'Reyes y profetas', 'David, Elías, Isaías y los Salmos', 2, 5, false),
  ('22222222-2222-4222-8222-222222222103', 'antiguo-testamento-sabiduria-alianza', '11111111-1111-4111-8111-111111111101', 3, 3, 'Sabiduría y alianza', 'Libros sapienciales y deuterocanónicos', 3, 5, true),

  -- Nuevo Testamento
  ('22222222-2222-4222-8222-222222222201', 'nuevo-testamento-milagros-de-jesus', '11111111-1111-4111-8111-111111111102', 1, 4, 'Los milagros de Jesús', 'Signos del Reino en los Evangelios', 1, 5, false),
  ('22222222-2222-4222-8222-222222222202', 'nuevo-testamento-parabolas-apostoles', '11111111-1111-4111-8111-111111111102', 2, 5, 'Parábolas y apóstoles', 'Enseñanzas y primeros discípulos', 2, 5, false),
  ('22222222-2222-4222-8222-222222222203', 'nuevo-testamento-cartas-apostolicas', '11111111-1111-4111-8111-111111111102', 3, 6, 'Cartas apostólicas', 'San Pablo, Hechos y Apocalipsis', 3, 5, true),

  -- Santos
  ('22222222-2222-4222-8222-222222222301', 'santos-cercanos', '11111111-1111-4111-8111-111111111103', 1, 7, 'Santos cercanos', 'Francisco, Teresa, José y María', 1, 5, false),
  ('22222222-2222-4222-8222-222222222302', 'santos-doctores-de-la-iglesia', '11111111-1111-4111-8111-111111111103', 2, 8, 'Doctores de la Iglesia', 'Agustín, Tomás y Catalina de Siena', 2, 5, false),
  ('22222222-2222-4222-8222-222222222303', 'santos-america-siglo-xx', '11111111-1111-4111-8111-111111111103', 3, 9, 'Santos de América y del siglo XX', 'Rosa de Lima, Brochero y Carlo Acutis', 3, 5, true),

  -- Sacramentos
  ('22222222-2222-4222-8222-222222222401', 'sacramentos-iniciacion-cristiana', '11111111-1111-4111-8111-111111111104', 1, 10, 'Iniciación cristiana', 'Bautismo, Confirmación y Eucaristía', 1, 5, false),
  ('22222222-2222-4222-8222-222222222402', 'sacramentos-curacion-servicio', '11111111-1111-4111-8111-111111111104', 2, 11, 'Curación y servicio', 'Reconciliación, Unción, Orden y Matrimonio', 2, 5, false),
  ('22222222-2222-4222-8222-222222222403', 'sacramentos-gracia-caracter', '11111111-1111-4111-8111-111111111104', 3, 12, 'Gracia y carácter sacramental', 'Teología sacramental según el Catecismo', 3, 5, true),

  -- Liturgia
  ('22222222-2222-4222-8222-222222222501', 'liturgia-la-santa-misa', '11111111-1111-4111-8111-111111111105', 1, 13, 'La Santa Misa', 'Partes esenciales de la celebración', 1, 5, false),
  ('22222222-2222-4222-8222-222222222502', 'liturgia-ano-liturgico-colores', '11111111-1111-4111-8111-111111111105', 2, 14, 'Año litúrgico y colores', 'Adviento, Cuaresma, Pascua y Tiempo Ordinario', 2, 5, false),
  ('22222222-2222-4222-8222-222222222503', 'liturgia-de-las-horas-signos', '11111111-1111-4111-8111-111111111105', 3, 15, 'Liturgia de las Horas y signos', 'El altar, el leccionario y las fiestas solemnes', 3, 5, true)
on conflict (global_order) do nothing;

-- 3. Banco de 30 preguntas reales (6 por categoría)
insert into public.questions (topic_id, difficulty, prompt, options, correct_index, explanation, source_ref)
values
  -- ANTIGUO TESTAMENTO (6)
  (
    '11111111-1111-4111-8111-111111111101', 1,
    '¿A quién le pidió Dios que construyera el arca antes del diluvio?',
    '["Moisés", "Noé", "Abraham", "Elías"]'::jsonb, 1,
    'Dios encomendó a Noé construir el arca para salvar a su familia y a los animales, prefigurando la salvación por el Bautismo.',
    'Gn 6,14 · CIC 1219'
  ),
  (
    '11111111-1111-4111-8111-111111111101', 1,
    '¿En qué monte recibió Moisés las tablas de los Diez Mandamientos?',
    '["Monte Carmelo", "Monte Tabor", "Monte Sinaí", "Monte de los Olivos"]'::jsonb, 2,
    'En el monte Sinaí Dios selló la Alianza con Israel y entregó a Moisés el Decálogo como camino de vida.',
    'Éx 19,20; 20,1-17 · CIC 2056'
  ),
  (
    '11111111-1111-4111-8111-111111111101', 1,
    '¿Quién es llamado en la Escritura el "padre de todos los creyentes"?',
    '["Isaac", "Jacob", "Abraham", "David"]'::jsonb, 2,
    'Abraham creyó en la promesa de Dios y partió hacia la tierra prometida, convirtiéndose en modelo de obediencia en la fe.',
    'Gn 12,1-4 · CIC 145'
  ),
  (
    '11111111-1111-4111-8111-111111111101', 2,
    '¿Qué rey de Israel compuso gran parte de los Salmos?',
    '["Saúl", "David", "Salomón", "Josías"]'::jsonb, 1,
    'La tradición bíblica atribuye al rey David la mayoría de los Salmos, oración inspirada de Israel y de la Iglesia.',
    'CIC 2579'
  ),
  (
    '11111111-1111-4111-8111-111111111101', 2,
    '¿Qué profeta anunció que una virgen concebiría y daría a luz a Emmanuel?',
    '["Jeremías", "Ezequiel", "Isaías", "Daniel"]'::jsonb, 2,
    'Isaías profetizó el nacimiento de Emmanuel, "Dios con nosotros", promesa cumplida plenamente en Jesucristo.',
    'Is 7,14 · Mt 1,22-23'
  ),
  (
    '11111111-1111-4111-8111-111111111101', 3,
    '¿Qué libro deuterocanónico del Antiguo Testamento fundamenta la oración por los difuntos?',
    '["Segundo libro de los Macabeos", "Libro de Rut", "Eclesiastés", "Lamentaciones"]'::jsonb, 0,
    'En 2 Macabeos, Judas Macabeo ofrece sacrificios y oraciones por los caídos, gesto que la Iglesia cita para la oración por las almas del purgatorio.',
    '2 Mac 12,43-46 · CIC 1032'
  ),

  -- NUEVO TESTAMENTO (6)
  (
    '11111111-1111-4111-8111-111111111102', 1,
    '¿Cuál fue el primer milagro público de Jesús narrado en el Evangelio de san Juan?',
    '["La multiplicación de los panes", "Convertir el agua en vino en Caná", "Caminar sobre las aguas", "La resurrección de Lázaro"]'::jsonb, 1,
    'A pedido de su Madre María en las bodas de Caná, Jesús transformó el agua en vino y manifestó su gloria.',
    'Jn 2,1-11 · CIC 2618'
  ),
  (
    '11111111-1111-4111-8111-111111111102', 1,
    '¿A qué apóstol le dijo Jesús: "Tú eres Pedro, y sobre esta piedra edificaré mi Iglesia"?',
    '["San Juan", "Santiago", "Simón Pedro", "San Andrés"]'::jsonb, 2,
    'Tras la confesión de fe de Simón en Cesarea de Filipo, Jesús le confió las llaves del Reino y el ministerio de unidad.',
    'Mt 16,18-19 · CIC 552'
  ),
  (
    '11111111-1111-4111-8111-111111111102', 1,
    '¿Con cuántos panes y peces alimentó Jesús a una multitud de cinco mil hombres?',
    '["Tres panes y un pez", "Cinco panes y dos peces", "Siete panes y cinco peces", "Doce panes y dos peces"]'::jsonb, 1,
    'Con cinco panes de cebada y dos peces Jesús sació a la multitud, prefigurando la sobreabundancia de la Eucaristía.',
    'Jn 6,9-13 · CIC 1335'
  ),
  (
    '11111111-1111-4111-8111-111111111102', 2,
    '¿En qué Evangelio se encuentra la parábola del Hijo Pródigo?',
    '["San Mateo", "San Marcos", "San Lucas", "San Juan"]'::jsonb, 2,
    'El Evangelio de san Lucas recoge esta parábola en el capítulo 15 para mostrar la misericordia infinita del Padre.',
    'Lc 15,11-32 · CIC 1439'
  ),
  (
    '11111111-1111-4111-8111-111111111102', 2,
    '¿Qué fiesta celebraban los discípulos cuando descendió el Espíritu Santo en lenguas de fuego?',
    '["Pascua", "Pentecostés", "Tabernáculos", "Dedicación"]'::jsonb, 1,
    'Cincuenta días después de la Resurrección, en Pentecostés, el Espíritu Santo fue derramado y la Iglesia comenzó su misión universal.',
    'Hch 2,1-4 · CIC 731'
  ),
  (
    '11111111-1111-4111-8111-111111111102', 3,
    '¿En qué carta escribió san Pablo el célebre himno a la caridad ("El amor es paciente, es servicial")?',
    '["Carta a los Romanos", "Primera carta a los Corintios", "Carta a los Efesios", "Carta a los Gálatas"]'::jsonb, 1,
    'En 1 Corintios 13, san Pablo enseña que la caridad es el mayor de todos los dones y el vínculo de la perfección.',
    '1 Cor 13,4-13 · CIC 1826'
  ),

  -- SANTOS (6)
  (
    '11111111-1111-4111-8111-111111111103', 1,
    '¿Qué santo de Asís compuso el "Cántico de las Criaturas" y abrazó la pobreza evangélica?',
    '["San Antonio de Padua", "San Francisco de Asís", "Santo Domingo de Guzmán", "San Benito"]'::jsonb, 1,
    'San Francisco de Asís vivió radicalmente el Evangelio y alabó a Dios a través de toda la creación.',
    'CIC 344'
  ),
  (
    '11111111-1111-4111-8111-111111111103', 1,
    '¿Qué santa carmelita es conocida por su "caminito" de confianza espiritual y es patrona de las misiones?',
    '["Santa Teresa de Ávila", "Santa Teresita del Niño Jesús", "Santa Clara de Asís", "Santa Faustina Kowalska"]'::jsonb, 1,
    'Santa Teresa de Lisieux mostró que la santidad está al alcance de todos mediante los pequeños actos hechos con gran amor.',
    'CIC 2011'
  ),
  (
    '11111111-1111-4111-8111-111111111103', 1,
    '¿Quién fue el esposo de la Virgen María y padre adoptivo de Jesús?',
    '["San Joaquín", "San Zacarías", "San José", "San Simeón"]'::jsonb, 2,
    'San José, hombre justo y custodio de la Sagrada Familia, es venerado como patrono de la Iglesia universal.',
    'Mt 1,19-24 · CIC 437'
  ),
  (
    '11111111-1111-4111-8111-111111111103', 2,
    '¿Qué Doctor de la Iglesia escribió las "Confesiones" y fue obispo de Hipona?',
    '["San Agustín", "Santo Tomás de Aquino", "San Jerónimo", "San Ambrosio"]'::jsonb, 0,
    'San Agustín narró su camino de conversión en las Confesiones: "Nos hiciste, Señor, para ti, y nuestro corazón está inquieto hasta que descanse en ti".',
    'CIC 30'
  ),
  (
    '11111111-1111-4111-8111-111111111103', 2,
    '¿Qué santo escribió la "Suma Teológica" y compuso himnos eucarísticos como el Pange Lingua?',
    '["San Buenaventura", "Santo Tomás de Aquino", "San Alberto Magno", "San Anselmo"]'::jsonb, 1,
    'Santo Tomás de Aquino armonizó fe y razón y profundizó admirablemente el misterio de la presencia real en la Eucaristía.',
    'CIC 1381'
  ),
  (
    '11111111-1111-4111-8111-111111111103', 3,
    '¿Quién fue la primera santa canonizada nacida en el continente americano?',
    '["Santa Mariana de Jesús", "Santa Rosa de Lima", "Santa Laura Montoya", "Santa Kateri Tekakwitha"]'::jsonb, 1,
    'Santa Rosa de Lima (1586-1617), terciaria dominica peruana, fue canonizada en 1671 y es patrona de América y Filipinas.',
    'Martirologio Romano, 23 de agosto'
  ),

  -- SACRAMENTOS (6)
  (
    '11111111-1111-4111-8111-111111111104', 1,
    '¿Cuántos son los sacramentos instituidos por Jesucristo en la Iglesia católica?',
    '["Cinco", "Seis", "Siete", "Nueve"]'::jsonb, 2,
    'Los siete sacramentos abarcan todas las etapas de la vida cristiana: iniciación, curación y servicio a la comunión.',
    'CIC 1210'
  ),
  (
    '11111111-1111-4111-8111-111111111104', 1,
    '¿Cuál es el sacramento que constituye el fundamento de toda la vida cristiana y nos hace hijos de Dios?',
    '["Confirmación", "Bautismo", "Reconciliación", "Eucaristía"]'::jsonb, 1,
    'El Bautismo es la puerta de la vida en el Espíritu, perdona el pecado original y nos incorpora a la Iglesia.',
    'CIC 1213'
  ),
  (
    '11111111-1111-4111-8111-111111111104', 1,
    '¿Qué sacramento es llamado por el Catecismo "fuente y culmen de toda la vida cristiana"?',
    '["El Matrimonio", "El Bautismo", "La Eucaristía", "El Orden Sagrado"]'::jsonb, 2,
    'En la Eucaristía está contenido todo el bien espiritual de la Iglesia, es decir, Cristo mismo, nuestra Pascua.',
    'CIC 1324'
  ),
  (
    '11111111-1111-4111-8111-111111111104', 2,
    '¿Cuáles son los dos sacramentos llamados "de curación"?',
    '["Bautismo y Confirmación", "Penitencia (Reconciliación) y Unción de los Enfermos", "Matrimonio y Orden Sagrado", "Eucaristía y Reconciliación"]'::jsonb, 1,
    'Cristo, médico de almas y cuerpos, quiso que su Iglesia continuara su obra de curación mediante la Reconciliación y la Unción de los Enfermos.',
    'CIC 1421'
  ),
  (
    '11111111-1111-4111-8111-111111111104', 2,
    '¿Cuál es el signo esencial del sacramento de la Confirmación?',
    '["La entrega de una vela encendida", "La unción con el santo crisma y la imposición de la mano", "La aspersión con agua bendita", "La señal de la paz"]'::jsonb, 1,
    'El sacramento de la Confirmación se confiere por la unción del santo crisma en la frente con la imposición de la mano y las palabras rituales.',
    'CIC 1300'
  ),
  (
    '11111111-1111-4111-8111-111111111104', 3,
    '¿Qué tres sacramentos imprimen un "carácter" espiritual indeleble y por eso no se repiten?',
    '["Bautismo, Eucaristía y Matrimonio", "Bautismo, Confirmación y Orden Sagrado", "Confirmación, Reconciliación y Unción", "Bautismo, Matrimonio y Orden Sagrado"]'::jsonb, 1,
    'El Bautismo, la Confirmación y el Orden confieren un sello espiritual permanente que configura al fiel con Cristo de modo definitivo.',
    'CIC 1121'
  ),

  -- LITURGIA (6)
  (
    '11111111-1111-4111-8111-111111111105', 1,
    '¿Cuáles son las dos grandes partes que forman un solo acto de culto en la Santa Misa?',
    '["Ritos iniciales y despedida", "Liturgia de la Palabra y Liturgia Eucarística", "Homilía y Comunión", "Salmo y Credo"]'::jsonb, 1,
    'La Misa se estructura en la mesa de la Palabra de Dios y la mesa del Cuerpo de Cristo, inseparablemente unidas.',
    'CIC 1346'
  ),
  (
    '11111111-1111-4111-8111-111111111105', 1,
    '¿Qué tiempo litúrgico prepara durante cuatro semanas la celebración de la Navidad?',
    '["Cuaresma", "Adviento", "Tiempo Ordinario", "Octava de Pascua"]'::jsonb, 1,
    'El Adviento abre el año litúrgico y nos invita a esperar con alegría el nacimiento de Jesús y su venida gloriosa.',
    'CIC 524'
  ),
  (
    '11111111-1111-4111-8111-111111111105', 1,
    '¿Cuál es la celebración central de todo el año litúrgico cristiano?',
    '["La Epifanía", "El Domingo de Pascua (Resurrección)", "La Asunción", "Todos los Santos"]'::jsonb, 1,
    'La Pascua es la "Fiesta de las fiestas" porque celebra la resurrección de Cristo, fundamento de nuestra fe.',
    'CIC 1169'
  ),
  (
    '11111111-1111-4111-8111-111111111105', 2,
    '¿Qué color litúrgico se usa habitualmente durante Adviento y Cuaresma?',
    '["Verde", "Rojo", "Morado", "Blanco"]'::jsonb, 2,
    'El color morado expresa conversión, espera vigilante y penitencia en Adviento y Cuaresma.',
    'IGMR 346'
  ),
  (
    '11111111-1111-4111-8111-111111111105', 2,
    '¿En qué fiestas se emplea el color litúrgico rojo?',
    '["Domingos del Tiempo Ordinario", "Pentecostés, Domingo de Ramos, Viernes Santo y mártires", "Navidad y Pascua", "Solemnidades de la Virgen María"]'::jsonb, 1,
    'El rojo simboliza el fuego del Espíritu Santo y la sangre derramada por Cristo y sus mártires.',
    'IGMR 346'
  ),
  (
    '11111111-1111-4111-8111-111111111105', 3,
    '¿Cómo se llama la oración pública diaria de la Iglesia compuesta principalmente por salmos e himnos?',
    '["Vía Crucis", "Liturgia de las Horas", "Lectio Divina", "Ángelus"]'::jsonb, 1,
    'La Liturgia de las Horas (Oficio Divino) santifica el curso del día y de la noche uniendo a los fieles en la oración de Cristo.',
    'CIC 1174-1175'
  );

-- 4. Banners iniciales (Oración, Iniciativa, Novedad — Línea Gráfica Lienzo)
insert into public.banners (id, tipo, titulo, texto, link, orden, is_active)
values
  ('33333333-3333-4333-8333-333333333301', 'oracion', 'Rosario por la paz', 'Sumate hoy a las 20:00 desde tu casa.', 'https://www.vaticannews.va/es.html', 1, true),
  ('33333333-3333-4333-8333-333333333302', 'iniciativa', 'Desafío comunitario de la semana', 'Completá una ronda de Sacramentos y compartilo en tu parroquia.', null, 2, true),
  ('33333333-3333-4333-8333-333333333303', 'novedad', 'Nuevas preguntas de Liturgia', 'Ya podés practicar el año litúrgico y los signos de la Santa Misa.', null, 3, true)
on conflict (id) do nothing;
