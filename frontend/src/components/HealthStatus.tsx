'use client';
import { useEffect, useState } from 'react';

type Health = { status: string; ts: string };

export default function HealthStatus() {
  const [data, setData] = useState<Health | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');
    fetch(`${base}/health`)
      .then((r) => r.json() as Promise<Health>)
      .then(setData)
      .catch((e) => setErr(String(e)));
  }, []);

  if (err) return <p className="text-red-400 text-sm">Erro: {err}</p>;
  if (!data) return <p className="text-sm opacity-70">Checando API…</p>;

  return (
    <pre className="text-xs opacity-70 mt-2 overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}