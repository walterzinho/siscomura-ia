export interface VersionEntry {
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'refactor' | 'remove';
  description: string;
  details?: string[];
}

export const VERSIONS: VersionEntry[] = [
  {
    version: '1.3.0',
    date: '2026-08-31',
    type: 'improvement',
    description: 'Sistema de versionamiento y panel de cambios',
    details: [
      'Nuevo panel de versiones accesible desde el sidebar',
      'Badge de versión dinámico en el pie del sidebar',
      'API /api/versions para consulta de historial',
      'Metodología de versionamiento semántico (semver)',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-31',
    type: 'improvement',
    description: 'Generador de Jingles v2 con control musical granular',
    details: [
      'Selección de plataforma: Suno, Udio, Google MusicFX',
      'Control de género musical (14 géneros latino/colombianos)',
      'Selección de BPM, instrumentos, mood y estructura',
      'Prompts específicos por plataforma con formato de salida',
      'Reglas anti-duración para Suno/Udio (resultados cortos)',
      'Tipos de rima conservados del módulo original',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-08-31',
    type: 'refactor',
    description: 'Jingles removidos de Cuñas Institucionales y Cuñas de Clientes',
    details: [
      'Los jingles ahora tienen su propio módulo dedicado (#10)',
      'Cuñas Institucionales: solo Unitario y Campaña',
      'Cuñas de Clientes: solo Unitario, Campaña e Infomercial',
      'Código limpio sin condicionales de jingle',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-08-30',
    type: 'feature',
    description: 'Módulos restaurados: Sembrando Esperanza y Bienestar Campesino',
    details: [
      'Módulo #11: Sembrando Esperanza - micro programa de motivación en fe',
      'Módulo #12: Bienestar Campesino - reflexión de salud mental rural',
      'Prompts especializados con estructura de 8 y 6 puntos respectivamente',
      'Formularios dedicados con campos específicos por micro programa',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-08-29',
    type: 'fix',
    description: 'Corrección de acentos en textos de la interfaz',
    details: [
      'Acentos corregidos en todos los módulos de cuñas',
      'Textos de placeholder y etiquetas normalizados',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-08-28',
    type: 'improvement',
    description: 'Mejoras funcionales (Fase 3)',
    details: [
      'Optimización de rendimiento en carga de módulos',
      'Mejoras en la gestión de estado de la aplicación',
      'Refactorización de componentes compartidos',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-27',
    type: 'feature',
    description: 'Siscomura.ia v1.0 — Generación de Contenido Radial con IA',
    details: [
      'Módulo 1: Cuñas Institucionales',
      'Módulo 2: Cuñas de Clientes',
      'Módulo 3: Horóscopo Semanal',
      'Módulo 4: Presentación de Franjas',
      'Módulo 5: Contenido Multicanal',
      'Módulo 6: Conexión Territorial',
      'Módulo 7: Perfiles Locutores IA',
      'Módulo 8: Contenido de Personajes',
      'Módulo 9: Generador de Libretos',
      'Panel de Historial de generaciones',
      'Editor de Prompts en vivo',
      'Configuración de Datos Emisora',
      'Gestión de API Keys',
      'Autenticación con NextAuth',
    ],
  },
];

export function getCurrentVersion(): string {
  return VERSIONS[0]?.version || '1.0.0';
}
