'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Radio } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [mode, setMode] = useState<'loading' | 'login' | 'setup'>('loading');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Setup form
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  useEffect(() => {
    fetch('/api/auth/setup')
      .then((r) => r.json())
      .then((data) => {
        setMode(data.needsSetup ? 'setup' : 'login');
      })
      .catch(() => setMode('login'));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales invalidas');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (setupPassword !== setupConfirm) {
      setError('Las contrasenas no coinciden');
      return;
    }

    if (setupPassword.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: setupEmail.trim().toLowerCase(),
          name: setupName.trim(),
          password: setupPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario');
        return;
      }

      // Auto-login after setup
      const result = await signIn('credentials', {
        email: setupEmail.trim().toLowerCase(),
        password: setupPassword,
        redirect: false,
      });

      if (result?.error) {
        setMode('login');
        setEmail(setupEmail);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Error al crear usuario');
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3">
          <Radio className="w-6 h-6 animate-pulse text-emerald-500" />
          <span className="text-muted-foreground">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-siscomura.png"
              alt="Siscomura.ia"
              className="w-12 h-12 rounded-xl"
            />
          </div>
          <CardTitle className="text-xl">
            Siscomura<span className="text-emerald-500">.ia</span>
          </CardTitle>
          <CardDescription>
            {mode === 'setup'
              ? 'Crea tu cuenta de administrador'
              : 'Ingresa a tu cuenta'}
          </CardDescription>
        </CardHeader>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@emisora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !email || !password}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleSetup}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm p-3 rounded-md">
                Primera vez? Crea el usuario administrador del sistema.
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-name">Nombre</Label>
                <Input
                  id="setup-name"
                  type="text"
                  placeholder="Tu nombre"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-email">Email</Label>
                <Input
                  id="setup-email"
                  type="email"
                  placeholder="admin@emisora.com"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-password">Contrasena</Label>
                <Input
                  id="setup-password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="setup-confirm">Confirmar contrasena</Label>
                <Input
                  id="setup-confirm"
                  type="password"
                  placeholder="Repite la contrasena"
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  loading ||
                  !setupName ||
                  !setupEmail ||
                  !setupPassword ||
                  !setupConfirm
                }
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta e ingresar'}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
