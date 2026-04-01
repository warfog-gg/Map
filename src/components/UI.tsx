import { PALETTE } from '../types';

interface UIProps {
  blockCount: number;
  onClear: () => void;
}

export function UI({ blockCount, onClear }: UIProps) {
  return (
    <>
      {/* Title banner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 20px',
        background: 'linear-gradient(180deg, rgba(30,20,10,0.85) 0%, rgba(30,20,10,0) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: '"Georgia", serif',
            fontSize: '22px',
            fontWeight: 'bold',
            color: PALETTE.goldBright,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: '2px',
          }}>
            ELWYNN TOWNSCAPER
          </div>
          <div style={{
            fontFamily: '"Georgia", serif',
            fontSize: '12px',
            color: '#B8A080',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            Human Alliance
          </div>
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#C8B898',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}>
          {blockCount} blocks
        </div>
      </div>

      {/* Controls help */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <Pill text="Left Click" desc="Build" />
        <Pill text="Right Click" desc="Remove" />
        <Pill text="Drag" desc="Rotate" />
        <Pill text="Scroll" desc="Zoom" />
      </div>

      {/* Clear button */}
      {blockCount > 0 && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 20,
          zIndex: 10,
        }}>
          <button
            onClick={onClear}
            style={{
              background: 'rgba(60,30,20,0.8)',
              border: '1px solid #8B7355',
              borderRadius: '4px',
              color: '#C8B898',
              padding: '6px 14px',
              fontFamily: '"Georgia", serif',
              fontSize: '12px',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Warcraft-style border corners */}
      <CornerDecoration />
    </>
  );
}

function Pill({ text, desc }: { text: string; desc: string }) {
  return (
    <div style={{
      background: 'rgba(30,20,10,0.7)',
      borderRadius: '12px',
      padding: '4px 12px',
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
      border: '1px solid rgba(139,115,85,0.3)',
    }}>
      <span style={{
        fontFamily: 'monospace',
        fontSize: '11px',
        color: PALETTE.goldBright,
        fontWeight: 'bold',
      }}>{text}</span>
      <span style={{
        fontFamily: '"Georgia", serif',
        fontSize: '11px',
        color: '#A89878',
      }}>{desc}</span>
    </div>
  );
}

function CornerDecoration() {
  const cornerStyle = (top: boolean, left: boolean): React.CSSProperties => ({
    position: 'absolute',
    [top ? 'top' : 'bottom']: 0,
    [left ? 'left' : 'right']: 0,
    width: '40px',
    height: '40px',
    borderStyle: 'solid',
    borderColor: 'rgba(218,165,32,0.25)',
    borderWidth: 0,
    ...(top ? { borderTopWidth: '2px' } : { borderBottomWidth: '2px' }),
    ...(left ? { borderLeftWidth: '2px' } : { borderRightWidth: '2px' }),
    pointerEvents: 'none' as const,
    zIndex: 10,
  });

  return (
    <>
      <div style={cornerStyle(true, true)} />
      <div style={cornerStyle(true, false)} />
      <div style={cornerStyle(false, true)} />
      <div style={cornerStyle(false, false)} />
    </>
  );
}
