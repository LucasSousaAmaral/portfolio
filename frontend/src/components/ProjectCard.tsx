'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Project } from '@/types/projects';

export function ProjectCard({ p }: { p: Project }) {
  const hasImg = !!p.image;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {hasImg && (
        <div className="relative w-full aspect-[16/9] bg-gray-100">
          {/* Ajuste domains no next.config.mjs para servir essa imagem */}
          <Image
            src={p.image!}
            alt={p.title}
            fill
            sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </div>
      )}

      <CardHeader className="space-y-2">
        <CardTitle className="text-base sm:text-lg">{p.title}</CardTitle>
        {p.techs?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {p.techs.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {p.description && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>}

        <div className="flex gap-3 pt-1">
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4 hover:opacity-80"
            >
              Visit
            </a>
          )}
          {/* Exemplo de link para detalhes futuros */}
          {/* <Link href={`/projects/${p.id}`} className="text-sm text-muted-foreground hover:underline">Details</Link> */}
        </div>
      </CardContent>
    </Card>
  );
}