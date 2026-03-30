import { create } from 'zustand'

export interface GameState {
  // Player
  health: number
  maxHealth: number
  isAiming: boolean
  isLeaning: 'none' | 'left' | 'right'
  isCrouching: boolean
  isProne: boolean
  isJumping: boolean
  isSprinting: boolean
  stance: 'stand' | 'crouch' | 'prone'

  // Weapon
  currentWeapon: number
  ammo: number
  maxAmmo: number
  reserveAmmo: number
  isReloading: boolean
  isFiring: boolean
  fireRate: number
  lastFireTime: number

  // Actions
  setHealth: (health: number) => void
  takeDamage: (damage: number) => void
  setAiming: (aiming: boolean) => void
  setLeaning: (dir: 'none' | 'left' | 'right') => void
  setStance: (stance: 'stand' | 'crouch' | 'prone') => void
  setJumping: (jumping: boolean) => void
  setSprinting: (sprinting: boolean) => void
  fire: () => boolean
  reload: () => void
  switchWeapon: (slot: number) => void
  setReloading: (reloading: boolean) => void
}

export const WEAPONS = [
  { name: 'AKM', ammo: 30, maxAmmo: 30, reserve: 90, fireRate: 100, damage: 36 },
  { name: 'M416', ammo: 30, maxAmmo: 30, reserve: 90, fireRate: 86, damage: 31 },
]

export const useGameStore = create<GameState>((set, get) => ({
  health: 100,
  maxHealth: 100,
  isAiming: false,
  isLeaning: 'none',
  isCrouching: false,
  isProne: false,
  isJumping: false,
  isSprinting: false,
  stance: 'stand',

  currentWeapon: 0,
  ammo: WEAPONS[0].ammo,
  maxAmmo: WEAPONS[0].maxAmmo,
  reserveAmmo: WEAPONS[0].reserve,
  isReloading: false,
  isFiring: false,
  fireRate: WEAPONS[0].fireRate,
  lastFireTime: 0,

  setHealth: (health) => set({ health: Math.max(0, Math.min(get().maxHealth, health)) }),
  takeDamage: (damage) => set({ health: Math.max(0, get().health - damage) }),
  setAiming: (isAiming) => set({ isAiming }),
  setLeaning: (isLeaning) => set({ isLeaning }),
  setStance: (stance) => {
    set({
      stance,
      isCrouching: stance === 'crouch',
      isProne: stance === 'prone',
    })
  },
  setJumping: (isJumping) => set({ isJumping }),
  setSprinting: (isSprinting) => set({ isSprinting }),

  fire: () => {
    const state = get()
    if (state.isReloading || state.ammo <= 0) return false
    const now = Date.now()
    if (now - state.lastFireTime < state.fireRate) return false
    set({ ammo: state.ammo - 1, lastFireTime: now, isFiring: true })
    setTimeout(() => set({ isFiring: false }), 50)
    return true
  },

  reload: () => {
    const state = get()
    if (state.isReloading || state.reserveAmmo <= 0 || state.ammo === state.maxAmmo) return
    set({ isReloading: true })
    setTimeout(() => {
      const s = get()
      const needed = s.maxAmmo - s.ammo
      const available = Math.min(needed, s.reserveAmmo)
      set({
        ammo: s.ammo + available,
        reserveAmmo: s.reserveAmmo - available,
        isReloading: false,
      })
    }, 2000)
  },

  switchWeapon: (slot) => {
    const weapon = WEAPONS[slot]
    if (!weapon) return
    set({
      currentWeapon: slot,
      ammo: weapon.ammo,
      maxAmmo: weapon.maxAmmo,
      reserveAmmo: weapon.reserve,
      fireRate: weapon.fireRate,
      isReloading: false,
    })
  },

  setReloading: (isReloading) => set({ isReloading }),
}))
