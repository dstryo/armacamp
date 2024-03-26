import { useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect } from 'react'
import { useStore } from './store'

export default function Eve(props) {
  const group = useRef()
  const { nodes, materials, animations } = useGLTF('/armfram2.glb')
  const { actions } = useAnimations(animations, group)
  const activeAction = useStore((state) => state.activeAction)

  return (
    <group ref={group} {...props} dispose={null} scale={[0.01, 0.01, 0.01]}>
      <group name="Scene">
        <group name="Armature" position={[9.254, 162.946, -32.294]} rotation={[-1.572, Math.PI / 2, 0]}>
          <primitive object={nodes.Bone} />
          <primitive object={nodes.Bone006} />
        </group>
        <group name="Armature001" position={[-32.183, 162.946, -32.294]} rotation={[-1.572, Math.PI / 2, 0]}>
          <primitive object={nodes.Bone_1} />
          <primitive object={nodes.Bone006_1} />
        </group>
        <group name="Cylinder" position={[-10.948, 184.971, -25.408]} rotation={[0, Math.PI / 2, 0]} scale={[5.564, 6.028, 5.334]}>
          <mesh name="Cylinder002" castShadow receiveShadow geometry={nodes.Cylinder002.geometry} material={materials['Pelv.001']} />
          <mesh name="Cylinder002_1" castShadow receiveShadow geometry={nodes.Cylinder002_1.geometry} material={materials['Pelv.003']} />
          <mesh name="Cylinder002_2" castShadow receiveShadow geometry={nodes.Cylinder002_2.geometry} material={materials.Bolt} />
          <mesh name="Cylinder002_3" castShadow receiveShadow geometry={nodes.Cylinder002_3.geometry} material={materials.connectors} />
          <mesh name="Cylinder002_4" castShadow receiveShadow geometry={nodes.Cylinder002_4.geometry} material={materials['connectors.002']} />
          <mesh name="Cylinder002_5" castShadow receiveShadow geometry={nodes.Cylinder002_5.geometry} material={materials['Bolt.002']} />
          <group name="Empty" position={[0.243, -1.615, -0.181]} scale={[2.293, 2.165, 6.662]} />
        </group>
        <group name="walk_Path001" position={[-32.576, -9.466, -35.104]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} scale={[0.672, 1, 0.772]} />
        <group name="walk_Path" position={[9.291, -9.466, -32.055]} rotation={[Math.PI / 2, 0, -Math.PI / 2]} scale={[0.672, 1, 0.772]} />
      </group>
    </group>
  )
}

useGLTF.preload('/armfram2.glb')
