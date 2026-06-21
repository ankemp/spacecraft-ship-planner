import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from 'three';
import { SHAPE_CONFIGS } from '../src/utils/geometry/shapes/index';

// Polyfill __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../exported_shapes');

// Helper to convert BufferGeometry to OBJ format
function geometryToObj(
  name: string,
  id: string,
  geom: THREE.BufferGeometry,
  translation: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  vertexOffset: number = 0
): { objContent: string; vertexCount: number } {
  const positionAttr = geom.getAttribute('position');
  if (!positionAttr) {
    return { objContent: '', vertexCount: 0 };
  }

  let content = `# Shape: ${name} (${id})\n`;
  content += `g ${id}\n`;

  const vertexCount = positionAttr.count;
  for (let i = 0; i < vertexCount; i++) {
    const x = positionAttr.getX(i) + translation.x;
    const y = positionAttr.getY(i) + translation.y;
    const z = positionAttr.getZ(i) + translation.z;
    content += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`;
  }

  // Non-indexed geometry faces
  for (let i = 0; i < vertexCount; i += 3) {
    const v1 = vertexOffset + i + 1;
    const v2 = vertexOffset + i + 2;
    const v3 = vertexOffset + i + 3;
    content += `f ${v1} ${v2} ${v3}\n`;
  }

  return { objContent: content, vertexCount };
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  const args = process.argv.slice(2);
  let width = 4;
  let depth = 3;
  let height = 2;

  const input = args.join(' ');
  const match = input.match(/(\d+(?:\.\d+)?)\s*[xX,]\s*(\d+(?:\.\d+)?)\s*[xX,]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    width = parseFloat(match[1]);
    depth = parseFloat(match[2]);
    height = parseFloat(match[3]);
  } else if (args.length > 0) {
    width = parseFloat(args[0]);
    depth = args[1] ? parseFloat(args[1]) : 3;
    height = args[2] ? parseFloat(args[2]) : 2;
  }

  if (isNaN(width) || isNaN(depth) || isNaN(height)) {
    console.error('Error: Dimensions must be valid numbers.');
    console.log('Usage: npm run export-shapes -- [width] [depth] [height]');
    console.log('Or:    npm run export-shapes [width]x[depth]x[height]');
    process.exit(1);
  }

  console.log(`Generating shape geometries matching name pattern [Width]x[Depth]x[Height] (e.g. 4x3x2)`);
  console.log(`Using dimensions: Width=${width}, Depth=${depth}, Height=${height}`);
  console.log(`(Underlying 3D coordinates: w=${width}, h=${height}, d=${depth})`);
  console.log(`To customize dimensions, run: npm run export-shapes -- [width] [depth] [height]`);
  console.log(`Or:                          npm run export-shapes [width]x[depth]x[height]`);

  let combinedObj = `# Merged spacecraft-shipbuilder shape geometries (w=${width}, h=${height}, d=${depth} -> name pattern: ${width}x${depth}x${height})\n\n`;
  let currentVertexOffset = 0;
  const shapes = Object.values(SHAPE_CONFIGS);

  console.log(`Found ${shapes.length} shapes to export.`);

  shapes.forEach((shape, index) => {
    // Generate geometry with the specified dimensions
    const geom = shape.generateGeometry(width, height, depth);
    
    // Save individual OBJ file (no translation, offset starts at 0)
    const { objContent: individualObj } = geometryToObj(shape.name, shape.id, geom);
    const individualPath = path.join(OUTPUT_DIR, `${shape.id}.obj`);
    fs.writeFileSync(individualPath, individualObj, 'utf-8');
    console.log(`Exported individual shape: ${shape.id} -> ${individualPath}`);

    // Append to combined OBJ file (spaced out dynamically based on width)
    const spacing = width + 2.0;
    const translation = { x: index * spacing, y: 0, z: 0 };
    const { objContent: partObj, vertexCount } = geometryToObj(
      shape.name,
      shape.id,
      geom,
      translation,
      currentVertexOffset
    );
    combinedObj += partObj + '\n';
    currentVertexOffset += vertexCount;
  });

  const combinedPath = path.join(OUTPUT_DIR, 'all_shapes.obj');
  fs.writeFileSync(combinedPath, combinedObj, 'utf-8');
  console.log(`\nExported combined shapes -> ${combinedPath}`);
  console.log('All exports completed successfully!');
}

main();
