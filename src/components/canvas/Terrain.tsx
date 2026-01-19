import { shaderMaterial } from "@react-three/drei";
import { extend, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { noiseGLSL } from "../shaders/terrain.glsl";

const TerrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorLow: new THREE.Color("#050505"),
    uColorHigh: new THREE.Color("#3b82f6"),
  },

  // Vertex Shader: Manipulating the geometry
  `
    varying float vElevation;
    uniform float uTime;
    ${noiseGLSL}

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      // calculate elevation using noise
      float elevation = snoise(modelPosition.xz * 0.2 + uTime * 0.1) * 0.8;
      elevation += snoise(modelPosition.xz * 0.5) * 0.2; // add a layer of detail

      modelPosition.y += elevation;
      vElevation = elevation;

      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `,

  // Fragment Shader: Manipulates the color
  `
    varying float vElevation;
    uniform vec3 uColorLow;
    uniform vec3 uColorHigh;

    void main() {
      // mix colors based on height
      float mixStrength = (vElevation + 0.5) * 1.0;
      vec3 color = mix(uColorLow, uColorHigh, mixStrength);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ TerrainMaterial });

export function Terrain() {
  const materialRef = useRef<any>();

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.elapsedTime;
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20, 256, 256]} />
      {/*@ ts-ignore*/}
      <terrainMaterial ref={materialRef} side={THREE.DoubleSide} />
    </mesh>
  );
}
