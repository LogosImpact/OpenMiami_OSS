const BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:3000';

export type Resource = {
  id: string;
  name: string;
  provider_type: string;
  category: string;
  description: string | null;
  languages: string[];
  contact: Record<string, string>;
  source_url: string;
  verified_at: string | null;
  health_score: number;
  url_status: string | null;
};

export async function searchResources(params: {
  q?: string;
  category?: string;
  language?: string;
  verse?: string;
  limit?: number;
}) {
  const u = new URL(`${BASE}/resources`);
  for (const [k, v] of Object.entries(params)) {
    if (v) u.searchParams.set(k, String(v));
  }
  const res = await fetch(u);
  if (!res.ok) throw new Error(`/resources ${res.status}`);
  return (await res.json()) as { data: Resource[]; page: { limit: number; offset: number; total: number } };
}

export async function getResource(id: string) {
  const res = await fetch(`${BASE}/resources/${id}`);
  if (!res.ok) throw new Error(`/resources/:id ${res.status}`);
  return ((await res.json()) as { data: Resource }).data;
}

export async function submitSuggestion(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error?.message ?? `/suggest ${res.status}`);
  }
  return res.json();
}

export type ChatEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; name: string; input: unknown }
  | { type: 'tool_result'; name: string; count: number }
  | { type: 'done' }
  | { type: 'error'; message: string };

export async function* streamChat(opts: {
  messages: { role: 'user' | 'assistant'; content: string }[];
  lang: string;
  anthropicKey: string;
}): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok || !res.body) {
    const j = await res.json().catch(() => null);
    yield { type: 'error', message: j?.error?.message ?? `/chat ${res.status}` };
    return;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!frame.startsWith('data:')) continue;
      const payload = frame.slice(5).trim();
      if (!payload) continue;
      try {
        yield JSON.parse(payload) as ChatEvent;
      } catch {
        // ignore malformed frames
      }
    }
  }
}
