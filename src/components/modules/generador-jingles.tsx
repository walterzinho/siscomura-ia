'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Music2, Loader2, Copy, Check, Info, Sparkles as SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useAppStore } from '@/lib/store';
import {
  PLATAFORMA_OPTIONS,
  GENERO_OPTIONS,
  TEMPO_OPTIONS,
  INSTRUMENTOS_OPTIONS,
  VOCAL_OPTIONS,
  MOOD_OPTIONS,
  ESTRUCTURA_OPTIONS,
  DURACION_JINGLE_OPTIONS,
  RIMA_OPTIONS,
  ESTROFAS_OPTIONS,
  CLASE_JINGLE_OPTIONS,
  PARA_QUIEN_OPTIONS,
} from '@/lib/jingles-constants';

interface FormData {
  plataforma: string;
  clase: string;
  paraQuien: string;
  nombreJingle: string;
  nombreSujeto: string;
  objetivo: string;
  mensajeResaltar: string;
  datosContacto: string;
  genero: string;
  tempo: string;
  tempoPersonalizado: string;
  instrumentos: string[];
  estiloVocal: string;
  mood: string;
  estructura: string;
  tipoRima: string;
  numeroEstrofas: string;
  duracion: string;
  incluirLocucion: boolean;
}

const INITIAL_FORM: FormData = {
  plataforma: '',
  clase: '',
  paraQuien: 'institucional',
  nombreJingle: '',
  nombreSujeto: '',
  objetivo: '',
  mensajeResaltar: '',
  datosContacto: '',
  genero: '',
  tempo: 'medio',
  tempoPersonalizado: '',
  instrumentos: [],
  estiloVocal: 'masculino',
  mood: 'festivo',
  estructura: 'simple',
  tipoRima: 'AABB',
  numeroEstrofas: '2',
  duracion: '15-20',
  incluirLocucion: true,
};

interface JingleResult {
 plataforma: string;
  stylePrompt: string | null;
  lyrics: string | null;
  fullPrompt: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '¡Copiado!' : label}
    </Button>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-sm">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function GeneradorJinglesGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<JingleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInstrumento = (value: string) => {
    setForm((prev) => ({
      ...prev,
      instrumentos: prev.instrumentos.includes(value)
        ? prev.instrumentos.filter((i) => i !== value)
        : prev.instrumentos.length < 8
          ? [...prev.instrumentos, value]
          : prev.instrumentos,
    }));
  };

  // Form validation
  const isFormValid =
    form.plataforma &&
    form.clase &&
    form.genero &&
    form.tipoRima &&
    form.numeroEstrofas &&
    form.duracion &&
    (form.estiloVocal !== 'instrumental' || true); // instrumental is valid

  const plataformaLabel = PLATAFORMA_OPTIONS.find((p) => p.value === form.plataforma)?.label || '';
  const isGoogle = form.plataforma === 'google-musicfx';
  const isSuno = form.plataforma === 'suno';
  const isUdio = form.plataforma === 'udio';

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      try {
        const body: Record<string, unknown> = { ...form };
        if (form.tempo !== 'personalizado') {
          delete body.tempoPersonalizado;
        }

        const res = await fetch('/api/generate-jingle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }

        const data = await res.json();
        setResult(data as JingleResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado al generar el jingle');
      } finally {
        setGenerating(false);
      }
    },
    [form, isFormValid, isGenerating, setGenerating],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Music2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Generador de Jingles IA</h2>
          <p className="text-sm text-muted-foreground">
            Crea prompts listos para Suno, Udio o Google MusicFX
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Sección 1: Plataforma y Tipo ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plataforma y Tipo</CardTitle>
            <CardDescription>
              Selecciona la plataforma de música IA y el tipo de jingle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Plataforma */}
            <div className="space-y-2">
              <Label>Plataforma destino</Label>
              <Select value={form.plataforma} onValueChange={(v) => updateField('plataforma', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la plataforma..." />
                </SelectTrigger>
                <SelectContent>
                  {PLATAFORMA_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="font-medium">{p.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isGoogle && (
              <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded-md p-2">
                Google MusicFX siempre genera exactamente 30 segundos. La duración seleccionada se usará para controlar la cantidad de contenido.
              </p>
            )}

            {(isSuno || isUdio) && (
              <p className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 rounded-md p-2">
                {isSuno ? 'Suno' : 'Udio'} tiende a generar piezas largas. Se incluirán tags de duración corta (“short”, “30 second jingle”) y el metatag [End] para forzar un cierre limpio.
              </p>
            )}

            {/* Clase + Para Quién */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Clase de jingle</Label>
                <Select value={form.clase} onValueChange={(v) => updateField('clase', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASE_JINGLE_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>¿Para quién?</Label>
                <Select value={form.paraQuien} onValueChange={(v) => updateField('paraQuien', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PARA_QUIEN_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Sección 2: Información del Jingle ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información del Jingle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del jingle</Label>
                <Input
                  value={form.nombreJingle}
                  onChange={(e) => updateField('nombreJingle', e.target.value)}
                  placeholder="Ej: Jingle Voces Campesinas"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nombre de la {form.paraQuien === 'institucional' ? 'emisora' : 'cliente'}
                </Label>
                <Input
                  value={form.nombreSujeto}
                  onChange={(e) => updateField('nombreSujeto', e.target.value)}
                  placeholder={form.paraQuien === 'institucional' ? 'Ej: Voces Campesinas Punto Co' : 'Ej: Ferretería El Clavo'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Objetivo del jingle</Label>
              <Textarea
                value={form.objetivo}
                onChange={(e) => updateField('objetivo', e.target.value)}
                placeholder="¿Qué quieres lograr? Ej: Que la audiencia recuerde el nombre de la emisora y la sintonice"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Mensaje a resaltar</Label>
              <Textarea
                value={form.mensajeResaltar}
                onChange={(e) => updateField('mensajeResaltar', e.target.value)}
                placeholder="Frase o idea central. Ej: La voz del campo que te acompaña cada día"
                rows={2}
              />
            </div>

            {form.paraQuien === 'cliente' && (
              <div className="space-y-2">
                <Label>Datos de contacto del cliente</Label>
                <Textarea
                  value={form.datosContacto}
                  onChange={(e) => updateField('datosContacto', e.target.value)}
                  placeholder="Dirección, WhatsApp, teléfono, redes sociales..."
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Sección 3: Dirección Musical ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Dirección Musical
              <InfoTip text="Estos parámetros controlan cómo sonará el jingle en la plataforma de música IA" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Género */}
            <div className="space-y-2">
              <Label>Género musical</Label>
              <Select value={form.genero} onValueChange={(v) => updateField('genero', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el género..." />
                </SelectTrigger>
                <SelectContent>
                  {GENERO_OPTIONS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      <span className="font-medium">{g.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        — {g.desc}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tempo + Vocal + Mood */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tempo / BPM</Label>
                <Select value={form.tempo} onValueChange={(v) => updateField('tempo', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPO_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.tempo === 'personalizado' && (
                  <Input
                    type="number"
                    min={40}
                    max={200}
                    value={form.tempoPersonalizado}
                    onChange={(e) => updateField('tempoPersonalizado', e.target.value)}
                    placeholder="Ej: 126"
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Estilo vocal</Label>
                <Select value={form.estiloVocal} onValueChange={(v) => updateField('estiloVocal', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOCAL_OPTIONS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Mood / Energía</Label>
                <Select value={form.mood} onValueChange={(v) => updateField('mood', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        <span className="font-medium">{m.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Instrumentación (multi-select) */}
            <div className="space-y-2">
              <Label>
                Instrumentación (máx. 8){' '}
                {form.instrumentos.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {form.instrumentos.length} seleccionados
                  </Badge>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {INSTRUMENTOS_OPTIONS.map((inst) => {
                  const selected = form.instrumentos.includes(inst.value);
                  return (
                    <button
                      key={inst.value}
                      type="button"
                      onClick={() => toggleInstrumento(inst.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${selected ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      />
                      {inst.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estructura */}
            <div className="space-y-2">
              <Label>Estructura musical</Label>
              <div className="grid grid-cols-2 gap-3">
                {ESTRUCTURA_OPTIONS.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    onClick={() => updateField('estructura', e.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      form.estructura === e.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{e.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{e.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Sección 4: Letra y Rimas ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letra y Rimas</CardTitle>
            <CardDescription>
              Controla la estructura lírica del canto del jingle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>
                  Tipo de rima{' '}
                  <InfoTip text="Esquema de rima que seguirán los versos del canto" />
                </Label>
                <Select value={form.tipoRima} onValueChange={(v) => updateField('tipoRima', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RIMA_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número de estrofas</Label>
                <Select value={form.numeroEstrofas} onValueChange={(v) => updateField('numeroEstrofas', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTROFAS_OPTIONS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Duración total{' '}
                  <InfoTip text={
                    isGoogle
                      ? 'MusicFX siempre genera 30s. La duración controla la densidad del contenido.'
                      : 'Controla la cantidad de letra. Para jingles cortos, se agregarán tags de duración corta.'
                  } />
                </Label>
                <Select value={form.duracion} onValueChange={(v) => updateField('duracion', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURACION_JINGLE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        <span className="font-medium">{d.label}</span>
                        <span className="ml-1 text-xs text-muted-foreground">
                          — {d.desc}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Incluir locución */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="incluirLocucion"
                checked={form.incluirLocucion}
                onCheckedChange={(checked) => updateField('incluirLocucion', !!checked)}
              />
              <Label htmlFor="incluirLocucion" className="text-sm font-normal">
                Incluir locución (texto hablado al final del jingle)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* ── Botón generar ── */}
        <Button
          type="submit"
          disabled={!isFormValid || isGenerating}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generando prompt para {plataformaLabel}...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              Generar Prompt de Jingle
            </>
          )}
        </Button>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Resultado ── */}
      {result && (
        <div className="space-y-4">
          <Separator />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              Prompt generado para{' '}
              <span className="text-primary">{plataformaLabel}</span>
            </h3>
            <CopyButton text={result.fullPrompt} label="Copiar todo" />
          </div>

          {/* Suno: Style + Lyrics separados */}
          {isSuno && result.stylePrompt && result.lyrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Style of Music</Label>
                  <CopyButton text={result.stylePrompt} label="Copiar Style" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copia esto al campo &quot;Style of Music&quot; en Suno
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono">
                  {result.stylePrompt}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Lyrics</Label>
                  <CopyButton text={result.lyrics} label="Copiar Lyrics" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copia esto al campo &quot;Lyrics&quot; en Suno
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono">
                  {result.lyrics}
                </div>
              </div>
            </div>
          )}

          {/* Udio: Prompt + Letra separados */}
          {isUdio && result.stylePrompt && result.lyrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Prompt</Label>
                  <CopyButton text={result.stylePrompt} label="Copiar Prompt" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copia esto al campo principal de descripción en Udio
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono">
                  {result.stylePrompt}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Letra con Tags</Label>
                  <CopyButton text={result.lyrics} label="Copiar Letra" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Copia esto al editor de letras &quot;Custom&quot; en Udio
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono">
                  {result.lyrics}
                </div>
              </div>
            </div>
          )}

          {/* Google MusicFX: prompt único */}
          {isGoogle && result.fullPrompt && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Prompt para MusicFX</Label>
                <CopyButton text={result.fullPrompt} label="Copiar Prompt" />
              </div>
              <p className="text-xs text-muted-foreground">
                Copia y pega esto completo en Google MusicFX (AI Test Kitchen)
              </p>
              <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto">
                {result.fullPrompt}
              </div>
            </div>
          )}

          {/* Instrucciones post-generación */}
          <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-800 dark:text-blue-300 space-y-2">
            <p className="font-medium">¿Cómo usar este prompt?</p>
            {isSuno && (
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Abre <strong>suno.com</strong> y ve a &quot;Create&quot;</li>
                <li>Copia el <strong>Style of Music</strong> al campo &quot;Style of Music&quot;</li>
                <li>Copia las <strong>Lyrics</strong> al campo &quot;Lyrics&quot;</li>
                <li>Asegúrate de estar en modo &quot;Custom&quot; (no &quot;Simple&quot;)</li>
                <li>Genera y revisa. Si es muy largo, acorta las letras o agrega más secciones [Instrumental]</li>
              </ol>
            )}
            {isUdio && (
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Abre <strong>udio.com</strong></li>
                <li>Pega el <strong>Prompt</strong> en el campo de descripción</li>
                <li>Selecciona &quot;Custom&quot; en el editor de letras y pega la <strong>Letra con Tags</strong></li>
                <li>Genera y ajusta si es necesario</li>
              </ol>
            )}
            {isGoogle && (
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Abre <strong>Google AI Test Kitchen / MusicFX</strong></li>
                <li>Pega el <strong>Prompt completo</strong> en el campo de texto</li>
                <li>La pieza será exactamente de 30 segundos</li>
                <li>Si el resultado no es el deseado, ajusta los parámetros musicales y regenera</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
