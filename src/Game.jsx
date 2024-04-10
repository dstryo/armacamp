import React, { useMemo, useRef } from 'react'

import Player from './Player'
import EnemyNpcs from './EnemyFleet'
import { throttle } from 'lodash'

const MemoizedPlayer = React.memo(Player)

const Game = React.memo(function Game({ gameState, geckosClient }) {
  const channel = useMemo(() => geckosClient.current, [geckosClient])
  const throttledGameState = useMemo(() => throttle(() => gameState, 0.2), [gameState])

  return (
    <>
      <EnemyNpcs gameState={gameState} channel={channel} />
      {Object.values(throttledGameState())
        .filter((clientData) => !clientData.id.includes('enemy'))
        .map((clientData) => {
          const { id, position, rotation, torsoRotation, reticulePosition } = clientData

          return (
            geckosClient.current && (
              <MemoizedPlayer
                id={id}
                key={id}
                position={position}
                rotation={rotation}
                channel={channel}
                torsoRotation={torsoRotation}
                reticulePosition={reticulePosition}
                geckosClient={geckosClient}
                gameState={gameState}
              />
            )
          )
        })}
    </>
  )
})

export default Game
