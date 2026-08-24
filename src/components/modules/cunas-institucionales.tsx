'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Radio, Loader2, Copy, Check, Sparkles as SparklesIcon, Info, Music2 } from 'lucide-react';
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
import { useAppStore } from '@/lib/store';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const TIPO_OPTIONS = [
  { value: 'unitario', label: 'Unitario', desc: 'Genera una sola cuña' },
  { value: 'campaña', label: 'Campaña Publicitaria', desc: 'Genera de 3 a 5 cuñas' },
  { value: 'jingle', label: 'Jingle', desc: 'Canción con rima + locución de complemento' },
];

const CLASE_OPTIONS = [
  { value: 'para-programa', label: 'Para Programa' },
  { value: 'para-franja', label: 'Para Franja' },
  { value: 'campaña-institucional', label: 'Campaña Institucional' },
];

const DURACION_OPTIONS = [
  { value: '30-40', label: '30 a 40 segundos' },
  { value: '50-60', label: '50 a 60 segundos' },
];

const DURACION_JINGLE_OPTIONS = [
  { value: '15-20', label: '15 a 20 segundos' },
  { value: '20-30', label: '20 a 30 segundos' },
  { value: '30-40', label: '30 a 40 segundos' },
];

const TEMATICA_OPTIONS = [
  { value: 'expectativa', label: 'Expectativa' },
  { value: 'llamada-accion', label: 'Llamada a la Acción (Escuchar)' },
  { value: 'recordacion-marca', label: 'Recordación de Marca' },
  { value: 'horario-emision', label: 'Horario de Emisión' },
  { value: 'tematica-franja-programa', label: 'Temática de la Franja o Programa' },
  { value: 'campaña', label: 'Campaña' },
];

const RIMA_OPTIONS = [
  { value: 'AABB', label: 'Rima Gemela / Pareada (AABB)', desc: 'Dos versos seguidos riman entre sí, luego los siguientes dos' },
  { value: 'ABAB', label: 'Rima Cruzada / Alterna (ABAB)', desc: 'El primer verso rima con el tercero, el segundo con el cuarto' },
  { value: 'ABBA', label: 'Rima Abrazada (ABBA)', desc: 'El primero rima con el cuarto, el segundo con el tercero' },
  { value: 'AAAA', label: 'Rima Continua (AAAA)', desc: 'Todos los versos de la estrofa riman entre sí' },
  { value: 'interna', label: 'Rima Interna', desc: 'Una palabra del medio del verso rima con la palabra final del mismo verso' },
];

const ESTROFAS_OPTIONS = [
  { value: '2', label: '2 estrofas (corto)' },
  { value: '3', label: '3 estrofas (medio)' },
  { value: '4', label: '4 estrofas (completo)' },
];

const isJingle = (tipo: string) => tipo === 'jingle';

interface FormData {
  tipo: string;
  clase: string;
  duracion: string;
  tematica: string;
  tipoRima: string;
  numeroEstrofas: string;
  nombreCuña: string;
  nombrePrograma: string;
  horarioEmision: string;
  objetivo: string;
  mensajeResaltar: string;
}

const INITIAL_FORM: FormData = {
  tipo: '',
  clase: '',
  duracion: '',
  tematica: '',
  tipoRima: '',
  numeroEstrofas: '',
  nombreCuña: '',
  nombrePrograma: '',
  horarioEmision: '',
  objetivo: '',
  mensajeResaltar: '',
};

function buildPrompt(form: FormData): string {
  const tipoLabel = TIPO_OPTIONS.find((t) => t.value === form.tipo)?.label || form.tipo;
  const claseLabel = CLASE_OPTIONS.find((c) => c.value === form.clase)?.label || form.clase;
  const isJ = isJingle(form.tipo);
  const duracionOpts = isJ ? DURACION_JINGLE_OPTIONS : DURACION_OPTIONS;
  const duracionLabel = duracionOpts.find((d) => d.value === form.duracion)?.label || form.duracion;
  const tematicaLabel = TEMATICA_OPTIONS.find((t) => t.value === form.tematica)?.label || form.tematica;
  const rimaLabel = RIMA_OPTIONS.find((r) => r.value === form.tipoRima)?.label || form.tipoRima;

  const lines: string[] = [];

  lines.push(`TIPO: ${tipoLabel}`);

  if (isJ) {
    lines.push('FORMATO: JINGLE - Genera una pieza que contiene DOS partes:');
    lines.push('  PARTE 1 - CANTO: Letra rimada que se canta, siguiendo el esquema de rima indicado.');
    lines.push('  PARTE 2 - LOCUCION: Texto hablado de complemento que refuerza el mensaje del canto.');
    lines.push('CANTIDAD: Genera un solo jingle.');
    lines.push(`ESQUEMA DE RIMA: ${rimaLabel}`);
    lines.push(`NUMERO DE ESTROFAS DEL CANTO: ${form.numeroEstrofas || 'No especificado'}`);
  } else if (form.tipo === 'campaña') {
    lines.push('CANTIDAD: Genera entre 3 y 5 cuñas para esta campaña.');
  } else {
    lines.push('CANTIDAD: Genera una sola cuña unitaria.');
  }

  if (!isJ) {
    lines.push(`CLASE: ${claseLabel}`);
  }

  if (form.clase === 'campaña-institucional') {
    lines.push('CIERRE OBLIGATORIO: Cada libreto debe terminar exactamente con la frase: "Una Campaña de Voces Campesinas Punto Co".');
  }

  lines.push(`DURACION: ${duracionLabel}`);

  if (!isJ) {
    lines.push(`TEMATICA: ${tematicaLabel}`);
  }

  lines.push('');
  lines.push('--- DATOS GENERALES ---');
  if (form.nombreCuña.trim()) {
    lines.push(`Nombre de la ${isJ ? 'Pieza' : 'Cuña'}: ${form.nombreCuña.trim()}`);
  }
  if (form.nombrePrograma.trim()) {
    lines.push(`Nombre del Programa, Campaña o Franja: ${form.nombrePrograma.trim()}`);
  }
  if (form.horarioEmision.trim()) {
    lines.push(`Horario de Emision: ${form.horarioEmision.trim()}`);
  }

  lines.push('');
  lines.push('--- OBJETIVO ---');
  lines.push(form.objetivo.trim() || '(No especificado)');

  lines.push('');
  lines.push('--- MENSAJE A RESALTAR ---');
  lines.push(form.mensajeResaltar.trim() || '(No especificado)');

  return lines.join('\n');
}

export function CunasInstitucionalesGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isJ = isJingle(form.tipo);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTipoChange = (value: string) => {
    const wasJingle = isJ;
    const willBeJingle = isJingle(value);
    setForm((prev) => ({
      ...prev,
      tipo: value,
      ...(wasJingle !== willBeJingle ? { clase: '', duracion: '', tematica: '', tipoRima: '', numeroEstrofas: '' } : {}),
    }));
  };

  const isFormValid = isJ
    ? form.tipo && form.duracion && form.tipoRima && form.numeroEstrofas
    : form.tipo && form.clase && form.duracion && form.tematica;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      const prompt = buildPrompt(form);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId: 'cunas-institucionales', prompt }),
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
    [form, isFormValid, isGenerating, setGenerating]
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = result;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setError(null);
  };

  const getSubmitLabel = () => {
    if (form.tipo === 'campaña') return 'Generar Campaña (3-5 Cuñas)';
    if (isJ) return 'Generar Jingle';
    return 'Generar Cuña';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Module Header */}
        <div className="flex items-start gap-4">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${isJ ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'}`}>
            {isJ ? <Music2 className="size-6" /> : <Radio className="size-6" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Cuñas Institucionales
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isJ
                ? 'Jingle institucional: canción con rima + locución de complemento.'
                : 'Cuñas, campañas y locución institucional. Formulario especializado para generar libretos de locución limpios.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Tipo + (Clase or Rima) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-sm font-medium">
                Tipo
              </Label>
              <Select value={form.tipo} onValueChange={handleTipoChange}>
                <SelectTrigger id="tipo" className="w-full">
                  <SelectValue placeholder="Selecciona tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.desc}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isJ ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="tipoRima" className="text-sm font-medium">
                    Esquema de Rima <span className="text-red-500">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px] text-xs">
                      Define cómo riman los versos del canto del jingle. Cada esquema produce un ritmo y sensación diferente.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.tipoRima} onValueChange={(v) => updateField('tipoRima', v)}>
                  <SelectTrigger id="tipoRima" className="w-full">
                    <SelectValue placeholder="Selecciona rima..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RIMA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex flex-col">
                          <span>{opt.label}</span>
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="clase" className="text-sm font-medium">
                    Clase
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] text-xs">
                      Si seleccionas &quot;Campaña Institucional&quot;, cada libreto terminará con &quot;Una Campaña de Voces Campesinas Punto Co&quot;.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.clase} onValueChange={(v) => updateField('clase', v)}>
                  <SelectTrigger id="clase" className="w-full">
                    <SelectValue placeholder="Selecciona clase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Row 2: Duración + (Temática or Estrofas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion" className="text-sm font-medium">
                Duración
              </Label>
              <Select value={form.duracion} onValueChange={(v) => updateField('duracion', v)}>
                <SelectTrigger id="duracion" className="w-full">
                  <SelectValue placeholder="Selecciona duración..." />
                </SelectTrigger>
                <SelectContent>
                  {(isJ ? DURACION_JINGLE_OPTIONS : DURACION_OPTIONS).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isJ ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="numeroEstrofas" className="text-sm font-medium">
                    Estrofas del Canto <span className="text-red-500">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      Cantidad de estrofas que tendrá la parte cantada del jingle. Más estrofas = jingle más largo.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.numeroEstrofas} onValueChange={(v) => updateField('numeroEstrofas', v)}>
                  <SelectTrigger id="numeroEstrofas" className="w-full">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTROFAS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="tematica" className="text-sm font-medium">
                  Temática
                </Label>
                <Select value={form.tematica} onValueChange={(v) => updateField('tematica', v)}>
                  <SelectTrigger id="tematica" className="w-full">
                    <SelectValue placeholder="Selecciona temática..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMATICA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Jingle Indicator */}
          {isJ && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/40">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Formato de Jingle
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-300 mb-2">
                El jingle se compone de dos partes:
              </p>
              <ol className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-decimal list-inside">
                <li><strong>CANTO:</strong> Letra rimada ({form.tipoRima || 'esquema seleccionado'}) con {form.numeroEstrofas || '?'} estrofas. Es la parte que se canta.</li>
                <li><strong>LOCUCION:</strong> Texto hablado de complemento que refuerza el mensaje. Se dice al micrófono.</li>
              </ol>
              {form.tipoRima === 'interna' && (
                <p className="mt-2 text-xs text-purple-700 dark:text-purple-400 italic">
                  Rima interna: la palabra del medio del verso rima con la palabra final del mismo verso.
                </p>
              )}
            </div>
          )}

          {/* Separator - Datos Generales */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos Generales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreCuña" className="text-sm font-medium">
                  Nombre de la {isJ ? 'Pieza' : 'Cuña'}
                </Label>
                <Input
                  id="nombreCuña"
                  placeholder={isJ ? 'Ej: Jingle Voces Campesinas' : 'Ej: Identificación Matutina'}
                  value={form.nombreCuña}
                  onChange={(e) => updateField('nombreCuña', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombrePrograma" className="text-sm font-medium">
                  Programa / Campaña / Franja
                </Label>
                <Input
                  id="nombrePrograma"
                  placeholder="Ej: Mañanas Campesinas"
                  value={form.nombrePrograma}
                  onChange={(e) => updateField('nombrePrograma', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="horarioEmision" className="text-sm font-medium">
                  Horario de Emisión
                </Label>
                <Input
                  id="horarioEmision"
                  placeholder="Ej: Lunes a Viernes 6:00 AM - 8:00 AM"
                  value={form.horarioEmision}
                  onChange={(e) => updateField('horarioEmision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Separator - Dirección Creativa */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Dirección Creativa
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objetivo" className="text-sm font-medium">
                  Objetivo de la {isJ ? 'Pieza' : 'Cuña o Campaña'}
                </Label>
                <Textarea
                  id="objetivo"
                  placeholder={isJ
                    ? 'Ej: Crear identidad sonora para la emisora que la audiencia recuerde y repita...'
                    : '¿Qué se busca lograr con esta cuña o campaña? Ej: Informar a la audiencia sobre el nuevo horario de programas deportivos...'}
                  value={form.objetivo}
                  onChange={(e) => updateField('objetivo', e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="mensajeResaltar" className="text-sm font-medium">
                    Mensaje a Resaltar
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      {isJ
                        ? 'La frase o idea central que el canto del jingle debe repetir y grabar en la mente del oyente.'
                        : 'Este espacio orienta hacia dónde se debe dirigir el libreto. El mensaje principal que debe quedar en la mente del oyente.'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="mensajeResaltar"
                  placeholder={isJ
                    ? 'Ej: Voces Campesinas, la voz del campo colombiano...'
                    : 'Ej: La región se informa con nosotros, sintoniza la mejor programación campesina del oriente colombiano...'}
                  value={form.mensajeResaltar}
                  onChange={(e) => updateField('mensajeResaltar', e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Campaign indicator */}
          {form.tipo === 'campaña' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Modo Campaña:</strong> Se generarán entre 3 y 5 cuñas con variaciones sobre el mismo tema.
              </p>
            </div>
          )}

          {form.clase === 'campaña-institucional' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Campaña Institucional:</strong> Cada libreto cerrará con &quot;Una Campaña de Voces Campesinas Punto Co&quot;.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className={isJ ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <SparklesIcon className="size-4" />
                  {getSubmitLabel()}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isGenerating}
            >
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
                <CardTitle className="text-base">Resultado</CardTitle>
                {form.tipo === 'campaña' && (
                  <CardDescription className="mt-1">Campaña generada con múltiples cuñas</CardDescription>
                )}
                {isJ && (
                  <CardDescription className="mt-1">Jingle con canto rimado y locución</CardDescription>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className={["max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full", isJ ? "[&::-webkit-scrollbar-thumb]:bg-purple-200 [&::-webkit-scrollbar-thumb]:dark:bg-purple-800" : "[&::-webkit-scrollbar-thumb]:bg-emerald-200 [&::-webkit-scrollbar-thumb]:dark:bg-emerald-800"].join(' ')}>
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
