"use client";
import React, { useRef } from "react";
import * as THREE from "three";
import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { noiseGLSL } from "../shaders/terrain.glsl";

const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uCameraPosition: new THREE.Vector3(),
  },
  // Vertex Shader
  `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  uniform float uTime;
  uniform vec3 uCameraPosition;
  
  ${noiseGLSL}
  
  void main() {
    float offset = 0.08;
    
    // Multiple octaves for realistic wave complexity
    vec2 p = position.xy;
    float t = uTime * 0.05;
    
    // Large swells (ocean waves)
    float wave1 = fbm(p * 0.08 + t * 0.3) * 2.0;
    // Medium waves
    float wave2 = fbm(p * 0.25 + t * 0.5) * 0.6;
    // Small ripples
    float wave3 = fbm(p * 1.2 + t * 1.5) * 0.15;
    
    float displacement = wave1 + wave2 + wave3;
    
    // Calculate normals with proper wave interaction
    float heightL = fbm((p - vec2(offset, 0.0)) * 0.08 + t * 0.3) * 2.0
                  + fbm((p - vec2(offset, 0.0)) * 0.25 + t * 0.5) * 0.6
                  + fbm((p - vec2(offset, 0.0)) * 1.2 + t * 1.5) * 0.15;
    float heightR = fbm((p + vec2(offset, 0.0)) * 0.08 + t * 0.3) * 2.0
                  + fbm((p + vec2(offset, 0.0)) * 0.25 + t * 0.5) * 0.6
                  + fbm((p + vec2(offset, 0.0)) * 1.2 + t * 1.5) * 0.15;
    float heightD = fbm((p - vec2(0.0, offset)) * 0.08 + t * 0.3) * 2.0
                  + fbm((p - vec2(0.0, offset)) * 0.25 + t * 0.5) * 0.6
                  + fbm((p - vec2(0.0, offset)) * 1.2 + t * 1.5) * 0.15;
    float heightU = fbm((p + vec2(0.0, offset)) * 0.08 + t * 0.3) * 2.0
                  + fbm((p + vec2(0.0, offset)) * 0.25 + t * 0.5) * 0.6
                  + fbm((p + vec2(0.0, offset)) * 1.2 + t * 1.5) * 0.15;
    
    vec3 newPosition = position;
    newPosition.z += displacement;
    
    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec3 tangentX = normalize(vec3(offset * 2.0, 0.0, heightR - heightL));
    vec3 tangentY = normalize(vec3(0.0, offset * 2.0, heightU - heightD));
    vNormal = normalize(cross(tangentY, tangentX));
    
    vElevation = displacement;
    vViewDirection = normalize(uCameraPosition - worldPosition.xyz);
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
  `,
  // Fragment Shader
  `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDirection;
  uniform float uTime;
  
  void main() {
    vec3 lightDir = normalize(vec3(0.3, 0.5, 0.8));
    
    // Fresnel effect for realistic water reflectivity
    float fresnel = pow(1.0 - max(dot(vViewDirection, vNormal), 0.0), 3.0);
    
    // Diffuse lighting
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    
    // Specular highlights (sun glints)
    vec3 halfVector = normalize(lightDir + vViewDirection);
    float specular = pow(max(dot(vNormal, halfVector), 0.0), 128.0);
    
    // Depth-based color
    float depth = (vElevation + 2.0) * 0.3;
    vec3 deepWater = vec3(0.01, 0.05, 0.12);
    vec3 shallowWater = vec3(0.05, 0.15, 0.3);
    vec3 surfaceWater = vec3(0.2, 0.35, 0.45);
    
    vec3 waterColor = mix(deepWater, shallowWater, depth);
    waterColor = mix(waterColor, surfaceWater, fresnel * 0.5);
    
    // Add foam on wave peaks
    float foam = smoothstep(1.5, 2.0, vElevation);
    waterColor = mix(waterColor, vec3(0.9, 0.95, 1.0), foam * 0.8);
    
    // Combine lighting
    vec3 finalColor = waterColor * (diffuse * 0.4 + 0.6);
    finalColor += vec3(1.0, 0.95, 0.8) * specular * 0.8;
    
    // Subsurface scattering approximation
    float backlight = max(dot(vNormal, -lightDir), 0.0);
    finalColor += vec3(0.1, 0.2, 0.25) * backlight * 0.3;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `,
);

const MountainMaterial = shaderMaterial(
  {
    uTime: 0,
    uCameraPosition: new THREE.Vector3(),
  },
  // Vertex Shader
  `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vSlope;
  uniform vec3 uCameraPosition;
  
  ${noiseGLSL}
  
  void main() {
    float offset = 0.08;
    vec2 p = position.xy;
    
    // Multi-scale terrain generation
    float mountains = fbm(p * 0.05) * 8.0;        // Large mountain ranges
    float hills = fbm(p * 0.15) * 2.5;            // Hills and valleys
    float ridges = fbm(p * 0.4) * 0.8;            // Ridge details
    float rocks = fbm(p * 1.5) * 0.2;             // Rocky surface
    float micro = fbm(p * 6.0) * 0.05;            // Micro detail
    
    // Erosion simulation - valleys are deeper than peaks are high
    float erosion = smoothstep(0.0, 1.0, mountains / 8.0);
    float displacement = mountains + hills * erosion + ridges + rocks + micro;
    
    // Calculate normals with full detail
    float heightL = fbm((p - vec2(offset, 0.0)) * 0.05) * 8.0
                  + fbm((p - vec2(offset, 0.0)) * 0.15) * 2.5
                  + fbm((p - vec2(offset, 0.0)) * 0.4) * 0.8
                  + fbm((p - vec2(offset, 0.0)) * 1.5) * 0.2;
    float heightR = fbm((p + vec2(offset, 0.0)) * 0.05) * 8.0
                  + fbm((p + vec2(offset, 0.0)) * 0.15) * 2.5
                  + fbm((p + vec2(offset, 0.0)) * 0.4) * 0.8
                  + fbm((p + vec2(offset, 0.0)) * 1.5) * 0.2;
    float heightD = fbm((p - vec2(0.0, offset)) * 0.05) * 8.0
                  + fbm((p - vec2(0.0, offset)) * 0.15) * 2.5
                  + fbm((p - vec2(0.0, offset)) * 0.4) * 0.8
                  + fbm((p - vec2(0.0, offset)) * 1.5) * 0.2;
    float heightU = fbm((p + vec2(0.0, offset)) * 0.05) * 8.0
                  + fbm((p + vec2(0.0, offset)) * 0.15) * 2.5
                  + fbm((p + vec2(0.0, offset)) * 0.4) * 0.8
                  + fbm((p + vec2(0.0, offset)) * 1.5) * 0.2;
    
    vec3 newPosition = position;
    newPosition.z += displacement;
    
    vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    vec3 tangentX = vec3(offset * 2.0, 0.0, heightR - heightL);
    vec3 tangentY = vec3(0.0, offset * 2.0, heightU - heightD);
    vNormal = normalize(cross(tangentY, tangentX));
    
    // Calculate slope for texture blending
    vSlope = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    
    vElevation = displacement;
    vUv = position.xy * 0.1;
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
  `,
  // Fragment Shader
  `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vSlope;
  
  ${noiseGLSL}
  
  void main() {
    vec3 lightDir = normalize(vec3(0.4, 0.3, 0.8));
    
    // Diffuse lighting with softer falloff
    float diffuse = max(dot(vNormal, lightDir), 0.0);
    float wrapped = (diffuse + 0.5) / 1.5;
    
    // Ambient occlusion based on height and slope
    float ao = smoothstep(-2.0, 8.0, vElevation) * 0.5 + 0.5;
    float slopeAO = pow(vSlope, 0.5);
    ao *= slopeAO * 0.5 + 0.5;
    
    // Terrain texturing with realistic color variation
    vec3 grassDark = vec3(0.12, 0.18, 0.08);
    vec3 grassLight = vec3(0.25, 0.35, 0.15);
    vec3 rock = vec3(0.35, 0.32, 0.28);
    vec3 rockDark = vec3(0.18, 0.16, 0.14);
    vec3 snow = vec3(0.85, 0.87, 0.9);
    vec3 dirt = vec3(0.28, 0.22, 0.16);
    
    // Add noise-based texture variation
    float textureNoise = snoise(vUv * 20.0) * 0.5 + 0.5;
    vec3 grass = mix(grassDark, grassLight, textureNoise);
    
    // Elevation zones with realistic transitions
    vec3 baseColor;
    float e = vElevation;
    
    if (e < 0.0) {
      baseColor = mix(dirt, grass, smoothstep(-1.0, 0.5, e));
    } else if (e < 2.0) {
      baseColor = grass;
    } else if (e < 4.0) {
      float t = smoothstep(2.0, 4.0, e);
      baseColor = mix(grass, rock, t);
    } else if (e < 6.0) {
      baseColor = mix(rock, rockDark, (e - 4.0) / 2.0);
    } else if (e < 7.5) {
      float t = smoothstep(6.0, 7.5, e);
      baseColor = mix(rockDark, snow, t);
    } else {
      baseColor = snow;
    }
    
    // Slope-based texturing (steep = rock)
    float steepness = 1.0 - vSlope;
    if (steepness > 0.4 && e > 1.0) {
      float rockBlend = smoothstep(0.4, 0.7, steepness);
      baseColor = mix(baseColor, rock, rockBlend * 0.8);
    }
    
    // Add micro detail
    float detail = snoise(vWorldPosition.xy * 3.0) * 0.03;
    baseColor += detail;
    
    // Apply lighting
    vec3 ambient = vec3(0.4, 0.45, 0.5) * 0.3;
    vec3 finalColor = baseColor * (wrapped * 0.7 + 0.3) * ao + ambient * baseColor;
    
    // Atmospheric perspective (distant mountains fade to blue)
    float distance = length(vWorldPosition.xy);
    vec3 fogColor = vec3(0.6, 0.7, 0.8);
    float fogFactor = smoothstep(0.0, 25.0, distance);
    finalColor = mix(finalColor, fogColor, fogFactor * 0.4);
    
    // Rim lighting on peaks
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float rim = 1.0 - max(dot(viewDir, vNormal), 0.0);
    rim = smoothstep(0.6, 1.0, rim);
    if (e > 5.0) {
      finalColor += vec3(0.8, 0.85, 0.9) * rim * 0.2;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
  `,
);

extend({ WaterMaterial, MountainMaterial });

interface TerrainProps {
  type: "water" | "mountain";
}

export function Terrain({ type }: TerrainProps) {
  const materialRef = useRef<any>();

  useFrame((state, delta) => {
    if (materialRef.current) {
      if (type === "water") {
        materialRef.current.uTime += delta * 0.5;
      }
      materialRef.current.uCameraPosition.copy(state.camera.position);
    }
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[25, 25, 256, 256]} />
      {type === "water" ? (
        // @ts-ignore
        <waterMaterial ref={materialRef} side={THREE.DoubleSide} />
      ) : (
        // @ts-ignore
        <mountainMaterial ref={materialRef} side={THREE.DoubleSide} />
      )}
    </mesh>
  );
}
