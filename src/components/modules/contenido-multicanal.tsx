'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Globe, Loader2, Copy, Check, Sparkles as SparklesIcon,
  Radio, Zap, Search, Image as ImageIcon, Share2,
  RotateCcw, Lock, CheckCircle2,
  Circle, ArrowRight, Info, Link, FileEdit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const PHASES = [
  { id: 0, key: 'noticia', name: 'Noticia Radio',        description: 'Genera la noticia completa para radio a partir del contexto fuente.',          icon: Radio },
  { id: 1, key: 'flashes', name: 'Flashes Informativos',    description: 'Crea 3 libretos tipo Flash Informativo a partir de la noticia generada.',       icon: Zap },
  { id: 2, key: 'seo',     name: 'Articulo SEO',             description: 'Genera un articulo de blog optimizado para buscadores a partir de la noticia.',   icon: Search },
  { id: 3, key: 'imagenes', name: 'Prompts de Imagenes',     description: 'Genera 3 prompts detallados para imagenes fotorrealistas a partir de la noticia.', icon: ImageIcon },
  { id: 4, key: 'redes',   name: 'Publicaciones Redes',     description: 'Genera posts para Facebook, Instagram, X/Twitter y WhatsApp con hashtags.',        icon: Share2 },
] as const;

const TONO_OPTIONS = [
  { value: 'informativo',     label: 'Informativo',     desc: 'Objetivo, neutral y directo' },
  { value: 'analitico',      label: 'Analitico',      desc: 'Profundiza en causas y contexto' },
  { value: 'sensibilizador', label: 'Sensibilizador', desc: 'Emotivo, cercano a la comunidad' },
  { value: 'educativo',      label: 'Educativo',      desc: 'Explica conceptos, orienta a la audiencia' },
];

const PHASE_LABELS: Record<number, string> = {
  0: 'Generar Noticia',
  1: 'Generar Flashes',
  2: 'Generar Articulo SEO',
  3: 'Generar Prompts de Imagenes',
  4: 'Generar Publicaciones',
};

/* ------------------------------------------------------------------ */
/*  BUILD PROMPT (pure function)                                      */
/* ------------------------------------------------------------------ */

function buildPrompt(
  phase: number,
  sourceContext: string,
  tono: string,
  phaseResults: Record<number, string>,
): string {
  const tonoLabel = TONO_OPTIONS.find((t) => t.value === tono)?.label ?? 'Informativo';
  let prompt = '';

  switch (phase) {
    case 0:
      prompt = [
        `CONTEXTO FUENTE:`,
        sourceContext,
        '',
        `TONO: ${tonoLabel}`,
        '',
        `FASE ACTUAL: Fase 1 — Noticia Radio`,
        `Genera la noticia radial completa a partir del contexto fuente proporcionado. Sigue las instrucciones de la FASE 1 del sistema.`,
      ].join('\n');
      break;
    case 1:
      prompt = [
        `NOTICIA GENERADA (Fase 1):`,
        phaseResults[0],
        '',
        `TONO: ${tonoLabel}`,
        '',
        `FASE ACTUAL: Fase 2 — Flashes Informativos`,
        `A partir de la noticia generada arriba, crea 3 libretos tipo Flash Informativo para radio. Sigue las instrucciones de la FASE 2 del sistema.`,
      ].join('\n');
      break;
    case 2:
      prompt = [
        `NOTICIA GENERADA (Fase 1):`,
        phaseResults[0],
        '',
        `TONO: ${tonoLabel}`,
        '',
        `FASE ACTUAL: Fase 3 — Articulo SEO`,
        `A partir de la noticia generada arriba, genera un articulo de blog optimizado para buscadores. Sigue las instrucciones de la FASE 3 del sistema.`,
      ].join('\n');
      break;
    case 3:
      prompt = [
        `NOTICIA GENERADA (Fase 1):`,
        phaseResults[0],
        '',
        `TONO: ${tonoLabel}`,
        '',
        `FASE ACTUAL: Fase 4 — Prompts de Imagenes`,
        `A partir de la noticia generada arriba, genera 3 prompts detallados para imagenes fotorrealistas. Sigue las instrucciones de la FASE 4 del sistema.`,
      ].join('\n');
      break;
    case 4:
      prompt = [
        `NOTICIA GENERADA (Fase 1):`,
        phaseResults[0],
        '',
        `TONO: ${tonoLabel}`,
        '',
        `FASE ACTUAL: Fase 5 — Publicaciones Redes Sociales`,
        `A partir de la noticia generada arriba, genera publicaciones para multiples redes sociales. Sigue las instrucciones de la FASE 5 del sistema.`,
      ].join('\n');
      break;
  }

  return prompt;
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export function ContenidoMulticanalGenerator() {
  const { isGenerating, setGenerating } = useAppStore();

  /* local state */
  const [sourceMode, setSourceMode] = useState<'texto' | 'url'>('texto');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceContext, setSourceContext] = useState('');
  const [sourceTitle, setSourceTitle] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchUrlError, setFetchUrlError] = useState<string | null>(null);
  const [tono, setTono] = useState('informativo');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseResults, setPhaseResults] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [copiedPhase, setCopiedPhase] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  /* derived */
  const completedCount = useMemo(
    () => Object.keys(phaseResults).length,
    [phaseResults],
  );

  const allDone = completedCount === PHASES.length;

  const canGenerateCurrent = useMemo(() => {
    if (isGenerating) return false;
    if (currentPhase === 0) return sourceContext.trim().length > 0;
    return phaseResults[currentPhase - 1] !== undefined;
  }, [isGenerating, currentPhase, sourceContext, phaseResults]);

  const isPhaseUnlocked = useCallback(
    (phaseId: number) => {
      if (phaseId === 0) return true;
      return phaseResults[phaseId - 1] !== undefined;
    },
    [phaseResults],
  );

  /* fetch URL content */
  const handleFetchUrl = useCallback(async () => {
    const trimmed = sourceUrl.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setFetchUrlError('Ingresa una URL valida (http o https)');
      return;
    }
    setIsFetchingUrl(true);
    setFetchUrlError(null);
    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cargar la URL');
      setSourceTitle(data.title ?? '');
      setSourceContext(data.text);
    } catch (err) {
      setFetchUrlError(err instanceof Error ? err.message : 'Error inesperado al cargar la URL');
    } finally {
      setIsFetchingUrl(false);
    }
  }, [sourceUrl]);

  /* handlers */
  const handleGenerate = useCallback(async () => {
    if (!canGenerateCurrent) return;
    setGenerating(true);
    setError(null);

    const prompt = buildPrompt(currentPhase, sourceContext, tono, phaseResults);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: 'noticias-multicanal', prompt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      const text = data.result ?? data.text ?? data.content ?? 'Sin resultado';

      setPhaseResults((prev) => ({ ...prev, [currentPhase]: text }));

      /* auto-advance */
      if (currentPhase < PHASES.length - 1) {
        setCurrentPhase(currentPhase + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado al generar contenido');
    } finally {
      setGenerating(false);
    }
  }, [canGenerateCurrent, currentPhase, sourceContext, tono, phaseResults, setGenerating]);

  const handleRegenerate = useCallback(
    async (phaseId: number) => {
      if (isGenerating) return;
      setGenerating(true);
      setError(null);
      setCurrentPhase(phaseId);

      const prompt = buildPrompt(phaseId, sourceContext, tono, phaseResults);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId: 'noticias-multicanal', prompt }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }

        const data = await res.json();
        const text = data.result ?? data.text ?? data.content ?? 'Sin resultado';
        setPhaseResults((prev) => ({ ...prev, [phaseId]: text }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado');
      } finally {
        setGenerating(false);
      }
    },
    [isGenerating, sourceContext, tono, phaseResults, setGenerating],
  );

  const handleCopyPhase = useCallback(async (phaseId: number) => {
    const text = phaseResults[phaseId];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPhase(phaseId);
      setTimeout(() => setCopiedPhase(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedPhase(phaseId);
      setTimeout(() => setCopiedPhase(null), 2000);
    }
  }, [phaseResults]);

  const handleCopyAll = useCallback(async () => {
    const lines: string[] = [
      `CONTENIDO MULTICANAL — ${new Date().toLocaleDateString('es-CO')}`,
      '='.repeat(50),
      '',
    ];

    for (const phase of PHASES) {
      const content = phaseResults[phase.id];
      if (!content) continue;
      lines.push(`FASE ${phase.id + 1}: ${phase.name.toUpperCase()}`);
      lines.push('-'.repeat(40));
      lines.push(content);
      lines.push('');
      lines.push('');
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {
      /* fallback */
    }
  }, [phaseResults]);

  const handleReset = useCallback(() => {
    setSourceMode('texto');
    setSourceUrl('');
    setSourceContext('');
    setSourceTitle('');
    setFetchUrlError(null);
    setTono('informativo');
    setCurrentPhase(0);
    setPhaseResults({});
    setError(null);
    setCopiedPhase(null);
    setCopiedAll(false);
  }, []);

  /* ---------------------------------------------------------------- */

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 sm:p-6">

        {/* ── MODULE HEADER ──────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
            <Globe className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Contenido Multicanal
              </h2>
              <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-300 dark:text-sky-400 dark:border-sky-800">
                Orquestador 5 fases
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Convierte una noticia o contexto fuente en contenido optimizado para 5 canales distintos: radio, flashes, blog SEO, imagenes y redes sociales.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isGenerating}
            className="shrink-0 gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reiniciar
          </Button>
        </div>

        {/* ── SOURCE CONTEXT ─────────────────────────────────────── */}
        <Card className="overflow-hidden border-sky-200 dark:border-sky-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Contexto Fuente (Fase 1)</CardTitle>
              {sourceContext && !phaseResults[0] && (
                <Badge variant="outline" className="text-[10px] text-sky-600 border-sky-300 dark:text-sky-400 dark:border-sky-800">
                  {sourceContext.split('\n').filter(Boolean).length} lineas
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Mode toggle */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setSourceMode('texto')}
                className={[
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  sourceMode === 'texto'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                <FileEdit className="size-3.5" />
                Texto
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('url')}
                className={[
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  sourceMode === 'url'
                    ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
                    : 'text-muted-foreground hover:bg-muted',
                ].join(' ')}
              >
                <Link className="size-3.5" />
                URL
              </button>
            </div>

            {/* URL mode */}
            {sourceMode === 'url' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/noticia/..."
                    value={sourceUrl}
                    onChange={(e) => { setSourceUrl(e.target.value); setFetchUrlError(null); }}
                    disabled={isFetchingUrl || isGenerating}
                    className="text-sm flex-1"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFetchUrl(); } }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFetchUrl}
                    disabled={isFetchingUrl || !sourceUrl.trim() || isGenerating}
                    className="shrink-0 gap-1.5 text-xs"
                  >
                    {isFetchingUrl ? (
                      <><Loader2 className="size-3 animate-spin" /> Cargando</>
                    ) : (
                      <><Globe className="size-3" /> Extraer</>
                    )}
                  </Button>
                </div>
                {fetchUrlError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fetchUrlError}</p>
                )}
                {sourceTitle && (
                  <p className="text-xs text-muted-foreground">
                    Fuente extraida: <span className="font-medium text-foreground">{sourceTitle}</span>
                  </p>
                )}
              </div>
            )}

            {/* Shared textarea */}
            <Textarea
              id="source-context"
              placeholder={
                sourceMode === 'url'
                  ? 'El contenido de la URL aparecera aqui despues de extraerlo. Podras editarlo antes de generar.'
                  : 'Pega aqui la noticia, nota de prensa o informacion de referencia que sera la base para generar contenido en los 5 canales.\n\n' +
                    'Ejemplo:\n' +
                    'El Ministerio de Agricultura anuncio un nuevo subsidio de 2 millones de pesos para pequenos agricultores de menos de 5 hectareas en los departamentos de Boyaca, Cundinamarca y Santander...'
              }
              value={sourceContext}
              onChange={(e) => setSourceContext(e.target.value)}
              rows={6}
              className="resize-none text-sm leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-200 [&::-webkit-scrollbar-thumb]:dark:bg-sky-800"
              disabled={isGenerating}
            />
          </CardContent>
        </Card>

        {/* ── PROGRESS BAR ────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / PHASES.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap tabular-nums">
            {completedCount}/{PHASES.length} fases
          </span>
        </div>

        {completedCount === 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            Comienza generando la Noticia Radio a partir del contexto fuente.
          </p>
        )}
        {allDone && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 -mt-2 font-medium">
            Todas las fases completadas. Puedes copiar el contenido de cada fase.
          </p>
        )}

        {/* ── TWO-COLUMN LAYOUT ──────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">

          {/* ── LEFT: PHASE NAV ──────────────────────────────── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Fases
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[260px] text-xs">
                    Cada fase genera contenido para un canal diferente. Debes completar las fases en orden secuencial. Puedes regenerar cualquier fase ya completada.
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="space-y-1.5">
              {PHASES.map((phase) => {
                const unlocked = isPhaseUnlocked(phase.id);
                const completed = phaseResults[phase.id] !== undefined;
                const isCurrent = currentPhase === phase.id;
                const PhaseIcon = phase.icon;

                return (
                  <button
                    key={phase.id}
                    onClick={() => {
                      if (completed || isCurrent) setCurrentPhase(phase.id);
                    }}
                    disabled={!unlocked && !completed}
                    className={[
                      'w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-all duration-200',
                      isCurrent && 'border-sky-400 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40 ring-1 ring-sky-400/30 dark:ring-sky-700/30',
                      completed && !isCurrent && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-800',
                      !completed && !isCurrent && unlocked && 'border-border bg-card hover:border-sky-300 dark:hover:border-sky-800',
                      !unlocked && !completed && 'border-border bg-muted/30 opacity-50 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {/* status icon */}
                    <div className="mt-0.5 shrink-0">
                      {completed ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <div className="size-4 rounded-full bg-sky-500 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{phase.id + 1}</span>
                        </div>
                      ) : unlocked ? (
                        <Circle className="size-4 text-muted-foreground" />
                      ) : (
                        <Lock className="size-4 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* text */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <PhaseIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className={[
                          'text-sm font-medium truncate',
                          isCurrent && 'text-sky-700 dark:text-sky-300',
                          completed && !isCurrent && 'text-emerald-700 dark:text-emerald-300',
                        ].join(' ')}>
                          {phase.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                        {phase.description}
                      </p>
                      {completed && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                          {phaseResults[phase.id]?.split('\n').filter(Boolean).length ?? 0} lineas generadas
                        </p>
                      )}
                    </div>

                    {/* regenerate */}
                    {completed && isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerate(phase.id);
                        }}
                        className="shrink-0 p-1 rounded hover:bg-sky-100 dark:hover:bg-sky-900/40 text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                        title="Regenerar esta fase"
                      >
                        <RotateCcw className="size-3" />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── GENERATE BUTTON ──────────────────────────── */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Select value={tono} onValueChange={setTono} disabled={isGenerating}>
                  <SelectTrigger className="h-8 text-xs w-[140px]">
                    <SelectValue placeholder="Tono..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TONO_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex flex-col">
                          <span>{t.label}</span>
                          <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!canGenerateCurrent || isGenerating}
                className="w-full bg-sky-600 text-white hover:bg-sky-700 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-4" />
                    {PHASE_LABELS[currentPhase]}
                    <ArrowRight className="size-3 ml-auto" />
                  </>
                )}
              </Button>

              {!canGenerateCurrent && !isGenerating && currentPhase > 0 && !phaseResults[currentPhase - 1] && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Completa la fase anterior primero
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT: CONTENT DISPLAY ────────────────────────── */}
          <div className="min-w-0">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const PhaseIcon = PHASES[currentPhase].icon;
                      return <PhaseIcon className="size-4 text-sky-500 shrink-0" />;
                    })()}
                    <CardTitle className="text-base">
                      Fase {currentPhase + 1}: {PHASES[currentPhase].name}
                    </CardTitle>
                  </div>
                  {phaseResults[currentPhase] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPhase(currentPhase)}
                      className="shrink-0 gap-1.5 h-7 text-xs"
                    >
                      {copiedPhase === currentPhase ? (
                        <><Check className="size-3" /> Copiado</>
                      ) : (
                        <><Copy className="size-3" /> Copiar</>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {phaseResults[currentPhase] ? (
                  <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sky-200 [&::-webkit-scrollbar-thumb]:dark:bg-sky-800">
                    {phaseResults[currentPhase]}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      {(() => {
                        const PhaseIcon = PHASES[currentPhase].icon;
                        return <PhaseIcon className="size-5 text-muted-foreground" />;
                      })()}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {currentPhase === 0
                        ? 'Pendiente'
                        : isPhaseUnlocked(currentPhase)
                          ? 'Listo para generar'
                          : 'Bloqueado'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
                      {currentPhase === 0
                        ? 'Ingresa el contexto fuente y haz clic en Generar.'
                        : isPhaseUnlocked(currentPhase)
                          ? `Haz clic en "${PHASE_LABELS[currentPhase]}" para generar el contenido de esta fase.`
                          : 'Completa las fases anteriores para desbloquear esta fase.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── COPY ALL ──────────────────────────────── */}
            {completedCount > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAll}
                  className="gap-1.5 text-xs"
                >
                  {copiedAll ? (
                    <><Check className="size-3" /> Todo copiado</>
                  ) : (
                    <><Copy className="size-3" /> Copiar todo</>
                  )}
                </Button>
                <span className="text-[11px] text-muted-foreground self-center ml-auto">
                  {completedCount} de {PHASES.length} fases generadas
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── ERROR ──────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

      </div>
    </TooltipProvider>
  );
}
