import React from 'react'
import { Debug, useContactMaterial } from '@react-three/cannon'
import Floor from './Floor'
import EnemyNpcs from './EnemyNpcs'
import Player from './Player'
import { useControls } from 'leva'
import Box from './Box'
import Platform from './Platform'
import { Environment, OrbitControls, Sky, SpotLight } from '@react-three/drei'
import Wall from './Wall'
import Model2 from './Model2'
import Model3 from './Model3'
import Model4 from './Model4'
import Model5 from './Model5'

function Game() {
  useContactMaterial('ground', 'slippery', {
    friction: 0,
    restitution: 0.3,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3
  })
  console.log('running')
  return (
    <>
      <Sky distance={450000} sunPosition={[0, 90, 0]} inclination={0} azimuth={0.25} />

      <Environment preset="sunset" background />
      <Floor />
      <Wall />

      <Player position={[0, 0.5, 0]} />
    </>
  )
}

export default React.memo(Game)
