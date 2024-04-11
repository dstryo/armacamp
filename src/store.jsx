import { create } from 'zustand'
import { AnimationMixer } from 'three'

export const useStore = create((set) => ({
  // Capture set here
  planetPositions: {
    planet1: [600, 0, 0]
    // Add other planets if needed
  },
  enemyFleet: [],
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

    setPlanetPosition: (planetName, newPosition) => {
      set((state) => ({
        planetPosition: {
          ...state.planetPosition,
          [planetName]: newPosition
        }
      }))
    }

    //toggleSound: (sound) => {
    // Implement logic for toggling sound
    //}
    // ... Other existing actions
  },
  lasers: [], // New state for storing laser shots
  turretLasers: [],
  mixer: new AnimationMixer()
}))
