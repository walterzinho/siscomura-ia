'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Key, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKeyItem {
  id: string;
  name: string;
  model: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  keyPreview: string;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newModel, setNewModel] = useState('gemini-2.0-flash');
  const [saving, setSaving] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch {
      toast.error('Error al cargar API Keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleAdd = async () => {
    if (!newName.trim() || !newKey.trim()) {
      toast.error('Nombre y API Key son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, key: newKey, model: newModel }),
      });
      if (res.ok) {
        toast.success('API Key agregada correctamente');
        setNewName('');
        setNewKey('');
        setNewModel('gemini-2.0-flash');
        setShowAddDialog(false);
        fetchKeys();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al agregar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch('/api/keys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentState }),
      });
      if (res.ok) {
        toast.success(currentState ? 'Key desactivada' : 'Key activada');
        fetchKeys();
      }
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('API Key eliminada');
        fetchKeys();
      }
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const totalUsage = keys.reduce((sum, k) => sum + k.usageCount, 0);
  const activeKeys = keys.filter((k) => k.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Key className="w-6 h-6 text-emerald-600" />
            API Keys de Google AI Studio
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tus claves API. El sistema rota automáticamente entre las activas para distribuir el uso.
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="key-name">Nombre descriptivo</Label>
                <Input
                  id="key-name"
                  placeholder="Ej: Key Principal, Key Backup 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-value">API Key</Label>
                <Input
                  id="key-value"
                  type="password"
                  placeholder="AIzaSy..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-model">Modelo</Label>
                <Input
                  id="key-model"
                  placeholder="gemini-2.0-flash"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar API Key'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{keys.length}</p>
            <p className="text-xs text-muted-foreground">Total Keys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{activeKeys}</p>
            <p className="text-xs text-muted-foreground">Activas</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalUsage}</p>
            <p className="text-xs text-muted-foreground">Generaciones Totales</p>
          </CardContent>
        </Card>
      </div>

      {/* How rotation works */}
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-emerald-900">Rotación Automática</p>
              <p className="text-xs text-emerald-700 mt-1">
                El sistema selecciona la API Key con <strong>menor uso</strong> en cada generación.
                Esto distribuye la carga entre todas las keys activas y evita alcanzar los límites de uso de Google AI Studio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys list */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Cargando API Keys...
          </CardContent>
        </Card>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No hay API Keys configuradas</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Agrega al menos una API Key para comenzar a generar contenido.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <Card key={key.id} className={!key.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{key.name}</span>
                      <Badge variant={key.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {key.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {key.model}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {showKey[key.id] ? key.keyPreview : '••••••••'}
                      </span>
                      <button
                        onClick={() =>
                          setShowKey((prev) => ({ ...prev, [key.id]: !prev[key.id] }))
                        }
                        className="hover:text-foreground"
                      >
                        {showKey[key.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <Separator orientation="vertical" className="h-3" />
                      <span>{key.usageCount} usos</span>
                      {key.lastUsedAt && (
                        <span>· Último: {new Date(key.lastUsedAt).toLocaleDateString('es-CO')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={key.isActive}
                      onCheckedChange={() => handleToggle(key.id, key.isActive)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar esta API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará &quot;{key.name}&quot; permanentemente. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(key.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
