export type Project = {
  id: string;
  title: string;
  description?: string | null;
  techs: string[];
  url?: string | null;
  image?: string | null;
  status: 'draft' | 'published';
  createdAt: string; // ISO
};

export type ProjectsResponse = {
  items: Project[];
  nextCursor?: string | null;
};