import React, { useCallback, Suspense, useMemo, useRef, useEffect, useState } from 'react'
import { Vector3, Euler, Quaternion, Matrix4, Raycaster, SphereGeometry, MeshBasicMaterial, Mesh } from 'three'
import Eve from './Eve'
import useKeyboard from './useKeyboard'
import { useFrame, useThree } from '@react-three/fiber'
import useFollowCam from './useFollowCam'
import { useStore } from './store'
import Torso from './Torso'
import * as THREE from 'three'
import { Object3D } from 'three'

import { createReticule, handleIntersections } from './Reticule'
import { handleLasers } from './handleLasers'

const Player = React.memo(function Player({ id, position, rotation, channel, torsoRotation, geckosClient, gameState }) {
  const initialPositionSet = useRef(false)
  const followCamRef = useRef(null)
  let isLocalPlayer = useRef(id == geckosClient.current.id)
  const shouldListen = isLocalPlayer.current
  const keyboard = useKeyboard(shouldListen, isLocalPlayer)
  const secondGroup = useMemo(() => new Object3D(), [])
  const api = useRef(null)

  const playerGrounded = useRef(false)
  const inJumpAction = useRef(false)
  const group = useRef()

  if (isLocalPlayer.current) {
    followCamRef.current = useFollowCam(secondGroup, [0, 1, 1.5], isLocalPlayer.current)
  }

  const { camera } = useThree()

  const laserDirection = useMemo(() => new Vector3(), [])

  const raycaster = useMemo(() => new Raycaster(), [])

  const lasers = useStore((state) => state.lasers)
  const planetPosition = useStore((state) => state.planetPosition)
  const laserGroup = useRef()

  const [isRightMouseDown, setRightMouseDown] = useState(false)
  const handleLasersCallback = handleLasers(isRightMouseDown, lasers, camera, secondGroup, laserGroup, laserDirection, channel, geckosClient, gameState)

  let cancelFrame = null
  const [moveForward, setMoveForward] = useState(false)
  const forwardSpeed = 10
  const rollSpeed = 1
  const speed = 8 // Adjust as needed
  const direction = new Vector3()
  const rotationSpeed = 0.05 // Adjust this value to control the rotation speed
  const movementSpeed = 0.05 // Adjust this value to control the movement speed
  const rightDirection = new Vector3()
  const targetPosition = new Vector3()
  const forwardDirection = new Vector3()

  const playerData = {
    id: null,
    position: null,
    rotation: null,
    torsoRotation: null,
    time: null
  }

  const handleKeyDown = useCallback((event) => {
    if (event.code === 'Digit1') {
      setMoveForward((prevMoveForward) => !prevMoveForward)
    }
  }, [])

  const handleMouseDown = useCallback((event) => {
    if (event.button === 2) {
      setRightMouseDown((isRightMouseDown) => !isRightMouseDown)
    }
  }, [])

  const handleMouseUp = useCallback((event) => {
    if (event.button === 2) {
      setRightMouseDown((isRightMouseDown) => !isRightMouseDown)
    }
  }, [])

  useEffect(() => {
    isLocalPlayer.current = id == geckosClient.current.id

    // If the player is the local player and the initial position has not been set, set it
    if (isLocalPlayer.current && !initialPositionSet.current && position) {
      const [x, y, z] = position
      group.current.position.set(x, y, z)
      secondGroup.current.position.set(x, y, z)
      initialPositionSet.current = true // Mark the initial position as set
    }

    // If the player is not the local player, always update the position
    if (!isLocalPlayer.current && position) {
      const [x, y, z] = position
      group.current.position.set(x, y, z)
      secondGroup.current.position.set(x, y, z)
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [rotation, position, handleKeyDown, handleMouseDown, handleMouseUp])

  let moveTimeoutId = null
  function emitMoveEvent() {
    clearTimeout(moveTimeoutId)

    moveTimeoutId = setTimeout(() => {
      if (group.current) {
        playerData.id = geckosClient.current.id
        playerData.position = group.current.position.toArray()
        playerData.rotation = group.current.rotation.toArray()
      }
      // Convert the data to a string
      const dataString = JSON.stringify(playerData)

      // Encode the string to a Uint8Array
      const playerDataArray = new TextEncoder().encode(dataString)

      if (channel) {
        channel.emit('move', playerDataArray)
      }
    }, 10) // 400ms debounce time
  }

  const containerGroup = useRef()

  const updateSecondGroupQuaternion = () => {
    if (followCamRef.current) {
      const { yaw, pitch } = followCamRef.current

      const gaze = new Quaternion()
      const euler = new Euler(pitch.rotation.x, yaw.rotation.y, 0, 'YZX')
      gaze.setFromEuler(euler)

      secondGroup.current.setRotationFromQuaternion(gaze)
    }
  }

  const updatePlayerPosition = (delta) => {
    if (document.pointerLockElement && followCamRef.current) {
      updateSecondGroupQuaternion()
    }
  }

  useFrame(({ raycaster }, delta) => {
    // Get the forward direction of the secondGroup
    group.current.getWorldDirection(direction)

    // Reverse the direction for the 's' key
    // Get the right direction for the 'd' and 'a' keys
    rightDirection.crossVectors(new Vector3(0, 1, 0), direction)
    targetPosition.copy(group.current.position)

    if (moveForward) {
      // Move forward at constant speed
      group.current.getWorldDirection(forwardDirection)
      targetPosition.addScaledVector(forwardDirection.negate(), forwardSpeed)
    }
    if (keyboard['KeyW']) {
      // Move forward
      targetPosition.addScaledVector(direction.negate(), forwardSpeed)
      group.current.quaternion.slerp(secondGroup.current.quaternion, rotationSpeed)
    }
    if (keyboard['KeyS']) {
      // Move backward
      targetPosition.addScaledVector(direction, speed * delta)
      group.current.quaternion.slerp(secondGroup.current.quaternion, rotationSpeed)
    }
    if (keyboard['KeyA']) {
      // Move left
      targetPosition.addScaledVector(rightDirection.negate(), speed * delta)
    }
    if (keyboard['KeyD']) {
      // Move right
      targetPosition.addScaledVector(rightDirection, speed * delta)
    }
    if (keyboard['KeyZ']) {
      // Rotate up
      secondGroup.current.rotation.z += rollSpeed * delta
      group.current.rotation.z += rollSpeed * delta
      secondGroup.current.position.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rollSpeed * delta))
    }
    if (keyboard['KeyC']) {
      // Rotate up
      secondGroup.current.rotation.z -= rollSpeed * delta
      group.current.rotation.z -= rollSpeed * delta
      secondGroup.current.position.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rollSpeed * delta))
    }

    // Update secondGroup.current's quaternion
    if (isLocalPlayer.current) {
      updatePlayerPosition(delta)

      // Copy group.current's position to secondGroup.current's position
      secondGroup.current.position.copy(group.current.position)
      handleLasersCallback(delta, gameState)
      emitMoveEvent()
    }
    group.current.position.lerp(targetPosition, movementSpeed, 0.1)

    if (planetPosition && group.current) {
      const sunDistance = group.current.position.distanceTo(planetPosition.sun)
      const sunRadius = 225
      let playerRadius = 2 // Replace with the actual radius of the player

      // Create a list of planets and their properties
      const planets = [
        { name: 'planet1', distance: group.current.position.distanceTo(planetPosition.planet1), radius: 30 },
        { name: 'planet2', distance: group.current.position.distanceTo(planetPosition.planet2), radius: 42 },
        { name: 'planet3', distance: group.current.position.distanceTo(planetPosition.planet3), radius: 47 },
        { name: 'planet4', distance: group.current.position.distanceTo(planetPosition.planet4), radius: 30 },
        { name: 'planet5', distance: group.current.position.distanceTo(planetPosition.planet5), radius: 71 }
      ]

      // Check for collision with the sun
      if (sunDistance <= playerRadius + sunRadius) {
        console.log('Collision detected!')
        const encoder = new TextEncoder()
        const uint8Array = encoder.encode(JSON.stringify(geckosClient.current.id))
        channel.emit('hit', uint8Array)
      }

      // Check for collision with each planet
      for (let planet of planets) {
        if (planet.distance <= playerRadius + planet.radius) {
          console.log(`Collision detected with ${planet.name}!`)
          const encoder = new TextEncoder()
          const uint8Array = encoder.encode(JSON.stringify(geckosClient.current.id))
          channel.emit('hit', uint8Array)
        }
      }
    }
  })

  return (
    <group ref={containerGroup}>
      {/* First Eve component */}
      <group ref={(groupRef) => (group.current = groupRef)}>
        <Suspense fallback={null}>
          <Eve />
        </Suspense>
      </group>
      {/* Second Eve component */}

      <group ref={(secondGroupRef) => (secondGroup.current = secondGroupRef)}>
        <Suspense fallback={null}>
          <Torso />
        </Suspense>
      </group>
      <group ref={laserGroup}></group>
    </group>
  )
})

export default Player
