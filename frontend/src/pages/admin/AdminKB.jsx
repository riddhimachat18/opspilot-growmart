import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { KB_ARTICLES } from '../../utils/constants';

const C = {
  base: '#0B0E14', surface: '#111621', raised: '#181E2C',
  border: 'rgba(255,255,255,0.07)', border2: 'rgba(255,255,255,0.12)',
  ink1: '#E8EEFF', ink2: '#8899BB', ink3: '#4A5872',
  accent: '#4F6EF7', accentDim: 'rgba(79,110,247,0.14)',
};

// Simulated "recently referenced" articles (would come from real trace logs in production)
const RECENT_IDS = new Set([9, 4, 5, 11]);

export default function AdminKB() {
  const [query, setQuery] = useState('');

  const filtered = KB_ARTICLES.filter(a =>
    !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.tags.some(t => t.includes(query.toLowerCase()))
  );

  return (
    <div style={{ padding: '28px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em', color: C.ink1, margin: '0 0 4px' }}>Knowledge base</h1>
          <p style={{ color: C.ink3, fontSize: 12, margin: 0 }}>Support Agent retrieves from these articles via RAG · {KB_ARTICLES.length} articles</p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: C.ink3 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search articles…"
            style={{ backgroundColor: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 12px 8px 32px', color: C.ink1, fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none', width: 220 }}
            onFocus={e => e.target.style.borderColor = C.accent}
            onBlur={e => e.target.style.borderColor = C.border2}
          />
        </div>
      </div>

      {/* Recently referenced strip */}
      {!query && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.ink3, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>Recently referenced in conversations</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {KB_ARTICLES.filter(a => RECENT_IDS.has(a.id)).map(a => (
              <div key={a.id} style={{ backgroundColor: C.accentDim, border: `1px solid rgba(79,110,247,0.2)`, borderRadius: 7, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 7 }}>
                <BookOpen size={11} style={{ color: C.accent }} />
                <span style={{ color: C.accent, fontSize: 12 }}>{a.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Article grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
        {filtered.map(article => (
          <div key={article.id} style={{
            backgroundColor: C.surface,
            border: `1px solid ${RECENT_IDS.has(article.id) && !query ? 'rgba(79,110,247,0.2)' : C.border}`,
            borderRadius: 9, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
              <h3 style={{ color: C.ink1, fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.35 }}>{article.title}</h3>
              {RECENT_IDS.has(article.id) && !query && (
                <span style={{ backgroundColor: C.accentDim, color: C.accent, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>referenced</span>
              )}
            </div>
            <p style={{ color: C.ink3, fontSize: 12, lineHeight: 1.6, margin: '0 0 10px' }}>{article.excerpt}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {article.tags.map(tag => (
                <span key={tag} style={{ backgroundColor: C.raised, color: C.ink3, fontSize: 10, padding: '2px 8px', borderRadius: 5, fontFamily: 'JetBrains Mono, monospace' }}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: C.ink3, fontSize: 13 }}>
          No articles match "{query}".
        </div>
      )}
    </div>
  );
}
