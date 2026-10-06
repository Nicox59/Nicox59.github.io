import { mkdir, copyFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = path.join(root, 'public');
const wasmDir = path.join(publicDir, 'mediapipe', 'wasm');
await mkdir(wasmDir, { recursive: true });
for (const name of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  await copyFile(path.join(root, 'node_modules/@mediapipe/tasks-vision/wasm', name), path.join(wasmDir, name));
}
const modelPath = path.join(publicDir, 'models/hand_landmarker.task');
await mkdir(path.dirname(modelPath), { recursive: true });
const exists = async file => (await stat(file).catch(() => null))?.size > 0;
if (!await exists(modelPath)) {
  const publishedModel = path.resolve(root, '../../dedos-interactivos/models/hand_landmarker.task');
  if (await exists(publishedModel)) await copyFile(publishedModel, modelPath);
  else {
    const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo descargar el modelo: HTTP ${response.status}`);
    await writeFile(modelPath, Buffer.from(await response.arrayBuffer()));
  }
}
await mkdir(path.join(publicDir, 'licenses'), { recursive: true });
await copyFile(path.join(root, 'licenses/mediapipe-LICENSE.txt'), path.join(publicDir, 'licenses/mediapipe-LICENSE.txt'));
