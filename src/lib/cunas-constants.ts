export const DURACION_JINGLE_OPTIONS = [
  { value: '15-20', label: '15 a 20 segundos' },
  { value: '20-30', label: '20 a 30 segundos' },
  { value: '30-40', label: '30 a 40 segundos' },
];

export const RIMA_OPTIONS = [
  { value: 'AABB', label: 'Rima Gemela / Pareada (AABB)', desc: 'Dos versos seguidos riman entre sí, luego los siguientes dos' },
  { value: 'ABAB', label: 'Rima Cruzada / Alterna (ABAB)', desc: 'El primer verso rima con el tercero, el segundo con el cuarto' },
  { value: 'ABBA', label: 'Rima Abrazada (ABBA)', desc: 'El primero rima con el cuarto, el segundo con el tercero' },
  { value: 'AAAA', label: 'Rima Continua (AAAA)', desc: 'Todos los versos de la estrofa riman entre sí' },
  { value: 'interna', label: 'Rima Interna', desc: 'Una palabra del medio del verso rima con la palabra final del mismo verso' },
];

export const ESTROFAS_OPTIONS = [
  { value: '2', label: '2 estrofas (corto)' },
  { value: '3', label: '3 estrofas (medio)' },
  { value: '4', label: '4 estrofas (completo)' },
];
