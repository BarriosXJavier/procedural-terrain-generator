'use client'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Terrain } from './Terrain'

interface SceneProps {
  terrainType: 'water' | 'mountain'
}

export default function Scene({ terrainType }: SceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 15, 15], fov: 60 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0a0a0a']} />
      
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <Terrain type={terrainType} />
      
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxPolarAngle={Math.PI / 2}
      />
    </Canvas>
  )
}
