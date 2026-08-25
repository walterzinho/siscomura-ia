export interface ModuleDef {
  id: string;
  number: number;
  name: string;
  description: string;
  icon: string;
  placeholder: string;
  hasUrl: boolean;
  hasMultiUrl: boolean;
}

export const MODULES: ModuleDef[] = [
  {
    id: 'cunas-institucionales',
    number: 1,
    name: 'Cuñas Institucionales',
    description: 'Programas propios, locución institucional, microprogramas, franjas y campañas',
    icon: 'Radio',
    placeholder: 'Tipo de cuña (programa propio, locución, microprograma, franja, campaña), tema, audiencia objetivo...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'cunas-clientes',
    number: 2,
    name: 'Cuñas de Clientes',
    description: 'Cuñas comerciales normales, informerciales, unitarias o campaña de varias',
    icon: 'Megaphone',
    placeholder: 'Cliente, producto/servicio, tipo de cuña (normal, informercial, unitaria, campaña), mensaje principal...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'horoscopo-semanal',
    number: 3,
    name: 'Horóscopo Semanal',
    description: 'Horóscopo semanal orientado por los ángeles para los 12 signos',
    icon: 'Sparkles',
    placeholder: 'Opcional: semana específica, signos a enfatizar, enfoque temático...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'bienestar-campesino',
    number: 4,
    name: 'Bienestar Campesino',
    description: 'Contenido de salud mental para comunidades rurales',
    icon: 'Heart',
    placeholder: 'Tema de salud mental: estrés, soledad, ansiedad, duelo, resiliencia, relaciones...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'sembrando-esperanza',
    number: 5,
    name: 'Sembrando Esperanza',
    description: 'Micro programa de motivación en FE',
    icon: 'Sun',
    placeholder: 'Tema del día: siembra, cosecha, fe, paciencia, gratitud, comunidad...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'presentacion-franjas',
    number: 6,
    name: 'Presentación de Franjas',
    description: 'Libretos para listas de franjas diarias de programación',
    icon: 'LayoutList',
    placeholder: 'Lista de franjas del día con horarios y nombres de programas...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'noticias-multicanal',
    number: 7,
    name: 'Contenido Multicanal',
    description: 'Orquesta contenido para 5 canales: noticia radio, flashes, blog SEO, imagenes y redes sociales',
    icon: 'Globe',
    placeholder: 'Contexto fuente de la noticia o informacion base para generar en 5 canales...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'conexion-territorial',
    number: 8,
    name: 'Conexión Territorial',
    description: 'Informativo En 5 Surcos — Día 1 Coyuntural / Día 2 Técnico',
    icon: 'MapPin',
    placeholder: 'Día 1 o Día 2, región, fuentes...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'perfiles-locutores-ia',
    number: 9,
    name: 'Perfiles Locutores IA',
    description: 'Creador de perfiles de locutores para Google TTS',
    icon: 'Mic',
    placeholder: 'Tipo de locutor: noticiero, deportivo, musical, religioso, humorístico, narrativo...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'contenido-personajes',
    number: 10,
    name: 'Contenido de Personajes',
    description: 'Fichas de personajes, libretos de escenas y sketches humorísticos',
    icon: 'Drama',
    placeholder: 'Describe el personaje o escena: tipo, tema, personajes, contexto regional...',
    hasUrl: false,
    hasMultiUrl: false,
  },
  {
    id: 'generador-libretos',
    number: 11,
    name: 'Generador de Libretos',
    description: 'Libretos radiales con playlist de referencia (.slseq, CSV, M3U)',
    icon: 'FileAudio',
    placeholder: 'Tipo de programa, temas, playlist de canciones de referencia...',
    hasUrl: false,
    hasMultiUrl: false,
  },
];

export function getModuleById(id: string): ModuleDef | undefined {
  return MODULES.find((m) => m.id === id);
}
