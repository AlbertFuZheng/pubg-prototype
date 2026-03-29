import { useGameStore, WEAPONS } from '../stores/gameStore'

export function HUD() {
  const {
    health, maxHealth, ammo, maxAmmo, reserveAmmo,
    currentWeapon, isReloading, isAiming, stance, isLeaning, isSprinting,
  } = useGameStore()

  const healthPercent = (health / maxHealth) * 100
  const healthColor = healthPercent > 60 ? '#4ade80' : healthPercent > 30 ? '#fbbf24' : '#ef4444'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: "'Segoe UI', Tahoma, sans-serif",
      color: 'white',
      zIndex: 100,
    }}>
      {/* Crosshair */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        {isAiming ? (
          // Aimed crosshair - small dot
          <div style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 50, 50, 0.9)',
            boxShadow: '0 0 4px rgba(255, 50, 50, 0.5)',
          }} />
        ) : (
          // Hip fire crosshair
          <>
            <div style={{ position: 'absolute', top: -12, left: -1, width: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            <div style={{ position: 'absolute', bottom: -12, left: -1, width: 2, height: 8, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            <div style={{ position: 'absolute', left: -12, top: -1, width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            <div style={{ position: 'absolute', right: -12, top: -1, width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.8)' }} />
            <div style={{ width: 2, height: 2, backgroundColor: 'rgba(255,50,50,0.8)', borderRadius: '50%' }} />
          </>
        )}
      </div>

      {/* Health bar - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 30,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>HP</div>
        <div style={{
          width: 200,
          height: 8,
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: 4,
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${healthPercent}%`,
            height: '100%',
            backgroundColor: healthColor,
            borderRadius: 4,
            transition: 'width 0.3s, background-color 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 'bold' }}>
          {health}/{maxHealth}
        </div>
      </div>

      {/* Ammo - bottom right */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        right: 30,
        textAlign: 'right',
      }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {WEAPONS[currentWeapon].name}
        </div>
        <div style={{ fontSize: 28, fontWeight: 'bold', lineHeight: 1 }}>
          <span style={{ color: ammo === 0 ? '#ef4444' : 'white' }}>{ammo}</span>
          <span style={{ fontSize: 16, opacity: 0.5 }}> / {reserveAmmo}</span>
        </div>
        {isReloading && (
          <div style={{
            fontSize: 14,
            color: '#fbbf24',
            marginTop: 4,
            animation: 'pulse 1s infinite',
          }}>
            Reloading...
          </div>
        )}
      </div>

      {/* Weapon slots - bottom center */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
      }}>
        {WEAPONS.map((w, i) => (
          <div key={i} style={{
            padding: '4px 12px',
            backgroundColor: i === currentWeapon ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
            border: i === currentWeapon ? '1px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            fontSize: 12,
          }}>
            <span style={{ opacity: 0.5 }}>{i + 1}</span> {w.name}
          </div>
        ))}
      </div>

      {/* Status indicators - top right */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 12,
        opacity: 0.6,
      }}>
        {isAiming && <StatusBadge text="AIM" color="#60a5fa" />}
        {isSprinting && <StatusBadge text="SPRINT" color="#fbbf24" />}
        {stance === 'crouch' && <StatusBadge text="CROUCH" color="#a78bfa" />}
        {stance === 'prone' && <StatusBadge text="PRONE" color="#f87171" />}
        {isLeaning === 'left' && <StatusBadge text="LEAN L" color="#34d399" />}
        {isLeaning === 'right' && <StatusBadge text="LEAN R" color="#34d399" />}
      </div>

      {/* Controls help - top left */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        fontSize: 11,
        opacity: 0.4,
        lineHeight: 1.6,
      }}>
        <div>WASD - Move | Shift - Sprint</div>
        <div>Mouse - Look | LMB - Fire | RMB - Aim</div>
        <div>Space - Jump | C - Crouch | Z - Prone</div>
        <div>Q/E - Lean | R - Reload | 1/2/3 - Weapons</div>
      </div>
    </div>
  )
}

function StatusBadge({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      padding: '2px 8px',
      backgroundColor: 'rgba(0,0,0,0.4)',
      border: `1px solid ${color}`,
      borderRadius: 3,
      color,
      fontWeight: 'bold',
      textAlign: 'center',
    }}>
      {text}
    </div>
  )
}
