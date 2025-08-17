'use client';

export function ProjectSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border bg-background">
      <div className="h-40 w-full bg-muted/50" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-2/3 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-14 bg-muted rounded-full" />
          <div className="h-6 w-12 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-5/6 bg-muted rounded" />
      </div>
    </div>
  );
}

export function EmptyProjects() {
  return (
    <div className="text-center py-16 border rounded-2xl">
      <h3 className="text-lg font-semibold">Nenhum projeto publicado ainda</h3>
      <p className="text-sm text-muted-foreground mt-2">Volte mais tarde — novidades em breve.</p>
    </div>
  );
}