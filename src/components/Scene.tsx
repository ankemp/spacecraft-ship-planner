import { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Grid, Sky, Environment, Edges, Stars } from '@react-three/drei';
import { useShipStore, getBlockBounds } from '../store/shipStore';
import { Block } from './Block';
import { BlockGeometry } from './BlockGeometry';
import { BLOCK_DEFINITIONS } from '../config/blocks';
import * as THREE from 'three';
import { Nebula, Planet, HangarBay } from './Backgrounds';

/**
 * Invalidator: lives inside <Canvas> so it has access to R3F's invalidate().
 * Subscribes to the slices of state that visually change the scene, and tells
 * R3F to render a new frame whenever they change.
 * Required because we use frameloop="demand" for performance.
 */
function Invalidator() {
  const { invalidate } = useThree();
  // Subscribe to the minimal set of state that actually changes what's drawn.
  const blocks = useShipStore(s => s.blocks);
  const movingBlock = useShipStore(s => s.movingBlock);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const activeTool = useShipStore(s => s.activeTool);
  const potatoMode = useShipStore(s => s.potatoMode);
  const background = useShipStore(s => s.background);

  useEffect(() => { invalidate(); }, [blocks, movingBlock, selectedBlockId, activeTool, potatoMode, background, invalidate]);

  return null;
}

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

      // Check if rotation/flipping is allowed
      const isPlacingOrMoving = !!movingBlock || activeTool !== 'select';
      const targetType = movingBlock
        ? movingBlock.type
        : (activeTool !== 'select' ? activeTool : null);

      const targetDef = targetType ? BLOCK_DEFINITIONS[targetType] : null;
      const targetAllowedRotations = targetDef?.allowedRotations || [];
      const targetAllowedFlips = targetDef?.allowedFlips || [];

      const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;
      const selectedDef = selectedBlock ? BLOCK_DEFINITIONS[selectedBlock.type] : null;
      const selectedAllowedRotations = selectedDef?.allowedRotations || [];
      const selectedAllowedFlips = selectedDef?.allowedFlips || [];

      if (key === 'x') {
        if (isPlacingOrMoving) {
          if (targetAllowedRotations.includes('x')) {
            setRotation(prev => [(prev[0] + Math.PI / 2) % (Math.PI * 2), prev[1], prev[2]]);
          } else if (targetAllowedFlips.includes('x')) {
            setActiveFlipX(!activeFlipX);
          }
        } else if (selectedBlockId && !movingBlock) {
          if (selectedAllowedRotations.includes('x')) {
            rotateBlock(selectedBlockId, 'x');
          } else if (selectedAllowedFlips.includes('x')) {
            flipBlock(selectedBlockId, 'x');
          }
        }
      }

      if (key === 'y') {
        if (isPlacingOrMoving) {
          if (targetAllowedFlips.includes('y')) {
            setActiveFlipY(!activeFlipY);
          }
        } else if (selectedBlockId && !movingBlock) {
          if (selectedAllowedFlips.includes('y')) {
            flipBlock(selectedBlockId, 'y');
          }
        }
      }

      if (key === 'z') {
        if (isPlacingOrMoving) {
          if (targetAllowedFlips.includes('z')) {
            setActiveFlipZ(!activeFlipZ);
          }
        } else if (selectedBlockId && !movingBlock) {
          if (selectedAllowedFlips.includes('z')) {
            flipBlock(selectedBlockId, 'z');
          }
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

function PerformanceMonitor() {
  const potatoMode = useShipStore(s => s.potatoMode);
  const suggestPotatoMode = useShipStore(s => s.suggestPotatoMode);
  const dismissedPotatoSuggestion = useShipStore(s => s.dismissedPotatoSuggestion);
  const setSuggestPotatoMode = useShipStore(s => s.setSuggestPotatoMode);

  const frameTimesRef = useRef<number[]>([]);
  const consecLowFpsSecondsRef = useRef(0);

  useFrame((_, delta) => {
    if (potatoMode || dismissedPotatoSuggestion || suggestPotatoMode) return;

    const cappedDelta = Math.min(delta, 0.1);
    frameTimesRef.current.push(cappedDelta);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    if (frameTimesRef.current.length === 60) {
      const sum = frameTimesRef.current.reduce((a, b) => a + b, 0);
      const avgDelta = sum / 60;
      const fps = 1 / avgDelta;

      if (fps < 30) {
        consecLowFpsSecondsRef.current += cappedDelta;
        if (consecLowFpsSecondsRef.current >= 5) {
          setSuggestPotatoMode(true);
        }
      } else {
        consecLowFpsSecondsRef.current = Math.max(0, consecLowFpsSecondsRef.current - cappedDelta);
      }
    }
  });

  return null;
}

export function Scene() {
  const blocks = useShipStore(s => s.blocks);
  const potatoMode = useShipStore(s => s.potatoMode);
  const background = useShipStore(s => s.background);
  const activeTool = useShipStore(s => s.activeTool);
  const activeShape = useShipStore(s => s.activeShape);
  const setActiveTool = useShipStore(s => s.setActiveTool);
  const selectedBlockId = useShipStore(s => s.selectedBlockId);
  const setSelectedBlockId = useShipStore(s => s.setSelectedBlockId);
  const movingBlock = useShipStore(s => s.movingBlock);
  const startMoveBlock = useShipStore(s => s.startMoveBlock);

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

  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const dragRef = useRef<{
    blockId: string;
    startX: number;
    startY: number;
    timeoutId: number | null;
    isDragging: boolean;
  } | null>(null);
  const wasDraggingRef = useRef(false);
  const hoverPosRef = useRef<[number, number, number] | null>(null);
  const rotationRef = useRef<[number, number, number]>([0, 0, 0]);

  // Sync rotation and flip state when block is picked up
  if (movingBlock && movingBlock.id !== prevMovingBlockId) {
    setPrevMovingBlockId(movingBlock.id);
    setRotation(movingBlock.rotation);
  } else if (!movingBlock && prevMovingBlockId !== null) {
    setPrevMovingBlockId(null);
  }

  // Sync dragging state if movingBlock is cleared externally (e.g. keybind cancel or delete)
  useEffect(() => {
    if (!movingBlock && isDraggingBlock) {
      setTimeout(() => {
        setIsDraggingBlock(false);
      }, 0);
      if (dragRef.current) {
        if (dragRef.current.timeoutId) {
          window.clearTimeout(dragRef.current.timeoutId);
        }
        dragRef.current = null;
      }
    }
  }, [movingBlock, isDraggingBlock]);

  useEffect(() => {
    if (movingBlock) {
      setActiveFlipX(movingBlock.flipX || false);
      setActiveFlipY(movingBlock.flipY || false);
      setActiveFlipZ(movingBlock.flipZ || false);
    }
  }, [movingBlock, setActiveFlipX, setActiveFlipY, setActiveFlipZ]);

  useEffect(() => {
    if (isDraggingBlock) {
      document.body.style.cursor = 'grabbing';
      return () => {
        document.body.style.cursor = 'auto';
      };
    }
  }, [isDraggingBlock]);

  useEffect(() => {
    const handleGlobalPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;

      if (dragRef.current) {
        if (dragRef.current.timeoutId) {
          window.clearTimeout(dragRef.current.timeoutId);
        }

        if (dragRef.current.isDragging) {
          e.preventDefault();
          const currentHoverPos = hoverPosRef.current;
          const currentRotation = rotationRef.current;

          if (currentHoverPos) {
            const placed = placeMovingBlock(currentHoverPos, currentRotation);
            if (!placed) {
              cancelMoveBlock();
            }
          } else {
            cancelMoveBlock();
          }

          setIsDraggingBlock(false);
          wasDraggingRef.current = true;
          setTimeout(() => {
            wasDraggingRef.current = false;
          }, 0);
        }

        dragRef.current = null;
      }
    };

    window.addEventListener('pointerup', handleGlobalPointerUp, { capture: true });
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp, { capture: true });
    };
  }, [placeMovingBlock, cancelMoveBlock]);

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

    if (dragRef.current && !dragRef.current.isDragging) {
      const dx = e.nativeEvent.clientX - dragRef.current.startX;
      const dy = e.nativeEvent.clientY - dragRef.current.startY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        if (dragRef.current.timeoutId) {
          window.clearTimeout(dragRef.current.timeoutId);
        }
        dragRef.current = null;
      }
    }

    // If we are in select mode and not moving a block, we don't need grid position calculation or updates
    if (activeTool === 'select' && !movingBlock && !dragRef.current?.isDragging) {
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
    setCursorNormal(prev => {
      if (prev && prev[0] === nx && prev[1] === ny && prev[2] === nz) {
        return prev;
      }
      return [nx, ny, nz];
    });

    // Add a tiny bit of the normal to the hit point to ensure we pick the adjacent cell
    const hitPoint = point.add(normal.clone().multiplyScalar(0.1));
    const cx = Math.floor(hitPoint.x);
    const cy = Math.max(0, Math.floor(hitPoint.y));
    const cz = Math.floor(hitPoint.z);

    setCursorPos(prev => {
      if (prev && prev[0] === cx && prev[1] === cy && prev[2] === cz) {
        return prev;
      }
      return [cx, cy, cz];
    });
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

    if (e.button !== 0) return;

    if (activeTool !== 'select' || movingBlock) {
      return;
    }

    const clickedBlockId = e.object.userData?.blockId;
    if (clickedBlockId) {
      e.stopPropagation();

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      if (dragRef.current?.timeoutId) {
        window.clearTimeout(dragRef.current.timeoutId);
      }

      const timeoutId = window.setTimeout(() => {
        if (dragRef.current && !dragRef.current.isDragging) {
          dragRef.current.isDragging = true;
          setIsDraggingBlock(true);
          startMoveBlock(clickedBlockId);
        }
      }, 250);

      dragRef.current = {
        blockId: clickedBlockId,
        startX,
        startY,
        timeoutId,
        isDragging: false,
      };
    }
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

  useEffect(() => {
    hoverPosRef.current = hoverPos;
    rotationRef.current = rotation;
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.button === 2) return; // Handled by cancelMoveBlock or delete
    e.stopPropagation();

    if (wasDraggingRef.current) {
      return;
    }

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

  const canInteract = activeTool === 'select' && !movingBlock;

  return (
    <Canvas camera={{ position: [15, 15, 15], fov: 50 }} frameloop="demand">
      <KeyboardHandler setRotation={setRotation} />
      <PerformanceMonitor />
      <Invalidator />
      
      {/* Background / Environment Setup */}
      {potatoMode ? (
        <color 
          attach="background" 
          args={[
            background === 'atmosphere' ? '#0f172a' :
            background === 'nebula' ? '#090514' :
            background === 'orbit' ? '#02040a' :
            '#111215'
          ]} 
        />
      ) : (
        <>
          {background === 'atmosphere' && (
            <>
              <Sky sunPosition={[100, 20, 100]} />
              <Environment preset="city" />
            </>
          )}
          {background === 'nebula' && (
            <>
              <color attach="background" args={['#030206']} />
              <Stars radius={150} depth={50} count={3000} factor={4} saturation={0.5} speed={0} />
              <Nebula />
              <Environment preset="sunset" />
            </>
          )}
          {background === 'orbit' && (
            <>
              <color attach="background" args={['#010103']} />
              <Stars radius={150} depth={50} count={2000} factor={3} saturation={0.3} speed={0} />
              <Planet />
              <Environment preset="city" />
            </>
          )}
          {background === 'hangar' && (
            <>
              <color attach="background" args={['#090a0f']} />
              <HangarBay />
              <Environment preset="warehouse" />
            </>
          )}
        </>
      )}

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} castShadow />

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
          <Block key={b.id} {...b} canInteract={canInteract} />
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

      {/* Dynamic Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionColor={
          background === 'nebula' ? '#4d127a' :
          background === 'orbit' ? '#005f73' :
          background === 'hangar' ? '#9e2a2b' :
          '#444444'
        }
        cellColor={
          background === 'nebula' ? '#226b80' :
          background === 'orbit' ? '#0a9396' :
          background === 'hangar' ? '#e9d8a6' :
          '#888888'
        }
        sectionSize={5}
        cellSize={1}
        cellThickness={1.0}
        sectionThickness={1.5}
      />
      <OrbitControls makeDefault minDistance={20} maxDistance={160} enabled={!isDraggingBlock} />
    </Canvas>
  );
}
