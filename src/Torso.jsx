import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'

export default function Torso() {
  const ref = useRef()

  return (
    <>
      <group ref={ref}>
        <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
          <meshStandardMaterial color="grey" />
          <boxGeometry args={[0.1, 0.1, 0.8]} />
        </mesh>
      </group>
    </>
  )
}
