import { useCallback, useMemo } from 'react'

import * as THREE from 'three'
import { useStore } from './store'

export const handleLasers = (isRightMouseDown, lasers, camera, secondGroup, laserGroup, laserDirection, channel, geckosClient, gameState) => {
  const laserGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.9)
  const laserMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff })
  const enemyFleet = useStore((state) => state.enemyFleet) // Set color to blue
  const { decreaseEnemyHealth } = useStore((state) => state.actions)
  const { decreasePlayerHealth } = useStore((state) => state.actions)
  const players = useStore((state) => state.players)
  const currentPlayerId = geckosClient.current.id
  let lastFired = Date.now()

  const fireRate = 700 // Fire rate in milliseconds
  return useCallback(
    (delta) => {
      lasers.forEach((laser) => {
        const enemyKey = Object.keys(gameState).find((key) => key.startsWith('enemy'))
        if (!laser.removed) {
          laserDirection.set(0, 0, -1).applyQuaternion(laser.quaternion)
          laser.position.add(laserDirection.clone().multiplyScalar(500 * delta))
        }
        if (laser.position.distanceTo(secondGroup.current.position) > 500) {
          console.log(laser)
          laserGroup.current.remove(laser)
          lasers.splice(lasers.indexOf(laser), 1)
          laser.removed = true
        }

        if (gameState[enemyKey]) {
          const distanceToEnemy = laser.position.distanceTo(new THREE.Vector3(...gameState[enemyKey].enemyPosition))

          if (distanceToEnemy <= 10) {
            // Perform any additional logic here...
            console.log(laserGroup.current)
            laserGroup.current.remove(laser)
            const index = lasers.indexOf(laser)
            if (index !== -1) {
              lasers.splice(index, 1)
            }
            laser.removed = true
            if (laser.removed) {
              const encoder = new TextEncoder()
              const uint8Array = encoder.encode(JSON.stringify(enemyKey))

              channel.emit('enemyHit', uint8Array)
            }
          }
        }

        Object.keys(gameState).forEach((playerId) => {
          if (playerId !== currentPlayerId) {
            // Skip the current player
            const playerPosition = gameState[playerId].position
            if (playerPosition && Array.isArray(playerPosition)) {
              const distanceToPlayer = laser.position.distanceTo(new THREE.Vector3(...playerPosition))

              if (distanceToPlayer <= 2) {
                // Adjust this threshold as needed
                console.log('player hit')
                laserGroup.current.remove(laser)
                const index = lasers.indexOf(laser)
                if (index !== -1) {
                  lasers.splice(index, 1)
                }
                laser.removed = true
                const encoder = new TextEncoder()
                const uint8Array = encoder.encode(JSON.stringify(playerId))

                channel.emit('hit', uint8Array)
                return // Stop processing this laser
              }
            }
          }
        })
      })

      if (isRightMouseDown) {
        const now = Date.now()
        if (now - lastFired < fireRate) {
          return // If not enough time has passed since the last shot, don't fire
        }
        lastFired = now

        // Emit laser data to the server
        if (secondGroup.current && geckosClient.current) {
          const laserData = {
            id: geckosClient.current.id,
            position: [secondGroup.current.position.x, secondGroup.current.position.y, secondGroup.current.position.z],
            quaternion: secondGroup.current.quaternion.toArray()
          }
          const encoder = new TextEncoder()
          const uint8Array = encoder.encode(JSON.stringify(laserData))

          channel.emit('laser', uint8Array)
        }

        if (channel) {
          channel.on('laser', (buffer) => {
            // Convert the ArrayBuffer to a string
            const uint8Array = new Uint8Array(buffer.data)

            // Decode the Uint8Array back to a string
            const dataString = new TextDecoder().decode(uint8Array)

            // Parse the string back into a JavaScript object
            const laserData = JSON.parse(dataString)

            // Create a new laser with the received data
            const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial)
            laserMesh.position.fromArray(laserData.position)
            laserMesh.quaternion.fromArray(laserData.quaternion)

            // Add the laser to the scene and the state
            laserGroup.current.add(laserMesh)
            lasers.push(laserMesh)
            laserMesh.originalPosition = laserMesh.position.clone()
          })
        }
      }
    },
    [isRightMouseDown, lasers, camera, secondGroup, laserGroup, laserDirection, channel, geckosClient]
  )
}
