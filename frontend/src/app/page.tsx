'use client';

import { useEffect, useState, useTransition } from 'react';
import { fetchProjects } from '@/lib/api';
import type { Project } from '@/types/projects';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectSkeleton, EmptyProjects } from '@/components/ProjectSkeleton';
import { Button } from '@/components/ui/button';

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // primeira página
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchProjects({ limit: 12 })
      .then((res) => {
        if (!alive) return;
        setItems(res.items ?? []);
        setNextCursor(res.nextCursor ?? null);
        setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Erro desconhecido'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const loadMore = () => {
    if (!nextCursor) return;
    startTransition(async () => {
      try {
        const res = await fetchProjects({ limit: 12, cursor: nextCursor });
        setItems((prev) => [...prev, ...(res.items ?? [])]);
        setNextCursor(res.nextCursor ?? null);
      } catch (e: unknown) {
  if (e instanceof Error) {
    setError(e.message);
  } else {
    setError('Erro ao paginar');
  }
}
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seleção de projetos publicados, ordenados por mais recentes.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border p-4 text-sm">
          <span className="font-medium">Erro:</span> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyProjects />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>

          <div className="flex justify-center mt-10">
            {nextCursor ? (
              <Button onClick={loadMore} disabled={isPending}>
                {isPending ? 'Carregando…' : 'Carregar mais'}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Fim da lista</p>
            )}
          </div>
        </>
      )}
    </main>
  );
}