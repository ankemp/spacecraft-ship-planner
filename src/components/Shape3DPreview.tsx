import { Canvas } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { BlockGeometry } from './BlockGeometry';

interface Shape3DPreviewProps {
  shapeId: string;
  color?: string;
  className?: string;
}

export function Shape3DPreview({ shapeId, color = '#909090', className = "w-full h-10" }: Shape3DPreviewProps) {
  return (
    <div className={className} style={{ pointerEvents: 'none' }}>
      <Canvas
        orthographic
        camera={{ position: [2.5, 2, 2.5], zoom: 14 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <mesh position={[-0.5, -0.5, -0.5]}>
          <BlockGeometry shape={shapeId} w={1} h={1} d={1} />
          <meshStandardMaterial color={color} />
          <Edges color="#111" />
        </mesh>
      </Canvas>
    </div>
  );
}
