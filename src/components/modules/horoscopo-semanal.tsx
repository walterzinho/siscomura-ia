'use client';

import { useState, useCallback, type FormEvent } from 'react';
import {
  Sparkles, Loader2, Copy, Check,
  Sparkles as SparklesIcon, Info, Plus, X, Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/lib/store';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

const COMPETENCIAS_OPTIONS = [
  { value: 'tarot', label: 'Tarot' },
  { value: 'angeles', label: 'Ñngeles' },
  { value: 'runas', label: 'Runas' },
  { value: 'numerologia', label: 'Numerología' },
  { value: 'astrologia-china', label: 'Astrología China' },
  { value: 'cartas-nativas', label: 'Cartas Nativas' },
];

const LENGUAJE_OPTIONS = [
  { value: 'esoterico', label: 'Esotérico' },
  { value: 'comun', label: 'Común' },
  { value: 'cercano', label: 'Cercano' },
  { value: 'rural', label: 'Orientado al oyente rural' },
  { value: 'sin-exagerar', label: 'Sin exagerar' },
];

interface FormData {
  urls: string[];
  nombrePresentador: string;
  competencias: string[];
  nombrePrograma: string;
  horarioEmision: string;
  horarioReemision: string;
  fechaInicio: string;
  fechaFin: string;
  lenguaje: string;
  temaMotivacion: string;
  temaProyeccionEmocional: string;
  temaEsperanza: string;
  temaLlamadoAccion: string;
}

const INITIAL_FORM: FormData = {
  urls: [''],
  nombrePresentador: '',
  competencias: [],
  nombrePrograma: '',
  horarioEmision: '',
  horarioReemision: '',
  fechaInicio: '',
  fechaFin: '',
  lenguaje: '',
  temaMotivacion: '',
  temaProyeccionEmocional: '',
  temaEsperanza: '',
  temaLlamadoAccion: '',
};

function buildPrompt(form: FormData): string {
  const lenguajeLabel = LENGUAJE_OPTIONS.find((l) => l.value === form.lenguaje)?.label || form.lenguaje;
  const compLabels = form.competencias
    .map((c) => COMPETENCIAS_OPTIONS.find((o) => o.value === c)?.label || c)
    .join(', ');

  const lines: string[] = [];

  lines.push('--- DATOS DEL PRESENTADOR ---');
  if (form.nombrePresentador.trim()) {
    lines.push(`Nombre: ${form.nombrePresentador.trim()}`);
  }
  if (compLabels) {
    lines.push(`Competencias esotéricas: ${compLabels}`);
  }

  lines.push('');
  lines.push('--- DATOS DEL PROGRAMA ---');
  if (form.nombrePrograma.trim()) {
    lines.push(`Nombre del Programa: ${form.nombrePrograma.trim()}`);
  }
  if (form.horarioEmision.trim()) {
    lines.push(`Horario de Emisión: ${form.horarioEmision.trim()}`);
  }
  if (form.horarioReemision.trim()) {
    lines.push(`Horario de Reemisión: ${form.horarioReemision.trim()}`);
  }

  lines.push('');
  lines.push('--- PERIODO ---');
  if (form.fechaInicio.trim()) {
    lines.push(`Fecha inicio de la semana: ${form.fechaInicio.trim()}`);
  }
  if (form.fechaFin.trim()) {
    lines.push(`Fecha fin de la semana: ${form.fechaFin.trim()}`);
  }

  lines.push('');
  lines.push(`LENGUAJE: ${lenguajeLabel || '(No especificado)'}`);

  lines.push('');
  lines.push('--- TEMAS DE LOS MENSAJES ---');
  lines.push(`Tema del Mensaje 4 (Motivación): ${form.temaMotivacion.trim() || '(No especificado)'}`);
  lines.push(`Tema del Mensaje 6 (Proyección Emocional): ${form.temaProyeccionEmocional.trim() || '(No especificado)'}`);
  lines.push(`Tema del Mensaje 8 (Esperanza y Fortalecimiento): ${form.temaEsperanza.trim() || '(No especificado)'}`);
  lines.push(`Tema del Mensaje 9 (Llamado a la Acción y Despedida): ${form.temaLlamadoAccion.trim() || '(No especificado)'}`);

  return lines.join('\n');
}

export function HoroscopoSemanalGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCompetencia = (value: string) => {
    setForm((prev) => ({
      ...prev,
      competencias: prev.competencias.includes(value)
        ? prev.competencias.filter((c) => c !== value)
        : [...prev.competencias, value],
    }));
  };

  const addUrl = () => {
    if (form.urls.length < 3) {
      setForm((prev) => ({ ...prev, urls: [...prev.urls, ''] }));
    }
  };

  const removeUrl = (index: number) => {
    setForm((prev) => ({
      ...prev,
      urls: prev.urls.filter((_, i) => i !== index),
    }));
  };

  const updateUrl = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      urls: prev.urls.map((u, i) => (i === index ? value : u)),
    }));
  };

  const validUrls = form.urls.filter((u) => u.trim());
  const isFormValid =
    form.nombrePresentador.trim() &&
    form.nombrePrograma.trim() &&
    form.horarioEmision.trim() &&
    form.fechaInicio.trim() &&
    form.fechaFin.trim() &&
    form.lenguaje &&
    form.competencias.length > 0;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      const prompt = buildPrompt(form);
      const urls = validUrls;

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: 'horoscopo-semanal',
            prompt,
            urls: urls.length > 0 ? urls : undefined,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }

        const data = await res.json();
        setResult(data.result ?? data.text ?? data.content ?? 'Sin resultado');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado al generar contenido');
      } finally {
        setGenerating(false);
      }
    },
    [form, validUrls, isFormValid, isGenerating, setGenerating],
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Sparkles className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Horóscopo Semanal
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Guión radial de 10 puntos con lecturas para los 12 signos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Fuentes */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fuentes de Horóscopo
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px] text-xs">
                    URLs de sitios web con predicciones astrales. El sistema extraerá el contenido para adaptarlo al guión. Puedes agregar hasta 3 fuentes.
                  </TooltipContent>
                </Tooltip>
              </div>
              {form.urls.length < 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUrl}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="size-3" /> Agregar fuente
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {form.urls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder={`URL de fuente ${i + 1} (opcional)`}
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      disabled={isGenerating}
                      className="pl-8"
                    />
                  </div>
                  {form.urls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUrl(i)}
                      disabled={isGenerating}
                      className="shrink-0 text-muted-foreground hover:text-red-500"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Presentador + Lenguaje */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Presentador
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePresentador" className="text-sm font-medium">
                  Nombre del Presentador/a
                </Label>
                <Input
                  id="nombrePresentador"
                  placeholder="Ej: Selena Nobelis Álvarez"
                  value={form.nombrePresentador}
                  onChange={(e) => updateField('nombrePresentador', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lenguaje" className="text-sm font-medium">
                  Lenguaje
                </Label>
                <Select value={form.lenguaje} onValueChange={(v) => updateField('lenguaje', v)}>
                  <SelectTrigger id="lenguaje" className="w-full">
                    <SelectValue placeholder="Selecciona lenguaje..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGUAJE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Competencias Esotéricas */}
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium">Competencias Esotéricas</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    Selecciona las disciplinas que respaldan al presentador. Influyen en el vocabulario y enfoque del guión.
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {COMPETENCIAS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={form.competencias.includes(opt.value)}
                      onCheckedChange={() => toggleCompetencia(opt.value)}
                      disabled={isGenerating}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Datos del Programa */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos del Programa
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nombrePrograma" className="text-sm font-medium">
                  Nombre del Programa
                </Label>
                <Input
                  id="nombrePrograma"
                  placeholder="Ej: Voces del Cosmos"
                  value={form.nombrePrograma}
                  onChange={(e) => updateField('nombrePrograma', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioEmision" className="text-sm font-medium">
                  Horario de Emisión
                </Label>
                <Input
                  id="horarioEmision"
                  placeholder="Ej: Martes 6:10 AM"
                  value={form.horarioEmision}
                  onChange={(e) => updateField('horarioEmision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioReemision" className="text-sm font-medium">
                  Reemisión
                </Label>
                <Input
                  id="horarioReemision"
                  placeholder="Ej: Jueves y Sábados 6:10 AM"
                  value={form.horarioReemision}
                  onChange={(e) => updateField('horarioReemision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Periodo */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Periodo de la Semana
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-sm font-medium">
                  Fecha Inicio
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => updateField('fechaInicio', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFin" className="text-sm font-medium">
                  Fecha Fin
                </Label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => updateField('fechaFin', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Temas de los Mensajes */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Temas de los Mensajes
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Cada mensaje intercalado entre los signos lleva una temática específica que tú defines. Estos mensajes son los puntos 4, 6, 8 y 9 de la estructura del guión.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="temaMotivacion" className="text-sm font-medium">
                  4. Tema de Motivación
                </Label>
                <Textarea
                  id="temaMotivacion"
                  placeholder="Ej: La importance de sembrar con fe y paciencia, confiando en que la tierra siempre devuelve lo que se le entrega..."
                  value={form.temaMotivacion}
                  onChange={(e) => updateField('temaMotivacion', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temaProyeccion" className="text-sm font-medium">
                  6. Tema de Proyección Emocional
                </Label>
                <Textarea
                  id="temaProyeccion"
                  placeholder="Ej: Cómo manejar la tristeza y la nostalgia del campo cuando se está en la ciudad..."
                  value={form.temaProyeccionEmocional}
                  onChange={(e) => updateField('temaProyeccionEmocional', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temaEsperanza" className="text-sm font-medium">
                  8. Tema de Esperanza y Fortalecimiento
                </Label>
                <Textarea
                  id="temaEsperanza"
                  placeholder="Ej: La resiliencia del campesino que vuelve a sembrar después de la sequía..."
                  value={form.temaEsperanza}
                  onChange={(e) => updateField('temaEsperanza', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temaLlamado" className="text-sm font-medium">
                  9. Tema del Llamado a la Acción
                </Label>
                <Textarea
                  id="temaLlamado"
                  placeholder="Ej: Invitar a sintonizar el programa completo, seguir la página y compartir el horóscopo con la familia..."
                  value={form.temaLlamadoAccion}
                  onChange={(e) => updateField('temaLlamadoAccion', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Structure preview */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200 mb-2">
              Estructura del Guión Generado
            </p>
            <ol className="text-xs text-emerald-800 dark:text-emerald-300 space-y-1 list-decimal list-inside">
              <li>Saludo (Corto)</li>
              <li>Introducción al horóscopo semanal</li>
              <li>4 Primeros signos (Aries, Tauro, Géminis, Cáncer)</li>
              <li>Mensaje de Motivación</li>
              <li>4 Segundos signos (Leo, Virgo, Libra, Escorpio)</li>
              <li>Mensaje de Proyección Emocional</li>
              <li>4 Últimos signos (Sagitario, Capricornio, Acuario, Piscis)</li>
              <li>Mensaje de Esperanza y Fortalecimiento</li>
              <li>Llamado a la Acción (escuchar programa y emisora)</li>
              <li>Despedida (próxima semana + aporte a la cotidianidad)</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" /> Generando guión...</>
              ) : (
                <><SparklesIcon className="size-4" /> Generar Horóscopo Semanal</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset} disabled={isGenerating}>
              Limpiar Formulario
            </Button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
              <div className="min-w-0">
                <CardTitle className="text-base">Guión Generado</CardTitle>
                <CardDescription className="mt-1">
                  {form.nombrePrograma || 'Horóscopo Semanal'} {form.fechaInicio && form.fechaFin ? `• ${form.fechaInicio} al ${form.fechaFin}` : ''}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
                {copied ? (
                  <><Check className="size-3.5" /><span>Copiado</span></>
                ) : (
                  <><Copy className="size-3.5" /><span>Copiar</span></>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-200 [&::-webkit-scrollbar-thumb]:dark:bg-emerald-800">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
