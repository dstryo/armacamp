import { Canvas } from '@react-three/fiber'
import { Stats, useProgress, Html } from '@react-three/drei'
import Game from './Game'
import { Debug, Physics } from '@react-three/cannon'
import { Suspense } from 'react'
import { create } from 'zustand'
import { AnimationMixer } from 'three'
import { useStore } from './store'
import HealthBar from './HealthBar'

function Loader() {
  const { progress } = useProgress()
  return <Html center>{progress} % loaded</Html>
}

export default function App() {
  const { playerHealth } = useStore((state) => ({
    playerHealth: state.playerHealth
  }))
  return (
    <>
      <Canvas shadows onPointerDown={(e) => e.target.requestPointerLock()}>
        <Suspense fallback={<Loader />}>
          <spotLight position={[2.5, 5, 5]} angle={Math.PI / 3} penumbra={0.5} castShadow shadow-mapSize-height={2048} shadow-mapSize-width={2048} intensity={Math.PI * 25} />

          <Physics>
            <Game />
          </Physics>
          <Stats />
        </Suspense>
      </Canvas>
      <HealthBar health={playerHealth} />
    </>
  )
}
