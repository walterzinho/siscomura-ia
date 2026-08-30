// ── Plataformas de generación musical ──
export const PLATAFORMA_OPTIONS = [
  { value: 'suno', label: 'Suno', desc: 'Style + Lyrics con metatags. Tiende a generar piezas largas.' },
  { value: 'udio', label: 'Udio', desc: 'Prompt + Lyrics con tags de guía. Tiende a generar piezas largas.' },
  { value: 'google-musicfx', label: 'Google MusicFX', desc: 'Un solo prompt estructurado. Siempre genera 30 segundos.' },
] as const;

// ── Géneros musicales (enfocados a radio colombiana/latina) ──
export const GENERO_OPTIONS = [
  { value: 'cumbia', label: 'Cumbia', desc: 'Acordeón, percusión, ritmo bailable colombiano' },
  { value: 'vallenato', label: 'Vallenato', desc: 'Acordeón, caja vallenata, guacharaca' },
  { value: 'pop-latino', label: 'Pop Latino', desc: 'Pop con sabor latino, accesible y comercial' },
  { value: 'reggaeton', label: 'Reggaetón', desc: 'Dembow, bajo 808, ritmo urbano' },
  { value: 'salsa', label: 'Salsa', desc: 'Trompetas, piano montuno, clave, congas' },
  { value: 'ranchera', label: 'Ranchera / Música Mexicana', desc: 'Guitarra, trompeta, sentimiento ranchero' },
  { value: 'musica-campesina', label: 'Música Campesina', desc: 'Tiple, guitarra, guacharaca, estilo rural colombiano' },
  { value: 'porro', label: 'Porro', desc: 'Alegre, tambora, flauta, costeño colombiano' },
  { value: 'merengue', label: 'Merengue', desc: 'Tambora, güira, acordeón, ritmo dominicano' },
  { value: 'bachata', label: 'Bachata', desc: 'Guitarra, bongós, ritmo romántico dominicano' },
  { value: 'funk', label: 'Funk / Disco', desc: 'Bajo funky, guitarra rítmica, metales' },
  { value: 'rock-latino', label: 'Rock Latino', desc: 'Guitarra eléctrica, bajo, batería, con raíz latina' },
  { value: 'electronica-tropical', label: 'Electrónica Tropical', desc: 'Sintetizadores con ritmos latinos, fusión moderna' },
  { value: 'jingle-corporativo', label: 'Jingle Corporativo', desc: 'Producción limpia, pulida, estilo publicitario profesional' },
] as const;

// ── Tempo / BPM ──
export const TEMPO_OPTIONS = [
  { value: 'lento', label: 'Lento (60–80 BPM)', bpm: '70 BPM' },
  { value: 'medio', label: 'Medio (100–120 BPM)', bpm: '110 BPM' },
  { value: 'medio-rapido', label: 'Medio-Rápido (120–135 BPM)', bpm: '128 BPM' },
  { value: 'rapido', label: 'Rápido (135–155 BPM)', bpm: '145 BPM' },
  { value: 'personalizado', label: 'Personalizado', bpm: '' },
] as const;

// ── Instrumentación (multi-select) ──
export const INSTRUMENTOS_OPTIONS = [
  { value: 'acordeon', label: 'Acordeón' },
  { value: 'guitarra-acustica', label: 'Guitarra Acústica' },
  { value: 'guitarra-electrica', label: 'Guitarra Eléctrica' },
  { value: 'tiple', label: 'Tiple / Requinto' },
  { value: 'bajo', label: 'Bajo Eléctrico' },
  { value: 'batería', label: 'Batería' },
  { value: 'percusion-latina', label: 'Percusión Latina (congas, timbales)' },
  { value: 'tambora', label: 'Tambora' },
  { value: 'guacharaca', label: 'Guacharaca / Guache' },
  { value: 'teclados', label: 'Teclados / Sintetizadores' },
  { value: 'piano', label: 'Piano' },
  { value: 'vientos', label: 'Vientos (trompeta, trombón)' },
  { value: 'violín', label: 'Violín / Cuerdas' },
] as const;

// Mapeo de instrumentos a descripciones para el prompt
export const INSTRUMENTOS_MAP: Record<string, string> = {
  'acordeon': 'acordeón diatónico',
  'guitarra-acustica': 'guitarra acústica',
  'guitarra-electrica': 'guitarra eléctrica',
  'tiple': 'tiple colombiano / requinto',
  'bajo': 'bajo eléctrico',
  'batería': 'batería',
  'percusion-latina': 'percusión latina (congas, timbales, cencerro)',
  'tambora': 'tambora',
  'guacharaca': 'guacharaca y guache',
  'teclados': 'teclados / sintetizadores',
  'piano': 'piano',
  'vientos': 'sección de vientos (trompeta, trombón)',
  'violín': 'violín y cuerdas',
};

// ── Estilo vocal ──
export const VOCAL_OPTIONS = [
  { value: 'masculino', label: 'Voz Masculina' },
  { value: 'femenino', label: 'Voz Femenina' },
  { value: 'duo', label: 'Dúo (Masculino + Femenino)' },
  { value: 'coro', label: 'Coro' },
  { value: 'instrumental', label: 'Solo Instrumental (sin voces)' },
] as const;

// ── Mood / Energía ──
export const MOOD_OPTIONS = [
  { value: 'festivo', label: 'Animado / Festivo', desc: 'Energía alta, alegre, para celebrar' },
  { value: 'calido', label: 'Cálido / Acogedor', desc: 'Cercano, familiar, emotivo' },
  { value: 'energetico', label: 'Enérgico / Motivador', desc: 'Fuerza, acción, impulse' },
  { value: 'nostalgico', label: 'Nostálgico', desc: 'Melancolía dulce, recuerdos, tradición' },
  { value: 'profesional', label: 'Profesional / Corporativo', desc: 'Limpio, serio, confiable' },
  { value: 'romantico', label: 'Romántico', desc: 'Ternura, sensibilidad, emoción' },
] as const;

// ── Estructura musical ──
export const ESTRUCTURA_OPTIONS = [
  { value: 'simple', label: 'Simple', desc: 'Intro → Canto → Cierre (ideal para 15–20s)' },
  { value: 'completa', label: 'Completa', desc: 'Intro → Verso → Pre-Coro → Coro → Cierre (ideal para 30–40s)' },
] as const;

// ── Duración del jingle ──
export const DURACION_JINGLE_OPTIONS = [
  { value: '15-20', label: '15 a 20 segundos', desc: '2 estrofas cortas + cierre. Máximo 40–60 palabras.' },
  { value: '20-30', label: '20 a 30 segundos', desc: '3 estrofas + cierre. Máximo 60–90 palabras.' },
  { value: '30-40', label: '30 a 40 segundos', desc: '4 estrofas + cierre. Máximo 80–120 palabras.' },
] as const;

// ── Tipos de rima (conservados del módulo original) ──
export const RIMA_OPTIONS = [
  { value: 'AABB', label: 'AABB — Rima Pareada' },
  { value: 'ABAB', label: 'ABAB — Rima Cruzada' },
  { value: 'ABBA', label: 'ABBA — Rima Abrazada' },
  { value: 'AAAA', label: 'AAAA — Rima Continua' },
  { value: 'interna', label: 'Rima Interna' },
] as const;

// ── Número de estrofas ──
export const ESTROFAS_OPTIONS = [
  { value: '2', label: '2 estrofas' },
  { value: '3', label: '3 estrofas' },
  { value: '4', label: '4 estrofas' },
  { value: '5', label: '5 estrofas' },
] as const;

// ── Clase de jingle ──
export const CLASE_JINGLE_OPTIONS = [
  { value: 'marca', label: 'Jingle de Marca', desc: 'Identidad sonora del nombre' },
  { value: 'oferta', label: 'Jingle de Oferta / Promoción', desc: 'Promociona una oferta o descuento' },
  { value: 'evento', label: 'Jingle de Evento', desc: 'Anuncia un evento con fecha' },
  { value: 'programa', label: 'Jingle de Programa', desc: 'Identidad sonora de un programa' },
] as const;

// ── Para quién ──
export const PARA_QUIEN_OPTIONS = [
  { value: 'institucional', label: 'Institucional (Emisora)' },
  { value: 'cliente', label: 'Cliente (Negocio)' },
] as const;
