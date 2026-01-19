import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import * as THREE from "three";

const TerrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#22c55e"),
  },
  // Vertex Shader
  `
    varying float vZ;
    uniform float uTime;

    void main() {
      vec4 modelPosition = modelMatrix * vec4(position, 1.0);

      modelPosition.y += sin(modelPosition.x + uTime);
      vZ = modelPosition.y;

      gl_Position = projectionMatrix * viewMatrix * modelPosition;
    }
  `,
  // Fragment Shader
  `
    varying float vZ;

    void main() {
      gl_FragColor = vec4(vec3(vZ * 0.5 + 0.5), 1.0);
    }
  `
);

extend({ TerrainMaterial });

