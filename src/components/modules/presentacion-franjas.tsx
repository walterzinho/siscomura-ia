'use client';

import { useState, useCallback, type FormEvent } from 'react';
import {
  LayoutList, Loader2, Copy, Check,
  LayoutList as LayoutListIcon, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

const DURACION_OPTIONS = [
  { value: '30min', label: '30 minutos' },
  { value: '1h', label: '1 hora' },
  { value: '2h', label: '2 horas' },
  { value: '3h', label: '3 horas' },
  { value: '4h', label: '4 horas' },
  { value: '6h', label: '6 horas' },
  { value: '8h', label: '8 horas' },
];

const TURNO_OPTIONS = [
  { value: 'madrugada', label: 'Madrugada (12AM - 5AM)' },
  { value: 'manana', label: 'Mañana (5AM - 12PM)' },
  { value: 'mediodia', label: 'Mediodía (12PM - 2PM)' },
  { value: 'tarde', label: 'Tarde (2PM - 6PM)' },
  { value: 'noche', label: 'Noche (6PM - 10PM)' },
  { value: 'noche-profunda', label: 'Noche profunda (10PM - 12AM)' },
];

const DIA_OPTIONS = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
  { value: 'general', label: 'General (sin día específico)' },
];

interface Libreto {
  numero: number;
  texto: string;
}

interface GenerationResult {
  entradas: Libreto[];
  puentes: Libreto[];
  puentesLargos: Libreto[];
  salidas: Libreto[];
}

interface FormData {
  nombreFranja: string;
  generoMusical: string;
  duracion: string;
  nombreLocutor: string;
  horarioEmision: string;
  turno: string;
  diaSemana: string;
  playlist: string;
  cantidadPuentes: string;
  incluirPuentesLargos: boolean;
  cantidadPuentesLargos: string;
}

const INITIAL_FORM: FormData = {
  nombreFranja: '',
  generoMusical: '',
  duracion: '2h',
  nombreLocutor: '',
  horarioEmision: '',
  turno: '',
  diaSemana: 'general',
  playlist: '',
  cantidadPuentes: '3',
  incluirPuentesLargos: false,
  cantidadPuentesLargos: '2',
};

function buildPrompt(form: FormData): string {
  const duracionLabel = DURACION_OPTIONS.find((d) => d.value === form.duracion)?.label || form.duracion;
  const turnoLabel = TURNO_OPTIONS.find((t) => t.value === form.turno)?.label || form.turno;
  const diaLabel = DIA_OPTIONS.find((d) => d.value === form.diaSemana)?.label || form.diaSemana;

  const lines: string[] = [];

  lines.push('--- DATOS DE LA FRANJA ---');
  lines.push(`Nombre de la Franja: ${form.nombreFranja.trim()}`);
  lines.push(`Género(s) Musical(es): ${form.generoMusical.trim()}`);
  lines.push(`Duración: ${duracionLabel}`);
  lines.push(`Turno: ${turnoLabel || '(No especificado)'}`);
  lines.push(`Día: ${diaLabel}`);

  lines.push('');
  lines.push('--- LOCUTOR ---');
  lines.push(`Nombre: ${form.nombreLocutor.trim()}`);
  lines.push(`Horario de Emisión: ${form.horarioEmision.trim()}`);

  if (form.playlist.trim()) {
    lines.push('');
    lines.push('--- PLAYLIST DE REFERENCIA ---');
    lines.push(form.playlist.trim());
  }

  lines.push('');
  lines.push('--- CANTIDADES A GENERAR ---');
  lines.push(`Entradas: 5 opciones`);
  lines.push(`Puentes: ${form.cantidadPuentes || '3'} opciones`);
  if (form.incluirPuentesLargos) {
    lines.push(`Puentes Largos: ${form.cantidadPuentesLargos || '2'} opciones`);
  } else {
    lines.push('Puentes Largos: NO incluir');
  }
  lines.push('Salidas: 5 opciones');

  return lines.join('\n');
}

function parseResult(text: string): GenerationResult | null {
  try {
    let jsonStr = text;
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonStr);
    return {
      entradas: parsed.entradas || [],
      puentes: parsed.puentes || [],
      puentesLargos: parsed.puentesLargos || [],
      salidas: parsed.salidas || [],
    };
  } catch {
    return null;
  }
}

function LibretoCard({ libreto, tipo, copiedId, onCopy }: {
  libreto: Libreto;
  tipo: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
}) {
  const id = `${tipo}-${libreto.numero}`;
  const isCopied = copiedId === id;
  return (
    <div className="rounded-lg border border-border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Opción {libreto.numero}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(id, libreto.texto)}
          className="h-7 gap-1.5 text-xs"
        >
          {isCopied ? (
            <><Check className="size-3" /><span>Copiado</span></>
          ) : (
            <><Copy className="size-3" /><span>Copiar</span></>
          )}
        </Button>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{libreto.texto}</p>
    </div>
  );
}

export function PresentacionFranjasGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [rawResult, setRawResult] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState('entradas');
  const [showRaw, setShowRaw] = useState(false);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    form.nombreFranja.trim() &&
    form.generoMusical.trim() &&
    form.nombreLocutor.trim() &&
    form.horarioEmision.trim() &&
    form.turno;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!isFormValid || isGenerating) return;

      setError(null);
      setResult(null);
      setRawResult(null);
      setGenerating(true);

      const prompt = buildPrompt(form);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moduleId: 'presentacion-franjas',
            prompt,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${res.status})`);
        }

        const data = await res.json();
        const text = data.result ?? data.text ?? data.content ?? 'Sin resultado';
        setRawResult(text);

        const parsed = parseResult(text);
        if (parsed) {
          setResult(parsed);
        } else {
          setResult(null);
          setShowRaw(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inesperado al generar contenido');
      } finally {
        setGenerating(false);
      }
    },
    [form, isFormValid, isGenerating, setGenerating],
  );

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleCopyAll = useCallback((tipo: string, items: Libreto[]) => {
    const all = items.map((i) => `[Opción ${i.numero}]\n${i.texto}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(all).catch(() => {});
  }, []);

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setResult(null);
    setRawResult(null);
    setError(null);
    setShowRaw(false);
  };

  const totalLibretos = result
    ? result.entradas.length + result.puentes.length + result.puentesLargos.length + result.salidas.length
    : 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <LayoutList className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Presentación de Franjas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Genera entradas, puentes y salidas con múltiples opciones para elegir.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos de la franja */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos de la Franja
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nombreFranja" className="text-sm font-medium">
                  Nombre de la Franja <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreFranja"
                  placeholder="Ej: Amanecer Campesino, Noche de Boleros, Tarde Radiante..."
                  value={form.nombreFranja}
                  onChange={(e) => updateField('nombreFranja', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="generoMusical" className="text-sm font-medium">
                  Género(s) Musical(es) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="generoMusical"
                  placeholder="Ej: Vallenato, Música Campesina, Boleros, Pop Latino..."
                  value={form.generoMusical}
                  onChange={(e) => updateField('generoMusical', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="duracion" className="text-sm font-medium">Duración</Label>
                </div>
                <Select value={form.duracion} onValueChange={(v) => updateField('duracion', v)}>
                  <SelectTrigger id="duracion" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURACION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Locutor y horario */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Locutor y Programación
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreLocutor" className="text-sm font-medium">
                  Locutor/Locutora <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreLocutor"
                  placeholder="Ej: Carlos Mejía"
                  value={form.nombreLocutor}
                  onChange={(e) => updateField('nombreLocutor', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioEmision" className="text-sm font-medium">
                  Horario de Emisión <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="horarioEmision"
                  placeholder="Ej: 6:00 AM - 8:00 AM"
                  value={form.horarioEmision}
                  onChange={(e) => updateField('horarioEmision', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="turno" className="text-sm font-medium">
                    Turno <span className="text-red-500">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      El turno adapta el tono del libreto: madrugada es suave y de compañía, mañana es enérgico, tarde es relajado, noche es íntimo y reflexivo.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.turno} onValueChange={(v) => updateField('turno', v)}>
                  <SelectTrigger id="turno" className="w-full">
                    <SelectValue placeholder="Selecciona turno..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TURNO_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diaSemana" className="text-sm font-medium">Día</Label>
                <Select value={form.diaSemana} onValueChange={(v) => updateField('diaSemana', v)}>
                  <SelectTrigger id="diaSemana" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Configuración de cantidades */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Configuración de Generación
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidadPuentes" className="text-sm font-medium">
                  Cantidad de Puentes
                </Label>
                <Select value={form.cantidadPuentes} onValueChange={(v) => updateField('cantidadPuentes', v)}>
                  <SelectTrigger id="cantidadPuentes" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} opciones</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch
                    id="incluirPuentesLargos"
                    checked={form.incluirPuentesLargos}
                    onCheckedChange={(v) => updateField('incluirPuentesLargos', v)}
                    disabled={isGenerating}
                  />
                  <Label htmlFor="incluirPuentesLargos" className="text-sm font-medium cursor-pointer">
                    Incluir Puentes Largos
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      Los puentes largos duran 30-45 segundos y permiten incluir datos curiosos o menciones de artistas. Ideales para franjas de 2+ horas.
                    </TooltipContent>
                  </Tooltip>
                </div>
                {form.incluirPuentesLargos && (
                  <Select value={form.cantidadPuentesLargos} onValueChange={(v) => updateField('cantidadPuentesLargos', v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} opciones</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </div>

          {/* Playlist */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Playlist de Referencia
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px] text-xs">
                  Si agregas canciones y artistas, los libretos los mencionarán para dar más identidad a la franja. Si lo dejas vacío, los libretos serán generales y versátiles.
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              placeholder={"Ej:\n1. Los Hermanos Zuleta - La Golondrina\n2. Jorge Celedón - La Tierra del Olvido\n3. Diomedes Díaz - Cariñito de Mi Vida\n4. Silvestre Dangond - Materialista"}
              value={form.playlist}
              onChange={(e) => updateField('playlist', e.target.value)}
              rows={5}
              className="resize-none font-mono text-xs"
              disabled={isGenerating}
            />
          </div>

          {/* Estructura preview */}
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-200 mb-2">
              Se Generarán
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-violet-200 dark:bg-violet-800">5 Entradas</Badge>
              <Badge variant="secondary" className="bg-violet-200 dark:bg-violet-800">{form.cantidadPuentes || '3'} Puentes</Badge>
              {form.incluirPuentesLargos && (
                <Badge variant="secondary" className="bg-violet-200 dark:bg-violet-800">{form.cantidadPuentesLargos || '2'} Puentes Largos</Badge>
              )}
              <Badge variant="secondary" className="bg-violet-200 dark:bg-violet-800">5 Salidas</Badge>
              <span className="text-xs text-violet-600 dark:text-violet-400 self-center">
                = {5 + Number(form.cantidadPuentes || 3) + (form.incluirPuentesLargos ? Number(form.cantidadPuentesLargos || 2) : 0) + 5} libretos
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" /> Generando libretos...</>
              ) : (
                <><LayoutListIcon className="size-4" /> Generar Libretos de Franja</>
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

        {/* Results */}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{form.nombreFranja}</h3>
                <Badge variant="outline">{totalLibretos} libretos</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs"
              >
                {showRaw ? 'Ver por tabs' : 'Ver texto completo'}
              </Button>
            </div>

            {showRaw ? (
              <Card>
                <CardContent className="pt-4">
                  <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200 [&::-webkit-scrollbar-thumb]:dark:bg-violet-800">
                    {rawResult}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={resultTab} onValueChange={setResultTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="entradas" className="flex-1">
                    Entradas ({result.entradas.length})
                  </TabsTrigger>
                  <TabsTrigger value="puentes" className="flex-1">
                    Puentes ({result.puentes.length})
                  </TabsTrigger>
                  {result.puentesLargos.length > 0 && (
                    <TabsTrigger value="puentesLargos" className="flex-1">
                      P. Largos ({result.puentesLargos.length})
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="salidas" className="flex-1">
                    Salidas ({result.salidas.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="entradas" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleCopyAll('entradas', result.entradas)}>
                      Copiar todas las entradas
                    </Button>
                  </div>
                  {result.entradas.map((l) => (
                    <LibretoCard key={l.numero} libreto={l} tipo="entrada" copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </TabsContent>

                <TabsContent value="puentes" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleCopyAll('puentes', result.puentes)}>
                      Copiar todos los puentes
                    </Button>
                  </div>
                  {result.puentes.map((l) => (
                    <LibretoCard key={l.numero} libreto={l} tipo="puente" copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </TabsContent>

                <TabsContent value="puentesLargos" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleCopyAll('puentesLargos', result.puentesLargos)}>
                      Copiar todos
                    </Button>
                  </div>
                  {result.puentesLargos.map((l) => (
                    <LibretoCard key={l.numero} libreto={l} tipo="puente-largo" copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </TabsContent>

                <TabsContent value="salidas" className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => handleCopyAll('salidas', result.salidas)}>
                      Copiar todas las salidas
                    </Button>
                  </div>
                  {result.salidas.map((l) => (
                    <LibretoCard key={l.numero} libreto={l} tipo="salida" copiedId={copiedId} onCopy={handleCopy} />
                  ))}
                </TabsContent>
              </Tabs>
            )}
          </div>
        )}

        {/* Raw result when JSON parsing failed */}
        {!result && rawResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Libretos Generados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200 [&::-webkit-scrollbar-thumb]:dark:bg-violet-800">
                {rawResult}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
