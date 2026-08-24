'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { MapPin, Link, Loader2, Copy, Check, Sparkles, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { getModuleById } from '@/lib/modules';

const MAX_URLS = 5;
const INITIAL_VISIBLE = 2;

interface MultiUrlGeneratorProps {
  moduleId: string;
}

export function MultiUrlGenerator({ moduleId }: MultiUrlGeneratorProps) {
  const moduleDef = getModuleById(moduleId);
  const { isGenerating, setGenerating } = useAppStore();

  const [urls, setUrls] = useState<string[]>(['', '']);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const visibleCount = urls.length;
  const canAddMore = visibleCount < MAX_URLS;

  const updateUrl = useCallback((index: number, value: string) => {
    setUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const removeUrl = useCallback((index: number) => {
    setUrls((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const addUrl = useCallback(() => {
    if (urls.length >= MAX_URLS) return;
    setUrls((prev) => [...prev, '']);
  }, [urls.length]);

  const validUrls = urls.filter((u) => u.trim().length > 0);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (validUrls.length === 0 || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: 'conexion-territorial',
            prompt: prompt.trim(),
            urls: validUrls.map((u) => u.trim()),
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
    [validUrls, prompt, isGenerating, setGenerating]
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

  if (!moduleDef) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Módulo no encontrado</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Module Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <MapPin className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {moduleDef.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {moduleDef.description}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Inputs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>URLs de Noticias (máximo 5)</Label>
            <span className="text-xs text-muted-foreground">
              {validUrls.length}/{MAX_URLS} URL{validUrls.length !== 1 ? 's' : ''} ingresada{validUrls.length !== 1 ? 's' : ''}
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
                    placeholder={`URL de noticia ${index + 1}`}
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

          {canAddMore && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrl}
              disabled={isGenerating}
              className="gap-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
            >
              <Plus className="size-3.5" />
              Agregar otra URL
            </Button>
          )}
        </div>

        {/* Prompt Textarea */}
        <div className="space-y-2">
          <Label htmlFor="multi-url-prompt">Instrucciones adicionales</Label>
          <Textarea
            id="multi-url-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Instrucciones adicionales (opcional): enfoque, audiencia, estilo...'
            rows={4}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>

        <Button
          type="submit"
          disabled={validUrls.length === 0 || isGenerating}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto sm:justify-start"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generar Contenido
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
            <CardTitle className="text-base">Resultado</CardTitle>
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
            <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-200 [&::-webkit-scrollbar-thumb]:dark:bg-emerald-800">
              {result}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
