-- ============================================================================
-- Trivia Católica — Migración 013:
-- 1. Nueva modalidad: Completá la frase bíblica (4 niveles, 20 preguntas)
-- 2. Nueva modalidad: Canciones católicas (4 niveles, 20 preguntas)
-- 3. Textos completos de Biblia y Catecismo (CIC) en reference_texts
-- 100% idempotente.
-- ============================================================================

insert into public.topics (id, slug, title, description, icon, color_token, sort_order, is_premium)
values
  ('11111111-1111-4111-8111-111111111110', 'completa-frase', 'Completá la frase', 'Elegí la palabra exacta que completa frases célebres de la Biblia.', 'quotes', 'cat-cf', 1, false),
  ('11111111-1111-4111-8111-111111111111', 'canciones-catolicas', 'Canciones católicas', 'Leé un verso y adiviná qué canto de Misa, María o adoración es.', 'music-notes', 'cat-cc', 2, false)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  color_token = excluded.color_token,
  sort_order = excluded.sort_order;

insert into public.levels (id, slug, topic_id, level_number, global_order, title, subtitle, difficulty, questions_per_round, is_premium)
values
  ('22222222-2222-4222-8222-222222223001', 'completa-frase-palabras-de-jesus', '11111111-1111-4111-8111-111111111110', 1, 38, 'Palabras de Jesús', 'Frases del Evangelio que todos recordamos', 1, 5, false),
  ('22222222-2222-4222-8222-222222223002', 'completa-frase-salmos-confianza', '11111111-1111-4111-8111-111111111110', 2, 39, 'Salmos y confianza', 'Oraciones de paz, luz y gratitud', 1, 5, false),
  ('22222222-2222-4222-8222-222222223003', 'completa-frase-fe-esperanza', '11111111-1111-4111-8111-111111111110', 3, 40, 'Fe y esperanza', 'Fortaleza, libertad y confianza en Dios', 2, 5, true),
  ('22222222-2222-4222-8222-222222223004', 'completa-frase-amor-mision', '11111111-1111-4111-8111-111111111110', 4, 41, 'Amor y misión', 'Mandamiento nuevo, servicio y envío', 1, 5, false),
  ('22222222-2222-4222-8222-222222223101', 'canciones-catolicas-clasicos-misa', '11111111-1111-4111-8111-111111111111', 1, 42, 'Clásicos de la Misa', 'Pescador de hombres, Tan cerca de mí y más', 1, 5, false),
  ('22222222-2222-4222-8222-222222223102', 'canciones-catolicas-cantos-maria', '11111111-1111-4111-8111-111111111111', 2, 43, 'Cantos a la Virgen María', 'Santa María del Camino, Junto a ti María y más', 1, 5, false),
  ('22222222-2222-4222-8222-222222223103', 'canciones-catolicas-adoracion-oracion', '11111111-1111-4111-8111-111111111111', 3, 44, 'Adoración y oración', 'Nadie te ama como yo, Milagro de amor y Renuévame', 2, 5, true),
  ('22222222-2222-4222-8222-222222223104', 'canciones-catolicas-mision-juventud', '11111111-1111-4111-8111-111111111111', 4, 45, 'Misión y juventud', 'Alma misionera, Juntos como hermanos e Id y enseñad', 1, 5, false)
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  difficulty = excluded.difficulty,
  is_premium = excluded.is_premium;

insert into public.questions (id, topic_id, level_id, difficulty, prompt, options, correct_index, explanation, source_ref, is_active)
values
  ('44444444-4444-4444-8444-444444450101', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223001', 1, 'Completá la frase bíblica:
«Dejen que los ______ vengan a mí, y no se lo impidan.»', '["niños","sabios","reyes","escribas"]'::jsonb, 0, 'Jesús abraza y bendice a los niños, mostrando que el Reino de Dios pertenece a quienes tienen un corazón sencillo y confiado.', 'Mc 10,14 · CIC 526', true),
  ('44444444-4444-4444-8444-444444450102', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223001', 1, 'Completá la frase bíblica:
«Yo soy el ______, la verdad y la vida.»', '["puente","camino","templo","monte"]'::jsonb, 1, 'En la Última Cena Jesús responde a Tomás revelando que Él mismo es el acceso vivo al Padre.', 'Jn 14,6 · CIC 459', true),
  ('44444444-4444-4444-8444-444444450103', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223001', 1, 'Completá la frase bíblica:
«Ustedes son la ______ de la tierra.»', '["arena","lluvia","sal","espiga"]'::jsonb, 2, 'En el Sermón de la Montaña, Jesús invita a los discípulos a dar sabor y sentido cristiano al mundo sin perder su identidad.', 'Mt 5,13 · CIC 782', true),
  ('44444444-4444-4444-8444-444444450104', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223001', 1, 'Completá la frase bíblica:
«No solo de ______ vive el hombre, sino de toda palabra que sale de la boca de Dios.»', '["vino","oro","agua","pan"]'::jsonb, 3, 'Jesús cita el Deuteronomio en el desierto para recordar que el alma necesita alimentarse de la Palabra de Dios.', 'Mt 4,4 · CIC 131', true),
  ('44444444-4444-4444-8444-444444450105', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223001', 1, 'Completá la frase bíblica:
«Pidan y se les dará; busquen y encontrarán; llamen y se les ______.»', '["abrirá","mostrará","regalará","cantará"]'::jsonb, 0, 'Jesús enseña la confianza perseverante en la oración: Dios Padre escucha y da bienes verdaderos a sus hijos.', 'Mt 7,7 · CIC 2609', true),
  ('44444444-4444-4444-8444-444444450201', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223002', 1, 'Completá la frase bíblica:
«El Señor es mi ______, nada me puede faltar.»', '["escudo","pastor","juez","testigo"]'::jsonb, 1, 'El Salmo 23 es el canto clásico de confianza en la providencia amorosa de Dios, que Jesús asumió como el Buen Pastor.', 'Sal 23,1 · CIC 754', true),
  ('44444444-4444-4444-8444-444444450202', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223002', 1, 'Completá la frase bíblica:
«Tu palabra es una ______ para mis pasos y una luz en mi sendero.»', '["espada","antorcha","lámpara","estrella"]'::jsonb, 2, 'El Salmo 119 compara la Palabra de Dios con una lámpara que ilumina paso a paso las decisiones concretas de cada jornada.', 'Sal 119,105 · CIC 104', true),
  ('44444444-4444-4444-8444-444444450203', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223002', 1, 'Completá la frase bíblica:
«El Señor es mi luz y mi salvación, ¿a quién ______?»', '["buscaré","llamaré","seguiré","temeré"]'::jsonb, 3, 'El Salmo 27 expresa una serenidad profunda frente al miedo: cuando Dios sostiene la vida, el temor pierde su poder.', 'Sal 27,1 · CIC 2589', true),
  ('44444444-4444-4444-8444-444444450204', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223002', 2, 'Completá la frase bíblica:
«Crea en mí, Dios mío, un ______ puro, y renueva la firmeza de mi espíritu.»', '["corazón","camino","templo","rostro"]'::jsonb, 0, 'El Salmo 51 (Miserere) es la oración por excelencia del arrepentimiento sincero y el deseo de volver a empezar con Dios.', 'Sal 51,12 · CIC 1431', true),
  ('44444444-4444-4444-8444-444444450205', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223002', 2, 'Completá la frase bíblica:
«Den gracias al Señor porque es bueno, porque es eterno su ______.»', '["reino","amor","nombre","poder"]'::jsonb, 1, 'Este estribillo del Salmo 136 (y 118) recuerda en toda la liturgia pascual que la misericordia de Dios nunca se agota.', 'Sal 118,1 · CIC 2637', true),
  ('44444444-4444-4444-8444-444444450301', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223003', 1, 'Completá la frase bíblica:
«Todo lo puedo en Aquel que me ______.»', '["defiende","escucha","fortalece","premia"]'::jsonb, 2, 'San Pablo escribe esta frase desde la cárcel a los Filipenses: nuestra verdadera fuerza en la prueba brota de la unión con Cristo.', 'Flp 4,13 · CIC 2074', true),
  ('44444444-4444-4444-8444-444444450302', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223003', 2, 'Completá la frase bíblica:
«Si Dios está con nosotros, ¿quién estará ______ nosotros?»', '["lejos de","detrás de","sobre","contra"]'::jsonb, 3, 'En Romanos 8, san Pablo proclama que ninguna angustia ni dificultad puede separarnos del amor de Dios en Cristo.', 'Rm 8,31 · CIC 1821', true),
  ('44444444-4444-4444-8444-444444450303', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223003', 2, 'Completá la frase bíblica:
«Para Dios nada es ______.»', '["imposible","invisible","pequeño","lejano"]'::jsonb, 0, 'Son las palabras del arcángel Gabriel a la Virgen María en la Anunciación, invitándola a confiar plenamente en la obra de Dios.', 'Lc 1,37 · CIC 273', true),
  ('44444444-4444-4444-8444-444444450304', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223003', 2, 'Completá la frase bíblica:
«La verdad los hará ______.»', '["fuertes","libres","sabios","ricos"]'::jsonb, 1, 'Jesús enseña que permanecer en su Palabra nos libera de las mentiras y esclavitudes interiores.', 'Jn 8,32 · CIC 1741', true),
  ('44444444-4444-4444-8444-444444450305', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223003', 2, 'Completá la frase bíblica:
«Porque donde está tu ______, allí estará también tu corazón.»', '["familia","casa","tesoro","camino"]'::jsonb, 2, 'Jesús invita a revisar a qué le damos más valor en la vida, porque aquello que atesoramos orienta todo nuestro corazón.', 'Mt 6,21 · CIC 2547', true),
  ('44444444-4444-4444-8444-444444450401', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223004', 1, 'Completá la frase bíblica:
«Ámense los unos a los otros como yo los he ______.»', '["enviado","llamado","elegido","amado"]'::jsonb, 3, 'Es el mandamiento nuevo de Jesús en la Última Cena: la medida del amor cristiano es la entrega misma de Cristo.', 'Jn 13,34 · CIC 1823', true),
  ('44444444-4444-4444-8444-444444450402', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223004', 1, 'Completá la frase bíblica:
«No hay amor más grande que dar la ______ por los amigos.»', '["vida","palabra","casa","túnica"]'::jsonb, 0, 'Jesús anuncia su entrega en la Cruz como el acto supremo de amistad y amor sin reservas.', 'Jn 15,13 · CIC 609', true),
  ('44444444-4444-4444-8444-444444450403', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223004', 1, 'Completá la frase bíblica:
«Dios es ______, y el que permanece en el amor permanece en Dios.»', '["fuego","amor","justicia","silencio"]'::jsonb, 1, 'San Juan resume el núcleo de la fe cristiana: el amor no es solo algo que Dios hace, sino lo que Dios es.', '1 Jn 4,16 · CIC 221', true),
  ('44444444-4444-4444-8444-444444450404', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223004', 1, 'Completá la frase bíblica:
«Yo estaré con ustedes todos los ______ hasta el fin del mundo.»', '["domingos","años","días","siglos"]'::jsonb, 2, 'Al enviar a los discípulos a evangelizar, Jesús Resucitado promete acompañarlos cada día de la historia.', 'Mt 28,20 · CIC 849', true),
  ('44444444-4444-4444-8444-444444450405', '11111111-1111-4111-8111-111111111110', '22222222-2222-4222-8222-222222223004', 1, 'Completá la frase bíblica:
«Lo que hicieron con uno de estos hermanos míos más pequeños, conmigo lo ______.»', '["olvidaron","esperaron","soñaron","hicieron"]'::jsonb, 3, 'En Mateo 25 Jesús se identifica con el hambriento, el enfermo y el necesitado: servir al hermano es servir a Cristo mismo.', 'Mt 25,40 · CIC 2443', true),
  ('44444444-4444-4444-8444-444444451101', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223101', 1, '¿Qué canción católica dice?
«Tú has venido a la orilla, no has buscado ni a sabios ni a ricos, tan solo quieres que yo te siga.»', '["Pescador de hombres","Alma misionera","Cristo te necesita para amar","Junto a ti, María"]'::jsonb, 0, '«Pescador de hombres» (Cesáreo Gabaráin) evoca la llamada de Jesús a los primeros discípulos junto al lago de Galilea.', 'Mc 1,17 · CIC 1156', true),
  ('44444444-4444-4444-8444-444444451102', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223101', 1, '¿Qué canción católica dice?
«Hoy, Señor, te damos gracias, por la vida, la tierra y el sol...»', '["Dios está aquí","Hoy, Señor, te damos gracias","Tan cerca de mí","Entre tus manos"]'::jsonb, 1, 'Este canto de acción de gracias de Cesáreo Gabaráin celebra los dones cotidianos de la creación y la vida.', 'Sal 118,1 · CIC 2637', true),
  ('44444444-4444-4444-8444-444444451103', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223101', 1, '¿Qué canción católica dice?
«Tan cerca de mí, que hasta lo puedo tocar, Jesús está aquí.»', '["Dios está aquí","Cerca de ti, Señor","Tan cerca de mí","Milagro de amor"]'::jsonb, 2, '«Tan cerca de mí» nos recuerda que Cristo camina junto a nosotros en la Eucaristía y en cada hermano con quien nos cruzamos.', 'Mt 28,20 · CIC 1373', true),
  ('44444444-4444-4444-8444-444444451104', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223101', 1, '¿Qué canción católica dice?
«Entre tus manos está mi vida, Señor; entre tus manos pongo mi existir.»', '["Nadie te ama como yo","Renuévame","Sáname, Señor","Entre tus manos"]'::jsonb, 3, 'Inspirada en las palabras de entrega confiada a Dios y en el grano de trigo que muere para dar fruto abundante.', 'Lc 23,46 · CIC 1157', true),
  ('44444444-4444-4444-8444-444444451105', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223101', 1, '¿Qué canción católica dice?
«Dios está aquí, tan cierto como el aire que respiro, tan cierto como la mañana se levanta...»', '["Dios está aquí","Tan cerca de mí","Ven, Espíritu Santo","Tu fidelidad es grande"]'::jsonb, 0, 'Uno de los cantos de alabanza más cantados en Hispanoamérica para reconocer la presencia cercana de Dios en la asamblea.', 'Mt 18,20 · CIC 1156', true),
  ('44444444-4444-4444-8444-444444451201', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223102', 1, '¿Qué canción católica dice?
«Mientras recorres la vida, tú nunca solo estás; contigo por el camino Santa María va.»', '["Junto a ti, María","Santa María del Camino","María mírame","Quién será la mujer"]'::jsonb, 1, '«Santa María del Camino» (Juan Antonio Espinosa) canta la compañía maternal de María junto al pueblo peregrino.', 'Jn 19,27 · CIC 969', true),
  ('44444444-4444-4444-8444-444444451202', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223102', 1, '¿Qué canción católica dice?
«Junto a ti, María, como un niño quiero estar; tómame en tus brazos, guíame en mi caminar.»', '["Santa María del Camino","María de Nazaret","Junto a ti, María","Diario de María"]'::jsonb, 2, 'Este canto de la congregación Kairoi expresa la confianza filial de ponerse bajo el cuidado de la Madre de Jesús.', 'Lc 1,48 · CIC 971', true),
  ('44444444-4444-4444-8444-444444451203', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223102', 1, '¿Qué canción católica dice?
«María mírame, si tú me miras Él también me mirará; Madre mía, mírame, de la mano llévame...»', '["Dulce Muchacha Humilde","Hoy he vuelto, Madre","Santa María del Amén","María mírame"]'::jsonb, 3, '«María mírame» (Betsaida) recuerda que el camino mariano siempre conduce más cerca del corazón de Jesús.', 'Jn 2,5 · CIC 2677', true),
  ('44444444-4444-4444-8444-444444451204', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223102', 1, '¿Qué canción católica dice?
«Te miro a los ojos y entre tanto llanto parece mentira que te hayan clavado...»', '["Diario de María","Junto a ti, María","Dolorosa","María mírame"]'::jsonb, 0, '«Diario de María» (Martín Valverde) contempla con ternura el dolor y la fidelidad de la Virgen al pie de la Cruz.', 'Jn 19,25 · CIC 964', true),
  ('44444444-4444-4444-8444-444444451205', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223102', 2, '¿Qué canción católica dice?
«Cuántas veces siendo niño te recé, con mis besos te decía que te amaba...»', '["Santa María del Camino","Hoy he vuelto, Madre","María de Nazaret","Madre de los pobres"]'::jsonb, 1, '«Hoy he vuelto, Madre» (Cesáreo Gabaráin) expresa la alegría de regresar a la fe de la infancia y al abrazo de María.', 'Lc 1,38 · CIC 968', true),
  ('44444444-4444-4444-8444-444444451301', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223103', 1, '¿Qué canción católica dice?
«Cuánto he esperado este momento, cuánto he esperado que estuvieras así...»', '["Sáname, Señor","Milagro de amor","Nadie te ama como yo","Renuévame"]'::jsonb, 2, '«Nadie te ama como yo» (Martín Valverde) pone en labios de Jesús la cercanía de su Cruz y su amor incondicional.', 'Jn 15,13 · CIC 609', true),
  ('44444444-4444-4444-8444-444444451302', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223103', 1, '¿Qué canción católica dice?
«Jesús, aquí presente en forma real, te pido un poco más de fe y de humildad...»', '["Pescador de hombres","Dios está aquí","Sumérgeme","Milagro de amor"]'::jsonb, 3, '«Milagro de amor» es uno de los cantos eucarísticos más queridos para el momento de la Comunión y la adoración al Santísimo.', 'Jn 6,51 · CIC 1374', true),
  ('44444444-4444-4444-8444-444444451303', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223103', 1, '¿Qué canción católica dice?
«Renuévame, Señor Jesús, ya no quiero ser igual; pon en mí tu corazón...»', '["Renuévame","Entre tus manos","Sáname, Señor","Cerca de ti, Señor"]'::jsonb, 0, '«Renuévame» recoge el deseo de conversión interior: pedirle a Cristo un corazón nuevo semejante al suyo.', 'Sal 51,12 · CIC 1431', true),
  ('44444444-4444-4444-8444-444444451304', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223103', 2, '¿Qué canción católica dice?
«Hoy, Señor Jesús, vengo ante ti para alabarte; hoy, Señor Jesús, con tu poder puedes cambiarme.»', '["Tu fidelidad es grande","Sáname, Señor","Nadie te ama como yo","Mi pensamiento eres Tú"]'::jsonb, 1, '«Sáname, Señor» (Rafael Moreno) es una oración de sanación interior y entrega confiada a la misericordia de Jesús.', 'Mt 11,28-30 · CIC 2559', true),
  ('44444444-4444-4444-8444-444444451305', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223103', 2, '¿Qué canción católica dice?
«Cansado del camino, sediento de ti, un desierto he cruzado, sin fuerzas he quedado, vengo a ti.»', '["Entre tus manos","Pescador de hombres","Sumérgeme","Vasijas de barro"]'::jsonb, 2, '«Sumérgeme» invita a descansar en la presencia del Espíritu cuando el cansancio y la aridez pesan en la vida.', 'Jn 7,37-38 · CIC 2652', true),
  ('44444444-4444-4444-8444-444444451401', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223104', 1, '¿Qué canción católica dice?
«Señor, toma mi vida nueva antes de que la espera desgaste años en mí...»', '["Pescador de hombres","Cristo te necesita para amar","Canción del misionero","Alma misionera"]'::jsonb, 3, '«Alma misionera» es un himno juvenil de disponibilidad generosa para llevar el Evangelio allí donde más falta hace.', 'Is 6,8 · CIC 849', true),
  ('44444444-4444-4444-8444-444444451402', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223104', 1, '¿Qué canción católica dice?
«Cristo te necesita para amar, para amar; no te importe la raza ni el color de la piel...»', '["Cristo te necesita para amar","Alma misionera","Juntos como hermanos","Id y enseñad"]'::jsonb, 0, 'Este canto de Cesáreo Gabaráin recuerda que el amor cristiano no hace distinciones y nos llama a ser manos de Cristo hoy.', 'Jn 13,34 · CIC 1823', true),
  ('44444444-4444-4444-8444-444444451403', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223104', 1, '¿Qué canción católica dice?
«Juntos como hermanos, miembros de una Iglesia, vamos caminando al encuentro del Señor.»', '["Vienen con alegría","Juntos como hermanos","Pescador de hombres","Iglesia peregrina"]'::jsonb, 1, 'Canto de entrada clásico que expresa la alegría de ser comunidad y caminar unidos hacia el altar.', 'Hch 2,42 · CIC 752', true),
  ('44444444-4444-4444-8444-444444451404', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223104', 2, '¿Qué canción católica dice?
«Sois la semilla que ha de crecer, sois estrella que ha de brillar; sois levadura, sois grano de sal...»', '["Alma misionera","Juntos como hermanos","Id y enseñad","Hoy, Señor, te damos gracias"]'::jsonb, 2, '«Id y enseñad» (Cesáreo Gabaráin) recoge las imágenes evangélicas de la semilla, la sal y la luz para el envío misionero.', 'Mt 5,13 · CIC 782', true),
  ('44444444-4444-4444-8444-444444451405', '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222223104', 2, '¿Qué canción católica dice?
«Vienen con alegría, Señor, cantando vienen con alegría, Señor, los que caminan por la vida...»', '["Juntos como hermanos","Dios está aquí","Cristo te necesita para amar","Vienen con alegría"]'::jsonb, 3, '«Vienen con alegría» (Cesáreo Gabaráin) celebra la esperanza de quienes siembran paz y amor en medio de la vida diaria.', 'Flp 4,4 · CIC 1156', true)
on conflict (id) do update set
  topic_id = excluded.topic_id,
  level_id = excluded.level_id,
  difficulty = excluded.difficulty,
  prompt = excluded.prompt,
  options = excluded.options,
  correct_index = excluded.correct_index,
  explanation = excluded.explanation,
  source_ref = excluded.source_ref,
  is_active = true;

insert into public.reference_texts (ref_key, source_type, title, book_or_section, body)
values
  ('Mc 10,14', 'biblia', 'Marcos 10, 14', 'Nuevo Testamento · Jesús bendice a los niños', '«Dejen que los niños se acerquen a mí y no se lo impidan, porque el Reino de Dios pertenece a los que son como ellos.»'),
  ('CIC 526', 'cic', 'Catecismo de la Iglesia Católica · N.° 526', 'Primera Parte · Hacerse pequeños para entrar en el Reino', '«Hacerse niño» con relación a Dios es la condición para entrar en el Reino; para eso es necesario abajarse, hacerse pequeño, nacer de nuevo de lo alto.'),
  ('Jn 14,6', 'biblia', 'Juan 14, 6', 'Nuevo Testamento · Evangelio según san Juan', '«Jesús le respondió: "Yo soy el Camino, la Verdad y la Vida. Nadie va al Padre, sino por mí."»'),
  ('CIC 459', 'cic', 'Catecismo de la Iglesia Católica · N.° 459', 'Primera Parte · Cristo, Camino, Verdad y Vida', 'El Verbo se encarnó para ser nuestro modelo de santidad: «Tomad sobre vosotros mi yugo, y aprended de mí...» «Yo soy el Camino, la Verdad y la Vida».'),
  ('Mt 5,13', 'biblia', 'Mateo 5, 13', 'Nuevo Testamento · Sermón de la Montaña', '«Ustedes son la sal de la tierra. Pero si la sal pierde su sabor, ¿con qué se la volverá a salar?»'),
  ('CIC 782', 'cic', 'Catecismo de la Iglesia Católica · N.° 782', 'Primera Parte · El Pueblo de Dios, sal y luz del mundo', 'El Pueblo de Dios tiene por ley el mandamiento nuevo de amar como el mismo Cristo nos amó; su misión es ser la sal de la tierra y la luz del mundo.'),
  ('Mt 4,4', 'biblia', 'Mateo 4, 4', 'Nuevo Testamento · Tentaciones en el desierto', '«Jesús le respondió: "Está escrito: El hombre no vive solamente de pan, sino de toda palabra que sale de la boca de Dios."»'),
  ('CIC 131', 'cic', 'Catecismo de la Iglesia Católica · N.° 131', 'Primera Parte · Fuerza y alimento de la Sagrada Escritura', 'Es tan grande el poder y la fuerza de la palabra de Dios, que constituye sustento y vigor de la Iglesia, firmeza de fe para sus hijos, alimento del alma, fuente límpida y perenne de vida espiritual.'),
  ('Mt 7,7', 'biblia', 'Mateo 7, 7', 'Nuevo Testamento · Confianza en la oración', '«Pidan y se les dará; busquen y encontrarán; llamen y se les abrirá.»'),
  ('CIC 2609', 'cic', 'Catecismo de la Iglesia Católica · N.° 2609', 'Cuarta Parte · La fe perseverante en la oración', 'El corazón que decide convertirse aprende a orar en la fe. La fe es una adhesión filial a Dios, más allá de lo que nosotros sentimos y comprendemos: «Todo cuanto pidáis en la oración, creed que ya lo habéis recibido».'),
  ('Sal 23,1', 'biblia', 'Salmo 23, 1', 'Antiguo Testamento · Salmo del Buen Pastor', '«El Señor es mi pastor, nada me puede faltar. Él me hace descansar en verdes praderas, me conduce a las aguas tranquilas.»'),
  ('CIC 754', 'cic', 'Catecismo de la Iglesia Católica · N.° 754', 'Primera Parte · La Iglesia, redil del Buen Pastor', 'La Iglesia es el redil cuya puerta única y necesaria es Cristo, y el rebaño cuyo Pastor será el mismo Dios, guiado y alimentado por Cristo, el Buen Pastor que da su vida por las ovejas.'),
  ('Sal 119,105', 'biblia', 'Salmo 119, 105', 'Antiguo Testamento · Salmos', '«Tu palabra es una lámpara para mis pasos y una luz en mi camino.»'),
  ('CIC 104', 'cic', 'Catecismo de la Iglesia Católica · N.° 104', 'Primera Parte · La Palabra viva de Dios', 'En la Sagrada Escritura, la Iglesia encuentra sin cesar su alimento y su fuerza, porque en ella no recibe solamente una palabra humana, sino lo que es realmente: la Palabra de Dios.'),
  ('Sal 27,1', 'biblia', 'Salmo 27, 1', 'Antiguo Testamento · Salmo de confianza', '«El Señor es mi luz y mi salvación, ¿a quién temeré? El Señor es el baluarte de mi vida, ¿ante quién temblaré?»'),
  ('CIC 2589', 'cic', 'Catecismo de la Iglesia Católica · N.° 2589', 'Cuarta Parte · La oración de los Salmos', 'Los rasgos constantes de los Salmos son la sencillez y la espontaneidad de la oración, el deseo de Dios mismo a través y con todo lo que hay de bueno en su creación, y la fe confiada en medio de las pruebas.'),
  ('Sal 51,12', 'biblia', 'Salmo 51, 12', 'Antiguo Testamento · Salmo Miserere', '«Crea en mí, Dios mío, un corazón puro, y renueva la firmeza de mi espíritu.»'),
  ('CIC 1431', 'cic', 'Catecismo de la Iglesia Católica · N.° 1431', 'Segunda Parte · La conversión del corazón', 'La penitencia interior es una reorientación radical de toda la vida, un retorno, una conversión a Dios con todo nuestro corazón, una ruptura con el pecado y una aversión del mal, junto con la confianza en la misericordia divina.'),
  ('Sal 118,1', 'biblia', 'Salmo 118, 1', 'Antiguo Testamento · Salmo de acción de gracias', '«¡Den gracias al Señor, porque es bueno, porque es eterno su amor!»'),
  ('CIC 2637', 'cic', 'Catecismo de la Iglesia Católica · N.° 2637', 'Cuarta Parte · La oración de acción de gracias', 'La acción de gracias caracteriza la oración de la Iglesia que, al celebrar la Eucaristía, manifiesta y se convierte cada vez más en lo que ella es: todo acontecimiento y toda necesidad pueden convertirse en ofrenda de acción de gracias.'),
  ('Flp 4,13', 'biblia', 'Filipenses 4, 13', 'Nuevo Testamento · Carta a los Filipenses', '«Todo lo puedo en Aquel que me conforta.»'),
  ('CIC 2074', 'cic', 'Catecismo de la Iglesia Católica · N.° 2074', 'Tercera Parte · Permanecer en Cristo', 'Jesús dice: «Yo soy la vid; ustedes los sarmientos. El que permanece en mí y yo en él, ése da mucho fruto; porque separados de mí no pueden hacer nada». La vida moral cristiana nace de la unión con Cristo.'),
  ('Rm 8,31', 'biblia', 'Romanos 8, 31', 'Nuevo Testamento · Himno al amor de Dios', '«¿Qué más podremos decir? Si Dios está con nosotros, ¿quién estará contra nosotros?»'),
  ('CIC 1821', 'cic', 'Catecismo de la Iglesia Católica · N.° 1821', 'Tercera Parte · Confianza en el amor de Dios', 'Podemos esperar la gloria del cielo prometida por Dios a los que le aman y hacen su voluntad. En toda circunstancia, cada uno debe esperar, con la gracia de Dios, perseverar hasta el fin.'),
  ('Lc 1,37', 'biblia', 'Lucas 1, 37', 'Nuevo Testamento · Anunciación', '«Porque nada hay imposible para Dios.»'),
  ('CIC 273', 'cic', 'Catecismo de la Iglesia Católica · N.° 273', 'Primera Parte · La omnipotencia de Dios', 'Solo la fe puede adherirse a las vías misteriosas de la omnipotencia de Dios. Esta fe se gloría de sus debilidades con el fin de atraer sobre sí el poder de Cristo. De esta fe, la Virgen María es el modelo supremo: ella creyó que «nada es imposible para Dios».'),
  ('Jn 8,32', 'biblia', 'Juan 8, 32', 'Nuevo Testamento · Evangelio según san Juan', '«Conocerán la verdad, y la verdad los hará libres.»'),
  ('CIC 1741', 'cic', 'Catecismo de la Iglesia Católica · N.° 1741', 'Tercera Parte · Liberación y salvación en Cristo', 'Por su Cruz gloriosa, Cristo obtuvo la salvación para todos los hombres. Los rescató del pecado que los tenía sometidos a esclavitud: «Para ser libres nos libertó Cristo». En Él participamos de la «verdad que nos hace libres».'),
  ('Mt 6,21', 'biblia', 'Mateo 6, 21', 'Nuevo Testamento · Sermón de la Montaña', '«Porque allí donde esté tu tesoro, estará también tu corazón.»'),
  ('CIC 2547', 'cic', 'Catecismo de la Iglesia Católica · N.° 2547', 'Tercera Parte · Desprendimiento del corazón', 'El Señor se lamenta de los ricos porque encuentran su consuelo en la abundancia de bienes. El abandono en la providencia del Padre del cielo libera de la inquietud por el mañana y orienta el corazón al tesoro verdadero.'),
  ('Jn 13,34', 'biblia', 'Juan 13, 34', 'Nuevo Testamento · Mandamiento nuevo', '«Les doy un mandamiento nuevo: ámense los unos a los otros. Así como yo los he amado, ámense también ustedes los unos a los otros.»'),
  ('CIC 1823', 'cic', 'Catecismo de la Iglesia Católica · N.° 1823', 'Tercera Parte · El mandamiento nuevo de la caridad', 'Jesús hace de la caridad el mandamiento nuevo. Amando a los suyos hasta el fin manifiesta el amor del Padre que ha recibido, y al amarse unos a otros los discípulos imitan el amor de Jesús.'),
  ('Jn 15,13', 'biblia', 'Juan 15, 13', 'Nuevo Testamento · El amor más grande', '«No hay amor más grande que dar la vida por los amigos.»'),
  ('CIC 609', 'cic', 'Catecismo de la Iglesia Católica · N.° 609', 'Primera Parte · Ofrenda libre de Jesús', 'Al abrazar en su corazón humano el amor del Padre hacia los hombres, Jesús los amó hasta el extremo, ofreciendo libremente su vida por la salvación de todos.'),
  ('1 Jn 4,16', 'biblia', '1 Juan 4, 16', 'Nuevo Testamento · Primera Carta de san Juan', '«Dios es amor, y el que permanece en el amor permanece en Dios, y Dios permanece en él.»'),
  ('CIC 221', 'cic', 'Catecismo de la Iglesia Católica · N.° 221', 'Primera Parte · Dios es Amor', 'San Juan va aún más lejos al afirmar: «Dios es Amor» (1 Jn 4,8.16): el ser mismo de Dios es Amor. Al enviar en la plenitud de los tiempos a su Hijo único y al Espíritu de Amor, Dios revela su secreto más íntimo.'),
  ('Mt 28,20', 'biblia', 'Mateo 28, 20', 'Nuevo Testamento · Presencia permanente de Cristo', '«Y sepan que yo estoy con ustedes todos los días hasta el fin del mundo.»'),
  ('CIC 849', 'cic', 'Catecismo de la Iglesia Católica · N.° 849', 'Primera Parte · Mandato misionero', 'La Iglesia, enviada por Dios a las gentes para ser sacramento universal de salvación, se esfuerza en anunciar el Evangelio a todos los hombres obedeciendo el mandato de su Fundador.'),
  ('Mt 25,40', 'biblia', 'Mateo 25, 40', 'Nuevo Testamento · El servicio a los pequeños', '«Les aseguro que cada vez que lo hicieron con el más pequeño de mis hermanos, lo hicieron conmigo.»'),
  ('CIC 2443', 'cic', 'Catecismo de la Iglesia Católica · N.° 2443', 'Tercera Parte · Amor preferencial por los pobres', 'Dios bendice a los que ayudan a los pobres y reprueba a los que se niegan a hacerlo. Jesús reconocerá a sus elegidos en lo que hayan hecho por los pobres.'),
  ('Mc 1,17', 'biblia', 'Marcos 1, 17', 'Nuevo Testamento · Vocación de los primeros discípulos', '«Jesús les dijo: "Síganme, y yo los haré pescadores de hombres."»'),
  ('CIC 1156', 'cic', 'Catecismo de la Iglesia Católica · N.° 1156', 'Segunda Parte · Canto y música sagrada en la Iglesia', 'La tradición musical de la Iglesia universal constituye un tesoro de valor inestimable porque el canto sagrado, unido a las palabras, constituye una parte necesaria o integral de la liturgia solemne. «El que canta bien ora dos veces» (san Agustín).'),
  ('CIC 1373', 'cic', 'Catecismo de la Iglesia Católica · N.° 1373', 'Segunda Parte · Presencia de Cristo en la Iglesia', 'Cristo Jesús está presente de múltiples maneras en su Iglesia: en su Palabra, en la oración de su Iglesia, «allí donde dos o tres estén reunidos en mi nombre», en los pobres, los enfermos, los presos, y sobre todo bajo las especies eucarísticas.'),
  ('Lc 23,46', 'biblia', 'Lucas 23, 46', 'Nuevo Testamento · Entrega de Jesús en la Cruz', '«Jesús, con un gran grito, dijo: "Padre, en tus manos encomiendo mi espíritu." Y diciendo esto, expiró.»'),
  ('CIC 1157', 'cic', 'Catecismo de la Iglesia Católica · N.° 1157', 'Segunda Parte · El canto como expresión de oración', 'El canto y la música cumplen su función de signos de una manera tanto más significativa cuanto más estrechamente estén vinculados a la acción litúrgica: expresan la oración con belleza, favorecen la unanimidad y dan solemnidad al rito.'),
  ('Mt 18,20', 'biblia', 'Mateo 18, 20', 'Nuevo Testamento · Oración comunitaria', '«Porque donde hay dos o tres reunidos en mi Nombre, yo estoy presente en medio de ellos.»'),
  ('Jn 19,27', 'biblia', 'Juan 19, 27', 'Nuevo Testamento · María al pie de la Cruz', '«Después dijo al discípulo: "Aquí tienes a tu madre." Y desde aquel momento, el discípulo la recibió en su casa.»'),
  ('CIC 969', 'cic', 'Catecismo de la Iglesia Católica · N.° 969', 'Primera Parte · Maternidad espiritual de María', 'Esta maternidad de María perdura sin cesar en la economía de la gracia, desde el consentimiento que prestó fielmente en la Anunciación y mantuvo sin vacilar al pie de la cruz, hasta la consumación perpetua de todos los elegidos.'),
  ('Lc 1,48', 'biblia', 'Lucas 1, 48', 'Nuevo Testamento · Todas las generaciones', '«En adelante todas las generaciones me llamarán feliz, porque el Todopoderoso ha hecho en mí grandes cosas.»'),
  ('CIC 971', 'cic', 'Catecismo de la Iglesia Católica · N.° 971', 'Primera Parte · El culto a la Santísima Virgen', '«Me llamarán bienaventurada todas las generaciones». La piedad de la Iglesia hacia la Santísima Virgen es un elemento intrínseco del culto cristiano; es un culto especial de veneración, esencialmente distinto del culto de adoración debido solo a Dios.'),
  ('Jn 2,5', 'biblia', 'Juan 2, 5', 'Nuevo Testamento · Las bodas de Caná', '«Su madre dijo a los sirvientes: "Hagan todo lo que él les diga."»'),
  ('CIC 2677', 'cic', 'Catecismo de la Iglesia Católica · N.° 2677', 'Cuarta Parte · Ruega por nosotros', 'Al pedirle a María «ruega por nosotros pecadores, ahora y en la hora de nuestra muerte», nos abandonamos desde ahora a la voluntad de Dios y nos confiamos a su intercesión maternal.'),
  ('Jn 19,25', 'biblia', 'Juan 19, 25', 'Nuevo Testamento · Fidelidad de María en el Calvario', '«Junto a la cruz de Jesús, estaba su madre y la hermana de su madre, María, mujer de Cleofás, y María Magdalena.»'),
  ('CIC 964', 'cic', 'Catecismo de la Iglesia Católica · N.° 964', 'Primera Parte · María unida a Cristo en la Cruz', 'La unión de la Madre con el Hijo en la obra de la salvación se manifiesta desde la concepción virginal hasta la muerte de Cristo; al pie de la cruz, Jesús la entregó como Madre al discípulo amado.'),
  ('Lc 1,38', 'biblia', 'Lucas 1, 38', 'Nuevo Testamento · El sí de María', '«María dijo entonces: "Yo soy la servidora del Señor, que se cumpla en mí lo que has dicho."»'),
  ('CIC 968', 'cic', 'Catecismo de la Iglesia Católica · N.° 968', 'Primera Parte · Cooperación maternal de María', 'Con su obediencia, fe, esperanza y ardiente caridad, María cooperó de manera totalmente singular en la obra del Salvador para restaurar la vida sobrenatural de las almas. Por tal motivo es nuestra Madre en el orden de la gracia.'),
  ('Jn 6,51', 'biblia', 'Juan 6, 51 (Discurso del Pan de Vida)', 'Nuevo Testamento · Promesa de la Eucaristía', '«Yo soy el pan vivo bajado del cielo. El que coma de este pan vivirá eternamente, y el pan que yo daré es mi carne para la vida del mundo.»'),
  ('CIC 1374', 'cic', 'Catecismo de la Iglesia Católica · N.° 1374', 'Segunda Parte · Presencia real de Cristo en la Eucaristía', 'El modo de presencia de Cristo bajo las especies eucarísticas es singular: en el santísimo sacramento de la Eucaristía están contenidos verdadera, real y sustancialmente el Cuerpo y la Sangre junto con el alma y la divinidad de nuestro Señor Jesucristo.'),
  ('Mt 11,28-30', 'biblia', 'Mateo 11, 28-30', 'Nuevo Testamento · Evangelio según san Mateo', '«Vengan a mí todos los que están afligidos y agobiados, y yo los aliviaré. Carguen sobre ustedes mi yugo y aprendan de mí, porque soy paciente y humilde de corazón, y así encontrarán alivio. Porque mi yugo es suave y mi carga liviana.»'),
  ('CIC 2559', 'cic', 'Catecismo de la Iglesia Católica · N.° 2559', 'Cuarta Parte · La oración como don y encuentro', '«La oración es la elevación del alma a Dios o la petición a Dios de bienes convenientes» (san Juan Damasceno). La humildad es la disposición necesaria para recibir gratuitamente el don de la oración.'),
  ('Jn 7,37-38', 'biblia', 'Juan 7, 37-38', 'Nuevo Testamento · Promesa del agua viva', '«Si alguno tiene sed, venga a mí, y beba el que cree en mí. Como dice la Escritura: "De su seno brotarán manantiales de agua viva."»'),
  ('CIC 2652', 'cic', 'Catecismo de la Iglesia Católica · N.° 2652', 'Cuarta Parte · El Espíritu Santo, agua viva de la oración', 'El Espíritu Santo es el «agua viva» que, en el corazón orante, «brota hasta la vida eterna». Él es quien nos enseña a recogerla en la misma Fuente: Cristo.'),
  ('Is 6,8', 'biblia', 'Isaías 6, 8', 'Antiguo Testamento · Vocación del profeta Isaías', '«Oí la voz del Señor que decía: "¿A quién enviaré y quién irá por nosotros?" Yo respondí: "¡Aquí estoy: envíame!"»'),
  ('Hch 2,42', 'biblia', 'Hechos 2, 42', 'Nuevo Testamento · La primera comunidad cristiana', '«Todos se reunían asiduamente para escuchar la enseñanza de los Apóstoles y participar en la vida común, en la fracción del pan y en las oraciones.»'),
  ('CIC 752', 'cic', 'Catecismo de la Iglesia Católica · N.° 752', 'Primera Parte · La Iglesia como comunidad convocada', 'En el uso cristiano, la palabra «Iglesia» designa la asamblea litúrgica, pero también la comunidad local o toda la comunidad universal de los creyentes.'),
  ('Flp 4,4', 'biblia', 'Filipenses 4, 4', 'Nuevo Testamento · Alegría cristiana', '«Alégrense siempre en el Señor. Vuelvo a insistir, ¡alégrense!»')
on conflict (ref_key) do update set
  source_type = excluded.source_type,
  title = excluded.title,
  book_or_section = excluded.book_or_section,
  body = excluded.body;
