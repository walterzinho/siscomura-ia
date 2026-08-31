'use client';

import { useState, useEffect } from 'react';
import {
  GitCommitHorizontal,
  Sparkles,
  Wrench,
  Bug,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import type { VersionEntry } from '@/lib/versions';

const TYPE_CONFIG: Record<VersionEntry['type'], { icon: React.ElementType; label: string; color: string; bg: string }> = {
  feature: { icon: Sparkles, label: 'Nuevo', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/50' },
  improvement: { icon: Wrench, label: 'Mejora', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/50' },
  fix: { icon: Bug, label: 'Corrección', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/50' },
  refactor: { icon: ArrowRightLeft, label: 'Refactor', color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/50' },
  remove: { icon: Trash2, label: 'Eliminado', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/50' },
};

export function VersionsPanel() {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [currentVersion, setCurrentVersion] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['0']));
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [matchChecked, setMatchChecked] = useState(false);

  useEffect(() => {
    fetch('/api/versions')
      .then((r) => r.json())
      .then((data) => {
        setVersions(data.versions);
        setCurrentVersion(data.currentVersion);
        setServerVersion(data.currentVersion);
        setMatchChecked(true);
      })
      .catch(() => {
        setMatchChecked(false);
      });
  }, []);

  const toggleExpand = (index: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group by version
  const grouped = new Map<string, VersionEntry[]>();
  versions.forEach((v) => {
    const existing = grouped.get(v.version) || [];
    existing.push(v);
    grouped.set(v.version, existing);
  });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <GitCommitHorizontal className="size-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Historial de Versiones
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de cambios, mejoras y correcciones de Siscomura.ia
          </p>
        </div>
      </div>

      {/* Current version card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Versión Actual</CardTitle>
              <CardDescription className="mt-1">
                {currentVersion ? `v${currentVersion}` : 'Cargando...'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {matchChecked && serverVersion && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  <span className="text-xs font-medium">Desplegada</span>
                </div>
              )}
              {!matchChecked && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="size-4 rounded-full border-2 border-amber-500" />
                  <span className="text-xs font-medium">Sin verificar</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Version timeline */}
      <div className="relative space-y-3">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-8 bottom-0 w-px bg-border" />

        {Array.from(grouped.entries()).map(([version, entries], groupIdx) => {
          const isCurrent = version === currentVersion;
          return (
            <div key={version} className="relative flex gap-4">
              {/* Dot */}
              <div className="relative z-10 mt-1 flex-shrink-0">
                <div
                  className={`size-2.5 rounded-full border-2 ${
                    isCurrent
                      ? 'bg-emerald-500 border-emerald-500 ring-4 ring-emerald-500/20'
                      : 'bg-background border-muted-foreground/30'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold font-mono">
                    v{version}
                  </span>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-700">
                      Actual
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entries[0].date)}
                  </span>
                </div>

                <div className="space-y-2">
                  {entries.map((entry, entryIdx) => {
                    const typeKey = `${groupIdx}-${entryIdx}`;
                    const typeConf = TYPE_CONFIG[entry.type];
                    const TypeIcon = typeConf.icon;
                    const isExpanded = expanded.has(typeKey);
                    const hasDetails = entry.details && entry.details.length > 0;

                    return (
                      <Card key={typeKey} className="overflow-hidden">
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => hasDetails && toggleExpand(typeKey)}
                        >
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md ${typeConf.bg}`}>
                                  <TypeIcon className={`size-3.5 ${typeConf.color}`} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium leading-snug">
                                    {entry.description}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className={`mt-1 text-[10px] ${typeConf.color}`}
                                  >
                                    {typeConf.label}
                                  </Badge>
                                </div>
                              </div>
                              {hasDetails && (
                                <div className="flex-shrink-0 mt-0.5">
                                  {isExpanded ? (
                                    <ChevronUp className="size-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="size-4 text-muted-foreground" />
                                  )}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                        </button>

                        {hasDetails && isExpanded && (
                          <CardContent className="px-4 pb-3 pt-0">
                            <ul className="ml-8 space-y-1.5">
                              {entry.details!.map((detail, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Methodology note */}
      <Card className="border-dashed">
        <CardContent className="py-4 px-4">
          <div className="flex items-start gap-3">
            <GitCommitHorizontal className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Metodología de Versionamiento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Se usa <span className="font-mono">semver</span> (Major.Minor.Patch).{' '}
                <strong>Major</strong>: cambios incompatibles.{' '}
                <strong>Minor</strong>: nuevas funcionalidades.{' '}
                <strong>Patch</strong>: correcciones. Cada cambio se registra aquí y se puede verificar contra la versión desplegada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
