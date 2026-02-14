import { useState, type FormEvent } from 'react';

interface SearchOverlayProps {
  onSearch: (query: string) => void;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
}

export function SearchOverlay({ onSearch, status, error }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fantasy Map Generator</h1>
        <p style={styles.subtitle}>Transform real-world maps into heroic fantasy worlds</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a place name (ex: Paris, Tokyo, New York...)"
          style={styles.input}
          disabled={status === 'loading'}
        />
        <button type="submit" style={styles.button} disabled={status === 'loading'}>
          {status === 'loading' ? 'Generating...' : 'Generate World'}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {status === 'idle' && (
        <div style={styles.presets}>
          <p style={styles.presetsLabel}>Quick presets:</p>
          <div style={styles.presetButtons}>
            {['Paris', 'London', 'Rome', 'Kyoto', 'Prague', 'Edinburgh'].map((place) => (
              <button
                key={place}
                onClick={() => { setQuery(place); onSearch(place); }}
                style={styles.preset}
              >
                {place}
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div style={styles.controls}>
          <p style={styles.controlsText}>
            Drag to rotate / Scroll to zoom / Right-click to pan
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  header: {
    textAlign: 'center',
    marginBottom: '16px',
  },
  title: {
    color: '#ffd700',
    fontSize: '28px',
    fontWeight: 'bold',
    textShadow: '0 2px 10px rgba(0,0,0,0.8)',
    margin: 0,
    fontFamily: 'Georgia, serif',
    letterSpacing: '2px',
  },
  subtitle: {
    color: '#c8b8e8',
    fontSize: '14px',
    margin: '4px 0 0',
    textShadow: '0 1px 5px rgba(0,0,0,0.8)',
  },
  form: {
    display: 'flex',
    gap: '8px',
    pointerEvents: 'all',
    width: '100%',
    maxWidth: '550px',
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #5a3a8a',
    borderRadius: '8px',
    background: 'rgba(20, 10, 40, 0.85)',
    color: '#e8e0f0',
    fontSize: '15px',
    outline: 'none',
    backdropFilter: 'blur(10px)',
  },
  button: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #8B0000, #4a0020)',
    color: '#ffd700',
    border: '2px solid #ffd700',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 'bold',
    fontFamily: 'Georgia, serif',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
  },
  error: {
    color: '#ff6b6b',
    marginTop: '8px',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
    pointerEvents: 'all',
  },
  presets: {
    marginTop: '16px',
    textAlign: 'center',
    pointerEvents: 'all',
  },
  presetsLabel: {
    color: '#9a8abc',
    fontSize: '13px',
    marginBottom: '8px',
  },
  presetButtons: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  preset: {
    padding: '6px 14px',
    background: 'rgba(90, 58, 138, 0.5)',
    color: '#c8b8e8',
    border: '1px solid #5a3a8a',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    backdropFilter: 'blur(5px)',
  },
  controls: {
    marginTop: '12px',
    pointerEvents: 'all',
  },
  controlsText: {
    color: '#7a6a9a',
    fontSize: '12px',
    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
  },
};
