'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Radio,
  Globe,
  Mail,
  Phone,
  Facebook,
  Save,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

interface StationData {
  nombre: string;
  url: string;
  email: string;
  whatsapp: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  instagram: string;
  urlApp: string;
}

const DEFAULT_STATION: StationData = {
  nombre: '',
  url: '',
  email: '',
  whatsapp: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  instagram: '',
  urlApp: '',
};

export function StationConfigPanel() {
  const [data, setData] = useState<StationData>(DEFAULT_STATION);
  const [original, setOriginal] = useState<StationData>(DEFAULT_STATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges =
    data.nombre !== original.nombre ||
    data.url !== original.url ||
    data.email !== original.email ||
    data.whatsapp !== original.whatsapp ||
    data.facebook !== original.facebook ||
    data.tiktok !== original.tiktok ||
    data.youtube !== original.youtube ||
    data.instagram !== original.instagram ||
    data.urlApp !== original.urlApp;

  const fetchStation = useCallback(async () => {
    try {
      const res = await fetch('/api/station');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setOriginal(json);
      }
    } catch {
      toast.error('Error al cargar datos de la emisora');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStation();
  }, [fetchStation]);

  const update = (field: keyof StationData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/station', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const json = await res.json();
        setOriginal(json);
        setSaved(true);
        toast.success('Datos de la emisora guardados');
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setData(original);
  };

  const filledCount = Object.values(data).filter((v) => v.trim()).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Cargando...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-emerald-600" />
            Datos de la Emisora
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Estos datos se inyectan automáticamente en los prompts de generación para personalizar los libretos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleDiscard} disabled={saving}>
              Descartar
            </Button>
          )}
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              'Guardando...'
            ) : saved ? (
              <><Check className="w-4 h-4 mr-1" /> Guardado</>
            ) : (
              <><Save className="w-4 h-4 mr-1" /> Guardar</>
            )}
          </Button>
        </div>
      </div>

      {/* Status info */}
      <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-emerald-900 dark:text-emerald-200">
                Datos disponibles para la IA
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Completados <strong>{filledCount} de 9</strong> campos.{' '}
                {filledCount === 0
                  ? 'Completa al menos el nombre de la emisora para que aparezca en los libretos.'
                  : filledCount < 9
                    ? 'Mientras más datos completes, más personalizados serán los libretos generados.'
                    : 'Todos los datos están configurados. La IA usará estos datos en cada generación.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Column 1: Core info */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Información Principal</CardTitle>
            <CardDescription>Datos esenciales de la emisora</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Nombre de la Emisora
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Radio Sucesos 107.9 FM"
                value={data.nombre}
                onChange={(e) => update('nombre', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url" className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Sitio Web
              </Label>
              <Input
                id="url"
                placeholder="https://www.emisora.com"
                value={data.url}
                onChange={(e) => update('url', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@emisora.com"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                placeholder="+57 300 123 4567"
                value={data.whatsapp}
                onChange={(e) => update('whatsapp', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Social + App */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Redes Sociales y App</CardTitle>
            <CardDescription>Canales digitales de la emisora</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-1.5">
                <Facebook className="w-3.5 h-3.5" />
                Facebook
              </Label>
              <Input
                id="facebook"
                placeholder="https://facebook.com/emisora"
                value={data.facebook}
                onChange={(e) => update('facebook', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                TikTok
              </Label>
              <Input
                id="tiktok"
                placeholder="https://tiktok.com/@emisora"
                value={data.tiktok}
                onChange={(e) => update('tiktok', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                YouTube
              </Label>
              <Input
                id="youtube"
                placeholder="https://youtube.com/@emisora"
                value={data.youtube}
                onChange={(e) => update('youtube', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                Instagram
              </Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/emisora"
                value={data.instagram}
                onChange={(e) => update('instagram', e.target.value)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="urlApp" className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                URL de la App
              </Label>
              <Input
                id="urlApp"
                placeholder="https://play.google.com/store/apps/..."
                value={data.urlApp}
                onChange={(e) => update('urlApp', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview of how it will appear in prompts */}
      {filledCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              Vista previa de inyección en prompts
            </CardTitle>
            <CardDescription>
              Así se verán los datos de la emisora dentro del system instruction que recibe la IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 font-mono text-xs whitespace-pre-wrap">
{`## DATOS DE LA EMISORA (usa estos datos reales en los libretos cuando corresponda)`}
{data.nombre ? `
Nombre de la emisora: ${data.nombre}` : ''}
{data.url ? `
Sitio web: ${data.url}` : ''}
{data.email ? `
Correo de contacto: ${data.email}` : ''}
{data.whatsapp ? `
WhatsApp: ${data.whatsapp}` : ''}
{data.facebook ? `
Facebook: ${data.facebook}` : ''}
{data.tiktok ? `
TikTok: ${data.tiktok}` : ''}
{data.youtube ? `
YouTube: ${data.youtube}` : ''}
{data.instagram ? `
Instagram: ${data.instagram}` : ''}
{data.urlApp ? `
App de la emisora: ${data.urlApp}` : ''}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
