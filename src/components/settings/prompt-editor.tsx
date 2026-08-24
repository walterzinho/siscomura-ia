'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MODULES } from '@/lib/modules';
import { toast } from 'sonner';
import { FileText, Save, RotateCcw, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PromptData {
  moduleId: string;
  filename: string;
  content: string;
}

type SaveState = 'idle' | 'saving' | 'saved';

export function PromptEditor() {
  const [prompts, setPrompts] = useState<PromptData[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasUnsavedChanges = editedContent !== originalContent;

  const selectedModule = MODULES.find((m) => m.id === selectedModuleId);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await fetch('/api/prompts');
      if (!res.ok) throw new Error('Error al cargar los prompts');
      const data: PromptData[] = await res.json();
      setPrompts(data);
      return data;
    } catch (error) {
      toast.error('Error al cargar los prompts');
      return null;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const data = await fetchPrompts();
      if (data && data.length > 0) {
        const firstModule = MODULES[0];
        setSelectedModuleId(firstModule.id);
        const prompt = data.find((p) => p.moduleId === firstModule.id);
        const content = prompt?.content ?? '';
        setEditedContent(content);
        setOriginalContent(content);
      }
      setLoading(false);
    };
    init();
  }, [fetchPrompts]);

  const handleSelectModule = (moduleId: string) => {
    if (hasUnsavedChanges && selectedModuleId !== moduleId) {
      const confirmSwitch = window.confirm(
        'Tienes cambios sin guardar. ¿Deseas cambiar de módulo y perder los cambios?'
      );
      if (!confirmSwitch) return;
    }
    setSelectedModuleId(moduleId);
    const prompt = prompts.find((p) => p.moduleId === moduleId);
    const content = prompt?.content ?? '';
    setEditedContent(content);
    setOriginalContent(content);
  };

  const handleSave = async () => {
    if (!selectedModuleId) return;
    setSaveState('saving');
    try {
      const res = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: selectedModuleId, content: editedContent }),
      });
      if (!res.ok) throw new Error('Error al guardar');
      setOriginalContent(editedContent);
      toast.success('Prompt guardado correctamente');
      setSaveState('saved');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      toast.error('Error al guardar el prompt');
      setSaveState('idle');
    }
  };

  const handleReload = async () => {
    if (!selectedModuleId) return;
    const data = await fetchPrompts();
    if (data) {
      const prompt = data.find((p) => p.moduleId === selectedModuleId);
      const content = prompt?.content ?? '';
      setEditedContent(content);
      setOriginalContent(content);
      toast.info('Prompt recargado desde el servidor');
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3 text-emerald-600">
            <FileText className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-medium">Cargando prompts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row h-full min-h-[500px]">
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="lg:hidden border-b border-emerald-200 bg-emerald-50/50">
            <ScrollArea className="w-full">
              <div className="flex gap-1 p-2">
                {MODULES.map((mod) => {
                  const isSelected = selectedModuleId === mod.id;
                  const hasChanges =
                    isSelected && editedContent !== originalContent;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModule(mod.id)}
                      className={cn(
                        'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-700 hover:bg-emerald-100'
                      )}
                    >
                      <span className="text-xs opacity-70 font-bold">
                        {mod.number}.
                      </span>
                      <span className="relative">
                        {mod.name}
                        {hasChanges && (
                          <span className="absolute -top-1.5 -right-2.5 h-2 w-2 rounded-full bg-amber-400 ring-2 ring-white" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Desktop: Vertical sidebar */}
          <div className="hidden lg:flex flex-col w-72 border-r border-emerald-200 bg-emerald-50/50">
            <div className="p-4 pb-2">
              <h3 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Editor de Prompts
              </h3>
              <p className="text-xs text-emerald-600/70 mt-1">
                Selecciona un módulo para editar su instrucción del sistema
              </p>
            </div>
            <Separator className="bg-emerald-200" />
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {MODULES.map((mod) => {
                  const isSelected = selectedModuleId === mod.id;
                  const hasChanges =
                    isSelected && editedContent !== originalContent;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => handleSelectModule(mod.id)}
                      className={cn(
                        'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left transition-colors',
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-700 hover:bg-emerald-100'
                      )}
                    >
                      <Badge
                        variant={isSelected ? 'secondary' : 'outline'}
                        className={cn(
                          'flex-shrink-0 h-5 min-w-5 flex items-center justify-center text-[10px] font-bold px-1.5',
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-500'
                            : 'text-emerald-600 border-emerald-300'
                        )}
                      >
                        {mod.number}
                      </Badge>
                      <div className="flex-1 min-w-0 relative">
                        <span className="text-sm font-medium block truncate">
                          {mod.name}
                        </span>
                        {hasChanges && (
                          <span className="inline-flex items-center gap-1 text-[10px] mt-0.5 text-amber-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Sin guardar
                          </span>
                        )}
                      </div>
                      {isSelected && !hasChanges && (
                        <Check className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-70" />
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Editor area */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedModule ? (
              <>
                {/* Editor header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-emerald-100 bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-gray-900 truncate">
                          Módulo {selectedModule.number}: {selectedModule.name}
                        </h2>
                        {hasUnsavedChanges && (
                          <Badge
                            variant="outline"
                            className="flex-shrink-0 text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mr-1" />
                            Modificado
                          </Badge>
                        )}
                        {saveState === 'saved' && (
                          <Badge
                            variant="outline"
                            className="flex-shrink-0 text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50"
                          >
                            <Check className="h-3 w-3 mr-0.5" />
                            Guardado
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {selectedModule.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReload}
                      disabled={saveState === 'saving'}
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <RotateCcw className="h-4 w-4 mr-1.5" />
                      Descartar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!hasUnsavedChanges || saveState === 'saving'}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {saveState === 'saving' ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1.5" />
                          Guardando...
                        </>
                      ) : saveState === 'saved' ? (
                        <>
                          <Check className="h-4 w-4 mr-1.5" />
                          Guardado
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1.5" />
                          Guardar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Textarea */}
                <div className="flex-1 p-4">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Escribe la instrucción del sistema para este módulo..."
                    className={cn(
                      'w-full min-h-[400px] resize-y font-mono text-sm leading-relaxed',
                      'border-emerald-200 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-400',
                      'bg-white placeholder:text-emerald-300'
                    )}
                  />
                </div>

                {/* Footer status bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-emerald-100 bg-emerald-50/30">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {editedContent.length} caracteres
                    </span>
                    <span>·</span>
                    <span>
                      {editedContent.split('\n').length} líneas
                    </span>
                  </div>
                  {hasUnsavedChanges && (
                    <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Cambios sin guardar
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-emerald-600">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Selecciona un módulo</p>
                  <p className="text-xs mt-1 opacity-70">
                    Elige un módulo de la lista para editar su prompt
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
