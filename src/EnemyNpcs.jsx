import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useCompoundBody } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useLaser } from './laser'
import { useStore } from './store'
import { Html } from '@react-three/drei'

const positions = [[120, 1, 0]]

function EnemyNpc({ position, players }) {
  const refPosition = new THREE.Vector3()
  const turretPosition = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const turretLaserDirection = new THREE.Vector3()
  const laserPosition = new THREE.Vector3()
  const EnemyNpcPosition = new THREE.Vector3()
  const EnemyNpcRadius = useMemo(() => (Math.sqrt(3) * 2) / 3, [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const { decreasePlayerHealth } = useStore((state) => state.actions)
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
  const htmlRef = useRef()

  const shapes = useMemo(() => [
    { args: [1, 1, 1], position: [0, 0, 0], type: 'Box' },
    { args: [0.25, 0.5, 0.5], position: [0, 1.25, 0], type: 'Box' }
  ])
  const [ref, api] = useCompoundBody(
    () => ({
      mass: 1,
      position: position,
      shapes,
      material: 'slippery'
    }),
    useRef()
  )
  const laserMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0xff4500
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
    const adjustedPlayerPosition = players[0].clone()
    adjustedPlayerPosition.y += 1 // Adjust the y-coordinate

    direction.subVectors(adjustedPlayerPosition, turretRef.current.position)
    direction.normalize()

    // Store the direction with the laser
    laserMesh.direction = direction.clone() // Make sure to clone the direction vector
    // Add the lasers to the state for later reference
    turretLasers.push(laserMesh)
  }, [fireRate, laserGeometry, laserMaterial, turretLasers, turretRef, turretLaserGroup, players])

  useFrame(() => {
    if (turretRef.current && players.length > 0) {
      // Get the position of the first player
      const playerPosition = players[0]
      refPosition.setFromMatrixPosition(ref.current.matrixWorld)

      // Set the position of the turretRef to the ref's position
      turretRef.current.position.set(refPosition.x, refPosition.y + 1, refPosition.z)

      // Calculate the distance between the turret and the player
      turretPosition.setFromMatrixPosition(turretRef.current.matrixWorld)
      const distance = turretPosition.distanceTo(playerPosition)

      // If the player is within a distance of 20, shoot lasers
      if (distance <= 50) {
        // Make the turret look at the future position of the player
        turretRef.current.lookAt(playerPosition.x, playerPosition.y + 1, playerPosition.z)

        // Fire a rectangle (laser) at the player
        shootLasers()
      }

      if (distance > 20) {
        direction.subVectors(playerPosition, turretPosition)
        direction.normalize() // Call normalize once
        api.velocity.set(direction.x * 20, direction.y * 20, direction.z * 20) // Multiply by a scalar to adjust the speed
      } else if (distance < 5) {
        // If the enemy is too close to the player, stop moving
        api.velocity.set(0, 0, 0)
      }

      raycaster.linePrecision = 0.0001

      turretLasers.forEach((turretLaser, index) => {
        turretLaser.position.add(turretLaser.direction.clone().multiplyScalar(1.5))

        // Adjust the speed as needed
        raycaster.set(turretLaser.position, turretLaserDirection)
        const distance = turretLaser.position.distanceTo(turretRef.current.position)
        const intersects = raycaster.intersectObjects(playerPosition)
        const distanceToPlayer = turretLaser.position.distanceTo(playerPosition)

        if (distance > 60) {
          turretLaserGroup.current.remove(turretLaser)
          // Remove the laser from the state as well
          turretLasers.splice(turretLasers.indexOf(turretLaser), 1)
        }
        if (distanceToPlayer <= 1.2) {
          // Perform any additional logic here...
          turretLaserGroup.current.remove(turretLaser)
          // Remove the laser from the state as well
          turretLasers.splice(turretLasers.indexOf(turretLaser), 1)

          decreasePlayerHealth()
        }
      })
      if (ref.current && htmlRef.current && htmlRef.current.position) {
        const position = new THREE.Vector3()
        position.setFromMatrixPosition(ref.current.matrixWorld)
        htmlRef.current.position.set(position.x, position.y + 2, position.z)
      }
    }

    //Map over Player lasers and check for collisions
    lasers.forEach((laser, index) => {
      // Add a delay before checking for collisions
      laserPosition.copy(laser.position)
      // Get the position of the laser
      if (turretRef.current) {
        EnemyNpcPosition.setFromMatrixPosition(ref.current.matrixWorld)

        const distance = laserPosition.distanceTo(EnemyNpcPosition)

        // Check if the distance is less than the sum of the radii
        if (distance < EnemyNpcRadius) {
          setHealth(health - 10)
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
        <Html ref={htmlRef} center position={[0, 2, 0]} zIndexRange={[1000, 1000]}>
          <div
            style={{
              width: '50px',
              height: '5px',
              backgroundColor: 'white',
              border: '1px solid black',
              position: 'relative'
            }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${health}%`,
                height: '100%',
                backgroundColor: 'red'
              }}
            />
          </div>
        </Html>
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
