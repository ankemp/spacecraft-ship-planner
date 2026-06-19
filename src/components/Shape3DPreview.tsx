import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { BlockGeometry } from './BlockGeometry';
import { useShipStore } from '../store/shipStore';
import * as THREE from 'three';

interface Shape3DPreviewProps {
  shapeId: string;
  color?: string;
  className?: string;
  isHovered?: boolean;
  anyHovered?: boolean;
  mouseX?: number;
  mouseY?: number;
  disableRotation?: boolean;
  dimensions?: [number, number, number];
}

function PreviewMesh({
  shapeId,
  color,
  isHovered,
  anyHovered = false,
  localMouseRef,
  mouseX,
  mouseY,
  disableRotation = false,
  dimensions = [4, 2, 3]
}: {
  shapeId: string;
  color: string;
  isHovered: boolean;
  anyHovered?: boolean;
  localMouseRef: React.RefObject<{ x: number; y: number }>;
  mouseX?: number;
  mouseY?: number;
  disableRotation?: boolean;
  dimensions?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spinAngleRef = useRef(0);
  const freezeAngleRef = useRef(0);
  const wasAnyHoveredRef = useRef(false);
  const wasHoveredRef = useRef(false);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      if (disableRotation) {
        groupRef.current.rotation.x = 0;
        groupRef.current.rotation.y = 0;
        return;
      }
      
      // Cap delta to prevent massive jumps/catchup speeds when returning from hidden tabs/minimization
      const cappedDelta = Math.min(delta, 0.1);

      // Capture freeze angle at the exact moment hover starts
      if (anyHovered && !wasAnyHoveredRef.current) {
        freezeAngleRef.current = groupRef.current.rotation.y;
      }
      
      // Flick back immediately when hovering this card stops
      if (!isHovered && wasHoveredRef.current) {
        groupRef.current.rotation.y = freezeAngleRef.current;
        groupRef.current.rotation.x = 0;
        spinAngleRef.current = freezeAngleRef.current;
      }

      if (isHovered) {
        const x = mouseX !== undefined ? mouseX : localMouseRef.current.x;
        const y = mouseY !== undefined ? mouseY : localMouseRef.current.y;
        // Hover state: follow mouse relative to the freeze angle
        const targetRotX = y * Math.PI * 0.45;
        const targetRotY = freezeAngleRef.current + x * Math.PI * 0.65;

        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 10 * cappedDelta);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 10 * cappedDelta);
      } else if (anyHovered) {
        // Someone else is hovered: freeze exactly at freeze angle
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 10 * cappedDelta);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, freezeAngleRef.current, 10 * cappedDelta);
      } else {
        // Idle/Nobody hovered: spin in circles
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 10 * cappedDelta);
        
        // Spin Y-rotation continuously (1.2 radians per second)
        spinAngleRef.current += 1.2 * cappedDelta;
        
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, spinAngleRef.current, 10 * cappedDelta);
      }

      wasAnyHoveredRef.current = anyHovered;
      wasHoveredRef.current = isHovered;
    }
  });

  const [w, h, d] = dimensions;
  const scale = 1.3 / Math.max(w, h, d);

  return (
    <group ref={groupRef} scale={scale}>
      <mesh position={[-w / 2, -h / 2, -d / 2]}>
        <BlockGeometry shape={shapeId} w={w} h={h} d={d} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
        <Edges color="#111" />
      </mesh>
    </group>
  );
}

function Shape2DPreview({ shapeId, color, className }: { shapeId: string; color: string; className?: string }) {
  const path =
    shapeId === 'slope'
      ? 'M 6,26 L 26,26 L 26,6 Z'
      : shapeId === 'slope_flat'
      ? 'M 6,26 L 26,26 L 26,6 L 16,6 Z'
      : 'M 6,26 L 26,26 L 26,6 L 6,6 Z';

  return (
    <div className={`${className} flex items-center justify-center p-0.5`}>
      <svg viewBox="0 0 32 32" className="w-full h-full max-w-full max-h-full" style={{ aspectRatio: '1/1' }}>
        <path d={path} fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Shape3DPreview({
  shapeId,
  color = '#909090',
  className = "w-full h-10",
  isHovered: controlledIsHovered,
  anyHovered = false,
  mouseX,
  mouseY,
  disableRotation = false,
  dimensions
}: Shape3DPreviewProps) {
  const potatoMode = useShipStore(s => s.potatoMode);
  const [localIsHovered, setLocalIsHovered] = useState(false);
  const isHovered = controlledIsHovered !== undefined ? controlledIsHovered : localIsHovered;
  const isControlled = controlledIsHovered !== undefined;
  
  const localMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mouseX === undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      localMouseRef.current = { x, y };
    }
  };

  const handleMouseLeave = () => {
    setLocalIsHovered(false);
    localMouseRef.current = { x: 0, y: 0 };
  };

  if (potatoMode) {
    return <Shape2DPreview shapeId={shapeId} color={color} className={className} />;
  }

  return (
    <div 
      className={className} 
      onMouseEnter={() => setLocalIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={isControlled ? { pointerEvents: 'none' } : undefined}
    >
      <Canvas
        orthographic
        camera={{ position: [2.5, 2, 2.5], zoom: 14 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <PreviewMesh
          shapeId={shapeId}
          color={color}
          isHovered={isHovered}
          anyHovered={anyHovered}
          localMouseRef={localMouseRef}
          mouseX={mouseX}
          mouseY={mouseY}
          disableRotation={disableRotation}
          dimensions={dimensions}
        />
      </Canvas>
    </div>
  );
}
