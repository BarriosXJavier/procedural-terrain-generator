"use client";

import {Canvas} from "@react-three/fiber"
import {OrbitControls, Sky} from "@react-three/drei"
import {Terrain} from "./Terrain"

export default function Scene () {
  return (
    <Canvas camera={{position: [0, 10, 20], fov: 45}} dpr={[1, 2]} shadows>
    <color attach="background" args={["#050505"]}/>
    <ambientLight intensity={0.2}/>
    <directionalLight position={[10, 10, 5]} intensity={1} castShadow/>
    <Terrain />
    <Sky sunPosition={[100, 10, 100]}/>
    <OrbitControls makeDefault/>
    </Canvas>
  )
}
