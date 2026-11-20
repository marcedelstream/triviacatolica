import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface ReferenceTextEntry {
  refKey: string;
  sourceType: 'biblia' | 'cic' | 'igmr' | 'otro';
  title: string;
  bookOrSection: string;
  body: string;
}

/**
 * Banco local de pasajes completos de la Biblia Católica y numerales del
 * Catecismo de la Iglesia Católica (CIC). Cuando `public.reference_texts`
 * en Supabase tenga cargada la Biblia y el CIC completos, se consulta en vivo
 * primero y se usa este banco como respaldo instantáneo.
 */
const LOCAL_REFERENCES: Record<string, ReferenceTextEntry> = {
  'gn 6,14': {
    refKey: 'Gn 6,14',
    sourceType: 'biblia',
    title: 'Génesis 6, 14',
    bookOrSection: 'Antiguo Testamento · Pentateuco',
    body: '«Hazte un arca de madera resinosa; la dividirás en compartimentos y la calafatearás por dentro y por fuera con brea.»',
  },
  'cic 1219': {
    refKey: 'CIC 1219',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1219',
    bookOrSection: 'Segunda Parte · El sacramento del Bautismo',
    body: 'La Iglesia ha visto en el arca de Noé una prefiguración de la salvación por el Bautismo. En efecto, por medio de ella «unos pocos, es decir, ocho personas, fueron salvados a través del agua» (1 P 3,20).',
  },
  'éx 19,20; 20,1-17': {
    refKey: 'Éx 19,20; 20,1-17',
    sourceType: 'biblia',
    title: 'Éxodo 19,20 y 20,1-3',
    bookOrSection: 'Antiguo Testamento · Pentateuco',
    body: '«El Señor descendió sobre la cumbre del monte Sinaí y llamó a Moisés hacia la cima. Moisés subió... Entonces pronunció Dios todas estas palabras diciendo: "Yo soy el Señor, tu Dios, que te saqué de la tierra de Egipto, de la casa de servidumbre. No tendrás otros dioses delante de mí."»',
  },
  'cic 2056': {
    refKey: 'CIC 2056',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 2056',
    bookOrSection: 'Tercera Parte · Los Diez Mandamientos',
    body: 'La palabra «Decálogo» significa literalmente «diez palabras» (Éx 34,28). Estas «diez palabras» Dios las reveló a su pueblo en la santa montaña. Las escribió «con su dedo» (Éx 31,18), a diferencia de los otros preceptos escritos por Moisés. Constituyen palabras de Dios en un sentido eminente.',
  },
  'gn 12,1-4': {
    refKey: 'Gn 12,1-4',
    sourceType: 'biblia',
    title: 'Génesis 12, 1-4',
    bookOrSection: 'Antiguo Testamento · Vocación de Abraham',
    body: '«El Señor dijo a Abram: "Deja tu tierra natal y la casa de tu padre, y ve al país que yo te mostraré. Yo haré de ti una gran nación y te bendeciré; engrandeceré tu nombre y serás una bendición." Abram partió, como el Señor se lo había ordenado.»',
  },
  'cic 145': {
    refKey: 'CIC 145',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 145',
    bookOrSection: 'Primera Parte · La obediencia de la fe',
    body: 'La carta a los Hebreos, en el gran elogio de la fe de los antepasados, insiste particularmente en la fe de Abraham: «Por la fe, Abraham obedeció y salió para el lugar que había de recibir en herencia, y salió sin saber a dónde iba» (Hb 11,8). Por la fe, vivió como extranjero y peregrino en la tierra prometida.',
  },
  'cic 2579': {
    refKey: 'CIC 2579',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 2579',
    bookOrSection: 'Cuarta Parte · La oración en el Antiguo Testamento',
    body: 'David es por excelencia el rey «según el corazón de Dios», el pastor que ora por su pueblo y en su nombre, aquel cuya sumisión a la voluntad de Dios, cuya alabanza y arrepentimiento serán modelo de la oración del pueblo. Su oración, inspirada por el Espíritu Santo, es el primer modelo de la oración de los Salmos.',
  },
  'is 7,14': {
    refKey: 'Is 7,14',
    sourceType: 'biblia',
    title: 'Isaías 7, 14',
    bookOrSection: 'Antiguo Testamento · Libros Proféticos',
    body: '«Por eso, el Señor mismo les dará una señal: Miren, la joven concebirá y dará a luz un hijo, y lo llamará con el nombre de Emmanuel.»',
  },
  'mt 1,22-23': {
    refKey: 'Mt 1,22-23',
    sourceType: 'biblia',
    title: 'Mateo 1, 22-23',
    bookOrSection: 'Nuevo Testamento · Evangelio según san Mateo',
    body: '«Todo esto sucedió para que se cumpliera lo que el Señor había anunciado por el profeta: "La Virgen concebirá y dará a luz un hijo, a quien pondrán el nombre de Emmanuel", que traducido significa: "Dios con nosotros".»',
  },
  '2 mac 12,43-46': {
    refKey: '2 Mac 12,43-46',
    sourceType: 'biblia',
    title: 'Segundo libro de los Macabeos 12, 43-46',
    bookOrSection: 'Antiguo Testamento · Libros Deuterocanónicos',
    body: '«Después de haber reunido entre sus hombres cerca de dos mil dracmas, las mandó a Jerusalén para ofrecer un sacrificio por el pecado, obrando muy hermosa y noblemente, pensando en la resurrección... Por eso mandó hacer este sacrificio expiatorio en favor de los muertos, para que quedaran liberados del pecado.»',
  },
  'cic 1032': {
    refKey: 'CIC 1032',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1032',
    bookOrSection: 'Primera Parte · La purificación final o Purgatorio',
    body: 'Esta enseñanza se apoya también en la práctica de la oración por los difuntos, de la que ya habla la Escritura (2 M 12,46). Desde los primeros tiempos, la Iglesia ha honrado la memoria de los difuntos y ha ofrecido sufragios en su favor, en particular el sacrificio eucarístico, para que, una vez purificados, puedan llegar a la visión beatífica de Dios.',
  },
  'jn 2,1-11': {
    refKey: 'Jn 2,1-11',
    sourceType: 'biblia',
    title: 'Juan 2, 1-11',
    bookOrSection: 'Nuevo Testamento · Las bodas de Caná',
    body: '«Al tercer día se celebraron unas bodas en Caná de Galilea, y la madre de Jesús estaba allí... Su madre dijo a los sirvientes: "Hagan todo lo que él les diga."... Así, en Caná de Galilea, dio Jesús comienzo a sus signos. Y manifestó su gloria, y creyeron en él sus discípulos.»',
  },
  'cic 2618': {
    refKey: 'CIC 2618',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 2618',
    bookOrSection: 'Cuarta Parte · La oración de la Virgen María',
    body: 'El Evangelio nos revela cómo María ora e intercede en la fe: en Caná, la madre de Jesús ruega a su hijo por las necesidades de un banquete de bodas, signo de otro banquete, el de las bodas del Cordero que da su Cuerpo y su Sangre a petición de la Iglesia, su Esposa.',
  },
  'mt 16,18-19': {
    refKey: 'Mt 16,18-19',
    sourceType: 'biblia',
    title: 'Mateo 16, 18-19',
    bookOrSection: 'Nuevo Testamento · Confesión de Pedro',
    body: '«Y yo te digo: Tú eres Pedro, y sobre esta piedra edificaré mi Iglesia, y el poder de la Muerte no prevalecerá contra ella. Yo te daré las llaves del Reino de los Cielos.»',
  },
  'cic 552': {
    refKey: 'CIC 552',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 552',
    bookOrSection: 'Primera Parte · Las llaves del Reino',
    body: 'En el colegio de los Doce, Simón Pedro ocupa el primer lugar. Jesús le confió una misión única. Gracias a una revelación venida del Padre, Pedro había confesado: «Tú eres el Cristo, el Hijo de Dios vivo». Entonces nuestro Señor le declaró: «Tú eres Pedro, y sobre esta piedra edificaré mi Iglesia».',
  },
  'jn 6,9-13': {
    refKey: 'Jn 6,9-13',
    sourceType: 'biblia',
    title: 'Juan 6, 9-13',
    bookOrSection: 'Nuevo Testamento · Multiplicación de los panes',
    body: '«"Aquí hay un muchacho que tiene cinco panes de cebada y dos pescados, pero ¿qué es esto para tanta gente?"... Jesús tomó los panes, dio gracias y los distribuyó a los que estaban sentados. Lo mismo hizo con los pescados, dándoles todo lo que quisieron.»',
  },
  'cic 1335': {
    refKey: 'CIC 1335',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1335',
    bookOrSection: 'Segunda Parte · La Eucaristía',
    body: 'Los milagros de la multiplicación de los panes, cuando el Señor dijo la bendición, partió y distribuyó los panes por medio de sus discípulos para alimentar la multitud, prefiguran la sobreabundancia de este único pan de su Eucaristía.',
  },
  'lc 15,11-32': {
    refKey: 'Lc 15,11-32',
    sourceType: 'biblia',
    title: 'Lucas 15, 20-24',
    bookOrSection: 'Nuevo Testamento · Parábola del Padre Misericordioso',
    body: '«Cuando todavía estaba lejos, su padre lo vio y se conmovió profundamente; corrió a su encuentro, lo abrazó y lo besó... "Porque este hijo mío estaba muerto y ha vuelto a la vida; estaba perdido y fue encontrado."»',
  },
  'cic 1439': {
    refKey: 'CIC 1439',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1439',
    bookOrSection: 'Segunda Parte · La penitencia interior',
    body: 'El proceso de la conversión y de la penitencia fue descrito maravillosamente por Jesús en la parábola llamada «del hijo pródigo», cuyo centro es «el padre misericordioso» (Lc 15,11-24). Solo el corazón de Cristo que conoce las profundidades del amor de su Padre pudo revelarnos el abismo de su misericordia.',
  },
  'hch 2,1-4': {
    refKey: 'Hch 2,1-4',
    sourceType: 'biblia',
    title: 'Hechos de los Apóstoles 2, 1-4',
    bookOrSection: 'Nuevo Testamento · Pentecostés',
    body: '«Al llegar el día de Pentecostés, estaban todos reunidos en el mismo lugar. De pronto, vino del cielo un ruido, semejante a una fuerte ráfaga de viento... Vieron aparecer unas lenguas como de fuego, que descendieron por separado sobre cada uno de ellos. Todos quedaron llenos del Espíritu Santo.»',
  },
  'cic 731': {
    refKey: 'CIC 731',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 731',
    bookOrSection: 'Primera Parte · Pentecostés',
    body: 'El día de Pentecostés (al término de las siete semanas pascuales), la Pascua de Cristo se consuma con la efusión del Espíritu Santo que se manifiesta, da y comunica como Persona divina: desde su plenitud, Cristo, el Señor, derrama profusamente el Espíritu.',
  },
  '1 cor 13,4-13': {
    refKey: '1 Cor 13,4-13',
    sourceType: 'biblia',
    title: 'Primera carta a los Corintios 13, 4-8.13',
    bookOrSection: 'Nuevo Testamento · Himno a la caridad',
    body: '«El amor es paciente, es servicial; el amor no es envidioso, no hace alarde, no se envanece... El amor no pasará jamás... En una palabra, ahora existen tres cosas: la fe, la esperanza y el amor, pero la más grande todas es el amor.»',
  },
  'cic 1826': {
    refKey: 'CIC 1826',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1826',
    bookOrSection: 'Tercera Parte · La caridad',
    body: 'Si no tengo caridad —dice también el Apóstol— «nada soy». Y todo lo que es privilegio, servicio, virtud misma... si no tengo caridad, «nada me aprovecha». La caridad es superior a todas las virtudes. Es la primera de las virtudes teologales.',
  },
  'cic 344': {
    refKey: 'CIC 344',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 344',
    bookOrSection: 'Primera Parte · La Creación',
    body: 'Existe una solidaridad entre todas las criaturas por el hecho de que todas tienen el mismo Creador, y que todas están ordenadas a su gloria. San Francisco de Asís lo cantó de modo admirable en su Cántico de las Criaturas.',
  },
  'cic 2011': {
    refKey: 'CIC 2011',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 2011',
    bookOrSection: 'Tercera Parte · La gracia y el mérito',
    body: 'La caridad de Cristo es en nosotros la fuente de todos nuestros méritos ante Dios. La gracia, uniéndonos a Cristo con un amor activo, asegura el carácter sobrenatural de nuestros actos y, por consiguiente, su mérito tanto ante Dios como ante los hombres.',
  },
  'mt 1,19-24': {
    refKey: 'Mt 1,19-24',
    sourceType: 'biblia',
    title: 'Mateo 1, 19-24',
    bookOrSection: 'Nuevo Testamento · San José',
    body: '«José, su esposo, que era un hombre justo... Al despertar, José hizo lo que el Ángel del Señor le había ordenado, y llevó a María a su casa.»',
  },
  'cic 437': {
    refKey: 'CIC 437',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 437',
    bookOrSection: 'Primera Parte · El nacimiento de Jesús',
    body: 'El ángel anunció a los pastores el nacimiento de Jesús como el del Mesías prometido a Israel. Desde el comienzo, Él es «aquel a quien el Padre ha santificado y enviado al mundo», concebido como «santo» en el seno virginal de María. José fue llamado por Dios para «tomar consigo a María su esposa».',
  },
  'cic 30': {
    refKey: 'CIC 30',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 30',
    bookOrSection: 'Primera Parte · El deseo de Dios',
    body: '«Alégrese el corazón de los que buscan a Dios» (Sal 105,3). Como decía san Agustín en sus Confesiones: «Tú mismo le excitas a ello, haciendo que se deleite en alabarte, porque nos has hecho para ti y nuestro corazón está inquieto mientras no descanse en ti».',
  },
  'cic 1381': {
    refKey: 'CIC 1381',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1381',
    bookOrSection: 'Segunda Parte · La presencia real de Cristo',
    body: 'La presencia del verdadero Cuerpo de Cristo y de la verdadera Sangre de Cristo en este sacramento «no se conoce por los sentidos, dice santo Tomás, sino solo por la fe, la cual se apoya en la autoridad de Dios».',
  },
  'cic 1210': {
    refKey: 'CIC 1210',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1210',
    bookOrSection: 'Segunda Parte · Los siete sacramentos',
    body: 'Los sacramentos de la Nueva Ley fueron instituidos por Cristo y son siete, a saber: Bautismo, Confirmación, Eucaristía, Penitencia, Unción de los enfermos, Orden sacerdotal y Matrimonio. Los siete sacramentos corresponden a todas las etapas y todos los momentos importantes de la vida del cristiano.',
  },
  'cic 1213': {
    refKey: 'CIC 1213',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1213',
    bookOrSection: 'Segunda Parte · El Bautismo',
    body: 'El santo Bautismo es el fundamento de toda la vida cristiana, el pórtico de la vida en el espíritu y la puerta que abre el acceso a los otros sacramentos. Por el Bautismo somos liberados del pecado y regenerados como hijos de Dios, llegamos a ser miembros de Cristo y somos incorporados a la Iglesia.',
  },
  'cic 1324': {
    refKey: 'CIC 1324',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1324',
    bookOrSection: 'Segunda Parte · La Eucaristía',
    body: 'La Eucaristía es «fuente y culmen de toda la vida cristiana» (LG 11). Los demás sacramentos, como también todos los ministerios eclesiales y las obras de apostolado, están unidos a la Eucaristía y a ella se ordenan.',
  },
  'cic 1421': {
    refKey: 'CIC 1421',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1421',
    bookOrSection: 'Segunda Parte · Los sacramentos de curación',
    body: 'El Señor Jesucristo, médico de nuestras almas y de nuestros cuerpos, el que perdonó los pecados al paralítico y le devolvió la salud del cuerpo, quiso que su Iglesia continuase, con la fuerza del Espíritu Santo, su obra de curación y de salvación mediante los sacramentos de la Penitencia y de la Unción de los enfermos.',
  },
  'cic 1300': {
    refKey: 'CIC 1300',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1300',
    bookOrSection: 'Segunda Parte · La Confirmación',
    body: 'Sigue el rito esencial del sacramento. En el rito latino, «el sacramento de la Confirmación es conferido por la unción del santo crisma en la frente, hecha imponiendo la mano, y con estas palabras: "Recibe por esta señal el don del Espíritu Santo"».',
  },
  'cic 1121': {
    refKey: 'CIC 1121',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1121',
    bookOrSection: 'Segunda Parte · El carácter sacramental',
    body: 'Los tres sacramentos del Bautismo, de la Confirmación y del Orden confieren, además de la gracia, un carácter sacramental o «sello» por el cual el cristiano participa del sacerdocio de Cristo y forma parte de la Iglesia según estados y funciones diversos. Este sello espiritual es indeleble y por eso estos sacramentos no se reiteran.',
  },
  'cic 1346': {
    refKey: 'CIC 1346',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1346',
    bookOrSection: 'Segunda Parte · El desarrollo de la celebración',
    body: 'La liturgia de la Eucaristía se desarrolla conforme a una estructura fundamental que se ha conservado a través de los siglos hasta nosotros. Comprende dos grandes momentos que forman una unidad básica: la reunión, la liturgia de la Palabra y la liturgia eucarística.',
  },
  'cic 524': {
    refKey: 'CIC 524',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 524',
    bookOrSection: 'Primera Parte · El tiempo de Adviento',
    body: 'Al celebrar anualmente la liturgia de Adviento, la Iglesia actualiza esta espera del Mesías: participando en la larga preparación de la primera venida del Salvador, los fieles renuevan el ardiente deseo de su segunda venida.',
  },
  'cic 1169': {
    refKey: 'CIC 1169',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1169',
    bookOrSection: 'Segunda Parte · El año litúrgico',
    body: 'Por eso la Pascua no es simplemente una fiesta entre otras: es la «Fiesta de las fiestas», «Solemnidad de las solemnidades», como la Eucaristía es el Sacramento de los sacramentos.',
  },
  'igmr 346': {
    refKey: 'IGMR 346',
    sourceType: 'igmr',
    title: 'Instrucción General del Misal Romano · N.° 346',
    bookOrSection: 'Liturgia · Colores de las vestiduras sagradas',
    body: 'La diversidad de colores en las vestiduras sagradas pretende expresar con más eficacia el carácter propio de los misterios de la fe que se celebran: blanco en Pascua y Navidad; rojo en Domingo de Ramos, Viernes Santo, Pentecostés y mártires; verde en el Tiempo Ordinario; morado en Adviento y Cuaresma.',
  },
  'cic 1174-1175': {
    refKey: 'CIC 1174-1175',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1174–1175',
    bookOrSection: 'Segunda Parte · La Liturgia de las Horas',
    body: 'El misterio de Cristo, su Encarnación y su Pascua, que celebramos en la Eucaristía, penetra y transfigura el tiempo de cada día mediante la celebración de la Liturgia de las Horas, «el Oficio divino». Está destinada a llegar a ser la oración de todo el Pueblo de Dios.',
  },
  'cic 882': {
    refKey: 'CIC 882',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 882',
    bookOrSection: 'Primera Parte · El Papa y el colegio episcopal',
    body: 'El Papa, obispo de Roma y sucesor de san Pedro, «es el principio y fundamento perpetuo y visible de unidad, tanto de los obispos como de la muchedumbre de los fieles» (LG 23).',
  },
  'cic 1202-1203': {
    refKey: 'CIC 1202-1203',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1202–1203',
    bookOrSection: 'Segunda Parte · Tradiciones litúrgicas y catolicidad',
    body: 'Las diversas tradiciones litúrgicas nacieron por razón misma de la misión de la Iglesia. Las tradiciones litúrgicas, o ritos, actualmente en uso en la Iglesia son el rito latino y los ritos orientales (bizantino, alejandrino, siríaco, armenio, maronita y caldeo).',
  },
  'cic 1808': {
    refKey: 'CIC 1808',
    sourceType: 'cic',
    title: 'Catecismo de la Iglesia Católica · N.° 1808',
    bookOrSection: 'Tercera Parte · Las virtudes cardinales',
    body: 'La fortaleza es la virtud moral que asegura en las dificultades la firmeza y la constancia en la búsqueda del bien. Reafirma la resolución de resistir a las tentaciones y de superar los obstáculos en la vida moral.',
  },
  'lc 2,4-7': {
    refKey: 'Lc 2,4-7',
    sourceType: 'biblia',
    title: 'Lucas 2, 4-7',
    bookOrSection: 'Nuevo Testamento · Nacimiento de Jesús en Belén',
    body: '«También José subió desde Galilea, de la ciudad de Nazaret, a Judea, a la ciudad de David, llamada Belén... Y María dio a luz a su hijo primogénito, lo envolvió en pañales y lo acostó en un pesebre.»',
  },
  '1 cor 9,24-25': {
    refKey: '1 Cor 9,24-25',
    sourceType: 'biblia',
    title: 'Primera carta a los Corintios 9, 24-25',
    bookOrSection: 'Nuevo Testamento · Cartas de san Pablo',
    body: '«¿No saben que en el estadio todos corren, pero uno solo gana el premio? Corran, entonces, de manera que lo ganen. Los atletas se privan de todo por una corona corruptible; nosotros, en cambio, por una incorruptible.»',
  },
};

export function splitReferenceTokens(sourceRef: string): string[] {
  if (!sourceRef) return [];
  return sourceRef
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function lookupReferenceText(refToken: string): Promise<ReferenceTextEntry> {
  const clean = refToken.trim();
  const key = clean.toLowerCase();

  // 1. Consultar en Supabase (cuando la Biblia y el CIC completos estén cargados allí)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('reference_texts')
        .select('ref_key, source_type, title, book_or_section, body')
        .ilike('ref_key', clean)
        .maybeSingle();

      if (data) {
        return {
          refKey: data.ref_key,
          sourceType: data.source_type as ReferenceTextEntry['sourceType'],
          title: data.title,
          bookOrSection: data.book_or_section ?? '',
          body: data.body,
        };
      }
    } catch {
      // Fallback al banco local
    }
  }

  // 2. Buscar coincidencia exacta o parcial en banco local
  if (LOCAL_REFERENCES[key]) {
    return LOCAL_REFERENCES[key];
  }

  const partial = Object.entries(LOCAL_REFERENCES).find(
    ([k]) => key.includes(k) || k.includes(key)
  );
  if (partial) {
    return partial[1];
  }

  // 3. Fallback informativo respetuoso si todavía no está cargado ese artículo puntual
  const isCic = key.startsWith('cic');
  return {
    refKey: clean,
    sourceType: isCic ? 'cic' : 'otro',
    title: isCic ? `Catecismo de la Iglesia Católica · ${clean}` : clean,
    bookOrSection: isCic
      ? 'Catecismo de la Iglesia Católica'
      : 'Referencia doctrinal y de actualidad',
    body: isCic
      ? `Este numeral (${clean}) forma parte del Catecismo de la Iglesia Católica. Próximamente podrás leer el texto íntegro del CIC y la Biblia completa directamente desde aquí.`
      : `Referencia citada para esta pregunta: ${clean}.`,
  };
}
