'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { MODULES } from '@/lib/modules';
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
  Key,
  ArrowRight,
  Zap,
  Shield,
  Layers,
  FileText,
} from 'lucide-react';

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
};

interface Stats {
  totalGenerations: number;
  activeKeys: number;
  totalKeys: number;
}

export function HomeView() {
  const { setView } = useAppStore();
  const [stats, setStats] = useState<Stats>({ totalGenerations: 0, activeKeys: 0, totalKeys: 0 });
  const [recentGenerations, setRecentGenerations] = useState<Array<{
    id: string;
    moduleName: string;
    moduleId: string;
    createdAt: string;
  }>>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [genRes, keyRes] = await Promise.all([
          fetch('/api/generations?limit=5'),
          fetch('/api/keys'),
        ]);
        if (genRes.ok) {
          const genData = await genRes.json();
          setRecentGenerations(genData.slice(0, 5));
        }
        if (keyRes.ok) {
          const keyData = await keyRes.json();
          setStats({
            totalGenerations: 0,
            activeKeys: keyData.filter((k: { isActive: boolean }) => k.isActive).length,
            totalKeys: keyData.length,
          });
        }
      } catch {
        // silently fail
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <img src="/logo-siscomura.png" alt="Siscomura.ia" className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Siscomura<span className="text-emerald-200">.ia</span></h1>
              <p className="text-emerald-100 text-xs sm:text-sm">Generación de Contenido Radial con IA</p>
            </div>
          </div>
          <p className="text-emerald-50/90 text-sm max-w-lg">
            Sistema integral de producción de contenido radial con inteligencia artificial. Módulos especializados, prompts editables, rotación de API Keys y tema oscuro.
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{MODULES.length}</p>
            <p className="text-[10px] text-muted-foreground">Módulos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Key className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{stats.activeKeys}</p>
            <p className="text-[10px] text-muted-foreground">Keys Activas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{recentGenerations.length}</p>
            <p className="text-[10px] text-muted-foreground">Recientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
            <p className="text-2xl font-bold">{MODULES.length}</p>
            <p className="text-[10px] text-muted-foreground">Prompts .md</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning if no keys */}
      {stats.activeKeys === 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm text-amber-900 dark:text-amber-200">Configura tus API Keys</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                No tienes API Keys activas. Ve a API Keys para agregar al menos una de Google AI Studio.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900"
              onClick={() => setView({ type: 'settings' })}
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              Ir a API Keys
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modules Grid */}
      <div>
        <h2 className="text-lg font-bold mb-4">Módulos de Generación</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map((mod) => {
            const Icon = iconMap[mod.icon] || Radio;
            return (
              <Card
                key={mod.id}
                className="hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group"
                onClick={() => setView({ type: 'module', moduleId: mod.id })}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition-colors">
                      <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{mod.number}.</span>
                        <CardTitle className="text-sm">{mod.name}</CardTitle>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardDescription className="text-xs line-clamp-2">
                    {mod.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Generations */}
      {recentGenerations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Generaciones Recientes</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView({ type: 'history' })}
            >
              Ver todo <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentGenerations.map((gen) => {
              const modDef = MODULES.find((m) => m.id === gen.moduleId);
              const Icon = modDef ? iconMap[modDef.icon] || Radio : Radio;
              return (
                <Card key={gen.id} className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30" onClick={() => setView({ type: 'history' })}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{gen.moduleName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(gen.createdAt).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}