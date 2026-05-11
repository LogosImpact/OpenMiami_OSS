import { useEffect, useMemo, useState } from 'react';
import { detectLang, LANGS, pack, type Lang } from './i18n';
import { searchResources, getResource, submitSuggestion, streamChat, type Resource, type ChatEvent } from './api';

type View = 'search' | 'detail' | 'suggest' | 'chat';
type Verse = 'all' | 'miamiverse' | 'openmiami' | 'lhrt';

const CATEGORIES = [
  'housing', 'food', 'health', 'small_business', 'workforce',
  'arts_culture', 'climate_resilience', 'transit', 'civic_311',
] as const;

function healthClass(score: number) {
  if (score >= 75) return 'badge-green';
  if (score >= 50) return 'badge-amber';
  return 'badge-red';
}

export default function App() {
  const [lang, setLang] = useState<Lang>(detectLang());
  const [view, setView] = useState<View>('search');
  const [detailId, setDetailId] = useState<string | null>(null);
  const L = pack(lang);

  return (
    <div className="app">
      <header className="topbar">
        <h1 onClick={() => setView('search')} role="button">MiamiVerse</h1>
        <div className="lang-switch">
          {LANGS.map((l) => (
            <button
              key={l.code}
              className={l.code === lang ? 'chip chip-on' : 'chip'}
              onClick={() => setLang(l.code)}
              aria-label={`Switch to ${l.label}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </header>

      <div className="banner">
        Demo stub for community feedback. Production lives at{' '}
        <a href="https://impact-lab-miami.vercel.app/" target="_blank" rel="noreferrer">
          impact-lab-miami.vercel.app
        </a>.
      </div>

      <nav className="tabs">
        <button className={view === 'search' ? 'tab on' : 'tab'} onClick={() => setView('search')}>Search</button>
        <button className={view === 'suggest' ? 'tab on' : 'tab'} onClick={() => setView('suggest')}>{L.suggest.title}</button>
        <button className={view === 'chat' ? 'tab on' : 'tab'} onClick={() => setView('chat')}>{L.miagpt.title}</button>
      </nav>

      <main>
        {view === 'search' && (
          <SearchView
            L={L}
            onOpen={(id) => { setDetailId(id); setView('detail'); }}
            lang={lang}
          />
        )}
        {view === 'detail' && detailId && (
          <DetailView L={L} id={detailId} onBack={() => setView('search')} />
        )}
        {view === 'suggest' && <SuggestView L={L} lang={lang} />}
        {view === 'chat' && <ChatView L={L} lang={lang} />}
      </main>

      <footer className="footer">
        OpenMiami_OSS · MIT · <a href="https://github.com/LogosImpact/OpenMiami_OSS" target="_blank" rel="noreferrer">source</a>
      </footer>
    </div>
  );
}

function SearchView({ L, onOpen, lang }: { L: any; onOpen: (id: string) => void; lang: Lang }) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [verse, setVerse] = useState<Verse>('all');
  const [results, setResults] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await searchResources({
        q: q || undefined,
        category: category || undefined,
        verse: verse === 'all' ? undefined : verse,
        language: lang,
        limit: 25,
      });
      setResults(r.data);
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { run(); /* on first paint */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section>
      <form className="search-form" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input
          type="search"
          placeholder={L.common.search_placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit">{L.common.search_button}</button>
      </form>

      <div className="chips" role="tablist" aria-label="verse">
        {(['all', 'miamiverse', 'openmiami', 'lhrt'] as Verse[]).map((v) => (
          <button key={v} className={v === verse ? 'chip chip-on' : 'chip'} onClick={() => setVerse(v)}>
            {v === 'all' ? 'All' : v.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="chips" role="tablist" aria-label="category">
        <button className={category === '' ? 'chip chip-on' : 'chip'} onClick={() => setCategory('')}>
          {/* "All" label from i18n if present */}
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} className={c === category ? 'chip chip-on' : 'chip'} onClick={() => setCategory(c)}>
            {L.categories[c] ?? c}
          </button>
        ))}
      </div>

      {loading && <p className="muted">{L.common.loading}</p>}
      {error && <p className="error">{error}</p>}
      {!loading && results.length === 0 && !error && <p className="muted">{L.common.no_results}</p>}

      <ul className="cards">
        {results.map((r) => (
          <li key={r.id} className="card" onClick={() => onOpen(r.id)}>
            <div className="card-head">
              <strong>{r.name}</strong>
              <span className={`badge ${healthClass(r.health_score)}`} title="Health score 0–100">
                {r.health_score}
              </span>
            </div>
            <div className="card-meta">
              <span className="cat">{L.categories[r.category] ?? r.category}</span>
              <span className="langs">{r.languages.join(' · ')}</span>
            </div>
            {r.description && <p className="card-desc">{r.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function DetailView({ L, id, onBack }: { L: any; id: string; onBack: () => void }) {
  const [r, setR] = useState<Resource | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getResource(id).then(setR).catch((e) => setError(e.message ?? String(e)));
  }, [id]);
  if (error) return <p className="error">{error}</p>;
  if (!r) return <p className="muted">{L.common.loading}</p>;
  return (
    <section className="detail">
      <button className="back" onClick={onBack}>← Back</button>
      <h2>{r.name}</h2>
      <p className="card-meta">
        <span className="cat">{L.categories[r.category] ?? r.category}</span>
        <span className={`badge ${healthClass(r.health_score)}`}>{r.health_score}</span>
      </p>
      {r.description && <p>{r.description}</p>}
      <p>{L.common.languages_offered}: {r.languages.join(', ')}</p>
      <p><a href={r.source_url} target="_blank" rel="noreferrer">{L.common.view_source} →</a></p>
    </section>
  );
}

function SuggestView({ L, lang }: { L: any; lang: Lang }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submitSuggestion({
        name,
        source_url: url,
        description: desc,
        category: category || undefined,
        languages: [lang],
      });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message ?? String(e));
    }
  }

  if (submitted) return <p className="muted">{L.suggest.thanks}</p>;

  return (
    <section>
      <p>{L.suggest.intro}</p>
      <form className="suggest-form" onSubmit={onSubmit}>
        <label>
          <span>{L.suggest.name_label}</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span>{L.suggest.url_label}</span>
          <input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </label>
        <label>
          <span>{L.suggest.description_label}</span>
          <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} />
        </label>
        <label>
          <span>{L.suggest.category_label}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{L.categories[c] ?? c}</option>
            ))}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">{L.suggest.submit}</button>
      </form>
    </section>
  );
}

function ChatView({ L, lang }: { L: any; lang: Lang }) {
  const [apiKey, setApiKey] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const placeholder = useMemo(() => L.miagpt.input_placeholder, [L]);

  async function send() {
    const text = input.trim();
    if (!text || !apiKey) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setStreaming(true);
    setEvents([]);
    let assistantText = '';
    try {
      for await (const ev of streamChat({ messages: next, lang, anthropicKey: apiKey })) {
        setEvents((prev) => [...prev, ev]);
        if (ev.type === 'text') {
          assistantText += ev.text;
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') copy[copy.length - 1] = { role: 'assistant', content: assistantText };
            else copy.push({ role: 'assistant', content: assistantText });
            return copy;
          });
        }
        if (ev.type === 'error') throw new Error(ev.message);
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `[error] ${e.message}` }]);
    } finally {
      setStreaming(false);
    }
  }

  return (
    <section className="chat">
      <p className="muted small">{L.miagpt.tagline} · {L.miagpt.privacy_note}</p>
      {!apiKey && (
        <label className="key-input">
          <span>Anthropic API key (stays in this tab; never stored):</span>
          <input
            type="password"
            placeholder="sk-ant-…"
            onChange={(e) => setApiKey(e.target.value.trim())}
            autoComplete="off"
          />
        </label>
      )}
      <ul className="chat-log">
        {messages.map((m, i) => (
          <li key={i} className={`msg msg-${m.role}`}><strong>{m.role}:</strong> {m.content}</li>
        ))}
      </ul>
      {events.some((e) => e.type === 'tool_use' || e.type === 'tool_result') && (
        <details className="tool-events" open>
          <summary>Tool events</summary>
          <ul>
            {events.filter((e) => e.type === 'tool_use' || e.type === 'tool_result').map((e, i) => (
              <li key={i}><code>{JSON.stringify(e)}</code></li>
            ))}
          </ul>
        </details>
      )}
      <form className="chat-form" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          rows={2}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!apiKey || streaming}
        />
        <button type="submit" disabled={!apiKey || streaming || !input.trim()}>Send</button>
      </form>
    </section>
  );
}
