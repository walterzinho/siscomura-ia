import { z } from 'zod';

/* ------------------------------------------------------------------
   Zod schemas for API route input validation.
   Each route should import and .parse() its corresponding schema.
   ------------------------------------------------------------------ */

// ── API Keys ──
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Se requiere nombre').max(100),
  key: z.string().min(10, 'API Key muy corta').max(200),
  model: z.string().optional().default('gemini-3.6-flash'),
});

export const updateApiKeySchema = z.object({
  id: z.string().min(1, 'Se requiere ID'),
  name: z.string().min(1).max(100).optional(),
  key: z.string().min(10).max(200).optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ── Generate (generic) ──
export const generateSchema = z.object({
  moduleId: z.string().min(1, 'Se requiere moduleId'),
  prompt: z.string().min(1, 'Se requiere prompt').max(10000),
  urls: z.array(z.string().url('URL invalida')).max(10).optional(),
});

// ── Generate Phrases ──
export const VALID_TONES = [
  'motivacional', 'humoristico', 'reflexivo',
  'provocativo', 'informativo', 'contundente',
] as const;

export const generatePhrasesSchema = z.object({
  quantity: z.number().int().min(1).max(50).default(10),
  tones: z.array(z.enum(VALID_TONES)).min(1).default(['contundente']),
  topics: z.string().max(1000).default(''),
  character: z.string().max(500).default(''),
});

// ── Generate Campaign ──
export const VALID_ENFOQUE = ['consejo', 'tecnico', 'tutorial'] as const;
export const VALID_FB_LENGTH = ['corto', 'medio', 'largo'] as const;
export const VALID_PHOTO_STYLE = [
  'cinematic', 'smartphone', 'analog', 'watercolor', 'oil', 'macro',
] as const;

export const generateCampaignSchema = z.object({
  characterName: z.string().min(1, 'Se requiere nombre del personaje').max(200),
  characterDesc: z.string().min(1, 'Se requiere descripcion del personaje').max(2000),
  numMessages: z.number().int().min(1).max(20).default(8),
  topics: z.string().max(1000).default(''),
  enfoque: z.enum(VALID_ENFOQUE).default('consejo'),
  fbLength: z.enum(VALID_FB_LENGTH).default('medio'),
  photoStyle: z.enum(VALID_PHOTO_STYLE).default('cinematic'),
  footer: z.string().max(300).default(''),
  hashtags: z.string().max(300).default(''),
});

// ── Generate Profile ──
export const generateProfileSchema = z.object({
  name: z.string().max(200).default(''),
  age: z.string().max(50).default(''),
  gender: z.string().max(50).default(''),
  profileType: z.string().max(100).default(''),
  region: z.string().max(100).default(''),
  scenario: z.string().max(1000).default(''),
  additional: z.string().max(2000).default(''),
});

// ── Generador de Jingles ──
export const VALID_PLATAFORMA = ['suno', 'udio', 'google-musicfx'] as const;
export const VALID_CLASE_JINGLE = ['marca', 'oferta', 'evento', 'programa'] as const;
export const VALID_PARA_QUIEN = ['institucional', 'cliente'] as const;
export const VALID_RIMA = ['AABB', 'ABAB', 'ABBA', 'AAAA', 'interna'] as const;
export const VALID_ESTRUCTURA = ['simple', 'completa'] as const;
export const VALID_VOCAL = ['masculino', 'femenino', 'duo', 'coro', 'instrumental'] as const;

export const generateJingleSchema = z.object({
  plataforma: z.enum(VALID_PLATAFORMA),
  clase: z.enum(VALID_CLASE_JINGLE),
  paraQuien: z.enum(VALID_PARA_QUIEN),
  nombreJingle: z.string().max(200).default(''),
  nombreSujeto: z.string().max(200).default(''),
  objetivo: z.string().max(2000).default(''),
  mensajeResaltar: z.string().max(1000).default(''),
  datosContacto: z.string().max(500).default(''),
  genero: z.string().max(100).default(''),
  tempo: z.string().max(50).default('medio'),
  tempoPersonalizado: z.string().max(10).optional(),
  instrumentos: z.array(z.string()).max(8).default([]),
  estiloVocal: z.enum(VALID_VOCAL).default('masculino'),
  mood: z.string().max(100).default('festivo'),
  estructura: z.enum(VALID_ESTRUCTURA).default('simple'),
  tipoRima: z.enum(VALID_RIMA).default('AABB'),
  numeroEstrofas: z.string().default('2'),
  duracion: z.string().max(20).default('15-20'),
  incluirLocucion: z.boolean().default(true),
});

// ── Prompt Editor ──
export const updatePromptSchema = z.object({
  moduleId: z.string().min(1, 'Se requiere moduleId').max(100),
  content: z.string().max(50000),
});

// ── Station Config ──
export const updateStationSchema = z.object({
  nombre: z.string().max(200).optional(),
  url: z.string().url('URL invalida').optional().or(z.literal('')),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  whatsapp: z.string().max(50).optional(),
  facebook: z.string().max(200).optional(),
  tiktok: z.string().max(200).optional(),
  youtube: z.string().max(200).optional(),
  instagram: z.string().max(200).optional(),
  urlApp: z.string().max(200).optional(),
});

// ── Fetch URL ──
export const fetchUrlSchema = z.object({
  url: z.string().url('Se requiere una URL valida (http/https)'),
});

// ── Generations ──
export const deleteGenerationSchema = z.object({
  id: z.string().min(1, 'Se requiere ID'),
});

/**
 * Helper to validate and return parsed data, or throw a 400 Response.
 */
export function validateOrThrow<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstError = result.error.issues[0];
    const message = firstError
      ? `${firstError.path.join('.')}: ${firstError.message}`
      : 'Datos invalidos';
    throw new ValidationError(message);
  }
  return result.data;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
