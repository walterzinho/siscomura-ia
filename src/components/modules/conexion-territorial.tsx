'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { MapPin, Link, Loader2, Copy, Check, Sparkles, Plus, X, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';

type DiaSeleccion = 'dia1' | 'dia2';

const MAX_URLS = 5;

const DIA_INFO: Record<DiaSeleccion, { label: string; sub: string; color: string; surcos: string[] }> = {
  dia1: {
    label: 'Día 1',
    sub: 'Coyuntural / Vigencia Corta',
    color: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
    surcos: [
      'La Cosecha y el Bolsillo (Precios y plazas)',
      'Cielo, Lluvias y Vientos (Clima regional)',
      'Oportunidades y Plazos (Convocatorias con fecha límite)',
      'Sanidad en la Parcela (Alertas y plagas)',
      'La Voz del Territorio (Noticia gremial y asociaciones)',
    ],
  },
  dia2: {
    label: 'Día 2',
    sub: 'Técnico / Tradición',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
    surcos: [
      'Abonos y Suelos Vivos (Bioinsumos y compostaje)',
      'El Ojo Técnico (Manejo agronómico y pecuario)',
      'Tecnología del Campo (Herramientas e innovación rural)',
      'Cuentas Claras (Administración y costos de la finca)',
      'Tradición y Territorio (Saberes, semillas y cultura)',
    ],
  },
};

export function ConexionTerritorialGenerator() {
  const { isGenerating, setGenerating } = useAppStore();

  const [dia, setDia] = useState<DiaSeleccion>('dia1');
  const [urls, setUrls] = useState<string[]>(['', '']);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const diaData = DIA_INFO[dia];
  const validUrls = urls.filter((u) => u.trim().length > 0);

  const updateUrl = useCallback((index: number, value: string) => {
    setUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeUrl = useCallback((index: number) => {
    setUrls((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const addUrl = useCallback(() => {
    if (urls.length >= MAX_URLS) return;
    setUrls((prev) => [...prev, '']);
  }, [urls.length]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      try {
        const diaPrefix = dia === 'dia1'
          ? '[DÍA 1 - COYUNTURAL / VIGENCIA CORTA]'
          : '[DÍA 2 - TÉCNICO / TRADICIÓN]';

        const fullPrompt = `${diaPrefix}\n${prompt.trim()}`;

        const body: Record<string, unknown> = {
          moduleId: 'conexion-territorial',
          prompt: fullPrompt,
        };

        if (validUrls.length > 0) {
          body.urls = validUrls.map((u) => u.trim());
        }

        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
    [dia, prompt, validUrls, isGenerating, setGenerating]
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Module Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <MapPin className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Conexión Territorial: En 5 Surcos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Informativo radial del territorio — 2 días a la semana con temática diferenciada
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4" />
          Seleccionar día de emisión
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(DIA_INFO) as DiaSeleccion[]).map((key) => {
            const d = DIA_INFO[key];
            const isSelected = dia === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDia(key)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? `${d.color} ring-2 ring-offset-1 ring-current`
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <p className="font-bold text-base">{d.label}</p>
                <p className={`text-xs mt-0.5 ${isSelected ? 'opacity-80' : 'text-muted-foreground'}`}>
                  {d.sub}
                </p>
              </button>
            );
          })}
        </div>

        {/* Surcos preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Surcos del {diaData.label}: {diaData.sub}
          </p>
          <ol className="space-y-1">
            {diaData.surcos.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex gap-2">
                <span className="font-mono text-muted-foreground shrink-0">S{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Inputs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Fuentes / URLs de referencia (opcional)</Label>
            <span className="text-xs text-muted-foreground">
              {validUrls.length}/{MAX_URLS}
            </span>
          </div>

          <div className="space-y-2">
            {urls.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    value={value}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    placeholder={`URL de fuente ${index + 1}`}
                    className="pl-10"
                    disabled={isGenerating}
                  />
                </div>
                {urls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrl(index)}
                    disabled={isGenerating}
                    className="shrink-0 text-muted-foreground hover:text-red-500"
                    aria-label={`Eliminar URL ${index + 1}`}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {urls.length < MAX_URLS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrl}
              disabled={isGenerating}
              className="gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Plus className="size-3.5" />
              Agregar otra URL
            </Button>
          )}
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="ct-prompt">Instrucciones adicionales</Label>
          <Textarea
            id="ct-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Región, enfoque específico, datos adicionales, estilo del locutor...'
            rows={3}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>

        <Button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto sm:justify-start"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generando {diaData.label}...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generar {diaData.label}
            </>
          )}
        </Button>
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
            <CardTitle className="text-base">
              {diaData.label} — {diaData.sub}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
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
  );
}
