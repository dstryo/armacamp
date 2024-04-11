import { SphereGeometry, MeshBasicMaterial, Mesh, Vector3 } from 'three'
// Reuse geometry and material
const geometry = new SphereGeometry(0.02, 16, 16)
const material = new MeshBasicMaterial({ color: 0xff0000 })

export const createReticule = (containerGroup) => {
  const mesh = new Mesh(geometry, material)
  containerGroup.current.add(mesh)
  return mesh
}

export const handleIntersections = (raycaster, camera, groundObjects, reticule, defaultPosition) => {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera)

  // Only calculate defaultPosition when necessary
  if (camera.matrixWorldNeedsUpdate) {
    defaultPosition.set(0, -1.1, -10)
    defaultPosition.applyMatrix4(camera.matrixWorld)
  }

  reticule.current.position.copy(defaultPosition)
}
