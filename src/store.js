import { create } from 'zustand'
import { AnimationMixer } from 'three'

export const useStore = create((set) => ({
  // Capture set here
  players: [],
  groundObjects: {},
  actions: {
    shoot: () => {
      set((state) => ({ lasers: [...state.lasers, Date.now()] }))
      // Implement logic for firing lasers
    },
    shootTurretLaser: () => {
      set((state) => ({ turretLasers: [...state.turretLasers] }))
      // Implement logic for firing lasers
    },
    addPlayer: (playerGroup) => {
      set((state) => ({ players: [playerGroup] })) // Now set is defined
    },
    decreasePlayerHealth: () => {
      set((state) => ({ playerHealth: state.playerHealth - 10 }))
    },
    setPlayerHealth: (newHealth) => {
      set({ playerHealth: newHealth })
    }
    //toggleSound: (sound) => {
    // Implement logic for toggling sound
    //}
    // ... Other existing actions
  },
  playerHealth: 100,
  lasers: [], // New state for storing laser shots
  turretLasers: [],
  mixer: new AnimationMixer()
}))
