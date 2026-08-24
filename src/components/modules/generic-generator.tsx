'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Radio, Megaphone, Sparkles, Heart, Sun, LayoutList, Globe, MapPin, Mic, Drama, Loader2, Copy, Check, Sparkles as SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { getModuleById } from '@/lib/modules';

type LucideIcon = typeof Radio;

const ICON_MAP: Record<string, LucideIcon> = {
  Radio,
  Megaphone,
  Sparkles,
  Heart,
  Sun,
  LayoutList,
  Globe,
  MapPin,
  Mic,
  Drama,
};

interface GenericGeneratorProps {
  moduleId: string;
}

export function GenericGenerator({ moduleId }: GenericGeneratorProps) {
  const moduleDef = getModuleById(moduleId);
  const { isGenerating, setGenerating } = useAppStore();

  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const IconComponent = moduleDef ? ICON_MAP[moduleDef.icon] || Sparkles : Sparkles;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!prompt.trim() || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId, prompt: prompt.trim() }),
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
    [prompt, moduleId, isGenerating, setGenerating]
  );

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
          <IconComponent className="size-6" />
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`prompt-${moduleId}`}>Instrucciones</Label>
          <Textarea
            id={`prompt-${moduleId}`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={moduleDef.placeholder || 'Describe lo que deseas generar...'}
            rows={5}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>

        <Button
          type="submit"
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto sm:justify-start"
        >
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <SparklesIcon className="size-4" />
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
