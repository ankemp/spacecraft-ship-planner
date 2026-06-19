import { useRef, useState, useEffect, memo } from 'react';
import { Edges } from '@react-three/drei';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import { useShipStore } from '../store/shipStore';
import { BlockGeometry } from './BlockGeometry';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface BlockProps {
  id?: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  shape?: string;
  flipX?: boolean;
  flipY?: boolean;
  flipZ?: boolean;
  // Derived in Scene.tsx from (activeTool === 'select' && !movingBlock).
  // Passed as a prop so Block doesn't need its own store subscriptions for
  // activeTool / movingBlock, avoiding N re-renders per tool change.
  canInteract?: boolean;
  // bounds is part of BlockInstance but not needed for rendering
  bounds?: unknown;
}

export const Block = memo(function Block({ id, type, position, rotation, color, shape, flipX, flipY, flipZ, canInteract = false }: BlockProps) {
  const def = BLOCK_DEFINITIONS[type];
  const removeBlock = useShipStore(s => s.removeBlock);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);

  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // canHover is now driven by the prop passed from Scene, not from the store
  const canHover = canInteract;

  useEffect(() => {
    if (!canHover) {
      setIsHovered(false);
    }
  }, [canHover]);

  useEffect(() => {
    if (isHovered && canHover) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [isHovered, canHover]);

  if (!def) return null;

  const [w, h, d] = def.dimensions;
  const isSelected = selectedBlockId === id;

  return (
    <group position={position} rotation={rotation}>
      <mesh 
        userData={{ blockId: id }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          if (canHover) {
            e.stopPropagation();
            setIsHovered(true);
          }
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          if (canHover) {
            e.stopPropagation();
            setIsHovered(false);
          }
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          pointerDownRef.current = {
            x: e.nativeEvent.clientX,
            y: e.nativeEvent.clientY,
          };
        }}
        onContextMenu={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          e.nativeEvent.preventDefault();
          if (pointerDownRef.current) {
            const dx = e.nativeEvent.clientX - pointerDownRef.current.x;
            const dy = e.nativeEvent.clientY - pointerDownRef.current.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            pointerDownRef.current = null;
            if (distance > 5) return;
          } else {
            return;
          }
          if (id) removeBlock(id);
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (e.button === 2) {
            e.stopPropagation();
            if (pointerDownRef.current) {
              const dx = e.nativeEvent.clientX - pointerDownRef.current.x;
              const dy = e.nativeEvent.clientY - pointerDownRef.current.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              pointerDownRef.current = null;
              if (distance > 5) return;
            } else {
              return;
            }
            if (id) removeBlock(id);
          } else if (e.button === 0) {
            if (canInteract && id) {
              e.stopPropagation();
              if (pointerDownRef.current) {
                const dx = e.nativeEvent.clientX - pointerDownRef.current.x;
                const dy = e.nativeEvent.clientY - pointerDownRef.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                pointerDownRef.current = null;
                if (distance > 5) return;
              } else {
                return;
              }
              setSelectedBlockId(id);
            }
          }
        }}
      >
        <BlockGeometry shape={shape} w={w} h={h} d={d} flipX={flipX} flipY={flipY} flipZ={flipZ} />
        <meshStandardMaterial color={color || def.color} side={THREE.DoubleSide} />
        <Edges color={isSelected ? '#ffaa00' : (isHovered ? '#3b82f6' : 'black')} />
      </mesh>
 
      {isSelected && (
        <mesh raycast={() => null} position={[-0.025, -0.025, -0.025]}>
          <BlockGeometry shape={shape} w={w + 0.05} h={h + 0.05} d={d + 0.05} flipX={flipX} flipY={flipY} flipZ={flipZ} />
          <meshBasicMaterial visible={false} />
          <Edges color="#ffaa00" scale={1.01} />
        </mesh>
      )}
 
      {!isSelected && isHovered && (
        <mesh raycast={() => null} position={[-0.025, -0.025, -0.025]}>
          <BlockGeometry shape={shape} w={w + 0.05} h={h + 0.05} d={d + 0.05} flipX={flipX} flipY={flipY} flipZ={flipZ} />
          <meshBasicMaterial visible={false} />
          <Edges color="#3b82f6" scale={1.01} />
        </mesh>
      )}
    </group>
  );
});
