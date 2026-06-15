import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, Box, Edges } from '@react-three/drei';
import { useShipStore, getBlockBounds } from '../store/shipStore';
import { Block } from './Block';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import * as THREE from 'three';

export function Scene() {
  const blocks = useShipStore(s => s.blocks);
  const activeTool = useShipStore(s => s.activeTool);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const movingBlock = useShipStore(s => s.movingBlock);

  const addBlock = useShipStore(s => s.addBlock);
  const removeBlock = useShipStore(s => s.removeBlock);
  const checkCollision = useShipStore(s => s.checkCollision);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);
  const placeMovingBlock = useShipStore(s => s.placeMovingBlock);
  const cancelMoveBlock = useShipStore(s => s.cancelMoveBlock);
  const nudgeBlock = useShipStore(s => s.nudgeBlock);
  const rotateBlock = useShipStore(s => s.rotateBlock);

  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [prevMovingBlockId, setPrevMovingBlockId] = useState<string | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  // Sync rotation state when block is picked up
  if (movingBlock && movingBlock.id !== prevMovingBlockId) {
    setPrevMovingBlockId(movingBlock.id);
    setRotation(movingBlock.rotation);
  } else if (!movingBlock && prevMovingBlockId !== null) {
    setPrevMovingBlockId(null);
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Esc to cancel moving or deselect
      if (e.key === 'Escape') {
        if (movingBlock) {
          cancelMoveBlock();
        } else if (selectedBlockId) {
          setSelectedBlockId(null);
        }
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const key = e.key.toLowerCase();

      // Rotation
      if (key === 'r') {
        if (selectedBlockId && !movingBlock) {
          rotateBlock(selectedBlockId, 'y');
        } else {
          setRotation(prev => [prev[0], (prev[1] + Math.PI / 2) % (Math.PI * 2), prev[2]]);
        }
      } else if (key === 'x') {
        if (selectedBlockId && !movingBlock) {
          rotateBlock(selectedBlockId, 'x');
        } else {
          setRotation(prev => [(prev[0] + Math.PI / 2) % (Math.PI * 2), prev[1], prev[2]]);
        }
      } else if (key === 'z') {
        if (selectedBlockId && !movingBlock) {
          rotateBlock(selectedBlockId, 'z');
        } else {
          setRotation(prev => [prev[0], prev[1], (prev[2] + Math.PI / 2) % (Math.PI * 2)]);
        }
      }

      // S key switches to Select Mode
      if (key === 's') {
        setActiveTool('select');
        setSelectedBlockId(null);
      }

      // Move Block (Pick Up)
      if (key === 'm' && selectedBlockId && !movingBlock) {
        startMoveBlock(selectedBlockId);
      }

      // Delete Block
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && !movingBlock) {
        removeBlock(selectedBlockId);
      }

      // Nudging
      if (selectedBlockId && !movingBlock) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          nudgeBlock(selectedBlockId, [-1, 0, 0]);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nudgeBlock(selectedBlockId, [1, 0, 0]);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (e.shiftKey) {
            nudgeBlock(selectedBlockId, [0, 1, 0]);
          } else {
            nudgeBlock(selectedBlockId, [0, 0, -1]);
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (e.shiftKey) {
            nudgeBlock(selectedBlockId, [0, -1, 0]);
          } else {
            nudgeBlock(selectedBlockId, [0, 0, 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedBlockId,
    movingBlock,
    setActiveTool,
    startMoveBlock,
    cancelMoveBlock,
    setSelectedBlockId,
    removeBlock,
    nudgeBlock,
    rotateBlock
  ]);

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const point = e.point.clone();
    
    // Convert local normal to world normal if it exists
    let normal = new THREE.Vector3(0, 1, 0);
    if (e.face?.normal) {
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
        normal = e.face.normal.clone().applyMatrix3(normalMatrix).normalize();
    }
    
    // Add a tiny bit of the normal to the hit point to ensure we pick the adjacent cell
    const hitPoint = point.add(normal.multiplyScalar(0.1));
    const cx = Math.floor(hitPoint.x);
    const cy = Math.max(0, Math.floor(hitPoint.y));
    const cz = Math.floor(hitPoint.z);

    setCursorPos([cx, cy, cz]);
  };

  const onPointerOut = () => {
    setCursorPos(null);
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    };
  };

  const ghostType = movingBlock ? movingBlock.type : activeTool;
  const def = BLOCK_DEFINITIONS[ghostType];

  // Dynamically derive the centered anchor position of the block under rotation
  let hoverPos: [number, number, number] | null = null;
  if (cursorPos) {
    if (def) {
      const currentRotBounds = getBlockBounds(ghostType, [0, 0, 0], rotation);
      const sizeX = currentRotBounds.maxX - currentRotBounds.minX;
      const sizeZ = currentRotBounds.maxZ - currentRotBounds.minZ;
      hoverPos = [
        cursorPos[0] - Math.floor(sizeX / 2),
        cursorPos[1],
        cursorPos[2] - Math.floor(sizeZ / 2),
      ];
    } else {
      hoverPos = cursorPos;
    }
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.button === 2) return; // Handled by cancelMoveBlock or delete
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

    if (hoverPos) {
      if (movingBlock) {
        placeMovingBlock(hoverPos, rotation);
      } else if (activeTool !== 'select') {
        addBlock(activeTool, hoverPos, rotation);
      } else {
        setSelectedBlockId(null);
      }
    }
  };

  const onContextMenu = (e: ThreeEvent<MouseEvent>) => {
    e.nativeEvent.preventDefault();
    if (movingBlock) {
      e.stopPropagation();
      cancelMoveBlock();
    }
  };

  const isInvalid = hoverPos && def ? checkCollision(ghostType, hoverPos, rotation) : false;

  return (
    <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
      <Sky sunPosition={[100, 20, 100]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
      <Environment preset="city" />

      <group 
        onPointerDown={onPointerDown} 
        onPointerMove={onPointerMove} 
        onPointerOut={onPointerOut} 
        onClick={onClick}
        onContextMenu={onContextMenu}
      >
        {/* Base plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Placed Blocks */}
        {blocks.map(b => (
          <Block key={b.id} {...b} />
        ))}
      </group>

      {/* Ghost Block */}
      {hoverPos && def && (
        <group position={hoverPos} rotation={rotation}>
          <Box args={def.dimensions} position={[def.dimensions[0] / 2, def.dimensions[1] / 2, def.dimensions[2] / 2]}>
            <meshStandardMaterial color={isInvalid ? '#ff0000' : def.color} transparent opacity={0.6} />
            <Edges color={isInvalid ? 'red' : 'white'} />
          </Box>
        </group>
      )}

      {/* Grid */}
      <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#888" />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
