import { useBox } from '@react-three/cannon'

export default function Wall(props) {
  const [ref] = useBox(() => ({ mass: 0, position: [0, 0, -10], args: [20, 20, 1] }))
  const [ref2] = useBox(() => ({ mass: 0, position: [10, 0, 0], args: [1, 20, 20] }))
  const [ref3] = useBox(() => ({ mass: 0, position: [-10, 0, 0], args: [1, 20, 20] }))
  const [ref4] = useBox(() => ({ mass: 0, position: [7, 0, 10], args: [5, 20, 1] }))
  const [ref5] = useBox(() => ({ mass: 0, position: [-7, 0, 10], args: [5, 20, 1] }))
  const [roofRef] = useBox(() => ({ mass: 0, position: [0, 10, 0], args: [20, 1, 20] }))
  return (
    <group>
      <mesh ref={ref} position={[0, 0, -10]}>
        <boxGeometry args={[20, 20, 1]} />
        <meshStandardMaterial color={'silver'} />
      </mesh>
      <mesh ref={ref2} position={[10, 0, 0]}>
        <boxGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={'brown'} />
      </mesh>
      <mesh ref={ref3} position={[-10, 0, 0]}>
        <boxGeometry args={[1, 20, 20]} />
        <meshStandardMaterial color={'brown'} />
      </mesh>
      <mesh ref={ref4} position={[7, 0, 10]}>
        <boxGeometry args={[5, 20, 1]} />
        <meshStandardMaterial color={'brown'} />
      </mesh>
      <mesh ref={ref5} position={[-7, 0, 10]}>
        <boxGeometry args={[5, 20, 1]} />
        <meshStandardMaterial color={'brown'} />
      </mesh>
      <mesh ref={roofRef} position={[0, 10, 0]}>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color={'brown'} />
      </mesh>
    </group>
  )
}
