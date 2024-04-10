import React, { Suspense, useRef, useState } from 'react'
import { useStore } from './store'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const Sun = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const mesh = useRef()
  // Set up state for the hovered and active state

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    const x = 0
    const y = 0 // Assuming the planet is rotating in the x-z plane
    const z = 0

    let planetPosition = new THREE.Vector3(x, y, z)
    setPlanetPosition('sun', planetPosition)
  })
  return (
    <group>
      <mesh ref={mesh} position={[0, 0, 0]}>
        <sphereGeometry attach="geometry" args={[200, 32, 64]} />
        <meshBasicMaterial attach="material" color={'orange'} roughness={1} metalness={0} intensity={1.2} />

        <pointLight distance={20000} decay={1} position={[0, 0, 0]} color="#ffffff" skyColor="#ffffbb" groundColor="#080820" intensity={3000} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry attach="geometry" args={[205, 32, 64]} />
        <meshBasicMaterial attach="material" color={'red'} opacity={0.3} transparent={true} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry attach="geometry" args={[250, 32, 64]} />
        <meshBasicMaterial attach="material" color={'yellow'} opacity={0.2} transparent={true} />
      </mesh>
    </group>
  )
}

const Planet1 = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const group = useRef()
  const mesh = useRef()
  const planetPosition = new THREE.Vector3()

  useFrame(() => {
    group.current.rotation.y += 0.00015
    mesh.current.rotation.y += 0.0001

    let angle = group.current.rotation.y
    let radius = 2000

    planetPosition.x = radius * Math.cos(angle)
    planetPosition.y = 0
    planetPosition.z = -radius * Math.sin(angle)

    setPlanetPosition('planet1', planetPosition)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[2000, 0, 0]} receiveShadow={true} castShadow={true}>
        <sphereGeometry attach="geometry" args={[28, 16, 64]} />
        <meshPhongMaterial attach="material" color={'yellow'} opacity={1} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[2000, 0, 0]}>
        <sphereGeometry attach="geometry" args={[30, 16, 64]} />
        <meshPhongMaterial attach="material" color={'white'} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  )
}

const Planet2 = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const group = useRef()
  const mesh = useRef()
  const planetPosition = new THREE.Vector3()

  useFrame(() => {
    group.current.rotation.y += 0.00009
    mesh.current.rotation.y += 0.00025

    let angle = group.current.rotation.y
    let radius = 2800

    planetPosition.x = radius * Math.cos(angle)
    planetPosition.y = 0
    planetPosition.z = -radius * Math.sin(angle)

    setPlanetPosition('planet2', planetPosition)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[2800, 0, 0]} receiveShadow={true} castShadow={true}>
        <sphereGeometry attach="geometry" args={[40, 16, 64]} />
        <meshPhongMaterial attach="material" color="blue" opacity={1} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[2800, 0, 0]}>
        <sphereGeometry attach="geometry" args={[42, 16, 64]} />
        <meshPhongMaterial attach="material" color={'white'} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  )
}

const Planet3 = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const group = useRef()
  const mesh = useRef()
  const planetPosition = new THREE.Vector3()

  useFrame(() => {
    group.current.rotation.y += 0.00005
    mesh.current.rotation.y += 0.00012

    let angle = group.current.rotation.y
    let radius = 3500

    planetPosition.x = radius * Math.cos(angle)
    planetPosition.y = 0
    planetPosition.z = -radius * Math.sin(angle)

    setPlanetPosition('planet3', planetPosition)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[3500, 0, 0]} receiveShadow={true} castShadow={true}>
        <sphereGeometry attach="geometry" args={[45, 16, 64]} />
        <meshPhongMaterial attach="material" color="green" opacity={1} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[3500, 0, 0]}>
        <sphereGeometry attach="geometry" args={[47, 16, 64]} />
        <meshPhongMaterial attach="material" color={'white'} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  )
}

const Planet4 = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const group = useRef()
  const mesh = useRef()
  const planetPosition = new THREE.Vector3()

  useFrame(() => {
    group.current.rotation.y += 0.00005
    mesh.current.rotation.y += 0.00025

    let angle = group.current.rotation.y
    let radius = 4200

    planetPosition.x = radius * Math.cos(angle)
    planetPosition.y = 0
    planetPosition.z = -radius * Math.sin(angle)

    setPlanetPosition('planet4', planetPosition)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[4200, 0, 0]} receiveShadow={true} castShadow={true}>
        <sphereGeometry attach="geometry" args={[28, 16, 64]} />
        <meshPhongMaterial attach="material" color="red" opacity={1} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[4200, 0, 0]}>
        <sphereGeometry attach="geometry" args={[30, 16, 64]} />
        <meshPhongMaterial attach="material" color={'white'} opacity={0.3} transparent={true} />
      </mesh>
    </group>
  )
}

const Planet5 = () => {
  const setPlanetPosition = useStore((state) => state.actions.setPlanetPosition)
  const group = useRef()
  const mesh = useRef()
  const planetPosition = new THREE.Vector3()

  useFrame(() => {
    group.current.rotation.y += 0.00005
    mesh.current.rotation.y += 0.00025

    let angle = group.current.rotation.y
    let radius = 5000

    planetPosition.x = radius * Math.cos(angle)
    planetPosition.y = 0
    planetPosition.z = -radius * Math.sin(angle)

    setPlanetPosition('planet5', planetPosition)
  })

  const ring = useRef()

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[5000, 0, 0]} receiveShadow castShadow>
        <sphereGeometry attach="geometry" args={[70, 16, 64]} />
        <meshPhongMaterial attach="material" color="gold" opacity={1} roughness={1} metalness={0} />
      </mesh>
      <mesh position={[5000, 0, 0]}>
        <sphereGeometry attach="geometry" args={[71, 16, 64]} />
        <meshPhongMaterial attach="material" color={'white'} opacity={0.3} transparent={true} />
      </mesh>
      <mesh ref={ring} position={[4995, -1, 0]} rotation={[1, 10, 15]}>
        <torusGeometry args={[80, 1, 2, 25]} />
        <meshPhongMaterial attach="material" color="white" opacity={1} roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}

function System1() {
  return (
    <group>
      <Sun />
      <Planet1 />
      <Planet2 />
      <Planet3 />
      <Planet4 />
      <Planet5 />
    </group>
  )
}
export default System1
