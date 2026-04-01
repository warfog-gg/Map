import { PALETTE } from '../types';
import type { Mode } from '../App';

interface UIProps {
  blockCount: number;
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onClear: () => void;
}

export function UI({ blockCount, mode, onModeChange, onClear }: UIProps) {
  return (
    <>
      {/* Title banner */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '10px 16px',
        background: 'linear-gradient(180deg, rgba(30,20,10,0.85) 0%, rgba(30,20,10,0) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <div>
          <div style={{
            fontFamily: '"Georgia", serif',
            fontSize: '18px',
            fontWeight: 'bold',
            color: PALETTE.goldBright,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)',
            letterSpacing: '2px',
          }}>
            ELWYNN TOWNSCAPER
          </div>
          <div style={{
            fontFamily: '"Georgia", serif',
            fontSize: '11px',
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
          {blockCount}
        </div>
      </div>

      {/* Bottom toolbar - mobile friendly */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 16px 20px',
        background: 'linear-gradient(0deg, rgba(30,20,10,0.9) 0%, rgba(30,20,10,0) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        zIndex: 10,
      }}>
        {/* Build button */}
        <ToolButton
          label="Build"
          icon="+"
          active={mode === 'build'}
          onClick={() => onModeChange('build')}
          color="#4A7A2E"
          activeColor="#6AAA3E"
        />

        {/* Remove button */}
        <ToolButton
          label="Remove"
          icon="-"
          active={mode === 'remove'}
          onClick={() => onModeChange('remove')}
          color="#8B4040"
          activeColor="#BB5050"
        />

        {/* Separator */}
        <div style={{ width: '1px', height: '36px', background: 'rgba(139,115,85,0.3)', margin: '0 4px' }} />

        {/* Clear button */}
        {blockCount > 0 && (
          <ToolButton
            label="Clear"
            icon="x"
            active={false}
            onClick={onClear}
            color="#6B5335"
            activeColor="#6B5335"
          />
        )}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute',
        bottom: 68,
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: '"Georgia", serif',
        fontSize: '12px',
        color: 'rgba(200,184,152,0.5)',
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        whiteSpace: 'nowrap',
      }}>
        Tap cells to {mode} &bull; Drag to rotate &bull; Pinch to zoom
      </div>

      {/* Warcraft-style border corners */}
      <CornerDecoration />
    </>
  );
}

function ToolButton({ label, icon, active, onClick, color, activeColor }: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  color: string;
  activeColor: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? activeColor : color,
        border: active ? '2px solid ' + PALETTE.goldBright : '2px solid rgba(139,115,85,0.4)',
        borderRadius: '10px',
        color: active ? '#FFFFFF' : '#C8B898',
        padding: '10px 20px',
        fontFamily: '"Georgia", serif',
        fontSize: '15px',
        fontWeight: active ? 'bold' : 'normal',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: active ? '0 0 12px rgba(218,165,32,0.3)' : 'none',
        transition: 'all 0.15s ease',
        minWidth: '80px',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </button>
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
