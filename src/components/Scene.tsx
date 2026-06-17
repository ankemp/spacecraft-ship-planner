import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, Edges } from '@react-three/drei';
import { useShipStore, getBlockBounds } from '../store/shipStore';
import { Block } from './Block';
import { BlockGeometry } from './BlockGeometry';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import * as THREE from 'three';

interface KeyboardHandlerProps {
  setRotation: React.Dispatch<React.SetStateAction<[number, number, number]>>;
}

function KeyboardHandler({ setRotation }: KeyboardHandlerProps) {
  const { camera } = useThree();

  const blocks = useShipStore(s => s.blocks);
  const activeTool = useShipStore(s => s.activeTool);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const movingBlock = useShipStore(s => s.movingBlock);
  const cancelMoveBlock = useShipStore(s => s.cancelMoveBlock);
  const rotateBlock = useShipStore(s => s.rotateBlock);
  const flipBlock = useShipStore(s => s.flipBlock);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);
  const removeBlock = useShipStore(s => s.removeBlock);
  const nudgeBlock = useShipStore(s => s.nudgeBlock);

  const activeFlipX = useShipStore(s => s.activeFlipX);
  const activeFlipY = useShipStore(s => s.activeFlipY);
  const activeFlipZ = useShipStore(s => s.activeFlipZ);
  const setActiveFlipX = useShipStore(s => s.setActiveFlipX);
  const setActiveFlipY = useShipStore(s => s.setActiveFlipY);
  const setActiveFlipZ = useShipStore(s => s.setActiveFlipZ);

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

      // Check if rotation/flipping is allowed (only for Thrusters)
      const isPlacingOrMoving = !!movingBlock || activeTool !== 'select';
      const targetType = movingBlock
        ? movingBlock.type
        : (activeTool !== 'select' ? activeTool : null);

      const isEngine = targetType
        ? BLOCK_DEFINITIONS[targetType]?.group === 'Thrusters'
        : false;

      const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;
      const isSelectedEngine = selectedBlock
        ? BLOCK_DEFINITIONS[selectedBlock.type]?.group === 'Thrusters'
        : false;

      const isHull = targetType
        ? (BLOCK_DEFINITIONS[targetType]?.group === 'Steel' || BLOCK_DEFINITIONS[targetType]?.group === 'Titanium')
        : false;
      const isSelectedHull = selectedBlock
        ? (BLOCK_DEFINITIONS[selectedBlock.type]?.group === 'Steel' || BLOCK_DEFINITIONS[selectedBlock.type]?.group === 'Titanium')
        : false;

      if (key === 'x') {
        if (isPlacingOrMoving) {
          if (isEngine) {
            setRotation(prev => [(prev[0] + Math.PI / 2) % (Math.PI * 2), prev[1], prev[2]]);
          } else if (isHull) {
            setActiveFlipX(!activeFlipX);
          }
        } else if (selectedBlockId && !movingBlock) {
          if (isSelectedEngine) {
            rotateBlock(selectedBlockId, 'x');
          } else if (isSelectedHull) {
            flipBlock(selectedBlockId, 'x');
          }
        }
      }

      if (key === 'y') {
        if (isPlacingOrMoving && isHull) {
          setActiveFlipY(!activeFlipY);
        } else if (selectedBlockId && !movingBlock && isSelectedHull) {
          flipBlock(selectedBlockId, 'y');
        }
      }

      if (key === 'z') {
        if (isPlacingOrMoving && isHull) {
          setActiveFlipZ(!activeFlipZ);
        } else if (selectedBlockId && !movingBlock && isSelectedHull) {
          flipBlock(selectedBlockId, 'z');
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
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();

          // Shift + ArrowUp/ArrowDown: vertical nudge (absolute Y axis)
          if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            const deltaY = e.key === 'ArrowUp' ? 1 : -1;
            nudgeBlock(selectedBlockId, [0, deltaY, 0]);
            return;
          }

          // Horizontal camera-relative nudge (projected to XZ plane and snapped)
          const forward = new THREE.Vector3();
          camera.getWorldDirection(forward);
          forward.y = 0;
          if (forward.lengthSq() < 0.0001) {
            forward.copy(camera.up);
            forward.y = 0;
            if (forward.lengthSq() < 0.0001) {
              forward.set(0, 0, -1);
            }
          }
          forward.normalize();

          const right = new THREE.Vector3();
          right.crossVectors(forward, camera.up);
          right.y = 0;
          if (right.lengthSq() < 0.0001) {
            right.set(1, 0, 0);
          }
          right.normalize();

          const moveDir = new THREE.Vector3();
          if (e.key === 'ArrowUp') {
            moveDir.copy(forward);
          } else if (e.key === 'ArrowDown') {
            moveDir.copy(forward).negate();
          } else if (e.key === 'ArrowLeft') {
            moveDir.copy(right).negate();
          } else if (e.key === 'ArrowRight') {
            moveDir.copy(right);
          }

          let delta: [number, number, number];
          if (Math.abs(moveDir.x) > Math.abs(moveDir.z)) {
            delta = [Math.sign(moveDir.x), 0, 0];
          } else {
            delta = [0, 0, Math.sign(moveDir.z)];
          }

          nudgeBlock(selectedBlockId, delta);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    blocks,
    activeTool,
    selectedBlockId,
    movingBlock,
    camera,
    setActiveTool,
    startMoveBlock,
    cancelMoveBlock,
    setSelectedBlockId,
    removeBlock,
    nudgeBlock,
    rotateBlock,
    flipBlock,
    setRotation,
    activeFlipX,
    activeFlipY,
    activeFlipZ,
    setActiveFlipX,
    setActiveFlipY,
    setActiveFlipZ
  ]);

  return null;
}

export function Scene() {
  const blocks = useShipStore(s => s.blocks);
  const activeTool = useShipStore(s => s.activeTool);
  const activeShape = useShipStore(s => s.activeShape);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const movingBlock = useShipStore(s => s.movingBlock);

  const addBlock = useShipStore(s => s.addBlock);
  const checkCollision = useShipStore(s => s.checkCollision);
  const placeMovingBlock = useShipStore(s => s.placeMovingBlock);
  const cancelMoveBlock = useShipStore(s => s.cancelMoveBlock);

  const activeFlipX = useShipStore(s => s.activeFlipX);
  const activeFlipY = useShipStore(s => s.activeFlipY);
  const activeFlipZ = useShipStore(s => s.activeFlipZ);
  const setActiveFlipX = useShipStore(s => s.setActiveFlipX);
  const setActiveFlipY = useShipStore(s => s.setActiveFlipY);
  const setActiveFlipZ = useShipStore(s => s.setActiveFlipZ);

  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
  const [cursorNormal, setCursorNormal] = useState<[number, number, number] | null>(null);
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [prevMovingBlockId, setPrevMovingBlockId] = useState<string | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  // Sync rotation and flip state when block is picked up
  if (movingBlock && movingBlock.id !== prevMovingBlockId) {
    setPrevMovingBlockId(movingBlock.id);
    setRotation(movingBlock.rotation);
  } else if (!movingBlock && prevMovingBlockId !== null) {
    setPrevMovingBlockId(null);
  }

  useEffect(() => {
    if (movingBlock) {
      setActiveFlipX(movingBlock.flipX || false);
      setActiveFlipY(movingBlock.flipY || false);
      setActiveFlipZ(movingBlock.flipZ || false);
    }
  }, [movingBlock, setActiveFlipX, setActiveFlipY, setActiveFlipZ]);

  // Reset rotation and flip states when active tool changes to prevent stale states from leaking
  const [prevActiveTool, setPrevActiveTool] = useState(activeTool);
  if (activeTool !== prevActiveTool) {
    setPrevActiveTool(activeTool);
    setRotation([0, 0, 0]);
  }

  useEffect(() => {
    setActiveFlipX(false);
    setActiveFlipY(false);
    setActiveFlipZ(false);
  }, [activeTool, setActiveFlipX, setActiveFlipY, setActiveFlipZ]);



  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    // If we are in select mode and not moving a block, we don't need grid position calculation or updates
    if (activeTool === 'select' && !movingBlock) {
      return;
    }

    const point = e.point.clone();

    // Convert local normal to world normal if it exists
    let normal = new THREE.Vector3(0, 1, 0);
    if (e.face?.normal) {
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(e.object.matrixWorld);
      normal = e.face.normal.clone().applyMatrix3(normalMatrix).normalize();
    }

    const nx = Math.round(normal.x);
    const ny = Math.round(normal.y);
    const nz = Math.round(normal.z);
    setCursorNormal([nx, ny, nz]);

    // Add a tiny bit of the normal to the hit point to ensure we pick the adjacent cell
    const hitPoint = point.add(normal.clone().multiplyScalar(0.1));
    const cx = Math.floor(hitPoint.x);
    const cy = Math.max(0, Math.floor(hitPoint.y));
    const cz = Math.floor(hitPoint.z);

    setCursorPos([cx, cy, cz]);
  };

  const onPointerOut = () => {
    if (activeTool === 'select' && !movingBlock) {
      return;
    }
    setCursorPos(null);
    setCursorNormal(null);
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    pointerDownRef.current = {
      x: e.nativeEvent.clientX,
      y: e.nativeEvent.clientY,
    };
  };

  const ghostType = movingBlock ? movingBlock.type : activeTool;
  const def = BLOCK_DEFINITIONS[ghostType];
  const isHull = def && (def.group === 'Steel' || def.group === 'Titanium');
  const ghostShape = movingBlock ? (movingBlock.shape || 'full') : (isHull ? activeShape : 'full');

  // Dynamically derive the centered anchor position of the block under rotation (aligning bottom with cursorPos Y, adjusted by face normal to prevent clipping)
  let hoverPos: [number, number, number] | null = null;
  if (cursorPos) {
    if (def) {
      const currentRotBounds = getBlockBounds(ghostType, [0, 0, 0], rotation);
      const sizeX = currentRotBounds.maxX - currentRotBounds.minX;
      const sizeZ = currentRotBounds.maxZ - currentRotBounds.minZ;

      const nx = cursorNormal ? cursorNormal[0] : 0;
      const ny = cursorNormal ? cursorNormal[1] : 1;
      const nz = cursorNormal ? cursorNormal[2] : 0;

      let hx: number;
      if (nx > 0) {
        hx = cursorPos[0] - currentRotBounds.minX;
      } else if (nx < 0) {
        hx = cursorPos[0] + 1 - currentRotBounds.maxX;
      } else {
        hx = cursorPos[0] - Math.floor(sizeX / 2) - currentRotBounds.minX;
      }

      let hy: number;
      if (ny > 0) {
        hy = cursorPos[1] - currentRotBounds.minY;
      } else if (ny < 0) {
        hy = cursorPos[1] + 1 - currentRotBounds.maxY;
      } else {
        hy = cursorPos[1] - currentRotBounds.minY;
      }

      let hz: number;
      if (nz > 0) {
        hz = cursorPos[2] - currentRotBounds.minZ;
      } else if (nz < 0) {
        hz = cursorPos[2] + 1 - currentRotBounds.maxZ;
      } else {
        hz = cursorPos[2] - Math.floor(sizeZ / 2) - currentRotBounds.minZ;
      }

      hoverPos = [hx, hy, hz];
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

    if (movingBlock) {
      cancelMoveBlock();
    } else if (selectedBlockId) {
      setSelectedBlockId(null);
    } else if (activeTool !== 'select') {
      setActiveTool('select');
    }
  };

  const isInvalid = hoverPos && def ? checkCollision(ghostType, hoverPos, rotation) : false;

  return (
    <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
      <KeyboardHandler setRotation={setRotation} />
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
          <mesh raycast={() => null}>
            <BlockGeometry
              shape={ghostShape}
              w={def.dimensions[0]}
              h={def.dimensions[1]}
              d={def.dimensions[2]}
              flipX={activeFlipX}
              flipY={activeFlipY}
              flipZ={activeFlipZ}
            />
            <meshStandardMaterial
              color={isInvalid ? '#ff0000' : def.color}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
            <Edges color={isInvalid ? 'red' : 'white'} />
          </mesh>
        </group>
      )}

      {/* Grid */}
      <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#888" />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
