import { useState, useRef, useCallback, useMemo } from 'react'
import { Vector3 } from 'three'
import { useStore } from './store' // Assuming you have a store.js file
import * as THREE from 'three'
import { useCompoundBody } from '@react-three/cannon'
import { Raycaster } from 'three'
import { useThree } from '@react-three/fiber'

export const useLaser = (secondGroup, players) => {
  const lasers = useStore((state) => state.lasers)
  const laserGroup = useRef()
  const [isRightMouseDown, setRightMouseDown] = useState(false)
  const fireRate = 600 // Fire rate in milliseconds
  let lastFired = Date.now() - fireRate
  const raycaster = new Raycaster()
  const { scene } = useThree()
  const [damage, setDamage] = useState(100)
  // Create a compound body outside of the shootLasers function
  // Memoize geometry and material creation
  const laserGeometry = useMemo(() => new THREE.BoxGeometry(0.1, 0.1, 1), [])
  const laserMaterial = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        color: 0x00eeff,
        transparent: true,
        opacity: 0.8
      }),
    []
  )

  const handleMouseDown = useCallback((event) => {
    if (event.button === 2) {
      setRightMouseDown(true)
    }
  }, [])

  const handleMouseUp = useCallback((event) => {
    if (event.button === 2) {
      setRightMouseDown(false)
    }
  }, [])

  const shootLasers = useCallback(() => {
    const now = Date.now()
    if (now - lastFired < fireRate) {
      return // If not enough time has passed since the last shot, don't fire
    }
    lastFired = now

    const laserMesh = new THREE.Mesh(laserGeometry, laserMaterial)
    laserMesh.position.set(secondGroup.current.position.x, secondGroup.current.position.y + 1, secondGroup.current.position.z)
    laserMesh.quaternion.copy(secondGroup.current.quaternion)
    const light = new THREE.PointLight(0xffffff, 10, 500)
    light.position.set(0, 0, 0)
    laserMesh.add(light)

    // Add the lasers to the scene
    laserGroup.current.add(laserMesh)

    // Add the lasers to the state for later reference
    lasers.push(laserMesh)
  }, [fireRate, laserGeometry, laserMaterial, lasers, secondGroup])

  const updateLasers = useCallback(
    (group, delta) => {
      // Create a single Vector3 object outside the loop and reuse it
      const laserDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(secondGroup.current.quaternion)
      raycaster.linePrecision = 0.0001
      // Get all objects in the scene that the ray intersects
      lasers.forEach((laser, index) => {
        laserDirection.set(0, 0, -1).applyQuaternion(laser.quaternion)
        laser.position.add(laserDirection.clone().multiplyScalar(100 * delta)) // Adjust the speed as needed
        raycaster.set(laser.position, laserDirection)
        const intersects = raycaster.intersectObjects(scene.children)

        if (laser.position.distanceTo(group.current.position) > 100) {
          laserGroup.current.remove(laser)
          // Remove the laser from the state as well
          lasers.splice(lasers.indexOf(laser), 1)
        }
        if (intersects.length > 0.1 && intersects[0].distance < 1) {
          laserGroup.current.remove(laser)
          lasers.splice(lasers.indexOf(laser), 1)
        }
      })

      if (isRightMouseDown) {
        shootLasers()
      }
    },
    [isRightMouseDown, lasers, shootLasers, players]
  )

  return {
    lasers,
    laserGroup,
    isRightMouseDown,
    handleMouseDown,
    handleMouseUp,
    shootLasers,
    updateLasers
  }
}
