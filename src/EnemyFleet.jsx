import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useCompoundBody } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import { useStore } from './store'
import { Html } from '@react-three/drei'

function EnemyNpc({ position, gameState, channel, enemyHealth, enemyId }) {
  const { addEnemy } = useStore((state) => state.actions)
  const refPosition = new THREE.Vector3()
  const turretPosition = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const turretLaserDirection = new THREE.Vector3()
  const laserPosition = new THREE.Vector3()
  const EnemyNpcPosition = new THREE.Vector3()
  const EnemyNpcRadius = useMemo(() => (Math.sqrt(3) * 2) / 3, [])
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  const turretLasers = useStore((state) => state.turretLasers)

  const [isActive, setIsActive] = useState(true)
  const turretLaserGroup = useRef()
  const laserGroup = useRef()
  const turretRef = useRef()
  const bodyRef = useRef()
  const prevPlayerPosition = useRef(new THREE.Vector3())
  const fireRate = 600 // Fire rate in milliseconds
  const lastFired = useRef(Date.now() - fireRate)
  const lasers = useStore((state) => state.lasers)
  const laserGeometry = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 1), [])
  const htmlRef = useRef()
  const playerPositions = Object.entries(gameState)
    .filter(([id, player]) => player.position)
    .map(([id, player]) => ({ id, position: player.position }))

  const laserMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xff4500
      }),
    []
  )

  const shootLasers = useCallback(
    (closestPlayer) => {
      const now = Date.now()
      if (now - lastFired.current < fireRate) {
        return // If not enough time has passed since the last shot, don't fire
      }
      lastFired.current = now
      const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial)
      laserMesh.position.copy(turretRef.current.position)
      //laserMesh.position.y += 0.5 // Adjust this value as needed
      laserMesh.quaternion.copy(turretRef.current.quaternion)

      turretLaserGroup.current.add(laserMesh)
      // Add the lasers to the scene

      direction.subVectors(new THREE.Vector3(...closestPlayer), turretRef.current.position)
      direction.normalize()

      // Store the direction with the laser
      laserMesh.direction = direction.clone() // Make sure to clone the direction vector
      // Add the lasers to the state for later reference
      turretLasers.push(laserMesh)
    },
    [fireRate, laserGeometry, laserMaterial, turretLasers, turretRef, turretLaserGroup, playerPositions]
  )

  useFrame(() => {
    if (turretRef.current && playerPositions.length > 0) {
      // Get the position of the first player
      let closestPlayer = { ...playerPositions[0] }
      let closestDistance = turretRef.current.position.distanceTo(new THREE.Vector3(...closestPlayer.position))

      // Find the closest player
      for (let i = 1; i < playerPositions.length; i++) {
        const playerPosition = new THREE.Vector3(...playerPositions[i].position)
        const distance = turretRef.current.position.distanceTo(playerPosition)
        if (distance < closestDistance) {
          closestPlayer = { ...playerPositions[i] }
          closestDistance = distance
        }
      }

      // If the closest player is within a distance of 200, make the turret look at the player
      if (closestPlayer.position && closestDistance < 200) {
        turretRef.current.lookAt(new THREE.Vector3(...closestPlayer.position))
        shootLasers(closestPlayer.position)
      }
      if (closestPlayer.position && closestDistance > 100) {
        const step = 0.01 // Adjust the step size as needed
        turretRef.current.position.lerp(new THREE.Vector3(...closestPlayer.position), step)
        bodyRef.current.position.lerp(new THREE.Vector3(...closestPlayer.position), step)

        const encoder = new TextEncoder()
        const uint8Array = encoder.encode(
          JSON.stringify({ id: enemyId, position: [turretRef.current.position.x, turretRef.current.position.y, (position.z = turretRef.current.position.z)] })
        )
        channel.emit('enemyMove', uint8Array)
      }

      // If the player is within a distance of 20, shoot lasers

      raycaster.linePrecision = 0.0001

      turretLasers.forEach((turretLaser, index) => {
        turretLaser.position.add(turretLaser.direction.clone().multiplyScalar(1.5))

        // Adjust the speed as needed
        raycaster.set(turretLaser.position, turretLaserDirection)
        const distance = turretLaser.position.distanceTo(turretRef.current.position)
        const intersects = raycaster.intersectObjects(closestPlayer) // Use closestPlayer instead of playerPosition
        const distanceToPlayer = closestPlayer.position ? turretLaser.position.distanceTo(new THREE.Vector3(...closestPlayer.position)) : Infinity

        if (distance > 300) {
          turretLaserGroup.current.remove(turretLaser)
          // Remove the laser from the state as well
          turretLasers.splice(turretLasers.indexOf(turretLaser), 1)
        }
        if (distanceToPlayer <= 1.2) {
          // Perform any additional logic here...
          turretLaserGroup.current.remove(turretLaser)
          // Remove the laser from the state as well
          turretLasers.splice(turretLasers.indexOf(turretLaser), 1)
          const encoder = new TextEncoder()
          const uint8Array = encoder.encode(JSON.stringify(closestPlayer.id))

          channel.emit('hit', uint8Array)
        }
      })
      if (htmlRef.current && htmlRef.current.position) {
        const position = new THREE.Vector3()
        position.setFromMatrixPosition(turretRef.current.matrixWorld)
        htmlRef.current.position.set(position.x, position.y + 2, position.z)
      }
    }
  })

  useEffect(() => {
    if (enemyHealth <= 0) {
      setIsActive(false) // Set isActive to false
    }
    if (bodyRef.current && turretRef.current) {
      bodyRef.current.position.set(...position)
      turretRef.current.position.set(...position)
    }
  }, [enemyHealth, position])

  return isActive ? (
    <>
      <group>
        <mesh ref={bodyRef} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="grey" />
        </mesh>
      </group>
      <mesh ref={turretRef}>
        <boxGeometry args={[0.3, 0.4, 0.8]} />
        <meshStandardMaterial color="grey" />
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
                width: `${enemyHealth}%`,
                height: '100%',
                backgroundColor: 'red'
              }}
            />
          </div>
        </Html>
      </mesh>
      <group ref={laserGroup} />
      <group ref={turretLaserGroup} />
    </>
  ) : null
}

export default function EnemyNpcs({ gameState, channel }) {
  const enemy = Object.values(gameState).find((e) => e.enemyHealth !== undefined)

  return <>{enemy && <EnemyNpc key={enemy.id} enemyId={enemy.id} position={enemy.enemyPosition} enemyHealth={enemy.enemyHealth} gameState={gameState} channel={channel} />}</>
}
