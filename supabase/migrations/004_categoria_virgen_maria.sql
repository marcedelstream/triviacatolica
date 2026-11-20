-- Trivia Católica — 6.ª categoría: Virgen María (deja la grilla de Inicio en 3 filas x 2)
-- Idempotente: se puede correr más de una vez sin duplicar datos.

insert into public.topics (id, slug, title, description, icon, color_token, sort_order, is_premium)
values
  ('11111111-1111-4111-8111-111111111106', 'virgen-maria', 'Virgen María', 'La vida de la Madre de Dios, sus dogmas y advocaciones.', 'flower', 'cat-vm', 6, false)
on conflict (slug) do nothing;

insert into public.levels (id, slug, topic_id, level_number, global_order, title, subtitle, difficulty, questions_per_round, is_premium)
values
  ('22222222-2222-4222-8222-222222222601', 'virgen-maria-vida-de-maria', '11111111-1111-4111-8111-111111111106', 1, 16, 'La vida de María', 'Anunciación, Visitación y Caná', 1, 5, false),
  ('22222222-2222-4222-8222-222222222602', 'virgen-maria-dogmas-marianos', '11111111-1111-4111-8111-111111111106', 2, 17, 'Dogmas marianos', 'Inmaculada Concepción y Asunción', 2, 5, false),
  ('22222222-2222-4222-8222-222222222603', 'virgen-maria-madre-de-dios', '11111111-1111-4111-8111-111111111106', 3, 18, 'Madre de Dios', 'Éfeso, la Theotokos y la Madre de la Iglesia', 3, 5, true)
on conflict (global_order) do nothing;

insert into public.questions (topic_id, difficulty, prompt, options, correct_index, explanation, source_ref)
select v.topic_id::uuid, v.difficulty, v.prompt, v.options::jsonb, v.correct_index, v.explanation, v.source_ref
from (values
  ('11111111-1111-4111-8111-111111111106', 1,
   '¿Qué ángel le anunció a María que sería la Madre del Salvador?',
   '["Miguel", "Rafael", "Gabriel", "Uriel"]', 2,
   'El ángel Gabriel fue enviado a Nazaret, y María respondió con fe: "Hágase en mí según tu palabra".',
   'Lc 1,26-38 · CIC 494'),
  ('11111111-1111-4111-8111-111111111106', 1,
   '¿A qué pariente visitó María después de la Anunciación?',
   '["A Ana, su madre", "A su prima Isabel", "A Marta de Betania", "A María Magdalena"]', 1,
   'En la Visitación, Isabel la saludó: "¡Bendita tú entre las mujeres y bendito el fruto de tu vientre!", palabras que rezamos en el Avemaría.',
   'Lc 1,39-45 · CIC 2676'),
  ('11111111-1111-4111-8111-111111111106', 1,
   '¿En qué celebración Jesús hizo su primer milagro a pedido de María?',
   '["En la Pascua en Jerusalén", "En la presentación en el Templo", "En las bodas de Caná", "En la multiplicación de los panes"]', 2,
   'En Caná, María dijo a los sirvientes "Hagan todo lo que él les diga", y Jesús convirtió el agua en vino.',
   'Jn 2,1-11 · CIC 2618'),
  ('11111111-1111-4111-8111-111111111106', 2,
   '¿Qué afirma el dogma de la Inmaculada Concepción?',
   '["Que Jesús fue concebido sin intervención de varón", "Que María fue preservada del pecado original desde su concepción", "Que María fue llevada al cielo en cuerpo y alma", "Que María permaneció virgen toda su vida"]', 1,
   'Pío IX lo proclamó en 1854: por singular gracia de Dios y en previsión de los méritos de Cristo, María fue preservada de toda mancha de pecado original.',
   'CIC 491'),
  ('11111111-1111-4111-8111-111111111106', 2,
   '¿Qué dogma mariano proclamó el papa Pío XII en 1950?',
   '["La Asunción", "La Inmaculada Concepción", "La Maternidad divina", "La Virginidad perpetua"]', 0,
   'La Virgen, terminado el curso de su vida terrena, fue asunta en cuerpo y alma a la gloria del cielo.',
   'CIC 966'),
  ('11111111-1111-4111-8111-111111111106', 3,
   '¿Qué concilio proclamó a María "Theotokos", Madre de Dios, en el año 431?',
   '["Concilio de Nicea", "Concilio de Éfeso", "Concilio de Trento", "Concilio Vaticano II"]', 1,
   'Éfeso confirmó que María es verdaderamente Madre de Dios porque el Hijo que concibió es el Hijo eterno del Padre hecho hombre.',
   'CIC 495')
) as v(topic_id, difficulty, prompt, options, correct_index, explanation, source_ref)
where not exists (
  select 1 from public.questions q where q.topic_id = v.topic_id::uuid and q.prompt = v.prompt
);
