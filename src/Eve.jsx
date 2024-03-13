import { useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useEffect } from 'react'
import { useStore } from './App'

export default function Eve() {
  const ref = useRef()

  return (
    <>
      <group ref={ref}>
        <mesh castShadow receiveShadow>
          <meshStandardMaterial color="grey" />
          <boxGeometry />
        </mesh>
      </group>
    </>
  )
}
