import React, { useRef } from 'react'
import { useGLTF } from '@react-three/drei'

export default function Model3(props) {
  const { nodes, materials } = useGLTF('/uploads_files_4048489_City+center+at+night+.gltf')
  return (
    <group {...props} dispose={null} scale={[1.5, 1.5, 1.5]} position={[0, -0.3, -7]}>
      <group position={[-0.036, 0.174, -1.632]}>
        <mesh castShadow receiveShadow geometry={nodes.Plane005_1.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane005_2.geometry} material={materials.window} />
        <mesh castShadow receiveShadow geometry={nodes.Plane005_3.geometry} material={materials['light bulb']} />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube002.geometry}
          material={materials['Material.001']}
          position={[-0.096, 7.98, 0.52]}
          rotation={[0, -0.682, 0]}
          scale={[1.007, 0.249, 1.007]}
        />
        <group position={[-0.327, 0.317, 0.875]}>
          <mesh castShadow receiveShadow geometry={nodes.Plane004_1.geometry} material={materials['Material.001']} />
          <mesh castShadow receiveShadow geometry={nodes.Plane004_2.geometry} material={materials.window} />
        </group>
        <group position={[0.216, 0.312, 0.875]}>
          <mesh castShadow receiveShadow geometry={nodes.Plane006_1.geometry} material={materials['Material.001']} />
          <mesh castShadow receiveShadow geometry={nodes.Plane006_2.geometry} material={materials.window} />
        </group>
        <mesh castShadow receiveShadow geometry={nodes.Plane_1.geometry} material={materials['Material.001']} />
        <mesh castShadow receiveShadow geometry={nodes.Plane_2.geometry} material={materials.window} />
      </group>
    </group>
  )
}

useGLTF.preload('/uploads_files_4048489_City+center+at+night+.gltf')
