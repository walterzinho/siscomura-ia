'use client';

import { useState, useCallback, type FormEvent } from 'react';
import {
  Heart, Loader2, Copy, Check,
  Heart as HeartIcon, Info, Plus, X, Link2,
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
import { useAppStore } from '@/lib/store';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

const POBLACION_OPTIONS = [
  { value: 'general', label: 'Público rural general' },
  { value: 'jovenes', label: 'Jóvenes rurales' },
  { value: 'adultos-mayores', label: 'Adultos mayores del campo' },
  { value: 'mujeres', label: 'Mujeres campesinas' },
  { value: 'familias', label: 'Familias rurales' },
  { value: 'desplazados', label: 'Población desplazada / retornada' },
  { value: 'agricultores', label: 'Agricultores y ganaderos' },
];

const ENFOQUE_OPTIONS = [
  { value: 'personal', label: 'Personal (autoconocimiento, autocuidado)' },
  { value: 'familiar', label: 'Familiar (relaciones, crianza, vínculos)' },
  { value: 'comunitario', label: 'Comunitario (vecinos, junta, solidaridad)' },
  { value: 'social', label: 'Social (estigmas, políticas públicas, acceso a servicios)' },
  { value: 'integral', label: 'Integral (combinar varios enfoques)' },
];

interface FormData {
  urls: string[];
  tema: string;
  nombrePresentador: string;
  nombrePrograma: string;
  horarioEmision: string;
  horarioReemision: string;
  poblacionObjetivo: string;
  enfoqueReflexion: string;
  contextoRegional: string;
  herramientaPractica: string;
  lineasAtencion: string;
  informacionAdicional: string;
}

const INITIAL_FORM: FormData = {
  urls: [''],
  tema: '',
  nombrePresentador: '',
  nombrePrograma: '',
  horarioEmision: '',
  horarioReemision: '',
  poblacionObjetivo: '',
  enfoqueReflexion: '',
  contextoRegional: '',
  herramientaPractica: '',
  lineasAtencion: '',
  informacionAdicional: '',
};

function buildPrompt(form: FormData): string {
  const poblacionLabel = POBLACION_OPTIONS.find((p) => p.value === form.poblacionObjetivo)?.label || form.poblacionObjetivo;
  const enfoqueLabel = ENFOQUE_OPTIONS.find((e) => e.value === form.enfoqueReflexion)?.label || form.enfoqueReflexion;

  const lines: string[] = [];

  lines.push('--- TEMA A TRATAR ---');
  lines.push(form.tema.trim());

  lines.push('');
  lines.push('--- DATOS DEL PRESENTADOR ---');
  lines.push(`Nombre: ${form.nombrePresentador.trim()}`);

  lines.push('');
  lines.push('--- DATOS DEL PROGRAMA ---');
  lines.push(`Nombre del Programa: ${form.nombrePrograma.trim()}`);
  lines.push(`Horario de Emisión: ${form.horarioEmision.trim()}`);
  if (form.horarioReemision.trim()) {
    lines.push(`Reemisión: ${form.horarioReemision.trim()}`);
  }

  lines.push('');
  lines.push(`POBLACIÓN OBJETIVO: ${poblacionLabel || '(No especificada)'}`);
  lines.push(`ENFOQUE DE LA REFLEXIÓN: ${enfoqueLabel || '(No especificado)'}`);

  if (form.contextoRegional.trim()) {
    lines.push('');
    lines.push('--- CONTEXTO REGIONAL / SITUACIONAL ---');
    lines.push(form.contextoRegional.trim());
  }

  if (form.herramientaPractica.trim()) {
    lines.push('');
    lines.push('--- HERRAMIENTA O PRÁCTICA A SUGERIR ---');
    lines.push(form.herramientaPractica.trim());
  }

  if (form.lineasAtencion.trim()) {
    lines.push('');
    lines.push('--- LÍNEAS DE ATENCIÓN A MENCIONAR ---');
    lines.push(form.lineasAtencion.trim());
  }

  if (form.informacionAdicional.trim()) {
    lines.push('');
    lines.push('--- INFORMACIÓN ADICIONAL ---');
    lines.push(form.informacionAdicional.trim());
  }

  return lines.join('\n');
}

export function BienestarCampesinoGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    form.tema.trim() &&
    form.nombrePresentador.trim() &&
    form.nombrePrograma.trim() &&
    form.horarioEmision.trim();

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
            moduleId: 'bienestar-campesino',
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
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            <Heart className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Bienestar Campesino
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Reflexión de salud mental rural. Libreto de 3 a 5 minutos.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tema a tratar */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Tema de la Reflexión
            </p>
            <div className="space-y-2">
              <Label htmlFor="tema" className="text-sm font-medium">
                Tema a tratar <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="tema"
                placeholder="Ej: Cómo manejar la ansiedad cuando la cosecha no es la esperada, o cómo afrontar la soledad en zonas rurales alejadas..."
                value={form.tema}
                onChange={(e) => updateField('tema', e.target.value)}
                rows={3}
                className="resize-none"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Fuentes de información */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fuentes de Información
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[300px] text-xs">
                    URLs con artículos, estudios o datos sobre el tema de salud mental. El sistema extraerá la información para enriquecer el libreto. Puedes agregar hasta 3 fuentes.
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

          {/* Presentador + Programa */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos del Programa
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePresentador" className="text-sm font-medium">
                  Nombre del Presentador/a <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombrePresentador"
                  placeholder="Ej: Carlos Mejía"
                  value={form.nombrePresentador}
                  onChange={(e) => updateField('nombrePresentador', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombrePrograma" className="text-sm font-medium">
                  Nombre del Programa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombrePrograma"
                  placeholder="Ej: Bienestar Campesino"
                  value={form.nombrePrograma}
                  onChange={(e) => updateField('nombrePrograma', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioEmision" className="text-sm font-medium">
                  Horario de Emisión <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="horarioEmision"
                  placeholder="Ej: Miércoles 7:00 AM"
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
                  placeholder="Ej: Viernes y Domingo 7:00 AM"
                  value={form.horarioReemision}
                  onChange={(e) => updateField('horarioReemision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Población + Enfoque */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Público y Enfoque
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="poblacionObjetivo" className="text-sm font-medium">
                    Población Objetivo
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      Define a quién va dirigida la reflexión. Ajusta el vocabulario, las situaciones y los ejemplos.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.poblacionObjetivo} onValueChange={(v) => updateField('poblacionObjetivo', v)}>
                  <SelectTrigger id="poblacionObjetivo" className="w-full">
                    <SelectValue placeholder="Selecciona población..." />
                  </SelectTrigger>
                  <SelectContent>
                    {POBLACION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="enfoqueReflexion" className="text-sm font-medium">
                    Enfoque de la Reflexión
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      ¿Desde qué ángulo se aborda el tema? Influye en el desarrollo del libreto.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.enfoqueReflexion} onValueChange={(v) => updateField('enfoqueReflexion', v)}>
                  <SelectTrigger id="enfoqueReflexion" className="w-full">
                    <SelectValue placeholder="Selecciona enfoque..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ENFOQUE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contexto Regional */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contexto Regional
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Opcional. La emisora se escucha en varias partes del país. Si lo llenas, el libreto se localiza; si lo dejas vacío, será general para toda la audiencia.
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              placeholder="Ej: Estamos en temporada de cosecha de café, pero los precios están bajos y hay mucha preocupación en los municipios del sur del departamento..."
              value={form.contextoRegional}
              onChange={(e) => updateField('contextoRegional', e.target.value)}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Herramienta práctica + Líneas de atención */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Recursos y Buenas Prácticas
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="herramientaPractica" className="text-sm font-medium">
                    Herramienta o Práctica a Sugerir
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px] text-xs">
                      Si quieres que el libreto incluya una técnica o ejercicio concreto (respiración, conversación familiar, ejercicio de gratitud, etc.), descríbela aquí. Si lo dejas vacío, la IA elegirá la más adecuada según el tema.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="herramientaPractica"
                  placeholder="Ej: Ejercicio de respiración de 4-7-8 adaptado al campo: respirar mirando las montañas, contando los árboles..."
                  value={form.herramientaPractica}
                  onChange={(e) => updateField('herramientaPractica', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="lineasAtencion" className="text-sm font-medium">
                    Líneas de Atención a Mencionar
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px] text-xs">
                      Líneas telefónicas o recursos de salud mental que se mencionarán al cierre. Si lo dejas vacío, se incluirán por defecto la Línea 106 y Línea 123.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="lineasAtencion"
                  placeholder="Ej: Línea 106, Línea 123, Hospital San Vicente, Casa de la Justicia..."
                  value={form.lineasAtencion}
                  onChange={(e) => updateField('lineasAtencion', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Información Adicional
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Cualquier dato, anécdota, statistic o detalle que pueda enriquecer el libreto: cifras locales, testimonios (sin nombres), fechas importantes, etc.
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              placeholder="Ej: Según el último censo agropecuario, el 40% de los campesinos reportan sentir ansiedad frecuente. En nuestra vereda, dos familias están pasando por situaciones difíciles..."
              value={form.informacionAdicional}
              onChange={(e) => updateField('informacionAdicional', e.target.value)}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Estructura preview */}
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/40">
            <p className="text-sm font-medium text-rose-900 dark:text-rose-200 mb-2">
              Estructura del Libreto Generado
            </p>
            <ol className="text-xs text-rose-800 dark:text-rose-300 space-y-1 list-decimal list-inside">
              <li>Saludo (Corto)</li>
              <li>Introducción a la reflexión</li>
              <li>Desarrollo del tema de salud mental rural</li>
              <li>Cierre de la historia</li>
              <li>Llamado a la Acción (escuchar programa y emisora)</li>
              <li>Despedida (próxima semana + aporte a la cotidianidad)</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" /> Generando libreto...</>
              ) : (
                <><HeartIcon className="size-4" /> Generar Libreto de Bienestar</>
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
                <CardTitle className="text-base">Libreto Generado</CardTitle>
                <CardDescription className="mt-1">
                  {form.nombrePrograma || 'Bienestar Campesino'} • {form.tema.split('\n')[0].slice(0, 60)}
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
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-rose-200 [&::-webkit-scrollbar-thumb]:dark:bg-rose-800">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
