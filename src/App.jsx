import React, { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats, useProgress, Html } from '@react-three/drei'
import Game from './Game'
import { Suspense } from 'react'
import { create } from 'zustand'
import { AmbientLight, AnimationMixer } from 'three'
import geckos from '@geckos.io/client'
import { throttle } from 'lodash'
import System1 from './System1'
import { useStore } from './store'
import HealthBar from './HealthBar'

function Loader() {
  const { progress } = useProgress()
  return <Html center>{progress} % loaded</Html>
}

export default function App() {
  const geckosClient = useRef(null)
  const [gameState, setClients] = useState({})
  const [localPlayerHealth, setLocalPlayerHealth] = useState(0)

  const throttledSetClients = useMemo(() => throttle(setClients, 0.5), [])
  useEffect(() => {
    // On mount initialize the geckos connection
    if (!geckosClient.current) {
      geckosClient.current = geckos({ port: 4444 })
      geckosClient.current.onConnect(() => {
        console.log('Connected to server')
        const localPlayerId = geckosClient.current.id
        setLocalPlayerHealth(gameState[localPlayerId]?.playerHealth || 0)
      })

      geckosClient.current.on(
        'gameState',
        (gameStateBuffer) => {
          const data = gameStateBuffer.data
          const string = String.fromCharCode.apply(null, data)
          const newGameState = JSON.parse(string)
          if (JSON.stringify(newGameState) !== JSON.stringify(gameState)) {
            throttledSetClients(newGameState)
            const localPlayerId = geckosClient.current.id
            setLocalPlayerHealth(newGameState[localPlayerId]?.playerHealth || 0)
          }
        },
        [throttledSetClients]
      )
    }

    // Dispose gracefully
    return () => {
      if (geckosClient.current && geckosClient.current.localPeerConnection) {
        geckosClient.current.close()
      }
    }
  }, [])

  return (
    geckosClient.current && (
      <>
        <Canvas shadows onPointerDown={(e) => e.target.requestPointerLock()} camera={{ far: 20000, fov: 50 }}>
          <ambientLight intensity={0.1} />
          <Suspense fallback={<Loader />}>
            <Game gameState={gameState} geckosClient={geckosClient} />
            <System1 />
            <gridHelper />
            <Stats />
          </Suspense>
        </Canvas>
        <HealthBar health={localPlayerHealth} />
      </>
    )
  )
}
