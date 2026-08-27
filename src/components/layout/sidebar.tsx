'use client';

import { useAppStore } from '@/lib/store';
import { MODULES } from '@/lib/modules';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { UserButton } from '@clerk/nextjs';
import {
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
  FileAudio,
  Key,
  History,
  LayoutDashboard,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Moon,
  Sun as SunIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';

const iconMap: Record<string, React.ElementType> = {
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
  FileAudio,
};

export function Sidebar() {
  const { currentView, setView, sidebarOpen, toggleSidebar } = useAppStore();
  const { theme, setTheme } = useTheme();

  const isActive = (type: string, id?: string) => {
    if (currentView.type !== type) return false;
    if (id && currentView.type === 'module' && currentView.moduleId !== id) return false;
    return true;
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => toggleSidebar()}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-card border-r border-border transition-all duration-300 flex flex-col
          ${sidebarOpen ? 'w-72' : 'w-0 lg:w-16'}
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border min-h-[65px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <img src="/logo-siscomura.png" alt="Siscomura.ia" className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" />
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm truncate">Siscomura<span className="text-emerald-500">.ia</span></span>
                <span className="text-[10px] text-muted-foreground truncate">Contenido Radial con IA</span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`flex-shrink-0 ${!sidebarOpen ? 'mx-auto' : ''}`}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-2">
          <div className="px-2 space-y-0.5">
            {/* Home */}
            <Button
              variant={isActive('home') ? 'secondary' : 'ghost'}
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setView({ type: 'home' })}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2 text-sm">Inicio</span>}
            </Button>

            <Separator className="my-2" />

            {sidebarOpen && (
              <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Generadores
              </p>
            )}

            {/* Modules with numbers */}
            {MODULES.map((mod) => {
              const Icon = iconMap[mod.icon] || Radio;
              return (
                <Button
                  key={mod.id}
                  variant={isActive('module', mod.id) ? 'secondary' : 'ghost'}
                  className={`w-full h-auto py-1.5 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
                  onClick={() => setView({ type: 'module', moduleId: mod.id })}
                  title={`${mod.number}. ${mod.name}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="ml-2 text-xs font-mono text-muted-foreground w-5">{mod.number}.</span>
                      <span className="text-sm truncate">{mod.name}</span>
                    </>
                  )}
                </Button>
              );
            })}

            <Separator className="my-2" />

            {sidebarOpen && (
              <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Sistema
              </p>
            )}

            <Button
              variant={isActive('station') ? 'secondary' : 'ghost'}
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setView({ type: 'station' })}
              title="Datos Emisora"
            >
              <Radio className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2 text-sm">Datos Emisora</span>}
            </Button>

            <Button
              variant={isActive('prompts') ? 'secondary' : 'ghost'}
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setView({ type: 'prompts' })}
              title="Editar Prompts"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2 text-sm">Editar Prompts</span>}
            </Button>

            <Button
              variant={isActive('settings') ? 'secondary' : 'ghost'}
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setView({ type: 'settings' })}
              title="API Keys"
            >
              <Key className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2 text-sm">API Keys</span>}
            </Button>

            <Button
              variant={isActive('history') ? 'secondary' : 'ghost'}
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => setView({ type: 'history' })}
              title="Historial"
            >
              <History className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="ml-2 text-sm">Historial</span>}
            </Button>

            {/* Theme toggle */}
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={toggleTheme}
              title="Cambiar tema"
            >
              <SunIcon className="w-4 h-4 flex-shrink-0 dark:hidden" />
              <Moon className="w-4 h-4 flex-shrink-0 hidden dark:block" />
              {sidebarOpen && (
                <span className="ml-2 text-sm">
                  {theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}
                </span>
              )}
            </Button>
          </div>
        </ScrollArea>

        {sidebarOpen && (
          <div className="p-3 border-t border-border flex items-center justify-between">
            <Badge variant="outline" className="text-[10px]">
              Siscomura.ia v1.0
            </Badge>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        )}
      </aside>
    </>
  );
}

export function MobileMenuButton() {
  const { toggleSidebar } = useAppStore();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={toggleSidebar}
    >
      <Menu className="w-5 h-5" />
    </Button>
  );
}