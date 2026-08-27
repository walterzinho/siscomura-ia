'use client';

import { GenericGenerator } from './generic-generator';
import { UrlGenerator } from './url-generator';
import { MultiUrlGenerator } from './multi-url-generator';
import { CunasInstitucionalesGenerator } from './cunas-institucionales';
import { CunasClientesGenerator } from './cunas-clientes';
import { HoroscopoSemanalGenerator } from './horoscopo-semanal';
import { BienestarCampesinoGenerator } from './bienestar-campesino';
import { SembrandoEsperanzaGenerator } from './sembrando-esperanza';
import { PresentacionFranjasGenerator } from './presentacion-franjas';
import { GeneradorLibretosGenerator } from './generador-libretos';
import { ContenidoMulticanalGenerator } from './contenido-multicanal';
import { ConexionTerritorialGenerator } from './conexion-territorial';
import { PerfilesLocutoresIaGenerator } from './perfiles-locutores-ia';
import { ContenidoPersonajesGenerator } from './contenido-personajes';
import { getModuleById } from '@/lib/modules';

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

  // Custom form modules
  if (moduleId === 'cunas-institucionales') {
    return <CunasInstitucionalesGenerator />;
  }

  if (moduleId === 'cunas-clientes') {
    return <CunasClientesGenerator />;
  }

  if (moduleId === 'horoscopo-semanal') {
    return <HoroscopoSemanalGenerator />;
  }

  if (moduleId === 'bienestar-campesino') {
    return <BienestarCampesinoGenerator />;
  }

  if (moduleId === 'sembrando-esperanza') {
    return <SembrandoEsperanzaGenerator />;
  }

  if (moduleId === 'presentacion-franjas') {
    return <PresentacionFranjasGenerator />;
  }

  if (moduleId === 'generador-libretos') {
    return <GeneradorLibretosGenerator />;
  }

  if (moduleId === 'noticias-multicanal') {
    return <ContenidoMulticanalGenerator />;
  }

  if (moduleId === 'conexion-territorial') {
    return <ConexionTerritorialGenerator />;
  }

  if (moduleId === 'perfiles-locutores-ia') {
    return <PerfilesLocutoresIaGenerator />;
  }

  if (moduleId === 'contenido-personajes') {
    return <ContenidoPersonajesGenerator />;
  }

  if (moduleDef.hasUrl) {
    return <UrlGenerator moduleId={moduleId} />;
  }

  if (moduleDef.hasMultiUrl) {
    return <MultiUrlGenerator moduleId={moduleId} />;
  }

  return <GenericGenerator moduleId={moduleId} />;
}