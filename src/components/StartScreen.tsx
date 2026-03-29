import { useState, useCallback } from 'react'

export function StartScreen({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false)

  const handleClick = useCallback(() => {
    if (!ready) {
      setReady(true)
      return
    }
    // Request pointer lock and start game
    document.body.requestPointerLock()
    onStart()
  }, [ready, onStart])

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        cursor: 'pointer',
        zIndex: 200,
        userSelect: 'none',
      }}
    >
      <div style={{
        fontSize: 14,
        letterSpacing: 8,
        opacity: 0.4,
        marginBottom: 12,
      }}>
        AI GAME DEV WORKFLOW
      </div>
      <div style={{
        fontSize: 48,
        fontWeight: 900,
        letterSpacing: 4,
        marginBottom: 8,
      }}>
        PUBG PROTOTYPE
      </div>
      <div style={{
        fontSize: 16,
        opacity: 0.5,
        marginBottom: 60,
      }}>
        Third Person Shooter — Operation Demo
      </div>

      <div style={{
        fontSize: 20,
        padding: '12px 40px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderRadius: 8,
        animation: 'pulse 2s infinite',
      }}>
        {ready ? '🎮 CLICK TO START' : '👆 CLICK TO CONTINUE'}
      </div>

      <div style={{
        marginTop: 60,
        fontSize: 13,
        opacity: 0.3,
        textAlign: 'center',
        lineHeight: 2,
      }}>
        <div>WASD - Move | Shift - Sprint | Space - Jump</div>
        <div>Mouse - Look | LMB - Fire | RMB - Aim</div>
        <div>Q/E - Lean | C - Crouch | Z - Prone</div>
        <div>R - Reload | 1/2/3 - Switch Weapons</div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
