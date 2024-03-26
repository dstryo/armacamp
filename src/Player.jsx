import React, { useCallback, Suspense, useMemo, useRef, useEffect } from 'react'
import { Vector3, Euler, Quaternion, Matrix4 } from 'three'
import Eve from './Eve'
import { useCompoundBody } from '@react-three/cannon'
import useKeyboard from './useKeyboard'
import { useFrame } from '@react-three/fiber'
import { Vec3 } from 'cannon-es'
import useFollowCam from './useFollowCam'
import { useStore } from './store'
import Torso from './Torso'
import { useLaser } from './laser'
import * as THREE from 'three'

import { useReticule } from './useReticule'

const Player = React.memo(function Player({ position }) {
  const playerGrounded = useRef(false)
  const inJumpAction = useRef(false)
  const group = useRef()
  const { yaw, pitch, secondGroup, updateMouseMovement } = useFollowCam(group, [0, 1, 1.5])
  const velocity = useMemo(() => new Vector3(), [])
  const inputVelocity = useMemo(() => new Vector3(), [])
  const euler = useMemo(() => new Euler(), [])
  const quat = useMemo(() => new Quaternion(), [])
  const targetQuaternion = useMemo(() => new Quaternion(), [])
  const worldPosition = useMemo(() => new Vector3(), [])
  const raycasterOffset = useMemo(() => new Vector3(), [])
  const contactNormal = useMemo(() => new Vec3(0, 0, 0), [])
  const down = useMemo(() => new Vec3(0, -1, 0), [])
  const rotationMatrix = useMemo(() => new Matrix4(), [])
  const prevActiveAction = useRef(0) // 0:idle, 1:walking, 2:jumping
  const keyboard = useKeyboard()
  const secondGroupPosition = useMemo(() => new Vector3(), [])
  const { groundObjects, actions, mixer, setTime, setFinished } = useStore((state) => state)
  const { addPlayer } = useStore((state) => state.actions)
  const containerGroup = useRef()
  const reticule = useReticule(containerGroup)
  const { laserGroup, handleMouseDown, handleMouseUp, updateLasers } = useLaser(secondGroup)
  const { playerHealth } = useStore((state) => ({
    playerHealth: state.playerHealth,
    decreasePlayerHealth: state.actions.decreasePlayerHealth
  }))
  const { setPlayerHealth } = useStore((state) => state.actions)
  const setGroupRef = useCallback((groupRef) => {
    group.current = groupRef
  }, [])

  const setSecondGroupRef = useCallback((secondGroupRef) => {
    secondGroup.current = secondGroupRef
  }, [])
  let accumulator = 0
  const fixedDeltaTime = 1 / 60

  useEffect(() => {
    addPlayer(group.current.position)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousemove', updateMouseMovement)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', updateMouseMovement)
    }
  }, [handleMouseDown, handleMouseUp, updateMouseMovement])

  const shapes = useMemo(
    () => [
      { args: [1, 1, 1], position: [0, 0.5, 0], type: 'Box' },
      { args: [0.25, 0.5, 0.5], position: [0, 1.25, 0], type: 'Box' }
    ],
    []
  )

  const [ref, body] = useCompoundBody(
    () => ({
      mass: 1,
      shapes,
      onCollide: (e) => {
        if (e.contact.bi.id !== e.body.id) {
          contactNormal.set(...e.contact.ni)
        }
        if (contactNormal.dot(down) > 0.5) {
          if (inJumpAction.current) {
            // landed
            inJumpAction.current = true
            actions['jump']
          }
        }
      },
      material: 'slippery',
      linearDamping: 0,
      position: position
    }),
    useRef()
  )

  const updateSecondGroupQuaternion = () => {
    // Assuming yaw.rotation is the mouse movement data
    const gaze = new Quaternion()

    // Set pitch directly to euler.x
    const euler = new Euler(pitch.rotation.x, yaw.rotation.y, 0, 'YZX')

    // Convert euler angles to quaternion
    gaze.setFromEuler(euler)
    secondGroup.current.setRotationFromQuaternion(gaze)
  }

  const setActiveAction = useCallback((keyboard, delta) => {
    let activeAction = 0
    if (keyboard['KeyW'] || keyboard['KeyS'] || keyboard['KeyA'] || keyboard['KeyD']) {
      activeAction = 1
    }
    if (keyboard['Space']) {
      activeAction = 2
    }
    return activeAction
  })

  const handlePlayerGrounded = useCallback((raycaster, worldPosition, groundObjects) => {
    playerGrounded.current = false
    raycasterOffset.copy(worldPosition)
    raycasterOffset.y += 0.01
    raycaster.set(raycasterOffset, down)
    const intersectObjects = raycaster.intersectObjects(Object.values(groundObjects), false)
    for (let i = 0; i < intersectObjects.length; i++) {
      if (intersectObjects[i].distance < 0.028) {
        playerGrounded.current = true
        break
      }
    }
  }, [])

  const handleQuaternionUpdate = useCallback((worldPosition, group, targetQuaternion, rotationMatrix, distance, delta) => {
    rotationMatrix.lookAt(worldPosition, group.current.position, group.current.up)
    targetQuaternion.setFromRotationMatrix(rotationMatrix)
    if (distance > 0.0001 && !group.current.quaternion.equals(targetQuaternion)) {
      targetQuaternion.z = 0
      targetQuaternion.x = 0
      targetQuaternion.normalize()
      group.current.quaternion.rotateTowards(targetQuaternion, delta * 6)
    }
  }, [])

  const handleInputVelocity = useCallback((keyboard, delta, activeAction, prevActiveAction, actions, inputVelocity, body, velocity, euler, quat) => {
    inputVelocity.set(0, 0, 0)
    if (playerGrounded.current) {
      if (keyboard['KeyW']) {
        inputVelocity.z = -6
      }
      if (keyboard['KeyS']) {
        inputVelocity.z = 6
      }
      if (keyboard['KeyA']) {
        inputVelocity.x = -6
      }
      if (keyboard['KeyD']) {
        inputVelocity.x = 6
      }
      if (activeAction !== prevActiveAction.current) {
        if (prevActiveAction.current !== 1 && activeAction === 1) {
          actions['ArmatureAction.001']
          actions['idle']
        }
        if (prevActiveAction.current !== 0 && activeAction === 0) {
          actions['ArmatureAction.001']
          actions['walk']
        }
        prevActiveAction.current = activeAction
      }
      if (keyboard['Space']) {
        if (playerGrounded.current && !inJumpAction.current) {
          inJumpAction.current = false
          actions['jump']
          inputVelocity.y = 6
        }
      }
      euler.y = yaw.rotation.y
      euler.order = 'YZX'
      quat.setFromEuler(euler)
      inputVelocity.applyQuaternion(quat)
      velocity.set(inputVelocity.x, inputVelocity.y, inputVelocity.z)
      body.applyImpulse([velocity.x, velocity.y, velocity.z], [0, 0, 0])
    }
  }, [])

  const handleMixerUpdate = useCallback((mixer, activeAction, delta, distance) => {
    mixer.update(activeAction === 1 ? delta * distance * 22.5 : delta)
  }, [])

  const handleResetPosition = useCallback(
    (worldPosition, body, group, setFinished, setTime) => {
      setPlayerHealth(100)
      body.velocity.set(0, 0, 0)
      body.position.set(0, 1, 0)
      group.current.position.set(0, 1, 0)
    },
    [setPlayerHealth]
  )

  const handlePositionLerp = useCallback((worldPosition, group, secondGroup) => {
    const lerpFactor = 0.15 // Adjust this value to see what works best
    group.current.position.lerp(worldPosition, lerpFactor)
    secondGroup.current.position.lerp(new THREE.Vector3(worldPosition.x, worldPosition.y + 1, worldPosition.z), lerpFactor)
  }, [])

  useFrame(({ raycaster, scene, camera, clock }, delta) => {
    accumulator += delta
    updateLasers(group, delta)
    body.angularFactor.set(0, 0, 0)
    ref.current.getWorldPosition(worldPosition)
    handlePlayerGrounded(raycaster, worldPosition, groundObjects)
    body.linearDamping.set(playerGrounded.current ? 0.9999999 : 0)
    const distance = worldPosition.distanceTo(group.current.position)
    if (document.pointerLockElement) {
      updateSecondGroupQuaternion()
    }
    handleQuaternionUpdate(worldPosition, group, targetQuaternion, rotationMatrix, distance, delta)
    let activeAction = setActiveAction(keyboard, delta)
    while (accumulator >= fixedDeltaTime) {
      handleInputVelocity(keyboard, fixedDeltaTime, activeAction, prevActiveAction, actions, inputVelocity, body, velocity, euler, quat)
      handleMixerUpdate(mixer, activeAction, fixedDeltaTime, distance)
      accumulator -= fixedDeltaTime
    }

    handlePositionLerp(worldPosition, group, secondGroup)

    if (playerHealth <= 0) {
      handleResetPosition(worldPosition, body, group, setFinished, setTime)
    }

    if (reticule && reticule.current && secondGroup.current) {
      const raycaster = new THREE.Raycaster()
      raycaster.set(secondGroup.current.position, new THREE.Vector3(0, 0, -1))
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(secondGroup.current.quaternion)
      direction.multiplyScalar(10)
      reticule.current.position.copy(secondGroup.current.position).add(direction).add(new THREE.Vector3(0, 0, 0))
      reticule.current.material.depthTest = false
      reticule.current.renderOrder = 1 // render this last
    }
  })

  return (
    <>
      <group ref={containerGroup} position={position}>
        {/* First Eve component */}
        <group ref={setGroupRef} position={position}>
          <Suspense fallback={null}>
            <Eve />
          </Suspense>
        </group>

        {/* Second Eve component */}
        <group ref={setSecondGroupRef} position={secondGroupPosition}>
          <Suspense fallback={null}>
            <Torso />
          </Suspense>
        </group>
        <group ref={laserGroup}></group>
      </group>
    </>
  )
})

export default Player
