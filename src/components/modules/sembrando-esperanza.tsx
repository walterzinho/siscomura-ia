'use client';

import { useState, useCallback, type FormEvent } from 'react';
import {
  Sun, Loader2, Copy, Check,
  Sun as SunIcon, Info, Link2,
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

const LIBRO_OPTIONS = [
  { value: 'cualquiera', label: 'Cualquiera (la IA elige el que mejor cuadre)' },
  { value: 'genesis', label: 'Génesis' },
  { value: 'salmos', label: 'Salmos' },
  { value: 'proverbios', label: 'Proverbios' },
  { value: 'isaias', label: 'Isaías' },
  { value: 'jeremias', label: 'Jeremías' },
  { value: 'mateo', label: 'Mateo' },
  { value: 'juan', label: 'Juan' },
  { value: 'romanos', label: 'Romanos' },
  { value: 'galatas', label: 'Gálatas' },
  { value: 'filipenses', label: 'Filipenses' },
  { value: 'santiago', label: 'Santiago' },
  { value: 'apocalipsis', label: 'Apocalipsis' },
];

const TONO_ORACION_OPTIONS = [
  { value: 'comunitario', label: 'Comunitario (nosotros, pueblo)' },
  { value: 'personal', label: 'Personal (tú, hermano/a)' },
  { value: 'mixto', label: 'Mixto (comienza personal, cierra comunitario)' },
];

interface FormData {
  tema: string;
  urlVersiculo: string;
  versiculoSugerido: string;
  libroPreferido: string;
  tonoOracion: string;
  nombrePresentador: string;
  horarioEmision: string;
  horarioReemision: string;
  temaReto: string;
  informacionAdicional: string;
}

const INITIAL_FORM: FormData = {
  tema: '',
  urlVersiculo: '',
  versiculoSugerido: '',
  libroPreferido: '',
  tonoOracion: 'comunitario',
  nombrePresentador: '',
  horarioEmision: '',
  horarioReemision: '',
  temaReto: '',
  informacionAdicional: '',
};

function buildPrompt(form: FormData): string {
  const libroLabel = LIBRO_OPTIONS.find((l) => l.value === form.libroPreferido)?.label || form.libroPreferido;
  const tonoLabel = TONO_ORACION_OPTIONS.find((t) => t.value === form.tonoOracion)?.label || form.tonoOracion;

  const lines: string[] = [];

  lines.push('--- TEMA DEL DÍA ---');
  lines.push(form.tema.trim());

  lines.push('');
  lines.push('--- VERSÍCULO BÍBLICO ---');
  if (form.versiculoSugerido.trim()) {
    lines.push(`Versículo sugerido por el usuario: ${form.versiculoSugerido.trim()}`);
    lines.push('Usa este versículo como fundamento bíblico del programa.');
  } else {
    lines.push('No se proporcionó versículo. Busca y selecciona el versículo bíblico que mejor se ajuste al tema del día.');
  }
   if (form.libroPreferido && form.libroPreferido !== 'cualquiera') {
    lines.push(`Libro preferido: ${libroLabel}`);
  }

  lines.push('');
  lines.push(`TONO DE LA ORACIÓN: ${tonoLabel}`);

  lines.push('');
  lines.push('--- DATOS DEL PRESENTADOR ---');
  lines.push(`Nombre: ${form.nombrePresentador.trim()}`);

  lines.push('');
  lines.push('--- HORARIOS ---');
  lines.push(`Emisión: ${form.horarioEmision.trim()}`);
  if (form.horarioReemision.trim()) {
    lines.push(`Reemisión: ${form.horarioReemision.trim()}`);
  }

  if (form.temaReto.trim()) {
    lines.push('');
    lines.push('--- TEMA DEL RETO SEMANAL ---');
    lines.push(form.temaReto.trim());
  }

  if (form.informacionAdicional.trim()) {
    lines.push('');
    lines.push('--- INFORMACIÓN ADICIONAL ---');
    lines.push(form.informacionAdicional.trim());
  }

  return lines.join('\n');
}

export function SembrandoEsperanzaGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validUrl = form.urlVersiculo.trim();
  const isFormValid =
    form.tema.trim() &&
    form.nombrePresentador.trim() &&
    form.horarioEmision.trim();

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isGenerating) return;

      setError(null);
      setResult(null);
      setGenerating(true);

      const prompt = buildPrompt(form);
      const urls = validUrl ? [validUrl] : [];

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: 'sembrando-esperanza',
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
    [form, validUrl, isFormValid, isGenerating, setGenerating],
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
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <Sun className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Sembrando Esperanza
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Micro programa de motivación en fe. Libreto de 3 a 5 minutos con fundamento bíblico.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tema del día */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Tema del Día
            </p>
            <div className="space-y-2">
              <Label htmlFor="tema" className="text-sm font-medium">
                Temática <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="tema"
                placeholder="Ej: La paciencia en la espera de la cosecha, la fe en medio de la sequía, la gratitud por las bendiciones diarias..."
                value={form.tema}
                onChange={(e) => updateField('tema', e.target.value)}
                rows={3}
                className="resize-none"
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Versículo bíblico */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fundamento Bíblico
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Si tienes un versículo en mente, escríbelo. Si no, la IA buscará el que mejor se ajuste al tema. Puedes restringir la búsqueda a un libro específico o dejarlo abierto.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="versiculoSugerido" className="text-sm font-medium">
                  Versículo sugerido (opcional)
                </Label>
                <Input
                  id="versiculoSugerido"
                  placeholder="Ej: Gálatas 6:9, Romanos 12:12, Salmos 23:1..."
                  value={form.versiculoSugerido}
                  onChange={(e) => updateField('versiculoSugerido', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="libroPreferido" className="text-sm font-medium">
                    Libro preferido (opcional)
                  </Label>
                  <Select value={form.libroPreferido} onValueChange={(v) => updateField('libroPreferido', v)}>
                    <SelectTrigger id="libroPreferido" className="w-full">
                      <SelectValue placeholder="Cualquier libro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {LIBRO_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tonoOracion" className="text-sm font-medium">
                    Tono de la Oración
                  </Label>
                  <Select value={form.tonoOracion} onValueChange={(v) => updateField('tonoOracion', v)}>
                    <SelectTrigger id="tonoOracion" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONO_ORACION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="urlVersiculo" className="text-sm font-medium">
                    URL de referencia bíblica (opcional)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] text-xs">
                      Pega una URL con el texto bíblico o un comentario devocional. La IA extraerá el contenido para enriquecer el programa.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    id="urlVersiculo"
                    placeholder="Ej: https://www.biblegateway.com/..."
                    value={form.urlVersiculo}
                    onChange={(e) => updateField('urlVersiculo', e.target.value)}
                    disabled={isGenerating}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Datos del programa */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos de Transmisión
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombrePresentador" className="text-sm font-medium">
                  Presentador/a <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombrePresentador"
                  placeholder="Ej: Pastor Carlos"
                  value={form.nombrePresentador}
                  onChange={(e) => updateField('nombrePresentador', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioEmision" className="text-sm font-medium">
                  Horario de Emisión <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="horarioEmision"
                  placeholder="Ej: Lunes a Viernes 5:30 AM"
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
                  placeholder="Ej: Domingos 8:00 AM"
                  value={form.horarioReemision}
                  onChange={(e) => updateField('horarioReemision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Reto semanal */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Reto Semanal
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Desafío práctico para la semana ligado al tema. Los oyentes deben poder compartirlo en los comentarios. Si lo dejas vacío, la IA lo creará según el tema.
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              placeholder="Ej: Esta semana comparte una palabra de aliento con tres personas de tu comunidad y cuéntanos cómo reaccionaron..."
              value={form.temaReto}
              onChange={(e) => updateField('temaReto', e.target.value)}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Información adicional */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Información Adicional
            </p>
            <Textarea
              placeholder="Ej: Estamos cerca de Navidad, el tema puede conectar con el adviento. La comunidad está pasando por una temporada difícil de lluvias..."
              value={form.informacionAdicional}
              onChange={(e) => updateField('informacionAdicional', e.target.value)}
              rows={2}
              className="resize-none"
              disabled={isGenerating}
            />
          </div>

          {/* Estructura preview */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">
              Estructura del Programa Generado
            </p>
            <ol className="text-xs text-amber-800 dark:text-amber-300 space-y-1 list-decimal list-inside">
              <li>Presentación institucional (marca Sembrando Esperanza)</li>
              <li>Saludo y planteamiento del tema</li>
              <li>Fundamento bíblico/espiritual (versículo)</li>
              <li>Relato ejemplarizante (microhistoria en Colombia)</li>
              <li>Reflexión y aplicación</li>
              <li>Oración comunitaria</li>
              <li>Reto o llamado a la acción (comentarios)</li>
              <li>Despedida y horarios de transmisión</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" /> Generando programa...</>
              ) : (
                <><SunIcon className="size-4" /> Generar Sembrando Esperanza</>
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
                <CardTitle className="text-base">Programa Generado</CardTitle>
                <CardDescription className="mt-1">
                  Sembrando Esperanza {form.tema ? `• ${form.tema.split('\n')[0].slice(0, 50)}` : ''}
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
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-200 [&::-webkit-scrollbar-thumb]:dark:bg-amber-800">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
