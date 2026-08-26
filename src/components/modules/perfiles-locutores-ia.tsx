'use client';

import { useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { voices, getVoiceById, paceOptions, styleOptions } from '@/lib/voices';
import { audioTags, tagCategories, categoryOrder } from '@/lib/audio-tags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  User, Calendar, AudioLines, Palette, Gauge, Thermometer, Theater,
  Tag, Sparkles, Loader2, Copy, Check, ArrowLeft, Lightbulb,
  MapPin, Radio, MessageSquare, Pencil, Info, FileText, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

interface AiGenerated {
  voice: string;
  audioProfile: string;
  style: string;
  pace: string;
  temperature: number;
  scene: string;
  sampleContext: string;
  tag: string;
  suggestedTags: string[];
  voiceRationale: string;
}

const emptyInput = {
  name: '', age: '', gender: '', profileType: '', region: '', scenario: '', additional: '',
};

export function PerfilesLocutoresIaGenerator() {
  const { isGenerating, setGenerating } = useAppStore();

  // Form state
  const [input, setInput] = useState(emptyInput);
  const [isEditor, setIsEditor] = useState(false);
  const [aiResult, setAiResult] = useState<AiGenerated | null>(null);
  const [profileName, setProfileName] = useState('');

  // Preview
  const [previewTab, setPreviewTab] = useState<'es' | 'en'>('es');
  const [profileEn, setProfileEn] = useState<AiGenerated | null>(null);

  // Tag guide
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Copy state
  const [copied, setCopied] = useState(false);

  const updateInput = (field: string, value: string) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  const editField = (field: keyof AiGenerated, value: string | number | string[]) => {
    if (!aiResult) return;
    setAiResult({ ...aiResult, [field]: value });
  };

  const selectedVoice = aiResult ? getVoiceById(aiResult.voice) : null;

  // Generate profile
  const handleGenerate = useCallback(async () => {
    if (!input.name && !input.profileType && !input.scenario) {
      toast.error('Ingresa al menos el nombre, tipo de perfil o escenario');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (data.success) {
        const es = data.profile;
        setAiResult(es);
        setProfileEn(data.profileEn || null);
        setProfileName(
          input.profileType
            ? `Voz ${input.profileType} - ${input.name}`
            : input.name
        );
        setIsEditor(true);
        toast.success('Perfil generado exitosamente');
      } else {
        toast.error(data.error || 'Error al generar el perfil');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setGenerating(false);
    }
  }, [input, setGenerating]);

  // Build preview text
  const buildPreviewText = (profile: AiGenerated | null, lang: 'es' | 'en'): string => {
    if (!profile) return '';
    const voice = getVoiceById(profile.voice);
    const voiceName = voice?.name || profile.voice;
    const voiceTrait = lang === 'es' ? (voice?.trait || '') : (voice?.traitEn || '');
    const lines = [
      `${profileName}${lang === 'en' ? ' (EN)' : ''} - ${input.name}`,
      '',
      `Audio Profile: ${profile.audioProfile}`,
      `Style: ${profile.style}`,
      `Pace: ${profile.pace}`,
      `Temperatura: ${profile.temperature}`,
      `Scene: ${profile.scene}`,
      `Sample Context: ${profile.sampleContext}`,
      `Etiqueta: ${profile.tag}`,
      `Voz: ${voiceName}${voiceTrait && voiceTrait !== '—' ? ` (${voiceTrait})` : ''}.`,
    ];
    if (profile.suggestedTags?.length) {
      lines.push(`Tags sugeridos: ${profile.suggestedTags.join(', ')}`);
    }
    return lines.join('\n');
  };

  const handleCopy = useCallback(async () => {
    const text = previewTab === 'en' && profileEn
      ? buildPreviewText(profileEn, 'en')
      : buildPreviewText(aiResult, 'es');
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  }, [previewTab, profileEn, aiResult, profileName, input.name]);

  const handleCopyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    } catch { /* */ }
  };

  const handleReset = () => {
    setInput(emptyInput);
    setAiResult(null);
    setProfileEn(null);
    setProfileName('');
    setIsEditor(false);
    setPreviewTab('es');
  };

  // ========== FORM VIEW ==========
  if (!isEditor) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <Mic className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Perfiles de Locutores IA
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Genera perfiles de voz para Google Gemini TTS con IA
            </p>
          </div>
        </div>

        <Tabs defaultValue="crear" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="crear" className="gap-2">
              <Sparkles className="size-4" /> Crear con IA
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <BookOpen className="size-4" /> Guía de Etiquetas
            </TabsTrigger>
          </TabsList>

          {/* ===== CREAR TAB ===== */}
          <TabsContent value="crear" className="mt-4 space-y-5">
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <User className="size-3.5 text-violet-500" /> Nombre del Locutor/a *
                    </Label>
                    <Input
                      value={input.name}
                      onChange={e => updateInput('name', e.target.value)}
                      placeholder="Ej: Maria del Carmen Salamanca"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Calendar className="size-3.5 text-violet-500" /> Edad
                    </Label>
                    <Input
                      value={input.age}
                      onChange={e => updateInput('age', e.target.value)}
                      placeholder="Ej: 50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Radio className="size-3.5 text-violet-500" /> Género de Voz
                    </Label>
                    <Select value={input.gender} onValueChange={v => updateInput('gender', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculina</SelectItem>
                        <SelectItem value="female">Femenina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <MessageSquare className="size-3.5 text-violet-500" /> Tipo de Perfil / Segmento *
                    </Label>
                    <Input
                      value={input.profileType}
                      onChange={e => updateInput('profileType', e.target.value)}
                      placeholder="Ej: Alborada Campesina, Noticiero, Magazine..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <MapPin className="size-3.5 text-violet-500" /> Región / Acento
                  </Label>
                  <Input
                    value={input.region}
                    onChange={e => updateInput('region', e.target.value)}
                    placeholder="Ej: Andina colombiana, Costeña, Paisa..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Theater className="size-3.5 text-violet-500" /> Escenario / Contexto *
                  </Label>
                  <Textarea
                    value={input.scenario}
                    onChange={e => updateInput('scenario', e.target.value)}
                    placeholder="Ej: Estudio de radio rural transmitiendo a comunidades campesinas en la madrugada..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <Pencil className="size-3.5 text-violet-500" /> Información Adicional (opcional)
                  </Label>
                  <Textarea
                    value={input.additional}
                    onChange={e => updateInput('additional', e.target.value)}
                    placeholder="Cualquier otro detalle que ayude a definir la voz..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-6 text-base"
                >
                  {isGenerating ? (
                    <><Loader2 className="size-5 animate-spin mr-2" /> Generando con IA...</>
                  ) : (
                    <><Sparkles className="size-5 mr-2" /> Generar Perfil con IA</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAG GUIDE TAB ===== */}
          <TabsContent value="tags" className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Guía de Etiquetas de Audio</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Las etiquetas son modificadores intercalados como [whispers] o [laughs] que controlan el tono, ritmo y emoción de la entrega.
              </p>
            </div>

            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
              <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                Si tu transcripción no está en inglés, usa etiquetas de audio en inglés para mejores resultados con Gemini TTS.
              </AlertDescription>
            </Alert>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
              {categoryOrder.map((cat) => {
                const tags = audioTags.filter(t => t.category === cat);
                const cfg = tagCategories[cat];
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`size-2 rounded-full ${cfg.dot}`} />
                      <h4 className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</h4>
                      <span className="text-xs text-muted-foreground tabular-nums">{tags.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tags.map((audioTag) => {
                        const isCopied = copiedTag === audioTag.tag;
                        return (
                          <button
                            key={audioTag.tag}
                            onClick={() => handleCopyTag(audioTag.tag)}
                            className={`group relative text-left rounded-lg border p-3 transition-all duration-150 ${cfg.bg} ${cfg.border} hover:brightness-125 cursor-pointer`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <code className={`text-sm font-mono font-semibold ${cfg.color} group-hover:brightness-125`}>
                                {audioTag.tag}
                              </code>
                              {isCopied ? (
                                <Check className="size-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Copy className="size-3.5 text-muted-foreground group-hover:text-muted-foreground/70 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              {audioTag.description}
                            </p>
                            <p className="text-xs text-muted-foreground/60 mt-1 italic truncate">
                              "{audioTag.example}"
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ========== EDITOR VIEW ==========
  const previewEs = buildPreviewText(aiResult, 'es');
  const previewEn = buildPreviewText(profileEn, 'en');

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 sm:p-6">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4 mr-1" /> Volver a Datos Iniciales
        </Button>
        <p className="text-xs text-amber-500">Puedes editar cualquier campo generado por la IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ===== EDITOR (3 cols) ===== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Profile Name */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <User className="size-3.5 text-violet-500" /> Nombre del Perfil
              </Label>
              <Input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Ej: Voz Femenina Alborada Campesina"
              />
            </CardContent>
          </Card>

          {/* Voice + Rationale */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <AudioLines className="size-3.5 text-violet-500" /> Voz
                </Label>
                {selectedVoice && (
                  <Badge variant="outline" className="border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400">
                    {selectedVoice.name} ({selectedVoice.trait})
                  </Badge>
                )}
              </div>
              <Select
                value={aiResult?.voice || ''}
                onValueChange={v => editField('voice', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una voz..." />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {voices.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-xs text-muted-foreground">({v.trait})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {aiResult?.voiceRationale && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3">
                  <Lightbulb className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-medium">¿Por qué esta voz?</span> {aiResult.voiceRationale}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Profile */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <AudioLines className="size-3.5 text-violet-500" /> Audio Profile
              </Label>
              <Textarea
                value={aiResult?.audioProfile || ''}
                onChange={e => editField('audioProfile', e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Style + Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Palette className="size-3.5 text-violet-500" /> Style
                </Label>
                <Select
                  value={aiResult?.style || ''}
                  onValueChange={v => editField('style', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{s.label}</span>
                          <span className="text-xs text-muted-foreground">{s.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <Gauge className="size-3.5 text-violet-500" /> Pace
                </Label>
                <Select
                  value={aiResult?.pace || ''}
                  onValueChange={v => editField('pace', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paceOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Temperature */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Thermometer className="size-3.5 text-violet-500" /> Temperatura
                </Label>
                <span className="text-lg font-mono text-violet-600 dark:text-violet-400 font-bold">
                  {aiResult?.temperature?.toFixed(2) ?? '0.50'}
                </span>
              </div>
              <Slider
                value={[aiResult?.temperature ?? 0.5]}
                onValueChange={([v]) => editField('temperature', v)}
                min={0} max={1} step={0.01}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.0 (Preciso)</span>
                <span>1.0 (Creativo)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Controla la variabilidad y creatividad de la voz (0.0 - 1.0)
              </p>
            </CardContent>
          </Card>

          {/* Scene */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Theater className="size-3.5 text-violet-500" /> Scene
              </Label>
              <Textarea
                value={aiResult?.scene || ''}
                onChange={e => editField('scene', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Sample Context */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <FileText className="size-3.5 text-violet-500" /> Sample Context
              </Label>
              <Textarea
                value={aiResult?.sampleContext || ''}
                onChange={e => editField('sampleContext', e.target.value)}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Tag + Suggested Tags */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label className="text-sm flex items-center gap-2">
                <Tag className="size-3.5 text-violet-500" /> Etiqueta de Audio
              </Label>
              <Input
                value={aiResult?.tag || ''}
                onChange={e => editField('tag', e.target.value)}
                placeholder="Ej: [whispers], [excited]..."
              />
              <p className="text-xs text-muted-foreground">
                Las etiquetas se insertan en la transcripción para modificar la entrega
              </p>

              {aiResult?.suggestedTags && aiResult.suggestedTags.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Etiquetas Sugeridas</Label>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.suggestedTags.map((tag, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/30 border-violet-200 dark:border-violet-800"
                        onClick={() => handleCopyTag(tag)}
                      >
                        {tag}
                        <Copy className="size-3 ml-1 opacity-50" />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== PREVIEW (2 cols) ===== */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="size-4 text-violet-500" /> Vista Previa
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0 gap-1.5"
                >
                  {copied ? (
                    <><Check className="size-3.5" /> Copiado</>
                  ) : (
                    <><Copy className="size-3.5" /> Copiar</>
                  )}
                </Button>
              </div>

              {/* ES/EN tabs */}
              {profileEn && (
                <div className="flex gap-1 mt-2">
                  <button
                    onClick={() => setPreviewTab('es')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewTab === 'es'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Español
                  </button>
                  <button
                    onClick={() => setPreviewTab('en')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      previewTab === 'en'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    English
                    {previewTab === 'en' && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-violet-300 text-violet-500">
                        TTS
                      </Badge>
                    )}
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="max-h-[70vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed font-mono [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200 [&::-webkit-scrollbar-thumb]:dark:bg-violet-800">
                {previewTab === 'en' && profileEn
                  ? (previewEn || 'Sin versión en inglés')
                  : (previewEs || 'Completa los datos y genera un perfil')}
              </div>
            </CardContent>
          </Card>

          {/* Quick Tag Reference (collapsed) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="size-4 text-violet-500" /> Tags Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {audioTags.slice(0, 15).map(at => (
                  <Badge
                    key={at.tag}
                    variant="outline"
                    className={`cursor-pointer text-xs hover:brightness-125 ${
                      tagCategories[at.category]?.border || ''
                    } ${
                      tagCategories[at.category]?.bg || ''
                    }`}
                    onClick={() => handleCopyTag(at.tag)}
                    title={`${at.tag}: ${at.description}`}
                  >
                    {at.tag}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground cursor-pointer hover:bg-muted"
                  onClick={() => { setIsEditor(false); }}
                >
                  + Ver todas...
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Mic({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 8-9.04 9.06a2.82 2.82 0 0 0 .79 1.57l1.58 1.58a2.82 2.82 0 0 0 1.57.79L16 12"/>
      <circle cx="17" cy="7" r="5"/>
    </svg>
  );
}
