'use client';

import { lazy, Suspense } from 'react';
import { GenericGenerator } from './generic-generator';
import { UrlGenerator } from './url-generator';
import { MultiUrlGenerator } from './multi-url-generator';
import { getModuleById } from '@/lib/modules';

// Lazy-loaded module components for code splitting
const CunasInstitucionales = lazy(() => import('./cunas-institucionales').then(m => ({ default: m.CunasInstitucionalesGenerator })));
const CunasClientes = lazy(() => import('./cunas-clientes').then(m => ({ default: m.CunasClientesGenerator })));
const HoroscopoSemanal = lazy(() => import('./horoscopo-semanal').then(m => ({ default: m.HoroscopoSemanalGenerator })));
const PresentacionFranjas = lazy(() => import('./presentacion-franjas').then(m => ({ default: m.PresentacionFranjasGenerator })));
const GeneradorLibretos = lazy(() => import('./generador-libretos').then(m => ({ default: m.GeneradorLibretosGenerator })));
const ContenidoMulticanal = lazy(() => import('./contenido-multicanal').then(m => ({ default: m.ContenidoMulticanalGenerator })));
const ConexionTerritorial = lazy(() => import('./conexion-territorial').then(m => ({ default: m.ConexionTerritorialGenerator })));
const PerfilesLocutores = lazy(() => import('./perfiles-locutores-ia').then(m => ({ default: m.PerfilesLocutoresIaGenerator })));
const ContenidoPersonajes = lazy(() => import('./contenido-personajes').then(m => ({ default: m.ContenidoPersonajesGenerator })));
const GeneradorJingles = lazy(() => import('./generador-jingles').then(m => ({ default: m.GeneradorJinglesGenerator })));

function ModuleSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span>Cargando módulo...</span>
      </div>
    </div>
  );
}

interface ModuleRouterProps {
  moduleId: string;
}

export function ModuleRouter({ moduleId }: ModuleRouterProps) {
  const moduleDef = getModuleById(moduleId);
  if (!moduleDef) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">Módulo no encontrado</p>
      </div>
    );
  }

  // Custom form modules (lazy loaded)
  if (moduleId === 'cunas-institucionales') {
    return <Suspense fallback={<ModuleSkeleton />}><CunasInstitucionales /></Suspense>;
  }

  if (moduleId === 'cunas-clientes') {
    return <Suspense fallback={<ModuleSkeleton />}><CunasClientes /></Suspense>;
  }

  if (moduleId === 'horoscopo-semanal') {
    return <Suspense fallback={<ModuleSkeleton />}><HoroscopoSemanal /></Suspense>;
  }

  if (moduleId === 'presentacion-franjas') {
    return <Suspense fallback={<ModuleSkeleton />}><PresentacionFranjas /></Suspense>;
  }

  if (moduleId === 'generador-libretos') {
    return <Suspense fallback={<ModuleSkeleton />}><GeneradorLibretos /></Suspense>;
  }

  if (moduleId === 'noticias-multicanal') {
    return <Suspense fallback={<ModuleSkeleton />}><ContenidoMulticanal /></Suspense>;
  }

  if (moduleId === 'conexion-territorial') {
    return <Suspense fallback={<ModuleSkeleton />}><ConexionTerritorial /></Suspense>;
  }

  if (moduleId === 'perfiles-locutores-ia') {
    return <Suspense fallback={<ModuleSkeleton />}><PerfilesLocutores /></Suspense>;
  }

  if (moduleId === 'contenido-personajes') {
    return <Suspense fallback={<ModuleSkeleton />}><ContenidoPersonajes /></Suspense>;
  }

  if (moduleId === 'generador-jingles') {
    return <Suspense fallback={<ModuleSkeleton />}><GeneradorJingles /></Suspense>;
  }

  if (moduleDef.hasUrl) {
    return <UrlGenerator moduleId={moduleId} />;
  }

  if (moduleDef.hasMultiUrl) {
    return <MultiUrlGenerator moduleId={moduleId} />;
  }

  return <GenericGenerator moduleId={moduleId} />;
}
