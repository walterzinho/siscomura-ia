'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { Megaphone, Loader2, Copy, Check, Sparkles as SparklesIcon, Info, Music2 } from 'lucide-react';
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
  { value: 'infomercial', label: 'Infomercial', desc: 'Mini-programa comercial de 3 a 5 minutos' },
  { value: 'jingle', label: 'Jingle', desc: 'Canción con rima + locución de complemento' },
];

const CLASE_CUÑA_OPTIONS = [
  { value: 'producto', label: 'Para Producto', desc: '' },
  { value: 'servicio', label: 'Para Servicio', desc: '' },
  { value: 'campaña-institucional-cliente', label: 'Campaña Institucional del Cliente', desc: '' },
];

const CLASE_INFOMERCIAL_OPTIONS = [
  { value: 'testimonial', label: 'Testimonial', desc: 'Entrevista a un cliente que probó el producto/servicio' },
  { value: 'entrevista', label: 'Entrevista', desc: 'Entrevista al dueño o personal del negocio' },
  { value: 'locutor', label: 'Locutor', desc: 'El locutor habla del producto o servicio' },
];

const CLASE_JINGLE_OPTIONS = [
  { value: 'marca', label: 'Jingle de Marca', desc: 'Identidad sonora del negocio o cliente' },
  { value: 'oferta', label: 'Jingle de Oferta / Promoción', desc: 'Promociona una oferta, descuento o evento especial' },
  { value: 'evento', label: 'Jingle de Evento', desc: 'Anuncia un evento, fecha especial o inauguración' },
];

const DURACION_CUÑA_OPTIONS = [
  { value: '30-40', label: '30 a 40 segundos' },
  { value: '50-60', label: '50 a 60 segundos' },
];

const DURACION_INFOMERCIAL_OPTIONS = [
  { value: '3-4', label: '3 a 4 minutos' },
  { value: '4-5', label: '4 a 5 minutos' },
];

const DURACION_JINGLE_OPTIONS = [
  { value: '15-20', label: '15 a 20 segundos' },
  { value: '20-30', label: '20 a 30 segundos' },
  { value: '30-40', label: '30 a 40 segundos' },
];

const TEMATICA_CUÑA_OPTIONS = [
  { value: 'expectativa', label: 'Expectativa' },
  { value: 'llamada-accion', label: 'Llamada a la Acción (Comprar, Asistir, Disfrutar)' },
  { value: 'recordacion-marca', label: 'Recordación de Marca' },
  { value: 'campaña-institucional', label: 'Campaña Institucional' },
];

const LENGUAJE_OPTIONS = [
  { value: 'tecnico', label: 'Técnico', desc: 'Lenguaje especializado del sector o producto' },
  { value: 'casual', label: 'Casual', desc: 'Coloquial, cercano, como hablarle a un amigo' },
  { value: 'informativo', label: 'Informativo', desc: 'Neutral, claro, enfocado en datos y hechos' },
  { value: 'tipo-feria', label: 'Tipo Feria', desc: 'Animado, festivo, como si estuviera en una feria comercial' },
  { value: 'promocional', label: 'Promocional', desc: 'Enfocado en la oferta, descuentos y urgencia' },
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

const isInfomercial = (tipo: string) => tipo === 'infomercial';
const isJingle = (tipo: string) => tipo === 'jingle';

interface FormData {
  tipo: string;
  clase: string;
  duracion: string;
  tematica: string;
  lenguaje: string;
  tipoRima: string;
  numeroEstrofas: string;
  nombreCuña: string;
  nombreCliente: string;
  direccion: string;
  email: string;
  redes: string;
  whatsapp: string;
  movil: string;
  objetivo: string;
  mensajeResaltar: string;
}

const INITIAL_FORM: FormData = {
  tipo: '',
  clase: '',
  duracion: '',
  tematica: '',
  lenguaje: '',
  tipoRima: '',
  numeroEstrofas: '',
  nombreCuña: '',
  nombreCliente: '',
  direccion: '',
  email: '',
  redes: '',
  whatsapp: '',
  movil: '',
  objetivo: '',
  mensajeResaltar: '',
};

function buildPrompt(form: FormData): string {
  const tipoLabel = TIPO_OPTIONS.find((t) => t.value === form.tipo)?.label || form.tipo;
  const isInfor = isInfomercial(form.tipo);
  const isJ = isJingle(form.tipo);
  let claseOptions = CLASE_CUÑA_OPTIONS;
  if (isInfor) claseOptions = CLASE_INFOMERCIAL_OPTIONS;
  if (isJ) claseOptions = CLASE_JINGLE_OPTIONS;
  const claseLabel = claseOptions.find((c) => c.value === form.clase)?.label || form.clase;

  let duracionOptions = DURACION_CUÑA_OPTIONS;
  if (isInfor) duracionOptions = DURACION_INFOMERCIAL_OPTIONS;
  if (isJ) duracionOptions = DURACION_JINGLE_OPTIONS;
  const duracionLabel = duracionOptions.find((d) => d.value === form.duracion)?.label || form.duracion;
  const lenguajeLabel = LENGUAJE_OPTIONS.find((l) => l.value === form.lenguaje)?.label || form.lenguaje;
  const rimaLabel = RIMA_OPTIONS.find((r) => r.value === form.tipoRima)?.label || form.tipoRima;

  const lines: string[] = [];

  lines.push(`TIPO: ${tipoLabel}`);

  if (isInfor) {
    lines.push('CANTIDAD: Genera un solo infomercial completo.');
    lines.push('FORMATO: Infomercial (mini-programa comercial).');
  } else if (isJ) {
    lines.push('FORMATO: JINGLE - Genera una pieza que contiene DOS partes:');
    lines.push('  PARTE 1 - CANTO: Letra rimada que se canta, siguiendo el esquema de rima indicado.');
    lines.push('  PARTE 2 - LOCUCION: Texto hablado de complemento que refuerza el mensaje del canto e incluye datos del cliente.');
    lines.push('CANTIDAD: Genera un solo jingle.');
    lines.push(`ESQUEMA DE RIMA: ${rimaLabel}`);
    lines.push(`NUMERO DE ESTROFAS DEL CANTO: ${form.numeroEstrofas || 'No especificado'}`);
  } else if (form.tipo === 'campaña') {
    lines.push('CANTIDAD: Genera entre 3 y 5 cuñas para esta campaña.');
  } else {
    lines.push('CANTIDAD: Genera una sola cuña.');
  }

  lines.push(`CLASE: ${claseLabel}`);

  if (!isInfor && !isJ && form.clase === 'campaña-institucional-cliente' && form.nombreCliente.trim()) {
    lines.push(`CIERRE OBLIGATORIO: Cada libreto debe terminar exactamente con la frase: "Una Campaña de ${form.nombreCliente.trim()}".`);
  }

  if (isJ && form.clase === 'marca' && form.nombreCliente.trim()) {
    lines.push(`NOMBRE DE MARCA A SONORIZAR: ${form.nombreCliente.trim()}`);
  }

  lines.push(`DURACION: ${duracionLabel}`);

  if (isInfor) {
    lines.push(`LENGUAJE: ${lenguajeLabel || '(No especificado)'}`);
    lines.push('REGLA DE CONTACTO: Los canales de contacto del cliente DEBEN incluirse dentro del libreto del infomercial de forma natural y clara.');
  } else if (isJ) {
    lines.push('REGLA DE CONTACTO: Los datos del cliente (nombre, ubicacion, contacto) deben incluirse de forma natural en la LOCUCION de complemento.');
  } else {
    const tematicaLabel = TEMATICA_CUÑA_OPTIONS.find((t) => t.value === form.tematica)?.label || form.tematica;
    lines.push(`TEMATICA: ${tematicaLabel}`);
  }

  lines.push('');
  lines.push('--- DATOS GENERALES ---');
  if (form.nombreCuña.trim()) {
    lines.push(`Nombre de la ${isInfor ? 'Pieza' : isJ ? 'Pieza' : 'Cuña'}: ${form.nombreCuña.trim()}`);
  }

  lines.push('');
  lines.push('--- DATOS DEL CLIENTE ---');
  if (form.nombreCliente.trim()) {
    lines.push(`Nombre del Cliente: ${form.nombreCliente.trim()}`);
  }
  if (form.direccion.trim()) {
    lines.push(`Direccion: ${form.direccion.trim()}`);
  }
  if (form.email.trim()) {
    lines.push(`E-mail: ${form.email.trim()}`);
  }
  if (form.redes.trim()) {
    lines.push(`Redes Sociales: ${form.redes.trim()}`);
  }
  if (form.whatsapp.trim()) {
    lines.push(`WhatsApp: ${form.whatsapp.trim()}`);
  }
  if (form.movil.trim()) {
    lines.push(`Telefono Movil: ${form.movil.trim()}`);
  }

  lines.push('');
  lines.push('--- OBJETIVO ---');
  lines.push(form.objetivo.trim() || '(No especificado)');

  lines.push('');
  lines.push('--- MENSAJE A RESALTAR ---');
  lines.push(form.mensajeResaltar.trim() || '(No especificado)');

  return lines.join('\n');
}

export function CunasClientesGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isInfor = isInfomercial(form.tipo);
  const isJ = isJingle(form.tipo);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTipoChange = (value: string) => {
    const wasInfor = isInfor;
    const wasJingle = isJ;
    const willBeInfor = isInfomercial(value);
    const willBeJingle = isJingle(value);
    setForm((prev) => ({
      ...prev,
      tipo: value,
      ...(wasInfor !== willBeInfor || wasJingle !== willBeJingle ? { clase: '', duracion: '', tematica: '', lenguaje: '', tipoRima: '', numeroEstrofas: '' } : {}),
    }));
  };

  const getClaseOptions = () => {
    if (isInfor) return CLASE_INFOMERCIAL_OPTIONS;
    if (isJ) return CLASE_JINGLE_OPTIONS;
    return CLASE_CUÑA_OPTIONS;
  };

  const getDuracionOptions = () => {
    if (isInfor) return DURACION_INFOMERCIAL_OPTIONS;
    if (isJ) return DURACION_JINGLE_OPTIONS;
    return DURACION_CUÑA_OPTIONS;
  };

  const isFormValid = isInfor
    ? form.tipo && form.clase && form.duracion && form.lenguaje
    : isJ
      ? form.tipo && form.clase && form.duracion && form.tipoRima && form.numeroEstrofas
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
          body: JSON.stringify({ moduleId: 'cunas-clientes', prompt }),
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
    if (form.tipo === 'infomercial') return 'Generar Infomercial';
    if (isJ) return 'Generar Jingle';
    return 'Generar Cuña';
  };

  const getSubmitColor = () => {
    if (isJ) return 'bg-purple-600 text-white hover:bg-purple-700';
    if (isInfor) return 'bg-purple-600 text-white hover:bg-purple-700';
    return 'bg-emerald-600 text-white hover:bg-emerald-700';
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Module Header */}
        <div className="flex items-start gap-4">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${(isJ || isInfor) ? 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'}`}>
            {isJ ? <Music2 className="size-6" /> : <Megaphone className="size-6" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Cuñas de Clientes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isJ
                ? 'Jingle comercial: canción con rima + locución con datos del cliente.'
                : isInfor
                  ? 'Infomercial: mini-programa comercial con formato de entrevista, testimonial o locución.'
                  : 'Cuñas comerciales y campañas publicitarias para clientes.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Tipo + Clase */}
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

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="clase" className="text-sm font-medium">
                  Clase
                </Label>
                {!isInfor && !isJ && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px] text-xs">
                      Si seleccionas &quot;Campaña Institucional del Cliente&quot;, cada libreto terminará con &quot;Una Campaña de [Nombre del Cliente]&quot;.
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <Select value={form.clase} onValueChange={(v) => updateField('clase', v)}>
                <SelectTrigger id="clase" className="w-full">
                  <SelectValue placeholder={isInfor ? 'Formato del infomercial...' : isJ ? 'Tipo de jingle...' : 'Selecciona clase...'} />
                </SelectTrigger>
                <SelectContent>
                  {getClaseOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex flex-col">
                        <span>{opt.label}</span>
                        {opt.desc && (
                          <span className="text-xs text-muted-foreground">{opt.desc}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Duración + (Lenguaje / Temática / Rima) */}
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
                  {getDuracionOptions().map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isInfor ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="lenguaje" className="text-sm font-medium">
                    Lenguaje
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[260px] text-xs">
                      Define el tono y estilo del infomercial. Influye en cómo se aborda al oyente.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={form.lenguaje} onValueChange={(v) => updateField('lenguaje', v)}>
                  <SelectTrigger id="lenguaje" className="w-full">
                    <SelectValue placeholder="Selecciona lenguaje..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LENGUAJE_OPTIONS.map((opt) => (
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
            ) : isJ ? (
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
                      Define cómo riman los versos del canto del jingle. Cada esquema produce un ritmo diferente.
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
                <Label htmlFor="tematica" className="text-sm font-medium">
                  Temática
                </Label>
                <Select value={form.tematica} onValueChange={(v) => updateField('tematica', v)}>
                  <SelectTrigger id="tematica" className="w-full">
                    <SelectValue placeholder="Selecciona temática..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMATICA_CUÑA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Jingle: Estrofas row */}
          {isJ && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      Cantidad de estrofas de la parte cantada. Más estrofas = jingle más largo y completo.
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
            </div>
          )}

          {/* Dynamic indicators */}
          {isInfor && form.clase && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-900 dark:bg-purple-950/40">
              {form.clase === 'testimonial' && (
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>Formato Testimonial:</strong> El infomercial será una entrevista a un cliente satisfecho que cuenta su experiencia con el producto o servicio.
                </p>
              )}
              {form.clase === 'entrevista' && (
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>Formato Entrevista:</strong> El infomercial será una entrevista al dueño o personal del negocio.
                </p>
              )}
              {form.clase === 'locutor' && (
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>Formato Locutor:</strong> El locutor presenta el producto o servicio directamente.
                </p>
              )}
            </div>
          )}

          {isJ && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/40">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                Formato de Jingle
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-300 mb-2">
                El jingle se compone de dos partes:
              </p>
              <ol className="text-xs text-purple-800 dark:text-purple-300 space-y-1 list-decimal list-inside">
                <li><strong>CANTO:</strong> Letra rimada ({form.tipoRima || 'esquema seleccionado'}) con {form.numeroEstrofas || '?'} estrofas. Es la parte que se canta y debe incluir el nombre del cliente.</li>
                <li><strong>LOCUCION:</strong> Texto hablado de complemento con datos de contacto del cliente, ubicación y llamado a la acción.</li>
              </ol>
              {form.tipoRima === 'interna' && (
                <p className="mt-2 text-xs text-purple-700 dark:text-purple-400 italic">
                  Rima interna: la palabra del medio del verso rima con la palabra final del mismo verso.
                </p>
              )}
            </div>
          )}

          {/* Datos Generales */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Datos Generales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombreCuña" className="text-sm font-medium">
                  Nombre de la {isInfor || isJ ? 'Pieza' : 'Cuña'}
                </Label>
                <Input
                  id="nombreCuña"
                  placeholder={isJ ? 'Ej: Jingle Ferretería El Clavo' : isInfor ? 'Ej: Infomercial Ferretería El Clavo' : 'Ej: Promo Semana Santa'}
                  value={form.nombreCuña}
                  onChange={(e) => updateField('nombreCuña', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreCliente" className="text-sm font-medium">
                  Nombre del Cliente {isInfor && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="nombreCliente"
                  placeholder="Ej: Ferretería El Clavo"
                  value={form.nombreCliente}
                  onChange={(e) => updateField('nombreCliente', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Datos del Cliente - Contacto */}
          <div className="border-t border-border pt-5">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Datos de Contacto del Cliente
              </p>
              {(isInfor || isJ) && (
                <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">
                  {isJ ? 'Se usa en la locución' : 'Requerido en infomercial'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="direccion" className="text-sm font-medium">
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  placeholder="Ej: Cra 5 #12-30, Centro, Yopal"
                  value={form.direccion}
                  onChange={(e) => updateField('direccion', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailCliente" className="text-sm font-medium">
                  E-mail
                </Label>
                <Input
                  id="emailCliente"
                  type="email"
                  placeholder="Ej: contacto@ferreteriaelclavo.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="redesCliente" className="text-sm font-medium">
                  Redes Sociales
                </Label>
                <Input
                  id="redesCliente"
                  placeholder="Ej: @ferreteriaelclavo en Facebook e Instagram"
                  value={form.redes}
                  onChange={(e) => updateField('redes', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsappCliente" className="text-sm font-medium">
                  WhatsApp
                </Label>
                <Input
                  id="whatsappCliente"
                  placeholder="Ej: +57 300 123 4567"
                  value={form.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="movilCliente" className="text-sm font-medium">
                  Teléfono Móvil
                </Label>
                <Input
                  id="movilCliente"
                  placeholder="Ej: +57 320 987 6543"
                  value={form.movil}
                  onChange={(e) => updateField('movil', e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Dirección Creativa */}
          <div className="border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Dirección Creativa
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objetivo" className="text-sm font-medium">
                  Objetivo de la {isInfor || isJ ? 'Pieza' : 'Cuña'} o Campaña
                </Label>
                <Textarea
                  id="objetivo"
                  placeholder={isJ
                    ? 'Ej: Crear una identidad sonora pegadiza para que la audiencia recuerde la ferretería...'
                    : isInfor
                      ? '¿Qué se busca lograr con este infomercial? Ej: Dar a conocer los servicios de mecánica...'
                      : '¿Qué se busca lograr con esta cuña o campaña? Ej: Incrementar las ventas de herramientas...'}
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
                        ? 'La frase o idea que el canto del jingle debe repetir y grabar en la mente del oyente.'
                        : 'Este espacio orienta hacia dónde se debe dirigir el libreto. El mensaje principal.'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  id="mensajeResaltar"
                  placeholder={isJ
                    ? 'Ej: En El Clavo encuentras de todo para tu finca, a los mejores precios...'
                    : 'Ej: Los mejores precios de la región, con garantía y crédito...'}
                  value={form.mensajeResaltar}
                  onChange={(e) => updateField('mensajeResaltar', e.target.value)}
                  rows={3}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
            </div>
          </div>

          {/* Dynamic indicators */}
          {form.tipo === 'campaña' && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Modo Campaña:</strong> Se generarán entre 3 y 5 cuñas con variaciones sobre el mismo tema.
              </p>
            </div>
          )}

          {!isInfor && !isJ && form.clase === 'campaña-institucional-cliente' && form.nombreCliente.trim() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Campaña Institucional del Cliente:</strong> Cada libreto cerrará con &quot;Una Campaña de {form.nombreCliente.trim()}&quot;.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className={getSubmitColor()}
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
                {isInfor && (
                  <CardDescription className="mt-1">Infomercial generado ({DURACION_INFOMERCIAL_OPTIONS.find((d) => d.value === form.duracion)?.label || '3-5 min'})</CardDescription>
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
              <div className={["max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full", (isJ || isInfor) ? "[&::-webkit-scrollbar-thumb]:bg-purple-200 [&::-webkit-scrollbar-thumb]:dark:bg-purple-800" : "[&::-webkit-scrollbar-thumb]:bg-emerald-200 [&::-webkit-scrollbar-thumb]:dark:bg-emerald-800"].join(' ')}>
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
