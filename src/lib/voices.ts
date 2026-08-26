export interface Voice {
  id: string;
  name: string;
  trait: string;
  traitEn: string;
}

export const voices: Voice[] = [
  { id: 'zephyr', name: 'Zephyr', trait: 'Brillante', traitEn: 'Bright' },
  { id: 'puck', name: 'Puck', trait: 'Optimista', traitEn: 'Optimistic' },
  { id: 'charon', name: 'Charon', trait: 'Informativa', traitEn: 'Informative' },
  { id: 'kore', name: 'Kore', trait: 'Firme', traitEn: 'Firm' },
  { id: 'fenrir', name: 'Fenrir', trait: 'Excitabilidad', traitEn: 'Excitability' },
  { id: 'leda', name: 'Leda', trait: 'Juvenil', traitEn: 'Youthful' },
  { id: 'orus', name: 'Orus', trait: 'Firme', traitEn: 'Firm' },
  { id: 'aoede', name: 'Aoede', trait: 'Breezy', traitEn: 'Breezy' },
  { id: 'callirrhoe', name: 'Callirrhoe', trait: 'Tranquila', traitEn: 'Calm voice' },
  { id: 'autonoe', name: 'Autonoe', trait: 'Brillo', traitEn: 'Brightness' },
  { id: 'enceladus', name: 'Enceladus', trait: 'Respiración', traitEn: 'Breathing' },
  { id: 'iapetus', name: 'Iapetus', trait: 'Claro', traitEn: 'Clear' },
  { id: 'umbriel', name: 'Umbriel', trait: 'Tranquilo', traitEn: 'Calm' },
  { id: 'algieba', name: 'Algieba', trait: 'Suave', traitEn: 'Soft' },
  { id: 'despina', name: 'Despina', trait: 'Suave', traitEn: 'Soft' },
  { id: 'erinome', name: 'Erinome', trait: 'Despejado', traitEn: 'Clear-headed' },
  { id: 'algenib', name: 'Algenib', trait: 'Gravelly', traitEn: 'Gravelly' },
  { id: 'rasalgethi', name: 'Rasalgethi', trait: 'Informativa', traitEn: 'Informative' },
  { id: 'laomedeia', name: 'Laomedeia', trait: 'Optimista', traitEn: 'Optimistic' },
  { id: 'achernar', name: 'Achernar', trait: 'Suave', traitEn: 'Soft' },
  { id: 'alnilam', name: 'Alnilam', trait: 'Firme', traitEn: 'Firm' },
  { id: 'schedar', name: 'Schedar', trait: 'Par', traitEn: 'Even' },
  { id: 'gacrux', name: 'Gacrux', trait: 'Contenido para mayores', traitEn: 'Mature content' },
  { id: 'pulcherrima', name: 'Pulcherrima', trait: '—', traitEn: '—' },
  { id: 'achird', name: 'Achird', trait: 'Amistoso', traitEn: 'Friendly' },
  { id: 'zubenelgenubi', name: 'Zubenelgenubi', trait: 'Casual', traitEn: 'Casual' },
  { id: 'vindemiatrix', name: 'Vindemiatrix', trait: 'Suave', traitEn: 'Soft' },
  { id: 'sadachbia', name: 'Sadachbia', trait: 'Animada', traitEn: 'Lively' },
  { id: 'sadaltager', name: 'Sadaltager', trait: 'Conocimiento', traitEn: 'Knowledgeable' },
  { id: 'sulafat', name: 'Sulafat', trait: 'Cálida', traitEn: 'Warm' },
];

export function getVoiceById(id: string): Voice | undefined {
  return voices.find(v => v.id === id);
}

export const paceOptions = [
  { id: 'natural', label: 'Natural', description: 'Ritmo natural y equilibrado' },
  { id: 'rapid-fire', label: 'Rápido y fluido', description: 'Ritmo acelerado y continuo' },
  { id: 'the-drift', label: 'Fluido / Deriva', description: 'Transiciones suaves entre frases' },
  { id: 'staccato', label: 'Staccato / Cortante', description: 'Frases cortas y marcadas' },
] as const;

export const styleOptions = [
  { id: 'vocal-smile', label: 'Vocal Smile', description: 'Tono cálido y amigable' },
  { id: 'newscaster', label: 'Newscaster', description: 'Estilo presentador de noticias' },
  { id: 'whisper', label: 'Whisper', description: 'Susurro íntimo y cercano' },
  { id: 'empathetic', label: 'Empathetic', description: 'Empático y comprensivo' },
  { id: 'promo-hype', label: 'Promo Hype', description: 'Energía y promoción' },
  { id: 'deadpan', label: 'Deadpan', description: 'Neutro y sin expresión' },
] as const;
