import { useState, useCallback } from 'react';
import type { AppState, MapData } from './types';
import { geocode, fetchMapData } from './services/osmFetcher';
import { Scene } from './components/Scene';
import { SearchOverlay } from './components/SearchOverlay';

export function App() {
  const [state, setState] = useState<AppState>({
    status: 'idle',
    mapData: null,
    error: null,
    searchQuery: '',
  });

  const handleSearch = useCallback(async (query: string) => {
    setState((s) => ({ ...s, status: 'loading', error: null, searchQuery: query }));

    try {
      const location = await geocode(query);
      if (!location) {
        setState((s) => ({ ...s, status: 'error', error: `Place "${query}" not found. Try another location.` }));
        return;
      }

      const mapData: MapData = await fetchMapData(location.lat, location.lon, 0.5);
      setState((s) => ({ ...s, status: 'ready', mapData }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setState((s) => ({ ...s, status: 'error', error: message }));
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 3D Scene */}
      {state.mapData && <Scene mapData={state.mapData} />}

      {/* Idle background gradient */}
      {!state.mapData && (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #0a0515 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '120px',
            opacity: 0.08,
            color: '#ffd700',
            fontFamily: 'Georgia, serif',
            userSelect: 'none',
          }}>
            &#9876;
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {state.status === 'loading' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10, 5, 21, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #5a3a8a',
            borderTop: '3px solid #ffd700',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#c8b8e8', marginTop: '16px', fontSize: '16px', fontFamily: 'Georgia, serif' }}>
            Summoning the realm of {state.searchQuery}...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* UI Overlay */}
      <SearchOverlay
        onSearch={handleSearch}
        status={state.status}
        error={state.error}
      />
    </div>
  );
}
