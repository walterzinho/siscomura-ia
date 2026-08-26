export interface AudioTag {
  tag: string;
  category: 'emotion' | 'rhythm' | 'vocalEffect' | 'creative' | 'nonVerbal';
  description: string;
  example: string;
}

export const audioTags: AudioTag[] = [
  // Emoción
  { tag: '[amazed]', category: 'emotion', description: 'Sorpresa y asombro', example: '[amazed] No puedo creer lo que acabo de escuchar!' },
  { tag: '[excited]', category: 'emotion', description: 'Emoción y entusiasmo', example: '[excited] Bienvenidos a otra edición espectacular!' },
  { tag: '[serious]', category: 'emotion', description: 'Tono serio y formal', example: '[serious] Les informamos sobre los hechos de hoy.' },
  { tag: '[sarcastic]', category: 'emotion', description: 'Sarcasmo e ironía', example: '[sarcastic] Qué gran sorpresa, otra vez lo mismo.' },
  { tag: '[crying]', category: 'emotion', description: 'Llanto y tristeza', example: '[crying] Esta es una noticia que nos duele en el alma.' },
  { tag: '[panicked]', category: 'emotion', description: 'Pánico y urgencia', example: '[panicked] Tenemos que actuar ahora mismo!' },
  { tag: '[tired]', category: 'emotion', description: 'Cansancio y fatiga', example: '[tired] Han sido muchas horas de transmisión.' },
  { tag: '[curious]', category: 'emotion', description: 'Curiosidad e interés', example: '[curious] Alguna vez se han preguntado por qué...?' },
  { tag: '[reluctantly]', category: 'emotion', description: 'Reluctancia y desgano', example: '[reluctantly] Bueno, si insisten, les cuento...' },
  { tag: '[bored]', category: 'emotion', description: 'Aburrimiento y desinterés', example: '[bored] Otro día más de lo mismo...' },

  // Ritmo
  { tag: '[very fast]', category: 'rhythm', description: 'Muy rápido, ritmo acelerado', example: '[very fast] Y ahora pasamos directamente a la siguiente nota.' },
  { tag: '[very slow]', category: 'rhythm', description: 'Muy lento, pausado y deliberado', example: '[very slow] Cada palabra cuenta en este momento.' },
  { tag: '[one painfully slow word at a time]', category: 'rhythm', description: 'Una palabra a la vez, extremadamente lento', example: '[one painfully slow word at a time] Esto. Es. Importante.' },
  { tag: '[pauses]', category: 'rhythm', description: 'Pausas dramáticas entre frases', example: '[pauses] La respuesta... [pauses] nos sorprendió a todos.' },

  // Efecto Vocal
  { tag: '[whispers]', category: 'vocalEffect', description: 'Susurro, voz baja e íntima', example: '[whispers] Y les cuento un secreto que pocos conocen.' },
  { tag: '[shouting]', category: 'vocalEffect', description: 'Grito, voz alta y potente', example: '[shouting] GOOOOOL! Qué jugada increíble!' },
  { tag: '[low-voiced]', category: 'vocalEffect', description: 'Voz grave y profunda', example: '[low-voiced] En la quietud de la madrugada...' },
  { tag: '[trembling]', category: 'vocalEffect', description: 'Temblores en la voz, nerviosismo', example: '[trembling] La emoción no me deja hablar con claridad.' },
  { tag: '[nasal]', category: 'vocalEffect', description: 'Tono nasal', example: '[nasal] Hoy les traemos una historia peculiar.' },

  // Creativo
  { tag: '[like a cartoon dog]', category: 'creative', description: 'Estilo caricatura, voz animada', example: '[like a cartoon dog] Hola amiguitos!' },
  { tag: '[like dracula]', category: 'creative', description: 'Estilo Drácula, voz dramática y oscura', example: '[like dracula] Bienvenidos... a la noche eterna.' },
  { tag: '[mischievously]', category: 'creative', description: 'Tono pícaro y travieso', example: '[mischievously] Sabían que...? Pues no es lo que creen.' },
  { tag: '[like a news anchor]', category: 'creative', description: 'Estilo presentador de noticias', example: '[like a news anchor] Buenas noches, estas son las noticias del día.' },
  { tag: '[like a storyteller]', category: 'creative', description: 'Estilo narrador de cuentos', example: '[like a storyteller] Érase una vez, en un pueblo lejano...' },

  // No Verbal
  { tag: '[sighs]', category: 'nonVerbal', description: 'Suspiro audible', example: '[sighs] Qué belleza la de esta canción.' },
  { tag: '[gasp]', category: 'nonVerbal', description: 'Jadeo, sorpresa repentina', example: '[gasp] No lo puedo creer!' },
  { tag: '[giggles]', category: 'nonVerbal', description: 'Risitas suaves', example: '[giggles] Esto me recuerda algo gracioso.' },
  { tag: '[laughs]', category: 'nonVerbal', description: 'Risa audible', example: '[laughs] Qué bueno que vinieron hoy!' },
  { tag: '[cough]', category: 'nonVerbal', description: 'Tos', example: '[cough] Disculpen, un momento...' },
];

export const tagCategories: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  emotion:      { label: 'Emoción',     color: 'text-rose-300',    bg: 'bg-rose-500/10',    border: 'border-rose-500/25',    dot: 'bg-rose-400' },
  rhythm:       { label: 'Ritmo',      color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   dot: 'bg-amber-400' },
  vocalEffect:  { label: 'Efecto Vocal', color: 'text-purple-300',  bg: 'bg-purple-500/10',  border: 'border-purple-500/25',  dot: 'bg-purple-400' },
  creative:     { label: 'Creativo',   color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  nonVerbal:    { label: 'No Verbal',  color: 'text-sky-300',     bg: 'bg-sky-500/10',     border: 'border-sky-500/25',     dot: 'bg-sky-400' },
};

export const categoryOrder = ['emotion', 'rhythm', 'vocalEffect', 'creative', 'nonVerbal'] as const;
