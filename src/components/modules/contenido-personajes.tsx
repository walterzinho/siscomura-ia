'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Drama, Sparkles, Loader2, Copy, Check, Download, Users, Twitter,
  Plus, Trash2, ArrowLeft, Palette, Camera, MessageSquare, Zap, RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

// ===== TYPES =====
interface CampaignIdea {
  tema: string; titulo: string; subtitulo: string;
  mensaje: string; copy_facebook: string;
  accion: string; entorno: string; prompt_flow?: string;
}

interface PhraseItem {
  frase: string; tema: string;
}

interface Character {
  name: string; description: string; img1: string; img2: string; img3: string;
}

const DEFAULT_CHARACTERS: Record<string, Character> = {
  evaristo: {
    name: 'Don Evaristo',
    description: 'Campesino de 70 años del altiplano cundiboyacense, manos grandes y venosas, barba rala canosa, 1.60m, tez morena, expresión sabia y serena. Sombrero de Aguadas, camisa a cuadros tonos tierra, pantalón de trabajo, botas de caucho.',
    img1: '', img2: '', img3: '',
  },
  justina: {
    name: 'Mamá Justina',
    description: 'Abuela dulce de 68 años de las montañas colombianas, rostro amable, ojos expresivos, cabello plateado en moño tradicional, estatura baja, tez trigueña clara. Delantal bordado colorido sobre vestido floreado modesto, aretes de oro pequeños.',
    img1: '', img2: '', img3: '',
  },
  camilo_jenny: {
    name: 'Camilo y Jenny',
    description: 'Jóvenes tech-campesinos de 22 años, expresiones energéticas, sonrisas amigables. Camilo con piel tostada y gorra béisbol; Jenny con cabello oscuro largo trenzado y sombrero de paja tejido.',
    img1: '', img2: '', img3: '',
  },
  ernesto_juli: {
    name: 'Ernesto y Juli',
    description: 'Pareja urbano-rural consciente de 32 años, intelectualmente curiosos. Ernesto con barba de tres días; Juli con expresión cálida. Ropa moderna cómoda con detalles tradicionales colombianos sutiles.',
    img1: '', img2: '', img3: '',
  },
};

const PHOTO_STYLE_OPTIONS = [
  { id: 'cinematic', label: 'Cinematográfico' },
  { id: 'smartphone', label: 'Smartphone' },
  { id: 'analog', label: 'Analógico 35mm' },
  { id: 'watercolor', label: 'Acuarela' },
  { id: 'oil', label: 'Óleo sobre Lienzo' },
  { id: 'macro', label: 'Macro Estudio' },
];

const TONE_OPTIONS = [
  { id: 'motivacional', label: 'Motivacional', icon: '✨', desc: 'Inspirar y motivar al campesino' },
  { id: 'humoristico', label: 'Humorístico', icon: '😂', desc: 'Humor campero e ironía amable' },
  { id: 'reflexivo', label: 'Reflexivo', icon: '🌙', desc: 'Poesía rural y naturaleza' },
  { id: 'provocativo', label: 'Provocativo', icon: '🔥', desc: 'Pensamiento crítico sobre el agro' },
  { id: 'informativo', label: 'Informativo', icon: '📊', desc: 'Tips rápidos y datos agrícolas' },
  { id: 'contundente', label: 'Contundente', icon: '💥', desc: 'Directas, fuertes, pensamiento del día' },
];

const QUICK_COUNTS = [10, 20, 30, 40, 50];

// ===== COMPONENT =====
export function ContenidoPersonajesGenerator() {
  const { isGenerating, setGenerating } = useAppStore();

  // ===== CHARACTERS STATE =====
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [selectedCharKey, setSelectedCharKey] = useState('evaristo');
  const [charName, setCharName] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charImg1, setCharImg1] = useState('');
  const [charImg2, setCharImg2] = useState('');
  const [charImg3, setCharImg3] = useState('');

  // ===== CAMPAIGN STATE =====
  const [campaignIdeas, setCampaignIdeas] = useState<CampaignIdea[]>([]);
  const [numMessages, setNumMessages] = useState(8);
  const [topics, setTopics] = useState('');
  const [enfoque, setEnfoque] = useState('consejo');
  const [fbLength, setFbLength] = useState('medio');
  const [photoStyle, setPhotoStyle] = useState('cinematic');
  const [footer, setFooter] = useState('');
  const [hashtags, setHashtags] = useState('');

  // ===== PHRASES STATE =====
  const [phraseCount, setPhraseCount] = useState(20);
  const [phraseTone, setPhraseTone] = useState('contundente');
  const [phraseTopic, setPhraseTopic] = useState('');
  const [phraseCharacter, setPhraseCharacter] = useState('');
  const [phrases, setPhrases] = useState<PhraseItem[]>([]);

  // ===== UI STATE =====
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showCampaignResults, setShowCampaignResults] = useState(false);

  // Load characters from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('smc_characters_db');
    if (stored) {
      try { setCharacters(JSON.parse(stored)); } catch { setCharacters(DEFAULT_CHARACTERS); }
    } else {
      setCharacters(DEFAULT_CHARACTERS);
    }
  }, []);

  // Sync form when character selection changes
  useEffect(() => {
    const c = characters[selectedCharKey];
    if (c) {
      setCharName(c.name);
      setCharDesc(c.description);
      setCharImg1(c.img1 || '');
      setCharImg2(c.img2 || '');
      setCharImg3(c.img3 || '');
    }
  }, [selectedCharKey, characters]);

  const currentChar = characters[selectedCharKey];

  const saveCharacter = () => {
    if (!charName.trim()) { toast.error('Ponle un nombre al personaje'); return; }
    const updated = {
      ...characters,
      [selectedCharKey]: { name: charName.trim(), description: charDesc, img1: charImg1, img2: charImg2, img3: charImg3 },
    };
    setCharacters(updated);
    localStorage.setItem('smc_characters_db', JSON.stringify(updated));
    toast.success(`Perfil de ${charName} guardado`);
  };

  const newCharacter = () => {
    const id = `char_${Date.now()}`;
    const updated = { ...characters, [id]: { name: 'Nuevo Personaje', description: '', img1: '', img2: '', img3: '' } };
    setCharacters(updated);
    localStorage.setItem('smc_characters_db', JSON.stringify(updated));
    setSelectedCharKey(id);
  };

  const deleteCharacter = () => {
    const keys = Object.keys(characters);
    if (keys.length <= 1) { toast.error('No puedes borrar el único personaje'); return; }
    const name = characters[selectedCharKey]?.name;
    const { [selectedCharKey]: _, ...rest } = characters;
    const newKey = Object.keys(rest)[0];
    setCharacters(rest);
    localStorage.setItem('smc_characters_db', JSON.stringify(rest));
    setSelectedCharKey(newKey);
    toast.success(`${name} eliminado`);
  };

  // ===== GENERATE CAMPAIGN =====
  const handleGenerateCampaign = useCallback(async () => {
    if (!charName.trim() || !charDesc.trim()) {
      toast.error('Configura el personaje primero'); return;
    }
    setGenerating(true);
    setShowCampaignResults(false);
    try {
      const res = await fetch('/api/generate-campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: charName, characterDesc: charDesc,
          numMessages, topics, enfoque, fbLength, photoStyle,
          imgRefs: [charImg1, charImg2, charImg3], footer, hashtags,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCampaignIdeas(data.ideas);
        setShowCampaignResults(true);
        toast.success(`${data.ideas.length} propuestas generadas`);
      } else {
        toast.error(data.error || 'Error al generar');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setGenerating(false); }
  }, [charName, charDesc, numMessages, topics, enfoque, fbLength, photoStyle, charImg1, charImg2, charImg3, footer, hashtags, setGenerating]);

  // ===== GENERATE PHRASES =====
  const handleGeneratePhrases = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-phrases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: phraseCount, tone: phraseTone, topic: phraseTopic, character: phraseCharacter }),
      });
      const data = await res.json();
      if (data.success) {
        setPhrases(data.frases);
        toast.success(`${data.frases.length} frases generadas`);
      } else {
        toast.error(data.error || 'Error al generar');
      }
    } catch { toast.error('Error de conexión'); }
    finally { setGenerating(false); }
  }, [phraseCount, phraseTone, phraseTopic, phraseCharacter, setGenerating]);

  // ===== COPY HELPERS =====
  const copyText = async (text: string, idx?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx ?? -1);
      toast.success('Copiado');
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { toast.error('Error al copiar'); }
  };

  const copyAllPhrases = () => {
    const all = phrases.map((p, i) => `${i + 1}. ${p.frase}`).join('\n');
    copyText(all);
  };

  const exportPhrasesCsv = () => {
    const header = 'Numero|Frase|Tema';
    const rows = phrases.map((p, i) => `${i + 1}|${p.frase}|${p.tema}`).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `frases_${phraseTone}_${phraseCount}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportCampaignCsv = () => {
    const header = 'Tema|Titulo|Subtitulo|Mensaje|Copy_Facebook|Accion|Entorno|Prompt_Flow';
    const rows = campaignIdeas.map((i) =>
      [i.tema, i.titulo, i.subtitulo, i.mensaje, i.copy_facebook, i.accion, i.entorno, i.prompt_flow || '']
        .map(v => `"${(v || '').replace(/"/g, '""')}"`).join('|')
    ).join('\n');
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `campana_${charName.replace(/\s+/g, '_')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
          <Drama className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Contenido de Personajes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Campañas con personajes + Frases masivas tipo X</p>
        </div>
      </div>

      <Tabs defaultValue="campañas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campañas" className="gap-2"><Users className="size-4" /> Campañas con Personajes</TabsTrigger>
          <TabsTrigger value="frases" className="gap-2"><Twitter className="size-4" /> Frases Masivas X</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB 1: CAMPAÑAS CON PERSONAJES */}
        {/* ============================================================ */}
        <TabsContent value="campañas" className="mt-4 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column - Configuration */}
            <div className="lg:col-span-5 flex flex-col gap-4">

              {/* Character Selector + CRUD */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="size-4 text-orange-500" /> Personaje
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={newCharacter} className="h-7 px-2 text-xs gap-1">
                        <Plus className="size-3" /> Nuevo
                      </Button>
                      <Button variant="outline" size="sm" onClick={deleteCharacter} className="h-7 px-2 text-xs text-red-500 hover:text-red-600">
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedCharKey} onValueChange={setSelectedCharKey}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(characters).map(([key, c]) => (
                        <SelectItem key={key} value={key}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-2">
                    <Label className="text-xs">Nombre Visual</Label>
                    <Input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Nombre del personaje" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Descripción (rasgos físicos, ropa, estilo visual)</Label>
                    <Textarea value={charDesc} onChange={e => setCharDesc(e.target.value)} rows={4} className="resize-none text-xs" placeholder="Describe al personaje en detalle..." />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Imágenes de Referencia (Google Flow)</Label>
                    <Input value={charImg1} onChange={e => setCharImg1(e.target.value)} placeholder="URL imagen 1" className="text-xs" />
                    <Input value={charImg2} onChange={e => setCharImg2(e.target.value)} placeholder="URL imagen 2 (opcional)" className="text-xs" />
                    <Input value={charImg3} onChange={e => setCharImg3(e.target.value)} placeholder="URL imagen 3 (opcional)" className="text-xs" />
                  </div>

                  <Button onClick={saveCharacter} variant="outline" className="w-full text-xs">Guardar Personaje</Button>
                </CardContent>
              </Card>

              {/* Campaign Parameters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="size-4 text-orange-500" /> Parámetros de Campaña
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <Label className="text-xs">Mensajes:</Label>
                    <Input type="number" min={1} max={12} value={numMessages} onChange={e => setNumMessages(parseInt(e.target.value) || 8)} className="text-center text-sm" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Estilo Visual</Label>
                    <Select value={photoStyle} onValueChange={setPhotoStyle}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PHOTO_STYLE_OPTIONS.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Temas a Repartir</Label>
                    <Textarea value={topics} onChange={e => setTopics(e.target.value)} rows={2} className="resize-none text-xs" placeholder="Cuidado del agua, plagas, abono orgánico..." />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Profundidad</Label>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted">
                      {(['consejo', 'tecnico', 'tutorial'] as const).map(e => (
                        <button key={e} onClick={() => setEnfoque(e)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                            enfoque === e ? 'bg-orange-500 text-white' : 'hover:bg-muted-foreground/10 text-muted-foreground'
                          }`}>
                          {e === 'consejo' ? 'Consejo' : e === 'tecnico' ? 'Técnico' : 'Tutorial'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Extensión Facebook</Label>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-muted">
                      {(['corto', 'medio', 'largo'] as const).map(l => (
                        <button key={l} onClick={() => setFbLength(l)}
                          className={`py-1.5 rounded-md text-xs font-medium transition-colors ${
                            fbLength === l ? 'bg-orange-500 text-white' : 'hover:bg-muted-foreground/10 text-muted-foreground'
                          }`}>
                          {l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Footer Fijo Facebook</Label>
                    <Input value={footer} onChange={e => setFooter(e.target.value)} placeholder="Radio Voces Campesinas..." className="text-xs" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Hashtags Fijos</Label>
                    <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#VocesCampesinas #Agroecologia" className="text-xs" />
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Button onClick={handleGenerateCampaign} disabled={isGenerating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-sm">
                {isGenerating ? <><Loader2 className="size-4 animate-spin mr-2" /> Generando...</> : <><Sparkles className="size-4 mr-2" /> Generar Campaña con IA</>}
              </Button>
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-7 space-y-4">
              {!showCampaignResults ? (
                <Card className="flex flex-col items-center justify-center py-16">
                  <div className="bg-orange-100 dark:bg-orange-950 p-4 rounded-full text-3xl mb-4">
                    <Users className="size-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold">Todo Listo Para Empezar</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm text-center">
                    Configura tu personaje y parámetros, luego genera una campaña completa con textos, prompts y copy para redes.
                  </p>
                </Card>
              ) : (
                <>
                  {/* Campaign Header + Export */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{campaignIdeas.length} Propuestas Generadas</h3>
                      <p className="text-xs text-muted-foreground">{currentChar?.name} · {enfoque} · {photoStyle}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowCampaignResults(false)} className="gap-1 text-xs">
                        <ArrowLeft className="size-3" /> Volver
                      </Button>
                      <Button size="sm" onClick={exportCampaignCsv} className="gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                        <Download className="size-3" /> CSV
                      </Button>
                    </div>
                  </div>

                  {/* Campaign Cards */}
                  <div className="space-y-4">
                    {campaignIdeas.map((idea, idx) => (
                      <Card key={idx} className="overflow-hidden">
                        <CardContent className="p-4 space-y-3">
                          {/* Header Badges */}
                          <div className="flex items-center flex-wrap gap-2">
                            <Badge variant="outline" className="text-orange-600 border-orange-200 dark:border-orange-800">{String(idx + 1).padStart(2, '0')}</Badge>
                            <Badge variant="secondary" className="text-xs">{idea.tema}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{currentChar?.name}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Text Column */}
                            <div className="space-y-3">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Título</span>
                                <h4 className="text-sm font-bold">{idea.titulo}</h4>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Subtítulo</span>
                                <p className="text-xs text-muted-foreground">{idea.subtitulo}</p>
                              </div>
                              <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-lg">
                                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Frase del Personaje</span>
                                <p className="text-xs italic mt-1">&ldquo;{idea.mensaje}&rdquo;</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Copy Facebook</span>
                                  <button onClick={() => copyText(idea.copy_facebook, idx)} className="text-orange-500 hover:text-orange-600 text-[10px] font-bold flex items-center gap-1">
                                    {copiedIdx === idx ? <Check className="size-3" /> : <Copy className="size-3" />} copiar
                                  </button>
                                </div>
                                <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">{idea.copy_facebook}</p>
                              </div>
                            </div>

                            {/* Prompt Column */}
                            <div className="bg-muted/30 p-3 rounded-lg space-y-3">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Prompt Google Flow</span>
                              <div className="space-y-1.5 text-[11px]">
                                <div><span className="font-bold text-muted-foreground">Pose:</span> <span className="font-mono">{idea.accion}</span></div>
                                <div><span className="font-bold text-muted-foreground">Fondo:</span> <span className="font-mono">{idea.entorno}</span></div>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => copyText(idea.prompt_flow || '', `flow-${idx}`)} className="w-full text-xs gap-1">
                                <Camera className="size-3" /> Copiar Prompt
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: FRASES MASIVAS X/TWITTER */}
        {/* ============================================================ */}
        <TabsContent value="frases" className="mt-4 space-y-5">
          {/* Config Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="size-4 text-orange-500" /> Configuración de Frases Masivas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quantity Quick Select */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-orange-500" /> Cantidad de Frases
                </Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_COUNTS.map(n => (
                    <button key={n} onClick={() => setPhraseCount(n)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        phraseCount === n ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}>
                      {n}
                    </button>
                  ))}
                  <Input type="number" min={1} max={50} value={phraseCount} onChange={e => setPhraseCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
                    className="w-20 text-center text-sm" />
                </div>
              </div>

              {/* Tone Grid */}
              <div className="space-y-2">
                <Label className="text-xs">Tono</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.id} onClick={() => setPhraseTone(t.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        phraseTone === t.id
                          ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30'
                          : 'border-transparent bg-muted/50 hover:bg-muted'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.icon}</span>
                        <span className={`text-xs font-bold ${phraseTone === t.id ? 'text-orange-600 dark:text-orange-400' : ''}`}>{t.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic + Character */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Tema (opcional)</Label>
                  <Input value={phraseTopic} onChange={e => setPhraseTopic(e.target.value)} placeholder="Ej: la siembra, el café, la lluvia..." className="text-xs" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Voz de Personaje (opcional)</Label>
                  <Select value={phraseCharacter} onValueChange={setPhraseCharacter}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Sin personaje" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin personaje</SelectItem>
                      {Object.values(characters).map((c, i) => (
                        <SelectItem key={i} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGeneratePhrases} disabled={isGenerating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-6 text-sm">
                {isGenerating ? <><Loader2 className="size-4 animate-spin mr-2" /> Generando {phraseCount} frases...</> : <><Sparkles className="size-4 mr-2" /> Generar {phraseCount} Frases con IA</>}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {phrases.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">{phrases.length} Frases Generadas</CardTitle>
                    <p className="text-xs text-muted-foreground">Tono: {phraseTone}{phraseTopic ? ` · Tema: ${phraseTopic}` : ''}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyAllPhrases} className="gap-1 text-xs">
                      {copiedIdx === -1 ? <Check className="size-3" /> : <Copy className="size-3" />} Copiar Todas
                    </Button>
                    <Button size="sm" onClick={exportPhrasesCsv} className="gap-1 text-xs bg-orange-500 hover:bg-orange-600 text-white">
                      <Download className="size-3" /> CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {phrases.map((p, idx) => (
                    <div key={idx} className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-xs font-mono text-muted-foreground mt-0.5 w-6 shrink-0 text-right">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{p.frase}</p>
                        {p.tema && <Badge variant="secondary" className="mt-1.5 text-[10px]">{p.tema}</Badge>}
                      </div>
                      <button onClick={() => copyText(p.frase, idx)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
                        {copiedIdx === idx ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
