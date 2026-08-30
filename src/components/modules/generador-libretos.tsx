'use client';

import { useState, useCallback, useRef, type FormEvent } from 'react';
import {
  FileAudio, Loader2, Copy, Check,
  FileAudio as FileAudioIcon, Info, Plus, X, Upload,
  Music, ListMusic, Trash2, GripVertical,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';

// ── Types ──

interface SongEntry {
  id: string;
  titulo: string;
  artista: string;
  duracion: string;
  genero: string;
}

interface FormData {
  // Contenido
  nombrePrograma: string;
  nombrePresentador: string;
  horarioEmision: string;
  tipoPrograma: string;
  temas: string[];
  informacionAdicional: string;
  // Playlist
  playlist: SongEntry[];
  frecuenciaCanciones: string;
}

const TIPO_PROGRAMA_OPTIONS = [
  { value: 'musical-variedades', label: 'Musical de Variedades' },
  { value: 'musical-tematico', label: 'Musical Tematico' },
  { value: 'request', label: 'Programa de Peticiones' },
  { value: 'horas-musicales', label: 'Horas Musicales' },
  { value: 'agro-cultural', label: 'Agro-cultural' },
  { value: 'revista-radiofonica', label: 'Revista Radionica' },
  { value: 'nocturno', label: 'Programa Nocturno' },
  { value: 'matutino', label: 'Programa Matutino' },
];

const FRECUENCIA_OPTIONS = [
  { value: '2', label: 'Cada 2 temas de contenido' },
  { value: '3', label: 'Cada 3 temas de contenido' },
  { value: '1', label: 'Despues de cada tema' },
  { value: 'libre', label: 'Libre (la IA decide)' },
];

const INITIAL_FORM: FormData = {
  nombrePrograma: '',
  nombrePresentador: '',
  horarioEmision: '',
  tipoPrograma: '',
  temas: [''],
  informacionAdicional: '',
  playlist: [],
  frecuenciaCanciones: '2',
};

// ── .slseq Binary Parser ──

function extractStringsFromBinary(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  const strings: string[] = [];
  let current = '';
  const MIN_LENGTH = 3;

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    // Printable ASCII + extended Latin (0x20-0xFF excluding control chars)
    if (byte >= 0x20 && byte <= 0xFF && byte !== 0x7F) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= MIN_LENGTH) {
        strings.push(current);
      }
      current = '';
    }
  }
  if (current.length >= MIN_LENGTH) {
    strings.push(current);
  }
  return strings;
}

function looksLikeMusicPath(s: string): boolean {
  const musicExts = ['.mp3', '.wav', '.flac', '.ogg', '.wma', '.aac', '.m4a', '.mp4', '.opus'];
  const lower = s.toLowerCase();
  return musicExts.some((ext) => lower.endsWith(ext)) ||
    lower.includes('\\music\\') ||
    lower.includes('/music/') ||
    lower.includes('\\audio\\') ||
    lower.includes('/audio/') ||
    lower.includes('\\canciones\\') ||
    lower.includes('cancion') ||
    lower.includes(' pista ') ||
    lower.includes(' track ');
}

function looksLikeDuration(s: string): boolean {
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(s.trim()) || /^\d+\.\d+$/.test(s.trim());
}

function looksLikeGenre(s: string): boolean {
  const genres = [
    'vallenato', 'cumbia', 'salsa', 'merengue', 'bachata', 'reggaeton',
    'pop', 'rock', 'balada', 'ranchera', 'corridos', 'norteño',
    'tropical', 'reggae', 'hip hop', 'jazz', 'blues', 'clasica',
    'folklore', 'llanera', 'porro', 'mapale', 'cumbia', 'joropo',
    'pasillo', 'bambuco', 'guabina', 'sanjuanero', 'salsa',
  ];
  const lower = s.toLowerCase().trim();
  return genres.some((g) => lower === g || lower.includes(g));
}

function parseSlseqFile(buffer: ArrayBuffer): SongEntry[] {
  const strings = extractStringsFromBinary(buffer);
  const songs: SongEntry[] = [];

  // Strategy 1: Look for patterns like "Title - Artist" or "Title - Artist (Duration)"
  const titleArtistPattern = /^(.+)\s*-\s*(.+)$/;

  let i = 0;
  while (i < strings.length) {
    const s = strings[i].trim();

    // Skip file paths and very long strings
    if (s.length > 200 || looksLikeMusicPath(s)) {
      i++;
      continue;
    }

    // Try to match "Title - Artist" pattern
    const match = s.match(titleArtistPattern);
    if (match) {
      let titulo = match[1].trim();
      let artista = match[2].trim();
      let duracion = '';
      let genero = '';

      // Check if duration is embedded
      const durMatch = artista.match(/^(.+?)\s*\((\d{1,2}:\d{2}(?::\d{2})?)\)$/);
      if (durMatch) {
        artista = durMatch[1].trim();
        duracion = durMatch[2];
      }

      // Check next string for duration or genre
      if (i + 1 < strings.length) {
        const next = strings[i + 1].trim();
        if (!duracion && looksLikeDuration(next)) {
          duracion = next;
          i++;
        }
        if (i + 1 < strings.length) {
          const next2 = strings[i + 1].trim();
          if (looksLikeGenre(next2) && next2.length < 30) {
            genero = next2;
            i++;
          }
        }
      }

      // Only add if both title and artist are reasonable length
      if (titulo.length >= 2 && titulo.length < 120 && artista.length >= 2 && artista.length < 120) {
        songs.push({
          id: `song-${songs.length + 1}-${Date.now()}`,
          titulo,
          artista,
          duracion,
          genero,
        });
      }
    }
    i++;
  }

  return songs;
}

// ── CSV Parser ──

function parseCsvPlaylist(text: string): SongEntry[] {
  const lines = text.split(/[\r\n]+/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const songs: SongEntry[] = [];

  // Detect delimiter
  const delimiter = header.includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase().replace(/['"]+/g, ''));

  const titleIdx = headers.findIndex((h) => h.includes('titulo') || h.includes('title') || h.includes('cancion') || h.includes('song'));
  const artistIdx = headers.findIndex((h) => h.includes('artista') || h.includes('artist') || h.includes('autor') || h.includes('author'));
  const durIdx = headers.findIndex((h) => h.includes('duracion') || h.includes('duration') || h.includes('tiempo') || h.includes('time'));
  const genreIdx = headers.findIndex((h) => h.includes('genero') || h.includes('genre') || h.includes('estilo') || h.includes('style'));

  if (titleIdx === -1 && artistIdx === -1) return [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^['"]|['"]$/g, ''));
    const titulo = titleIdx >= 0 ? (cols[titleIdx] || '') : '';
    const artista = artistIdx >= 0 ? (cols[artistIdx] || '') : '';
    const duracion = durIdx >= 0 ? (cols[durIdx] || '') : '';
    const genero = genreIdx >= 0 ? (cols[genreIdx] || '') : '';

    if (titulo || artista) {
      songs.push({
        id: `song-${songs.length + 1}-${Date.now()}`,
        titulo: titulo || 'Sin titulo',
        artista: artista || 'Desconocido',
        duracion,
        genero,
      });
    }
  }

  return songs;
}

// ── M3U Parser ──

function parseM3uPlaylist(text: string): SongEntry[] {
  const lines = text.split(/[\r\n]+/).filter((l) => l.trim());
  const songs: SongEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      // Format: #EXTINF:duration,Artist - Title
      const content = line.replace('#EXTINF:', '');
      const commaIdx = content.indexOf(',');
      const duracion = commaIdx > 0 ? content.slice(0, commaIdx).trim() : '';
      const info = commaIdx > 0 ? content.slice(commaIdx + 1).trim() : content;

      let titulo = '';
      let artista = '';

      const dashIdx = info.indexOf(' - ');
      if (dashIdx > 0) {
        artista = info.slice(0, dashIdx).trim();
        titulo = info.slice(dashIdx + 3).trim();
      } else {
        titulo = info;
      }

      // Extract filename from next line if no title
      if (!titulo && i + 1 < lines.length) {
        const path = lines[i + 1].trim();
        if (!path.startsWith('#')) {
          const filename = path.split(/[\\/]/).pop() || '';
          titulo = filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
          i++;
        }
      } else if (i + 1 < lines.length && !lines[i + 1].trim().startsWith('#')) {
        i++;
      }

      if (titulo || artista) {
        // Convert duration from seconds to MM:SS
        let durFormatted = duracion;
        if (duracion && !duracion.includes(':')) {
          const secs = parseInt(duracion, 10);
          if (!isNaN(secs)) {
            const m = Math.floor(secs / 60);
            const s = secs % 60;
            durFormatted = `${m}:${s.toString().padStart(2, '0')}`;
          }
        }

        songs.push({
          id: `song-${songs.length + 1}-${Date.now()}`,
          titulo: titulo || 'Sin titulo',
          artista: artista || 'Desconocido',
          duracion: durFormatted,
          genero: '',
        });
      }
    }
  }

  return songs;
}

// ── File Handler ──

async function parsePlaylistFile(file: File): Promise<{ songs: SongEntry[]; format: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'slseq') {
    const buffer = await file.arrayBuffer();
    const songs = parseSlseqFile(buffer);
    return { songs, format: 'SLSEQ (StationPlaylist)' };
  }

  const text = await file.text();

  if (ext === 'csv') {
    const songs = parseCsvPlaylist(text);
    return { songs, format: 'CSV' };
  }

  if (ext === 'm3u' || ext === 'm3u8') {
    const songs = parseM3uPlaylist(text);
    return { songs, format: 'M3U' };
  }

  if (ext === 'txt') {
    // Try CSV first, then M3U, then line-by-line
    let songs = parseCsvPlaylist(text);
    if (songs.length > 0) return { songs, format: 'TXT (detectado como CSV)' };

    songs = parseM3uPlaylist(text);
    if (songs.length > 0) return { songs, format: 'TXT (detectado como M3U)' };

    // Line by line: "Artist - Title" or "Title - Artist"
    const lines = text.split(/[\r\n]+/).filter((l) => l.trim());
    songs = lines.map((line, idx) => {
      const dashIdx = line.indexOf(' - ');
      if (dashIdx > 0) {
        return {
          id: `song-${idx + 1}-${Date.now()}`,
          artista: line.slice(0, dashIdx).trim(),
          titulo: line.slice(dashIdx + 3).trim(),
          duracion: '',
          genero: '',
        };
      }
      return {
        id: `song-${idx + 1}-${Date.now()}`,
        titulo: line.trim(),
        artista: '',
        duracion: '',
        genero: '',
      };
    });
    return { songs, format: 'TXT (líneas)' };
  }

  return { songs: [], format: ext.toUpperCase() };
}

// ── Prompt Builder ──

function buildPrompt(form: FormData): string {
  const tipoLabel = TIPO_PROGRAMA_OPTIONS.find((t) => t.value === form.tipoPrograma)?.label || form.tipoPrograma;
  const frecLabel = FRECUENCIA_OPTIONS.find((f) => f.value === form.frecuenciaCanciones)?.label || form.frecuenciaCanciones;
  const hasPlaylist = form.playlist.length > 0;

  const lines: string[] = [];

  lines.push('--- DATOS DEL PROGRAMA ---');
  lines.push(`Nombre del Programa: ${form.nombrePrograma.trim()}`);
  lines.push(`Presentador/a: ${form.nombrePresentador.trim()}`);
  lines.push(`Horario de Emisión: ${form.horarioEmision.trim()}`);
  lines.push(`Tipo de Programa: ${tipoLabel || '(No especificado)'}`);

  lines.push('');
  lines.push('--- TEMAS DE CONTENIDO ---');
  const validTemas = form.temas.filter((t) => t.trim());
  validTemas.forEach((tema, i) => {
    lines.push(`Tema ${i + 1}: ${tema.trim()}`);
  });

  if (hasPlaylist) {
    lines.push('');
    lines.push('--- PLAYLIST DE REFERENCIA CARGADA ---');
    lines.push(`Formato detectado: Archivo de playlist`);
    lines.push(`Total de canciones: ${form.playlist.length}`);
    lines.push(`Frecuencia de presentación de canciones: ${frecLabel}`);
    lines.push('');
    lines.push('CANCIONES EN LA PLAYLIST:');
    form.playlist.forEach((song, i) => {
      const parts = [`${i + 1}. ${song.titulo}`];
      if (song.artista) parts.push(` - ${song.artista}`);
      if (song.duracion) parts.push(` (${song.duracion})`);
      if (song.genero) parts.push(` [${song.genero}]`);
      lines.push(parts.join(''));
    });

    lines.push('');
    lines.push('INSTRUCCION ESPECIAL DE ESTRUCTURA:');
    lines.push('Como se cargó una playlist de referencia, el libreto DEBE intercalar presentaciones de canciones entre los temas de contenido.');
    lines.push(`La frecuencia es: ${frecLabel}.`);
    lines.push('Cada presentación de canción debe incluir:');
    lines.push('- Transición natural desde el tema anterior hacia la canción');
    lines.push('- Nombre del artista y título de la canción');
    lines.push('- Un dato interesante, anécdota o contexto sobre la canción o el artista (breve, 1-2 líneas)');
    lines.push('- Transición hacia el siguiente tema o sección');
    lines.push('NO inventes canciones que no están en la playlist. Usa EXCLUSIVAMENTE las canciones proporcionadas.');
    lines.push('Distribuye las canciones de la playlist de manera equilibrada a lo largo del libreto.');
  } else {
    lines.push('');
    lines.push('NO se cargó playlist de referencia. Generar el libreto de contenido sin intercalar canciones.');
  }

  if (form.informacionAdicional.trim()) {
    lines.push('');
    lines.push('--- INFORMACION ADICIONAL ---');
    lines.push(form.informacionAdicional.trim());
  }

  return lines.join('\n');
}

// ── Component ──

export function GeneradorLibretosGenerator() {
  const { isGenerating, setGenerating } = useAppStore();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [parseStatus, setParseStatus] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof FormData, value: string | SongEntry[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTema = () => {
    if (form.temas.length < 8) {
      setForm((prev) => ({ ...prev, temas: [...prev.temas, ''] }));
    }
  };

  const removeTema = (index: number) => {
    setForm((prev) => ({
      ...prev,
      temas: prev.temas.filter((_, i) => i !== index),
    }));
  };

  const updateTema = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      temas: prev.temas.map((t, i) => (i === index ? value : t)),
    }));
  };

  const addSong = () => {
    const newSong: SongEntry = {
      id: `manual-${Date.now()}`,
      titulo: '',
      artista: '',
      duracion: '',
      genero: '',
    };
    setForm((prev) => ({ ...prev, playlist: [...prev.playlist, newSong] }));
  };

  const removeSong = (index: number) => {
    setForm((prev) => ({
      ...prev,
      playlist: prev.playlist.filter((_, i) => i !== index),
    }));
  };

  const updateSong = (index: number, field: keyof SongEntry, value: string) => {
    setForm((prev) => ({
      ...prev,
      playlist: prev.playlist.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const clearPlaylist = () => {
    setForm((prev) => ({ ...prev, playlist: [] }));
    setParseStatus(null);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseStatus({ message: 'Procesando archivo...', type: 'warning' });

    try {
      const { songs, format } = await parsePlaylistFile(file);

      if (songs.length === 0) {
        setParseStatus({
          message: `No se pudieron extraer canciones del archivo ${file.name} (${format}). Intenta con formato CSV o M3U, o agrega las canciones manualmente.`,
          type: 'error',
        });
        return;
      }

      setForm((prev) => ({
        ...prev,
        playlist: songs,
      }));
      setParseStatus({
        message: `Se cargaron ${songs.length} canciones desde ${file.name} (${format}). Revisa y edita la lista si es necesario.`,
        type: 'success',
      });
    } catch (err) {
      setParseStatus({
        message: `Error al procesar el archivo: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        type: 'error',
      });
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const validTemas = form.temas.filter((t) => t.trim());
  const hasPlaylist = form.playlist.length > 0;
  const isFormValid =
    form.nombrePrograma.trim() &&
    form.nombrePresentador.trim() &&
    form.horarioEmision.trim() &&
    validTemas.length > 0;

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
          body: JSON.stringify({
            moduleId: 'generador-libretos',
            prompt,
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
    [form, isFormValid, isGenerating, setGenerating],
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
    setParseStatus(null);
  };

  // Calculate total playlist duration
  const totalDuration = form.playlist.reduce((acc, song) => {
    if (!song.duracion) return acc;
    const parts = song.duracion.split(':').map(Number);
    if (parts.length === 3) return acc + parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return acc + parts[0] * 60 + parts[1];
    return acc;
  }, 0);
  const formatTotalDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <FileAudio className="size-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Generador de Libretos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea libretos radiales completos con playlist de referencia. Carga tu archivo .slseq o agrega canciones manualmente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tabs: Contenido | Playlist */}
          <Tabs defaultValue="contenido" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contenido" className="gap-1.5">
                <ListMusic className="size-3.5" /> Contenido del Libreto
              </TabsTrigger>
              <TabsTrigger value="playlist" className="gap-1.5">
                <Music className="size-3.5" /> Playlist de Referencia
                {hasPlaylist && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-[10px]">
                    {form.playlist.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ═══ TAB: CONTENIDO ═══ */}
            <TabsContent value="contenido" className="mt-4 space-y-5">
              {/* Datos del Programa */}
              <div className="border-t border-border pt-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Datos del Programa
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombrePrograma" className="text-sm font-medium">
                      Nombre del Programa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombrePrograma"
                      placeholder="Ej: Horas Musicales del Campo"
                      value={form.nombrePrograma}
                      onChange={(e) => updateField('nombrePrograma', e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombrePresentador" className="text-sm font-medium">
                      Presentador/a <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="nombrePresentador"
                      placeholder="Ej: Maria Fernanda Lopez"
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
                      placeholder="Ej: Lunes a Viernes 2:00 PM - 4:00 PM"
                      value={form.horarioEmision}
                      onChange={(e) => updateField('horarioEmision', e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="tipoPrograma" className="text-sm font-medium">
                        Tipo de Programa
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="size-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs">
                          Define el formato del programa para ajustar el tono y estructura del libreto.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={form.tipoPrograma} onValueChange={(v) => updateField('tipoPrograma', v)}>
                      <SelectTrigger id="tipoPrograma" className="w-full">
                        <SelectValue placeholder="Selecciona tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPO_PROGRAMA_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Temas de Contenido */}
              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Temas de Contenido <span className="text-red-500">*</span>
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px] text-xs">
                        Cada tema genera un bloque de contenido en el libreto. Si hay playlist cargada, se intercalarán presentaciones de canciones entre los temas.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {form.temas.length < 8 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addTema}
                      className="h-7 gap-1 text-xs"
                      disabled={isGenerating}
                    >
                      <Plus className="size-3" /> Agregar tema
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {form.temas.map((tema, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="flex items-center justify-center w-6 shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
                      </div>
                      <Textarea
                        placeholder={`Tema ${i + 1}: Ej: Beneficios del cafe organico para las comunidades rurales...`}
                        value={tema}
                        onChange={(e) => updateTema(i, e.target.value)}
                        rows={2}
                        className="resize-none"
                        disabled={isGenerating}
                      />
                      {form.temas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTema(i)}
                          disabled={isGenerating}
                          className="shrink-0 text-muted-foreground hover:text-red-500 mt-0.5"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Información Adicional */}
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
                      Datos extra, contexto, efemerides, eventos locales, o instrucciones especiales para el libreto.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Textarea
                  placeholder="Ej: Hoy celebramos el dia del campesino, hay feria ganadera en el municipio, se espera lluvia para la cosecha..."
                  value={form.informacionAdicional}
                  onChange={(e) => updateField('informacionAdicional', e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>

            {/* ═══ TAB: PLAYLIST ═══ */}
            <TabsContent value="playlist" className="mt-4 space-y-5">
              {/* Upload Area */}
              <div className="border-t border-border pt-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Cargar Playlist
                </p>
                <div
                  className={
                    'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ' +
                    (hasPlaylist
                      ? 'border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/30'
                      : 'border-muted-foreground/25 hover:border-violet-300 hover:bg-violet-50/50 dark:hover:border-violet-800 dark:hover:bg-violet-950/20')
                  }
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".slseq,.csv,.m3u,.m3u8,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    disabled={isGenerating}
                  />
                  <Upload className="mx-auto size-8 text-violet-400" />
                  <p className="mt-2 text-sm font-medium text-foreground">
                    Haz clic o arrastra tu archivo aqui
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formatos aceptados: .slseq, .csv, .m3u, .m3u8, .txt
                  </p>
                </div>
              </div>

              {/* Parse Status */}
              {parseStatus && (
                <div
                  className={
                    'rounded-lg border p-3 text-sm ' +
                    (parseStatus.type === 'success'
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-400'
                      : parseStatus.type === 'warning'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'
                        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400')
                  }
                >
                  {parseStatus.message}
                </div>
              )}

              {/* Frecuencia de canciones */}
              {hasPlaylist && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-sm font-medium">
                      Frecuencia de presentación de canciones
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px] text-xs">
                        Cada cuántos temas de contenido se presenta una canción. La IA generará la transición y presentación de la canción.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={form.frecuenciaCanciones} onValueChange={(v) => updateField('frecuenciaCanciones', v)}>
                    <SelectTrigger className="w-full sm:w-80">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FRECUENCIA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Playlist Info */}
              {hasPlaylist && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-violet-600 dark:text-violet-400">
                      <Music className="size-3 mr-1" />
                      {form.playlist.length} canciones
                    </Badge>
                    {totalDuration > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Duración total aprox: {formatTotalDuration(totalDuration)}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearPlaylist}
                    disabled={isGenerating}
                    className="h-7 gap-1 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="size-3" /> Limpiar playlist
                  </Button>
                </div>
              )}

              {/* Song List (editable) */}
              {hasPlaylist && (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {form.playlist.map((song, i) => (
                    <div
                      key={song.id}
                      className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-900 dark:bg-violet-950/20"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex items-center justify-center w-6 shrink-0 mt-1">
                          <Music className="size-3.5 text-violet-400" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Título
                            </Label>
                            <Input
                              value={song.titulo}
                              onChange={(e) => updateSong(i, 'titulo', e.target.value)}
                              placeholder="Título de la canción"
                              className="h-8 text-sm"
                              disabled={isGenerating}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Artista
                            </Label>
                            <Input
                              value={song.artista}
                              onChange={(e) => updateSong(i, 'artista', e.target.value)}
                              placeholder="Nombre del artista"
                              className="h-8 text-sm"
                              disabled={isGenerating}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Duración
                            </Label>
                            <Input
                              value={song.duracion}
                              onChange={(e) => updateSong(i, 'duracion', e.target.value)}
                              placeholder="Ej: 3:45"
                              className="h-8 text-sm"
                              disabled={isGenerating}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                              Género
                            </Label>
                            <Input
                              value={song.genero}
                              onChange={(e) => updateSong(i, 'genero', e.target.value)}
                              placeholder="Ej: Vallenato"
                              className="h-8 text-sm"
                              disabled={isGenerating}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSong(i)}
                          disabled={isGenerating}
                          className="shrink-0 text-muted-foreground hover:text-red-500 h-7 w-7"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Manual Song */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSong}
                  disabled={isGenerating}
                  className="h-8 gap-1.5 text-xs border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30"
                >
                  <Plus className="size-3" /> Agregar canción manualmente
                </Button>
                {form.playlist.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Carga un archivo o agrega canciones una por una
                  </span>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Structure Preview */}
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-200 mb-2">
              {hasPlaylist ? 'Estructura del Libreto (con Playlist)' : 'Estructura del Libreto (sin Playlist)'}
            </p>
            {hasPlaylist ? (
              <ol className="text-xs text-violet-800 dark:text-violet-300 space-y-1.5 list-decimal list-inside">
                <li>Apertura y saludo al aire</li>
                <li>Presentación del programa y tema 1</li>
                <li><span className="font-semibold text-violet-600 dark:text-violet-400">Presentación de canción + transición</span></li>
                <li>Tema 2 de contenido</li>
                <li><span className="font-semibold text-violet-600 dark:text-violet-400">Presentación de canción + transición</span></li>
                <li>Tema 3 de contenido (si aplica)</li>
                <li><span className="font-semibold text-violet-600 dark:text-violet-400">... así sucesivamente según frecuencia configurada</span></li>
                <li>Cierre, resumen y despedida</li>
              </ol>
            ) : (
              <ol className="text-xs text-violet-800 dark:text-violet-300 space-y-1 list-decimal list-inside">
                <li>Apertura y saludo al aire</li>
                <li>Presentacion del programa y contexto del dia</li>
                <li>Desarrollo de cada tema de contenido</li>
                <li>Transiciones entre temas</li>
                <li>Cierre, resumen y despedida</li>
              </ol>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="submit"
              disabled={!isFormValid || isGenerating}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {isGenerating ? (
                <><Loader2 className="size-4 animate-spin" /> Generando libreto...</>
              ) : (
                <><FileAudioIcon className="size-4" /> {hasPlaylist ? 'Generar Libreto con Playlist' : 'Generar Libreto'}</>
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
                  {form.nombrePrograma || 'Generador de Libretos'}
                  {hasPlaylist && ` • ${form.playlist.length} canciones en playlist`}
                  {` • ${validTemas.length} temas`}
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
              <div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-violet-200 [&::-webkit-scrollbar-thumb]:dark:bg-violet-800">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
