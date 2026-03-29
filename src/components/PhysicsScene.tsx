import { Physics } from '@react-three/rapier'
import { Player } from './Player'
import { GameWorld } from './GameWorld'

export default function PhysicsScene({ started }: { started: boolean }) {
  return (
    <Physics gravity={[0, -15, 0]}>
      {started && <Player />}
      <GameWorld />
    </Physics>
  )
}
