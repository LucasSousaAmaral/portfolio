import type { ProjectsResponse } from '@/types/projects';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE) {
  // Ajuda a detectar em build/local
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_API_BASE_URL não definido.');
}

export async function fetchProjects(params?: { limit?: number; cursor?: string; status?: 'published' | 'draft' }) {
  const url = new URL('/api/v1/projects', API_BASE);
  if (params?.limit) url.searchParams.set('limit', String(params.limit));
  if (params?.cursor) url.searchParams.set('cursor', params.cursor);
  // Em produção mantenha published; se precisar listar drafts quando tiver auth, altere aqui
  url.searchParams.set('status', params?.status ?? 'published');

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Erro ao buscar projetos (${res.status}): ${text || res.statusText}`);
  }
  return (await res.json()) as ProjectsResponse;
}