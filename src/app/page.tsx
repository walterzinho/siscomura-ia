'use client';

import { useAppStore } from '@/lib/store';
import { MODULES } from '@/lib/modules';
import { Sidebar, MobileMenuButton } from '@/components/layout/sidebar';
import { HomeView } from '@/components/layout/home-view';
import { ModuleRouter } from '@/components/modules/module-router';
import { ApiKeysManager } from '@/components/settings/api-keys';
import { HistoryPanel } from '@/components/settings/history';
import { PromptEditor } from '@/components/settings/prompt-editor';
import { StationConfigPanel } from '@/components/settings/station-config';
import { VersionsPanel } from '@/components/settings/versions-panel';
import { Toaster } from 'sonner';

export default function Page() {
  const { currentView, sidebarOpen } = useAppStore();

  const getPageTitle = () => {
    switch (currentView.type) {
      case 'home':
        return 'Inicio';
      case 'module': {
        const mod = MODULES.find((m) => m.id === currentView.moduleId);
        return mod ? `${mod.number}. ${mod.name}` : 'Generador';
      }
      case 'settings':
        return 'Configuración';
      case 'history':
        return 'Historial';
      case 'prompts':
        return 'Editar Prompts';
      case 'station':
        return 'Datos Emisora';
      case 'versions':
        return 'Versiones';
      default:
        return 'Siscomura.ia';
    }
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'home':
        return <HomeView />;
      case 'module':
        return <ModuleRouter moduleId={currentView.moduleId} />;
      case 'settings':
        return <ApiKeysManager />;
      case 'history':
        return <HistoryPanel />;
      case 'prompts':
        return <PromptEditor />;
      case 'station':
        return <StationConfigPanel />;
      case 'versions':
        return <VersionsPanel />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-72' : 'lg:pl-16'
        }`}
      >
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <MobileMenuButton />
            <h1 className="font-semibold text-sm sm:text-base">
              {getPageTitle()}
            </h1>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-5xl mx-auto">
          {renderContent()}
        </main>
      </div>
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
