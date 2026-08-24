'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { History, Search, Trash2, Copy, Check, Eye, Calendar, Radio, Drama, Mic, Globe, Sparkles, Heart, Newspaper } from 'lucide-react';
import { toast } from 'sonner';
import { MODULES } from '@/lib/modules';

const iconMap: Record<string, React.ElementType> = {
  Radio,
  Drama,
  Mic,
  Globe,
  Sparkles,
  Heart,
  Newspaper,
};

interface GenerationItem {
  id: string;
  moduleId: string;
  moduleName: string;
  prompt: string;
  result: string;
  metadata: string | null;
  createdAt: string;
}

export function HistoryPanel() {
  const [generations, setGenerations] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<GenerationItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('moduleId', filter);
      params.set('limit', '100');
      const res = await fetch(`/api/generations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setGenerations(data);
      }
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/generations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Registro eliminado');
        fetchHistory();
        setSelectedItem(null);
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  };

  const filtered = search
    ? generations.filter(
        (g) =>
          g.moduleName.toLowerCase().includes(search.toLowerCase()) ||
          g.prompt.toLowerCase().includes(search.toLowerCase()) ||
          g.result.toLowerCase().includes(search.toLowerCase())
      )
    : generations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          Historial de Generaciones
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta y reutiliza contenido generado anteriormente.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en historial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar módulo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los módulos</SelectItem>
            {MODULES.map((mod) => (
              <SelectItem key={mod.id} value={mod.id}>
                {mod.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Badge variant="outline">{filtered.length} registros</Badge>
        {filter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setFilter('all')}>
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Cargando historial...
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No hay generaciones</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Las generaciones aparecerán aquí una vez que comiences a usar los módulos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((gen) => {
            const modDef = MODULES.find((m) => m.id === gen.moduleId);
            const Icon = modDef ? iconMap[modDef.icon] || Radio : Radio;
            return (
              <Card
                key={gen.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedItem(gen)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{gen.moduleName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(gen.createdAt).toLocaleString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {gen.prompt.slice(0, 150)}
                        {gen.prompt.length > 150 ? '...' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(gen);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(gen.result);
                        }}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && (
                <>
                  {(() => {
                    const modDef = MODULES.find((m) => m.id === selectedItem.moduleId);
                    const Icon = modDef ? iconMap[modDef?.icon || ''] || Radio : Radio;
                    return <Icon className="w-5 h-5 text-emerald-600" />;
                  })()}
                  {selectedItem.moduleName}
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    {selectedItem && new Date(selectedItem.createdAt).toLocaleString('es-CO')}
                  </span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Prompt enviado</p>
                <div className="bg-muted rounded-lg p-3 text-sm">
                  {selectedItem.prompt}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Resultado</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(selectedItem.result)}
                >
                  {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <ScrollArea className="max-h-[50vh]">
                <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap">
                  {selectedItem.result}
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar este registro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará esta generación del historial permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedItem.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
