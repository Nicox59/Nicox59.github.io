import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, copyFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const source = process.argv[2];
if (!source) throw new Error('Indica la ruta del GLB original.');
const target = path.join(root, 'assets/sword');
await mkdir(target, { recursive: true });
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(source);
await doc.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.065, error: 0.004 }), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1536,1536], quality: 85 }));
const out = path.join(target, 'sword.glb');
await io.write(out, doc);
await copyFile(path.join(path.dirname(source), 'Espada tecno-mágica de nueve runas.png'), path.join(target, 'reference.png'));
const primitives = doc.getRoot().listMeshes().flatMap(m => m.listPrimitives());
const report = {
  sourceBytes: (await stat(source)).size,
  outputBytes: (await stat(out)).size,
  triangles: primitives.reduce((n,p) => n + p.getIndices().getCount()/3, 0),
  textures: doc.getRoot().listTextures().map(t => ({ name: t.getName(), bytes: t.getImage().byteLength, size: t.getSize() })),
};
await writeFile(path.join(target,'optimization.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
