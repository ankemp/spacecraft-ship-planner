import { useMemo } from 'react';
import { getBufferGeometry } from '../utils/geometry';

interface BlockGeometryProps {
  shape?: string;
  w: number;
  h: number;
  d: number;
  flipX?: boolean;
  flipY?: boolean;
  flipZ?: boolean;
}

export function BlockGeometry({
  shape = 'full',
  w,
  h,
  d,
  flipX = false,
  flipY = false,
  flipZ = false,
}: BlockGeometryProps) {
  const geometry = useMemo(() => {
    return getBufferGeometry(shape, w, h, d, flipX, flipY, flipZ);
  }, [shape, w, h, d, flipX, flipY, flipZ]);

  return <primitive object={geometry} attach="geometry" />;
}


