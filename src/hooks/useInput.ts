import { useEffect, useRef } from 'react'

interface InputState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  sprint: boolean
  crouch: boolean
  prone: boolean
  reload: boolean
  leanLeft: boolean
  leanRight: boolean
  fire: boolean
  aim: boolean
  weapon1: boolean
  weapon2: boolean
  weapon3: boolean
  mouseX: number
  mouseY: number
  isPointerLocked: boolean
}

const inputState: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
  crouch: false,
  prone: false,
  reload: false,
  leanLeft: false,
  leanRight: false,
  fire: false,
  aim: false,
  weapon1: false,
  weapon2: false,
  weapon3: false,
  mouseX: 0,
  mouseY: 0,
  isPointerLocked: false,
}

export function useInput() {
  const stateRef = useRef(inputState)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': stateRef.current.forward = true; break
        case 'KeyS': stateRef.current.backward = true; break
        case 'KeyA': stateRef.current.left = true; break
        case 'KeyD': stateRef.current.right = true; break
        case 'Space': stateRef.current.jump = true; break
        case 'ShiftLeft': stateRef.current.sprint = true; break
        case 'KeyC': stateRef.current.crouch = true; break
        case 'KeyZ': stateRef.current.prone = true; break
        case 'KeyR': stateRef.current.reload = true; break
        case 'KeyQ': stateRef.current.leanLeft = true; break
        case 'KeyE': stateRef.current.leanRight = true; break
        case 'Digit1': stateRef.current.weapon1 = true; break
        case 'Digit2': stateRef.current.weapon2 = true; break
        case 'Digit3': stateRef.current.weapon3 = true; break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': stateRef.current.forward = false; break
        case 'KeyS': stateRef.current.backward = false; break
        case 'KeyA': stateRef.current.left = false; break
        case 'KeyD': stateRef.current.right = false; break
        case 'Space': stateRef.current.jump = false; break
        case 'ShiftLeft': stateRef.current.sprint = false; break
        case 'KeyC': stateRef.current.crouch = false; break
        case 'KeyZ': stateRef.current.prone = false; break
        case 'KeyR': stateRef.current.reload = false; break
        case 'KeyQ': stateRef.current.leanLeft = false; break
        case 'KeyE': stateRef.current.leanRight = false; break
        case 'Digit1': stateRef.current.weapon1 = false; break
        case 'Digit2': stateRef.current.weapon2 = false; break
        case 'Digit3': stateRef.current.weapon3 = false; break
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) stateRef.current.fire = true
      if (e.button === 2) stateRef.current.aim = true
    }

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) stateRef.current.fire = false
      if (e.button === 2) stateRef.current.aim = false
    }

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        stateRef.current.mouseX += e.movementX
        stateRef.current.mouseY += e.movementY
        stateRef.current.isPointerLocked = true
      }
    }

    const onPointerLockChange = () => {
      stateRef.current.isPointerLocked = !!document.pointerLockElement
    }

    const onContextMenu = (e: Event) => e.preventDefault()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('contextmenu', onContextMenu)
    document.addEventListener('pointerlockchange', onPointerLockChange)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('contextmenu', onContextMenu)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    }
  }, [])

  return stateRef
}

export function consumeMouse(input: { current: InputState | null }) {
  const x = input.current!.mouseX
  const y = input.current!.mouseY
  input.current!.mouseX = 0
  input.current!.mouseY = 0
  return { x, y }
}
