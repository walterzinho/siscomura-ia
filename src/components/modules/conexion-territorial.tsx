'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { MapPin, Link, Loader2, Copy, Check, Sparkles, CalendarDays, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/lib/store';

type DiaSeleccion = 'dia1' | 'dia2';

interface SurcoDef {
  id: string;
  nombre: string;
  tema: string;
}

const SURCOS: Record<DiaSeleccion, SurcoDef[]> = {
  dia1: [
    { id: 's1', nombre: 'La Cosecha y el Bolsillo', tema: 'Precios y plazas' },
    { id: 's2', nombre: 'Cielo, Lluvias y Vientos', tema: 'Clima regional' },
    { id: 's3', nombre: 'Oportunidades y Plazos', tema: 'Convocatorias con fecha límite' },
    { id: 's4', nombre: 'Sanidad en la Parcela', tema: 'Alertas y plagas del momento' },
    { id: 's5', nombre: 'La Voz del Territorio', tema: 'Noticia gremial y asociaciones' },
  ],
  dia2: [
    { id: 's1', nombre: 'Abonos y Suelos Vivos', tema: 'Bioinsumos y compostaje' },
    { id: 's2', nombre: 'El Ojo Técnico', tema: 'Manejo agronómico y pecuario' },
    { id: 's3', nombre: 'Tecnología del Campo', tema: 'Herramientas e innovación rural' },
    { id: 's4', nombre: 'Cuentas Claras', tema: 'Administración y costos de la finca' },
    { id: 's5', nombre: 'Tradición y Territorio', tema: 'Saberes, semillas y cultura' },
  ],
};

const DIA_META: Record<DiaSeleccion, { label: string; sub: string; color: string; bgActive: string }> = {
  dia1: {
    label: 'Día 1',
    sub: 'Coyuntural / Vigencia Corta',
    color: 'border-amber-400 text-amber-700 dark:text-amber-300',
    bgActive: 'bg-amber-50 border-amber-400 dark:bg-amber-950/40',
  },
  dia2: {
    label: 'Día 2',
    sub: 'Técnico / Tradición',
    color: 'border-emerald-400 text-emerald-700 dark:text-emerald-300',
    bgActive: 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950/40',
  },
};

type SurcoState = Record<string, { selected: boolean; url: string }>;

function buildInitialSurcos(dia: DiaSeleccion): SurcoState {
  const state: SurcoState = {};
  for (const s of SURCOS[dia]) {
    state[s.id] = { selected: true, url: '' };
  }
  return state;
}

export function ConexionTerritorialGenerator() {
  const { isGenerating, setGenerating } = useAppStore();

  const [dia, setDia] = useState<DiaSeleccion>('dia1');
  const [surcos, setSurcos] = useState<SurcoState>(buildInitialSurcos('dia1'));
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const meta = DIA_META[dia];
  const selectedCount = Object.values(surcos).filter((s) => s.selected).length;

  const handleDiaChange = useCallback((newDia: DiaSeleccion) => {
    setDia(newDia);
    setSurcos(buildInitialSurcos(newDia));
    setResult(null);
  }, []);

  const toggleSurco = useCallback((id: string) => {
    setSurcos((prev) => ({
      ...prev,
      [id]: { ...prev[id], selected: !prev[id].selected },
    }));
  }, []);

  const updateSurcoUrl = useCallback((id: string, url: string) => {
    setSurcos((prev) => ({
      ...prev,
      [id]: { ...prev[id], url },
    }));
  }, []);

  const selectAll = useCallback(() => {
    setSurcos((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = { ...next[k], selected: true };
      return next;
    });
  }, []);

  const deselectAll = useCallback(() => {
    setSurcos((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = { ...next[k], selected: false };
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (isGenerating || selectedCount === 0) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      try {
        const selected = SURCOS[dia]
          .filter((s) => surcos[s.id].selected)
          .map((s) => ({
            surco: s.id,
            nombre: s.nombre,
            tema: s.tema,
            url: surcos[s.id].url.trim(),
          }));

        const surcosText = selected
          .map((s, i) => `SURCO ${i + 1}: ${s.nombre} (${s.tema})${s.url ? ` — Fuente: ${s.url}` : ''}`)
          .join('\n');

        const diaLabel = dia === 'dia1' ? 'DÍA 1 — COYUNTURAL / VIGENCIA CORTA' : 'DÍA 2 — TÉCNICO / TRADICIÓN';

        const fullPrompt = `[${diaLabel}]

SURCOS SELECCIONADOS (${selected.length} de 5):
${surcosText}

${prompt.trim() ? `INSTRUCCIONES ADICIONALES:
${prompt.trim()}` : ''}`;

        const urls = selected.map((s) => s.url).filter(Boolean);

        const body: Record<string, unknown> = {
          moduleId: 'conexion-territorial',
          prompt: fullPrompt,
        };
        if (urls.length > 0) body.urls = urls;

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
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setGenerating(false);
      }
    },
    [dia, surcos, prompt, selectedCount, isGenerating, setGenerating]
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <MapPin className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Conexión Territorial: En 5 Surcos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecciona los surcos y vincula fuentes según la información disponible
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="size-4" />
          Día de emisión
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(DIA_META) as DiaSeleccion[]).map((key) => {
            const d = DIA_META[key];
            const active = dia === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDiaChange(key)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  active
                    ? `${d.bgActive} ${d.color} ring-2 ring-offset-1 ring-current`
                    : 'border-border bg-card hover:border-muted-foreground/30'
                }`}
              >
                <p className="font-bold text-base">{d.label}</p>
                <p className={`text-xs mt-0.5 ${active ? 'opacity-80' : 'text-muted-foreground'}`}>{d.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Surcos Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <GripVertical className="size-4" />
            Surcos del {meta.label}{' '}
            <span className="text-muted-foreground font-normal">
              ({selectedCount}/5 seleccionados)
            </span>
          </Label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
              Todos
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={deselectAll} className="text-xs h-7">
              Ninguno
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {SURCOS[dia].map((surco, idx) => {
            const state = surcos[surco.id];
            const isActive = state.selected;
            return (
              <div
                key={surco.id}
                className={`rounded-lg border-2 p-3 transition-all ${
                  isActive
                    ? `${meta.bgActive} ${meta.color}`
                    : 'border-border bg-card opacity-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isActive}
                    onCheckedChange={() => toggleSurco(surco.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold">S{idx + 1}</span>
                      <span className="text-sm font-semibold">{surco.nombre}</span>
                    </div>
                    <p className="text-xs mt-0.5 opacity-70">{surco.tema}</p>

                    {isActive && (
                      <div className="mt-2 relative">
                        <Link className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="url"
                          value={state.url}
                          onChange={(e) => updateSurcoUrl(surco.id, e.target.value)}
                          placeholder={`Fuente para: ${surco.nombre} (opcional)`}
                          className="pl-9 h-8 text-xs"
                          disabled={isGenerating}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Prompt */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ct-prompt">Instrucciones adicionales</Label>
          <Textarea
            id="ct-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Región, enfoque específico, datos del territorio, estilo del locutor..."
            rows={3}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>

        <Button
          type="submit"
          disabled={isGenerating || selectedCount === 0}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto sm:justify-start"
        >
          {isGenerating ? (
            <><Loader2 className="size-4 animate-spin" /> Generando {meta.label}...</>
          ) : (
            <><Sparkles className="size-4" /> Generar {meta.label} ({selectedCount} surco{selectedCount !== 1 ? 's' : ''})</>
          )}
        </Button>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
          <p className="font-medium">Error</p><p className="mt-1">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <CardTitle className="text-base">{meta.label} — {meta.sub}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
              {copied ? (<><Check className="size-3.5" /><span>Copiado</span></>) : (<><Copy className="size-3.5" /><span>Copiar</span></>)}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-200 [&::-webkit-scrollbar-thumb]:dark:bg-emerald-800">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
