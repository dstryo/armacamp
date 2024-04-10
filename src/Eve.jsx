import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { Hull } from './Hull'

export default function Eve() {
  const ref = useRef()

  return (
    <>
      <group ref={ref}>
        <mesh castShadow receiveShadow>
          <Hull />
        </mesh>
      </group>
    </>
  )
}
