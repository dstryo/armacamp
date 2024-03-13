import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useCompoundBody } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLaser } from './laser'
import { useStore } from './store'

const positions = [
  [5, 1, 0],
  [0, 1, 5],
  [0, 1, -5],
  [-5, 1, 0]
]

function EnemyNpc({ position, players }) {
  const { scene } = useThree()
  const turretLasers = useStore((state) => state.turretLasers)
  const [health, setHealth] = useState(100)
  const [isActive, setIsActive] = useState(true)
  const turretLaserGroup = useRef()
  const laserGroup = useRef()
  const turretRef = useRef()
  const prevPlayerPosition = useRef(new THREE.Vector3())
  const { lasers } = useLaser(turretRef)
  let lastFired = Date.now() - fireRate
  const fireRate = 600 // Fire rate in milliseconds
  const laserGeometry = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 1), [])
  const [ref, api] = useCompoundBody(
    () => ({
      mass: 1,
      position: position,
      shapes: [
        { args: [1], position: [0, 0.25, 0], type: 'Sphere' },
        { args: [1], position: [0, 0.75, 0], type: 'Box' }
      ]
    }),
    useRef()
  )
  const laserMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0x00eeff,
        transparent: true,
        opacity: 0.8
      }),
    []
  )

  const shootLasers = useCallback(() => {
    const now = Date.now()
    if (now - lastFired < fireRate) {
      return // If not enough time has passed since the last shot, don't fire
    }
    lastFired = now
    const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial)
    laserMesh.position.copy(turretRef.current.position)
    //laserMesh.position.y += 0.5 // Adjust this value as needed
    laserMesh.quaternion.copy(turretRef.current.quaternion)

    turretLaserGroup.current.add(laserMesh)
    // Add the lasers to the scene

    // Add the lasers to the state for later reference
    turretLasers.push(laserMesh)
  }, [fireRate, laserGeometry, laserMaterial, turretLasers, turretRef, turretLaserGroup])

  useFrame(() => {
    if (turretRef.current && players.length > 0) {
      // Get the position of the first player
      const playerPosition = players[0]
      const refPosition = new THREE.Vector3().setFromMatrixPosition(ref.current.matrixWorld)

      // Set the position of the turretRef to the ref's position
      turretRef.current.position.set(refPosition.x, refPosition.y + 1, refPosition.z)
      // Calculate the player's velocity

      // Calculate the distance between the turret and the player
      const turretPosition = new THREE.Vector3().setFromMatrixPosition(turretRef.current.matrixWorld)
      const distance = turretPosition.distanceTo(playerPosition)

      // If the player is within a distance of 20, shoot lasers
      if (distance <= 50) {
        // Make the turret look at the future position of the player
        turretRef.current.lookAt(playerPosition.x, playerPosition.y + 1.9, playerPosition.z)

        // Fire a rectangle (laser) at the player
        shootLasers()
      }

      if (distance > 20) {
        const direction = new THREE.Vector3().subVectors(playerPosition, turretPosition).normalize()
        api.velocity.set(direction.x * 20, direction.y * 20, direction.z * 20) // Multiply by a scalar to adjust the speed
      } else if (distance < 5) {
        // If the enemy is too close to the player, stop moving
        api.velocity.set(0, 0, 0)
      }

      const raycaster = new THREE.Raycaster()
      raycaster.linePrecision = 0.0001

      turretLasers.forEach((turretLaser, index) => {
        const turretLaserDirection = new THREE.Vector3().subVectors(playerPosition, turretRef.current.position).normalize()
        turretLaser.position.add(turretLaserDirection.clone().multiplyScalar(1.2))
        // Adjust the speed as needed
        raycaster.set(turretLaser.position, turretLaserDirection)
        const distance = turretLaser.position.distanceTo(turretRef.current.position)
        const intersects = raycaster.intersectObjects(playerPosition)
        const distanceToPlayer = turretLaser.position.distanceTo(playerPosition)

        if (distance > 100) {
          turretLaserGroup.current.remove(turretLaser)
          // Remove the laser from the state as well
          turretLasers.splice(turretLasers.indexOf(turretLaser), 1)
        }
        if (distanceToPlayer <= 1) {
          // Perform any additional logic here...

          console.log('hit')
        }
      })
    }

    //Map over Player lasers and check for collisions
    lasers.forEach((laser, index) => {
      // Add a delay before checking for collisions
      const laserPosition = laser.position
      // Get the position of the laser
      if (turretRef.current) {
        const EnemyNpcPosition = new THREE.Vector3().setFromMatrixPosition(ref.current.matrixWorld)

        const distance = laserPosition.distanceTo(EnemyNpcPosition)

        const EnemyNpcRadius = (Math.sqrt(3) * 2) / 2.9
        // Check if the distance is less than the sum of the radii
        if (distance < EnemyNpcRadius) {
          setHealth(health - 10)
          console.log('hit')
        }
      }
    })
  })

  useEffect(() => {
    api.angularFactor.set(0, 1, 0)
    if (health <= 0) {
      ref.current.scale.set(0, 0, 0) // Set the scale to 0
      api.position.set(position[0], position[1], position[2])
      setIsActive(false) // Set isActive to false
    }
  }, [health, ref, api, position])

  return isActive ? (
    <>
      <group ref={ref}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} position={[0, 1, 0]} />
          <meshStandardMaterial color="grey" />
        </mesh>
      </group>
      <mesh ref={turretRef} position={[0, 1, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
        <meshStandardMaterial color="grey" />
      </mesh>
      <group ref={laserGroup} />
      <group ref={turretLaserGroup} />
    </>
  ) : null
}

export default function EnemyNpcs() {
  const players = useStore((state) => state.players) // Access players from the store

  return (
    <>
      {positions.map((position, i) => (
        <EnemyNpc key={i} position={position} material={'ground'} players={players} />
      ))}
    </>
  )
}
