import { useRef } from 'react';
import { Box, Edges } from '@react-three/drei';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import { useShipStore } from '../store/shipStore';
import type { ThreeEvent } from '@react-three/fiber';

interface BlockProps {
  id?: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export function Block({ id, type, position, rotation }: BlockProps) {
  const def = BLOCK_DEFINITIONS[type];
  const removeBlock = useShipStore(s => s.removeBlock);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const activeTool = useShipStore(s => s.activeTool);
  const movingBlock = useShipStore(s => s.movingBlock);

  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  if (!def) return null;

  const [w, h, d] = def.dimensions;
  const isSelected = selectedBlockId === id;

  return (
    <group position={position} rotation={rotation}>
      <Box 
        args={[w, h, d]} 
        position={[w / 2, h / 2, d / 2]}
        userData={{ blockId: id }}
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
            if (activeTool === 'select' && id && !movingBlock) {
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
        <meshStandardMaterial color={def.color} />
        <Edges color={isSelected ? '#ffaa00' : 'black'} />
      </Box>

      {isSelected && (
        <Box args={[w + 0.05, h + 0.05, d + 0.05]} position={[w / 2, h / 2, d / 2]}>
          <meshBasicMaterial visible={false} />
          <Edges color="#ffaa00" scale={1.01} />
        </Box>
      )}
    </group>
  );
}
