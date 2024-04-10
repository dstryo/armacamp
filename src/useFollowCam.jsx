import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Object3D, Vector3 } from 'three'

export default function useFollowCam(secondGroup, offset, isLocalPlayer) {
  const { scene, camera } = useThree()

  const pivot = useMemo(() => new Object3D(), [])
  const alt = useMemo(() => new Object3D(), [])
  const yaw = useMemo(() => new Object3D(), [])
  const pitch = useMemo(() => new Object3D(), [])
  const worldPosition = useMemo(() => new Vector3(), [])

  const MIN_PITCH = -90 * (Math.PI / 180)
  const MAX_PITCH = 90 * (Math.PI / 180)

  function onDocumentMouseMove(e) {
    if (document.pointerLockElement && isLocalPlayer) {
      e.preventDefault()
      yaw.rotation.y -= e.movementX * 0.002
      const v = pitch.rotation.x - e.movementY * 0.002
      if (v > MIN_PITCH && v < MAX_PITCH) {
        pitch.rotation.x = v
      }
    }
  }

  function onDocumentMouseWheel(e) {
    if (document.pointerLockElement && isLocalPlayer) {
      e.preventDefault()
      const v = camera.position.z + e.deltaY * 0.005
      if (v >= 1 && v <= 10) {
        camera.position.z = v
      }
    }
  }

  useEffect(() => {
    scene.add(pivot)
    pivot.add(alt)
    alt.position.y = offset[2]
    alt.add(yaw)
    yaw.add(pitch)
    pitch.add(camera)

    alt.add(secondGroup)

    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('mousewheel', onDocumentMouseWheel, { passive: false })
    return () => {
      document.removeEventListener('mousemove', onDocumentMouseMove)
      document.removeEventListener('mousewheel', onDocumentMouseWheel)
    }
  }, [camera])

  useFrame(() => {
    if (secondGroup.current) {
      secondGroup.current.getWorldPosition(worldPosition)
      pivot.position.set(worldPosition.x, worldPosition.y, worldPosition.z)
    }
  })

  return { pivot, alt, yaw, pitch, secondGroup }
}
