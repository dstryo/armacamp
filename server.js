import fs from 'fs'
import express from 'express'
import Router from 'express-promise-router'
import { createServer } from 'vite'
import viteConfig from './vite.config.js'
import geckos from '@geckos.io/server'
import http from 'http'

// Create router
const router = Router()
const playerPositions = {}
let lasers = {}
let enemyId = 'enemy' + Math.floor(Math.random() * 1000000)

// Create vite front end dev server
const vite = await createServer({
  configFile: false,
  server: {
    middlewareMode: 'html'
  },
  ...viteConfig
})

// Main route serves the index HTML
router.get('/', (req, res, next) => {
  fs.readFile('./public/index.html', 'utf-8', (err, html) => {
    if (err) {
      console.error(err)
      return
    }
    vite.transformIndexHtml(req.url, html).then((transformedHtml) => {
      res.send(transformedHtml)
    })
  })
})

// Use vite middleware so it rebuilds frontend
router.use(vite.middlewares)

// Everything else that's not index 404s
router.use('*', (req, res) => {
  res.status(404).send({ message: 'Not Found' })
})

// Create express app and listen on port 4444
const app = express()
app.use(router)
const server = http.createServer(app)
const io = geckos()
const range = 100

io.addServer(server)

let gameState = {}
let gameStatesHistory = []

function updateGameState() {
  gameStatesHistory.push(JSON.parse(JSON.stringify(gameState)))
  if (gameStatesHistory.length > 10) {
    gameStatesHistory.shift()
  }
  for (const id in playerPositions) {
    const positions = playerPositions[id].map((p) => p.position) // Extract the positions
    const rotations = playerPositions[id].map((p) => p.rotation) // Extract the rotations
    const torsoRotations = playerPositions[id].map((p) => p.torsoRotation) // Extract the torsoRotations

    // Calculate interpolated position, rotation, torsoPosition, and torsoRotation
    const interpolatedPosition = interpolate(positions)
    const interpolatedRotation = interpolate(rotations)
    const interpolatedTorsoRotation = interpolate(torsoRotations)
    if (gameState[id]) {
      gameState[id].position = interpolatedPosition
      gameState[id].rotation = interpolatedRotation
      gameState[id].torsoRotation = interpolatedTorsoRotation
      gameState[id].time = playerPositions[id][playerPositions[id].length - 1].time
    }
  }
}

// Socket app msgs
io.onConnection((channel) => {
  console.log(`User ${channel.id} connected`)

  //Add a new client indexed by his id
  gameState[channel.id] = {
    id: channel.id,
    position: [(Math.random() - 0.5) * 2000, (Math.random() - 0.5) * 2000, 200],
    rotation: [0, 0, 0],
    torsoRotation: [0, 0, 0],
    playerHealth: 500
  }
  gameState[enemyId] = {
    id: enemyId,
    enemyPosition: [100, 0, 0],

    // Set the initial position of the enemy
    enemyHealth: 500 // Set the initial health of the enemy
  }
  updateGameState()

  // Convert gameState to a Buffer and emit
  const gameStateBuffer = Buffer.from(JSON.stringify(gameState))
  channel.emit('gameState', gameStateBuffer) // Emit to the new player
  let lastMoveTime = 0

  channel.on('laser', (data) => {
    try {
      // Convert the data object back to a Uint8Array
      const uint8Array = Uint8Array.from(Object.values(data))

      // Convert the Uint8Array back to a string
      const dataString = new TextDecoder().decode(uint8Array)

      // Parse the string back into a JavaScript object
      const laserData = JSON.parse(dataString)

      lasers[laserData.id] = laserData

      // Convert the laser data to a Buffer (for Node.js environment)
      const buffer = Buffer.from(JSON.stringify(laserData))

      // Broadcast the laser data to all connected clients
      io.emit('laser', buffer)
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  channel.on('removeLaser', (laserId) => {
    const uint8Array = Uint8Array.from(Object.values(laserId))

    // Convert the Uint8Array back to a string
    const dataString = new TextDecoder().decode(uint8Array)

    // Parse the string back into a JavaScript object
    const laserIdData = JSON.parse(dataString)

    lasers[laserIdData.id] = laserIdData

    // Convert the laser data to a Buffer (for Node.js environment)
    const laserIdBuffer = Buffer.from(JSON.stringify(laserIdData))
    delete lasers[laserId]
    io.emit('removeLaser', laserIdBuffer)
  })

  channel.on('enemyHit', (data) => {
    try {
      // Convert the data object back to a Uint8Array
      const uint8Array = Uint8Array.from(Object.values(data))

      // Convert the Uint8Array back to a string
      const dataString = new TextDecoder().decode(uint8Array)

      // Parse the string back into a JavaScript object
      const hitData = JSON.parse(dataString)

      // Check if the enemy exists in the gameState
      if (gameState[enemyId] && hitData === enemyId) {
        // Decrease the enemy's health by 10
        gameState[enemyId].enemyHealth -= 10
        // If the enemy's health is less than or equal to 0, remove the enemy from the gameState
        if (gameState[enemyId].enemyHealth <= 0) {
          delete gameState[enemyId]
        }

        if (hitData.laserId && lasers[hitData.laserId]) {
          delete lasers[hitData.laserId]
        }

        // Convert gameState to a Buffer and emit
        const gameStateBuffer = Buffer.from(JSON.stringify(gameState))
        io.emit('gameState', gameStateBuffer) // Emit to all connected clients
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  channel.on('hit', (data) => {
    try {
      // Convert the data object back to a Uint8Array
      const uint8Array = Uint8Array.from(Object.values(data))

      // Convert the Uint8Array back to a string
      const dataString = new TextDecoder().decode(uint8Array)

      // Parse the string back into a JavaScript object
      const hitData = JSON.parse(dataString)

      // Check if the player exists in the gameState
      if (gameState[hitData]) {
        // Decrease the player's health by 10
        gameState[hitData].playerHealth -= 10

        // If the player's health is less than or equal to 0, remove the player from the gameState
        if (gameState[hitData].playerHealth <= 0) {
          delete gameState[hitData]
        }

        if (hitData.laserId && lasers[hitData.laserId]) {
          delete lasers[hitData.laserId]
        }

        // Convert gameState to a Buffer and emit
        const gameStateBuffer = Buffer.from(JSON.stringify(gameState))
        io.emit('gameState', gameStateBuffer) // Emit to all connected clients
      }
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  channel.onDisconnect(() => {
    console.log(`User ${channel.id} disconnected`)
    delete gameState[channel.id]
  })

  channel.on('enemyMove', (enemyDataArray) => {
    try {
      // Convert the Buffer to a Uint8Array
      const uint8Array = Uint8Array.from(Object.values(enemyDataArray))

      // Decode the Uint8Array back to a string
      const dataString = new TextDecoder().decode(uint8Array)

      // Parse the string back into a JavaScript object
      const enemyData = JSON.parse(dataString)

      const now = Date.now()
      if (now - lastMoveTime < 300) {
        // Limit to 10 moves per second
        const { id, position, rotation, torsoRotation, time } = enemyData

        // If this is a normal 'enemyMove' event, update the enemy's position as usual
        if (gameState[id]) {
          gameState[id].enemyPosition = position
        }
        return
      }
      lastMoveTime = now
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  channel.on('move', (playerDataArray) => {
    try {
      // Convert the Buffer to a Uint8Array

      const uint8Array = Uint8Array.from(Object.values(playerDataArray))

      // Decode the Uint8Array back to a string
      const dataString = new TextDecoder().decode(uint8Array)

      // Parse the string back into a JavaScript object
      const playerData = JSON.parse(dataString)

      const now = Date.now()
      if (now - lastMoveTime < 300) {
        // Limit to 10 moves per second
        const { id, position, rotation, torsoRotation, time } = playerData

        // Find the game state at the time the action was performed
        const pastGameState = gameStatesHistory.find((state) => state.time === time)

        if (pastGameState) {
          // Resolve the action in the past game state
          const pastPlayerState = pastGameState[id]
          if (pastPlayerState) {
            const changes = getChanges(pastGameState, playerData)
            gameState[id] = applyChanges(gameState[id], changes)
          } else {
            // If this is a lag compensation event, update the player's position with the past game state
            pastPlayerState.position = position
            pastPlayerState.rotation = rotation
            pastPlayerState.torsoRotation = torsoRotation
          }
        }

        // If this is a normal 'move' event, update the player's position as usual
        if (gameState[id]) {
          gameState[id].position = position
          gameState[id].rotation = rotation
          gameState[id].torsoRotation = torsoRotation
        }
        return
      }
      lastMoveTime = now
    } catch (error) {
      console.error('An error occurred:', error)
    }
  })

  setInterval(() => {
    updateGameState()

    // Convert gameState to a Buffer and emit
    const gameStateBuffer = Buffer.from(JSON.stringify(gameState))

    io.emit('gameState', gameStateBuffer) // Emit to all connected clients
  }, 1000 / 1000)
})

server.listen(process.env.PORT || 4444, () => {
  console.log(`Listening on port http://localhost:4444...`)
})

function interpolate(positions) {
  const len = positions.length
  if (len < 2) {
    return positions[len - 1]
  }
  const lastPosition = positions[len - 1]
  const secondLastPosition = positions[len - 2]
  for (let i = 0; i < lastPosition.length; i++) {
    lastPosition[i] = (lastPosition[i] + secondLastPosition[i]) / 2
  }
  return lastPosition
}
