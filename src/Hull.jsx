import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export function Hull(props) {
  const { nodes, materials } = useGLTF('/mothership1.glb')
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane.geometry}
        material={materials['Material.001']}
        position={[0, 0.19, -0.179]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.276, 0.194, 0.307]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001.geometry}
        material={materials['Material.002']}
        position={[0, 0.289, -1.251]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.337, 0.087, 0.307]}
      />
      <group position={[0.375, 0.228, 1.431]} rotation={[-Math.PI / 2, Math.PI / 2, 0]} scale={0.194}>
        <mesh castShadow receiveShadow geometry={nodes.Cylinder001_1.geometry} material={materials['Material.004']} />
        <mesh castShadow receiveShadow geometry={nodes.Cylinder001_2.geometry} material={materials['Material.003']} />
        <mesh castShadow receiveShadow geometry={nodes.Cylinder001_3.geometry} material={materials['Material.002']} />
      </group>
    </group>
  )
}

useGLTF.preload('/mothership1.glb')
