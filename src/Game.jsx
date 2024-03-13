import React from 'react'
import { Debug, useContactMaterial } from '@react-three/cannon'
import Floor from './Floor'
import EnemyNpcs from './EnemyNpcs'
import Player from './Player'
import { useControls } from 'leva'
import Box from './Box'
import Platform from './Platform'

function Game() {
  useContactMaterial('ground', 'slippery', {
    friction: 0,
    restitution: 0.3,
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3
  })

  return (
    <>
      <Platform />
      <Floor />
      <EnemyNpcs />
      <Player position={[0, 1, 0]} />
    </>
  )
}

export default React.memo(Game)
