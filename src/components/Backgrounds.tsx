import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useShipStore } from '../store/shipStore';

// --- NEBULA SHADER & COMPONENT ---
const NebulaShader = {
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vPosition;

    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(in vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float n = p.x + p.y * 157.0 + 113.0 * p.z;
      return mix(
        mix(mix(hash(n + 0.0),   hash(n + 1.0),   f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
      );
    }

    float fbm(in vec3 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = p * 2.01;
      f += 0.2500 * noise(p); p = p * 2.02;
      f += 0.1250 * noise(p); p = p * 2.03;
      f += 0.0625 * noise(p);
      return f;
    }

    void main() {
      vec3 dir = normalize(vPosition);
      vec3 p = dir * 2.8 + vec3(1.2, 3.4, 5.6);
      
      float n1 = fbm(p);
      float n2 = fbm(p + vec3(4.5, 2.1, 7.8));
      
      vec3 colorBg = vec3(0.015, 0.012, 0.03);
      vec3 colorNebula1 = vec3(0.3, 0.06, 0.5);
      vec3 colorNebula2 = vec3(0.04, 0.32, 0.45);
      
      vec3 finalColor = mix(colorBg, colorNebula1, n1);
      finalColor = mix(finalColor, colorNebula2, n2 * 0.65);
      
      float glow = smoothstep(0.55, 0.85, n1 * n2);
      finalColor += vec3(0.75, 0.55, 1.0) * glow * 0.4;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function Nebula() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  return (
    <mesh>
      <sphereGeometry args={[400, 32, 32]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={NebulaShader.vertexShader}
        fragmentShader={NebulaShader.fragmentShader}
      />
    </mesh>
  );
}

// --- PLANET SHADER & COMPONENT ---
const PlanetShader = {
  uniforms: {
    uLightDir: { value: new THREE.Vector3(20, 5, -7).normalize() },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec3 vWorldNormal;
    varying vec3 vLocalPosition;
    varying vec3 vViewDir;
    varying vec3 vLocalViewDir;
    void main() {
      vLocalPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
      vViewDir = cameraPosition - worldPos.xyz;
      
      // Calculate local view direction (using camera position relative to planet center)
      vec3 localCameraPos = cameraPosition - vec3(-150.0, -40.0, -220.0);
      vLocalViewDir = normalize(position - localCameraPos);
      
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform vec3 uLightDir;
    uniform float uTime;
    varying vec3 vWorldNormal;
    varying vec3 vLocalPosition;
    varying vec3 vViewDir;
    varying vec3 vLocalViewDir;

    float hash(float n) { return fract(sin(n) * 43758.5453123); }
    float noise(in vec3 x) {
      vec3 p = floor(x);
      vec3 f = fract(x);
      f = f * f * (3.0 - 2.0 * f);
      float n = p.x + p.y * 157.0 + 113.0 * p.z;
      return mix(
        mix(mix(hash(n + 0.0),   hash(n + 1.0),   f.x),
            mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
        mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
            mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
      );
    }

    float fbm(in vec3 p) {
      float f = 0.0;
      f += 0.5000 * noise(p); p = p * 2.01;
      f += 0.2500 * noise(p); p = p * 2.02;
      f += 0.1250 * noise(p); p = p * 2.03;
      f += 0.0625 * noise(p);
      return f;
    }

    void main() {
      vec3 normal = normalize(vWorldNormal);
      vec3 viewDir = normalize(vViewDir);
      vec3 lightDir = normalize(uLightDir);
      
      float ndl = dot(normal, lightDir);
      
      // Shift coordinates to strictly positive space to prevent negative noise boundary dropouts
      vec3 localPosShifted = vLocalPosition + vec3(250.0);
      vec3 p = localPosShifted * 0.025;
      
      float terrain = fbm(p);
      float landThreshold = 0.46;
      
      vec3 oceanColor = vec3(0.02, 0.08, 0.3);
      vec3 shallowOceanColor = vec3(0.04, 0.16, 0.4);
      vec3 landColorGreen = vec3(0.08, 0.24, 0.1);
      vec3 landColorBrown = vec3(0.24, 0.18, 0.12);
      vec3 landColorSand = vec3(0.42, 0.38, 0.28);
      
      vec3 surfaceColor;
      if (terrain < landThreshold) {
        float oceanDepth = terrain / landThreshold;
        surfaceColor = mix(oceanColor, shallowOceanColor, oceanDepth);
      } else {
        float landHeight = (terrain - landThreshold) / (1.0 - landThreshold);
        if (landHeight < 0.1) {
          surfaceColor = mix(landColorSand, landColorGreen, landHeight * 10.0);
        } else {
          surfaceColor = mix(landColorGreen, landColorBrown, (landHeight - 0.1) * 1.11);
        }
      }
      
      // Parallax-shift local coordinates along view direction to make clouds appear elevated
      vec3 cloudLocalPos = vLocalPosition - normalize(vLocalViewDir) * 7.5; // 7.5 units height
      
      // Procedural clouds
      vec3 cloudCoord = (cloudLocalPos + vec3(250.0)) * 0.031;
      float clouds = smoothstep(0.45, 0.68, fbm(cloudCoord));
      surfaceColor = mix(surfaceColor, vec3(0.85, 0.85, 0.9), clouds);
      
      // Day side diffuse shading with very low night-side ambient light leakage (0.01)
      float diffuse = max(0.0, ndl);
      vec3 dayColor = surfaceColor * (diffuse * 0.99 + 0.01);
      
      // Night side city lights (appear only on land, obscured and scattered by clouds)
      float landMask = step(landThreshold, terrain);
      vec3 cityCoord = localPosShifted * 0.22;
      float cityLightsNoise = smoothstep(0.58, 0.78, noise(cityCoord)) * smoothstep(0.55, 0.72, noise(cityCoord * 3.5));
      
      // Direct city lights are obscured by thick clouds
      float directLights = cityLightsNoise * (1.0 - clouds);
      
      // Light scattered and diffused in the cloud layer (clouds glow above city regions)
      float cityArea = smoothstep(0.5, 0.8, noise(cityCoord));
      float diffusedGlow = cityArea * clouds * 0.45;
      
      vec3 nightColor = vec3(1.0, 0.72, 0.3) * (directLights + diffusedGlow) * landMask;
      
      // Smooth gradient mix between night lights and day lighting at terminator
      vec3 finalColor = mix(nightColor, dayColor, smoothstep(-0.08, 0.08, ndl));
      
      // Aurora Borealis at the North Pole
      vec3 localNormal = normalize(vLocalPosition);
      float lat = localNormal.y;
      float angle = atan(vLocalPosition.z, vLocalPosition.x);
      
      // Organic waving motion using FBM noise over time
      vec3 auroraNoiseCoord1 = vec3(angle * 2.5 + uTime * 0.12, lat * 12.0 - uTime * 0.06, uTime * 0.05);
      vec3 auroraNoiseCoord2 = vec3(angle * 6.0 - uTime * 0.16, lat * 24.0 + uTime * 0.12, uTime * 0.08);
      
      float na = fbm(auroraNoiseCoord1);
      float nb = fbm(auroraNoiseCoord2);
      
      // Perturb latitude boundary to make the aurora curtains wiggle
      float latPerturb = lat + (na - 0.5) * 0.06 + (nb - 0.5) * 0.02;
      
      // Smooth ring band centered around latitude 0.72 to 0.88
      float auroraRing = smoothstep(0.72, 0.78, latPerturb) * smoothstep(0.91, 0.84, latPerturb);
      
      // Vertical curtains (high-frequency rays) along the longitude
      float rayNoise = fbm(vec3(angle * 20.0 + uTime * 0.2, lat * 6.0 - uTime * 0.08, uTime * 0.04));
      float curtains = smoothstep(0.3, 0.75, rayNoise);
      
      // Combine components for the final intensity
      float auroraIntensity = auroraRing * (0.25 + 0.75 * curtains);
      
      // Gradient: vibrant green at the bottom (lower latitude) to electric purple/pink at the top (higher latitude)
      float colorT = smoothstep(0.74, 0.88, latPerturb);
      vec3 greenColor = vec3(0.02, 0.95, 0.3);
      vec3 purpleColor = vec3(0.6, 0.05, 0.85);
      vec3 auroraColor = mix(greenColor, purpleColor, colorT);
      
      // Fade out on the sunlit side of the planet
      float auroraNightMask = smoothstep(0.18, -0.08, ndl);
      vec3 auroraGlow = auroraColor * auroraIntensity * auroraNightMask * 1.2;
      
      finalColor += auroraGlow;
      
      // Fresnel glow on the surface itself
      float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 4.0);
      vec3 atmosphereColor = vec3(0.3, 0.6, 1.0) * fresnel * smoothstep(-0.2, 0.1, ndl + 0.1);
      
      // Blend atmospheric glow with aurora green/purple at the poles
      float auroraAtmosphereMask = smoothstep(0.68, 0.86, lat) * auroraNightMask;
      vec3 finalAtmosphereColor = mix(atmosphereColor, auroraColor * fresnel * 1.1, auroraAtmosphereMask * 0.45);
      
      finalColor += finalAtmosphereColor * 1.3;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export function Planet() {
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);
  const potatoMode = useShipStore(s => s.potatoMode);

  const uniforms = useMemo(() => ({
    uLightDir: { value: new THREE.Vector3(20, 5, -7).normalize() },
    uTime: { value: 0 }
  }), []);

  useFrame((state) => {
    // 1. Slow Y-axis rotation
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += 0.0003;
      
      // Update time uniform for planet shader using ref to avoid React Hook lint rules on mutating memoized values
      const planetMat = planetMeshRef.current.material as THREE.ShaderMaterial;
      if (planetMat && planetMat.uniforms && planetMat.uniforms.uTime) {
        planetMat.uniforms.uTime.value = state.clock.getElapsedTime();
      }
    }

    // Update time uniform for halo shader
    if (haloMeshRef.current) {
      const haloMat = haloMeshRef.current.material as THREE.ShaderMaterial;
      if (haloMat && haloMat.uniforms && haloMat.uniforms.uTime) {
        haloMat.uniforms.uTime.value = state.clock.getElapsedTime();
      }
    }

    // 2. Drive the continuous animation loop only if not in potatoMode
    if (!potatoMode) {
      state.invalidate();
    }
  });
  
  return (
    <group>
      {/* Atmospheric Halo Glow (Additive outer ring) */}
      <mesh ref={haloMeshRef} position={[-150, -40, -220]}>
        <sphereGeometry args={[123.5, 32, 32]} />
        <shaderMaterial
          side={THREE.FrontSide}
          transparent
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec3 vWorldNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              vViewDir = normalize(-mvPosition.xyz);
              vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vNormal;
            varying vec3 vViewDir;
            varying vec3 vWorldNormal;
            uniform vec3 uLightDir;
            uniform float uTime;

            float hash(float n) { return fract(sin(n) * 43758.5453123); }
            float noise(in vec3 x) {
              vec3 p = floor(x);
              vec3 f = fract(x);
              f = f * f * (3.0 - 2.0 * f);
              float n = p.x + p.y * 157.0 + 113.0 * p.z;
              return mix(
                mix(mix(hash(n + 0.0),   hash(n + 1.0),   f.x),
                    mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
                mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                    mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z
              );
            }

            void main() {
              float dotProduct = max(0.0, dot(vNormal, vViewDir));
              
              // Soft atmospheric edge
              float intensity = smoothstep(0.0, 0.22, dotProduct) * pow(1.0 - dotProduct, 2.5);
              
              // Only illuminate the day side of the atmosphere
              vec3 normal = normalize(vWorldNormal);
              float ndl = dot(normal, normalize(uLightDir));
              float sunlit = smoothstep(-0.2, 0.25, ndl);
              
              vec3 baseGlowColor = vec3(0.25, 0.55, 1.0) * intensity * sunlit * 2.0;
              
              // Polar aurora glow in the outer halo (near north pole, i.e., normal.y > 0.6)
              float polarMask = smoothstep(0.68, 0.88, normal.y);
              float auroraNightMask = smoothstep(0.25, -0.1, ndl);
              
              // Wavy movement matching the aurora time
              float angle = atan(normal.z, normal.x);
              float wave = noise(vec3(angle * 5.0 + uTime * 0.1, normal.y * 10.0, uTime * 0.08));
              float auroraIntensity = polarMask * auroraNightMask * (0.3 + 0.7 * wave);
              
              // Green/purple gradient for outer aurora halo
              vec3 auroraColor = mix(vec3(0.05, 0.95, 0.3), vec3(0.6, 0.1, 0.9), smoothstep(0.7, 0.9, normal.y));
              
              // Add the aurora emission to the halo glow
              vec3 finalGlow = baseGlowColor + auroraColor * auroraIntensity * intensity * 1.8;
              
              // Add opacity contribution from aurora
              float finalAlpha = max(intensity * sunlit * 0.55, auroraIntensity * intensity * 0.4);
              
              gl_FragColor = vec4(finalGlow, finalAlpha);
            }
          `}
        />
      </mesh>

      {/* Main Planet Sphere */}
      <mesh ref={planetMeshRef} position={[-150, -40, -220]}>
        <sphereGeometry args={[120, 48, 48]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={PlanetShader.vertexShader}
          fragmentShader={PlanetShader.fragmentShader}
        />
      </mesh>
    </group>
  );
}

// --- HANGAR BAY COMPONENT ---
export function HangarBay() {
  const pillarColor = '#1e2128';
  const neonColor = '#ff6c00';
  
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#111317" metalness={0.8} roughness={0.4} />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[62, 62]} />
        <shaderMaterial
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying vec2 vUv;
            void main() {
              float border = 0.03;
              bool isBorder = vUv.x < border || vUv.x > 1.0 - border || vUv.y < border || vUv.y > 1.0 - border;
              if (!isBorder) {
                discard;
              }
              float value = fract((vUv.x + vUv.y) * 40.0);
              vec3 stripeColor = value < 0.5 ? vec3(0.08, 0.08, 0.08) : vec3(0.9, 0.65, 0.0);
              gl_FragColor = vec4(stripeColor, 1.0);
            }
          `}
        />
      </mesh>

      {[
        [-32, -32],
        [32, -32],
        [-32, 32],
        [32, 32]
      ].map(([x, z], i) => (
        <group key={i}>
          <mesh position={[x, 15, z]}>
            <boxGeometry args={[2, 30, 2]} />
            <meshStandardMaterial color={pillarColor} metalness={0.7} roughness={0.5} />
          </mesh>
          <mesh position={[x + (x > 0 ? -1.05 : 1.05), 15, z + (z > 0 ? -1.05 : 1.05)]}>
            <boxGeometry args={[0.1, 28, 0.1]} />
            <meshBasicMaterial color={neonColor} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 30, -32]}>
        <boxGeometry args={[64, 2, 2]} />
        <meshStandardMaterial color={pillarColor} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[0, 30, 32]}>
        <boxGeometry args={[64, 2, 2]} />
        <meshStandardMaterial color={pillarColor} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[-32, 30, 0]}>
        <boxGeometry args={[2, 2, 64]} />
        <meshStandardMaterial color={pillarColor} metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position={[32, 30, 0]}>
        <boxGeometry args={[2, 2, 64]} />
        <meshStandardMaterial color={pillarColor} metalness={0.7} roughness={0.5} />
      </mesh>

      <mesh position={[0, 29, -32]}>
        <boxGeometry args={[62, 0.1, 0.1]} />
        <meshBasicMaterial color={neonColor} />
      </mesh>
      <mesh position={[0, 29, 32]}>
        <boxGeometry args={[62, 0.1, 0.1]} />
        <meshBasicMaterial color={neonColor} />
      </mesh>
    </group>
  );
}
