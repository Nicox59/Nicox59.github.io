import "./style.css";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { WebGLThreadRenderer } from "./webgl-thread-renderer.js";
import { CameraSession } from "./camera-session.js";

const HAND_TIP_INDICES = [4, 8, 12, 16, 20];
const MODE_THREADS = "threads";
const MODE_SOLAR = "solar";
const MODE_PLANET = "planet";
const MODE_BLACK_HOLE = "blackhole";
const GESTURE_L = "gesture-l";
const GESTURE_INVERTED_Y = "gesture-inverted-y";
const FILTER_STYLE_MONO = 0;
const FILTER_STYLE_PIXEL = 1;
const FINGER_COLORS = [
  "#ff3b30",
  "#34c759",
  "#0a84ff",
  "#ff3b30",
  "#34c759"
];
const STAR_TIP_CONNECTIONS = buildStarTipConnections();
const SOLAR_PLANETS = [
  { orbit: 0.18, eccentricity: 0.84, size: 0.28, speed: 1.8, phase: 0.2, color: "#ffd166" },
  { orbit: 0.28, eccentricity: 0.88, size: 0.35, speed: 1.35, phase: 1.1, color: "#ff8fab" },
  { orbit: 0.4, eccentricity: 0.82, size: 0.38, speed: 1.1, phase: 2.4, color: "#4cc9f0" },
  { orbit: 0.53, eccentricity: 0.78, size: 0.42, speed: 0.94, phase: 3.3, color: "#06d6a0" },
  { orbit: 0.67, eccentricity: 0.75, size: 0.58, speed: 0.74, phase: 4.2, color: "#f77f00" },
  { orbit: 0.8, eccentricity: 0.7, size: 0.52, speed: 0.58, phase: 5.5, color: "#b5179e" }
];
const PALM_SUPPORT_INDICES = [5, 9, 13, 17];
const MODEL_ASSET_URL = new URL("./models/hand_landmarker.task", document.baseURI).toString();
const WASM_ASSET_URL = new URL("./mediapipe/wasm/", document.baseURI).toString();
const MAX_RENDER_DPR = 1.5;
const GPU_DELEGATE = "GPU";
const CPU_DELEGATE = "CPU";
const SUPPORTS_VIDEO_FRAME_CALLBACK =
  typeof HTMLVideoElement !== "undefined" &&
  "requestVideoFrameCallback" in HTMLVideoElement.prototype;

const video = document.querySelector("#webcam");
const canvas = document.querySelector("#scene");
const statusLabel = document.querySelector("#status");
const videoOpacityControl = document.querySelector("#videoOpacity");
const intensityControl = document.querySelector("#threadIntensity");
const crossHandThreadsControl = document.querySelector("#crossHandThreads");
const mirrorViewControl = document.querySelector("#mirrorView");
const filterWindowsButton = document.querySelector("#filterWindows");
const cameraSelect = document.querySelector("#cameraSelect");
const modeButtons = Array.from(document.querySelectorAll(".mode-button[data-mode]"));
const startCameraButton = document.querySelector("#startCamera");
const stopCameraButton = document.querySelector("#stopCamera");
const welcome = document.querySelector("#welcome");
const startMessage = document.querySelector("#startMessage");
const modeHint = document.querySelector("#modeHint");
const modeGuideTitle = document.querySelector("#modeGuideTitle");
const modeGuideHands = document.querySelector("#modeGuideHands");
const modeGuideSteps = document.querySelector("#modeGuideSteps");
const filterPoseGuide = document.querySelector("#filterPoseGuide");
const handCount = document.querySelector("#handCount");
const cameraSession = new CameraSession(video, navigator.mediaDevices);
let operationId = 0;
let isRunning = false;
let isStarting = false;
let isSwitching = false;
const MODE_HINTS = {
  threads: "Abre tus dedos: los hilos conectan sus puntas. Con dos manos, aparecen puentes entre ellas.",
  solar: "Muestra ambas manos: el sistema solar aparece entre tus palmas y crece al separarlas.",
  planet: "Muestra ambas manos para sostener una Tierra entre tus palmas.",
  blackhole: "Muestra ambas manos para formar un agujero negro entre tus palmas.",
  filters: "Haz la misma pose con ambas manos para crear una ventana con filtro sobre el video."
};
const MODE_GUIDES = {
  threads: { title: "Cómo usar Hilos", hands: "1 o 2 manos", steps: [
    "Muestra una mano abierta, con los dedos separados y la palma hacia la cámara.",
    "Mueve tus dedos para cambiar la forma de los hilos.",
    "Para conectar las dos manos, muestra ambas y activa «Unir ambas manos»."
  ] },
  solar: { title: "Cómo usar Solar", hands: "2 manos", steps: [
    "Muestra ambas manos abiertas, separadas y completas dentro de la imagen.",
    "Sepáralas para ampliar el sistema solar; acércalas para reducirlo.",
    "Mueve las dos manos para trasladarlo. Sube una respecto a la otra para inclinar sus órbitas."
  ] },
  planet: { title: "Cómo usar Planeta", hands: "2 manos", steps: [
    "Muestra ambas manos abiertas: la Tierra aparece entre sus palmas.",
    "Sepáralas para aumentar su tamaño; acércalas para hacerlo más pequeño.",
    "Mueve ambas manos juntas para cambiar su posición. La animación del planeta es automática."
  ] },
  blackhole: { title: "Cómo usar Agujero negro", hands: "2 manos", steps: [
    "Muestra ambas manos abiertas: el agujero negro aparece entre sus palmas.",
    "Sepáralas o acércalas para cambiar el tamaño del agujero y su anillo.",
    "Mueve ambas manos para desplazarlo. Sube una respecto a la otra para inclinar el anillo."
  ] },
  filters: { title: "Cómo activar los filtros", hands: "2 manos", steps: [
    "Espera a que el contador indique «2 manos detectadas».",
    "Elige una de las poses de abajo y hazla con ambas manos, separadas y sin superponerlas.",
    "Mueve las manos para desplazar y cambiar la forma de la ventana. Elige otro modo para salir de Filtros."
  ] }
};

const FINGER_RGB_COLORS = FINGER_COLORS.map(hexToRgb);
const SOLAR_PLANET_COLORS = SOLAR_PLANETS.map((planet) => hexToRgb(planet.color));
const FILTER_OUTLINE_A = hexToRgb("#77e7ff");
const FILTER_OUTLINE_B = hexToRgb("#ffffff");
const FILTER_GLOW = hexToRgb("#c8f6ff");
const FILTER_PIXEL_A = hexToRgb("#ffb347");
const FILTER_PIXEL_B = hexToRgb("#fff2a8");
const BLACK_HOLE_RING_COLORS = [
  hexToRgb("#ff9e2c"),
  hexToRgb("#ff5e5b"),
  hexToRgb("#7a5cff"),
  hexToRgb("#39d0ff")
];

let handLandmarker;
let sceneRenderer;
let animationFrameId = 0;
let videoFrameCallbackId = 0;
let lastVideoTime = -1;
let smoothedHands = [];
let viewport = { width: 0, height: 0, dpr: 1 };
let activeDelegate = CPU_DELEGATE;
let currentMode = MODE_THREADS;
let filterWindowsEnabled = false;
let visionFilesetPromise;
let activeCameraDeviceId = "";

function setStatus(message) {
  statusLabel.textContent = message;
}

function syncModeControls() {
  modeButtons.forEach((button) => {
    const isActiveMode = !filterWindowsEnabled && button.dataset.mode === currentMode;
    button.classList.toggle("is-active", isActiveMode);
    button.setAttribute("aria-pressed", isActiveMode ? "true" : "false");
  });

  filterWindowsButton?.classList.toggle("is-active", filterWindowsEnabled);
  filterWindowsButton?.setAttribute("aria-pressed", filterWindowsEnabled ? "true" : "false");
  const guideKey = filterWindowsEnabled ? "filters" : currentMode;
  const guide = MODE_GUIDES[guideKey];
  modeGuideTitle.textContent = guide.title;
  modeGuideHands.textContent = guide.hands;
  modeHint.textContent = MODE_HINTS[guideKey];
  modeGuideSteps.replaceChildren(...guide.steps.map(text => {
    const step = document.createElement("li");
    step.textContent = text;
    return step;
  }));
  filterPoseGuide.hidden = !filterWindowsEnabled;
}

function getReadyStatus() {
  if (!isRunning) return "Activa la cámara para comenzar.";
  if (filterWindowsEnabled) {
    return "Filtros activos. Sigue las poses de la guía.";
  }

  if (currentMode === MODE_BLACK_HOLE) {
    return "Cámara activa. El agujero negro se forma entre ambas palmas.";
  }

  return "Cámara activa. Muestra tus manos y mueve los dedos.";
}

function resizeScene() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (!width || !height) {
    return;
  }

  viewport = { width, height, dpr };
  sceneRenderer?.resize(viewport);
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255
  ];
}

function mixColor(colorA, colorB, amount) {
  return [
    colorA[0] + (colorB[0] - colorA[0]) * amount,
    colorA[1] + (colorB[1] - colorA[1]) * amount,
    colorA[2] + (colorB[2] - colorA[2]) * amount
  ];
}

function mixPoint(previousPoint, nextPoint, amount) {
  return {
    x: previousPoint.x + (nextPoint.x - previousPoint.x) * amount,
    y: previousPoint.y + (nextPoint.y - previousPoint.y) * amount,
    z: previousPoint.z + (nextPoint.z - previousPoint.z) * amount
  };
}

function smoothHands(nextHands) {
  const smoothed = nextHands.map((hand, index) => {
    const previousHand = smoothedHands[index];

    if (!previousHand) {
      return hand.map((point) => ({ ...point }));
    }

    return hand.map((point, pointIndex) => {
      const previousPoint = previousHand[pointIndex];
      return previousPoint ? mixPoint(previousPoint, point, 0.42) : { ...point };
    });
  });

  smoothedHands = smoothed;
  return smoothed;
}

function getCoverMetrics() {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (!sourceWidth || !sourceHeight) {
    return null;
  }

  const scale = Math.max(viewport.width / sourceWidth, viewport.height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (viewport.width - drawWidth) * 0.5;
  const offsetY = (viewport.height - drawHeight) * 0.5;

  return {
    drawWidth,
    drawHeight,
    offsetX,
    offsetY
  };
}

function projectPoint(point, metrics) {
  const projectedX = mirrorViewControl.checked ? 1 - point.x : point.x;
  return {
    x: projectedX * metrics.drawWidth + metrics.offsetX,
    y: point.y * metrics.drawHeight + metrics.offsetY,
    z: point.z
  };
}

function projectHands(handLandmarks, metrics) {
  return handLandmarks.map((hand) => hand.map((point) => projectPoint(point, metrics)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rotateVector(x, y, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine
  };
}

function averagePoints(points) {
  if (!points.length) {
    return { x: 0, y: 0 };
  }

  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y
    }),
    { x: 0, y: 0 }
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length
  };
}

function buildStarTipConnections() {
  const connections = [];

  for (let start = 0; start < HAND_TIP_INDICES.length; start += 1) {
    for (let end = start + 1; end < HAND_TIP_INDICES.length; end += 1) {
      connections.push([HAND_TIP_INDICES[start], HAND_TIP_INDICES[end], start, end]);
    }
  }

  return connections;
}

function pushSegment(segments, pointA, pointB, colorA, colorB, width, alpha, kind = 0) {
  const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

  if (distance < 3) {
    return;
  }

  segments.push({
    a: pointA,
    b: pointB,
    colorA,
    colorB,
    width,
    alpha,
    kind
  });
}

function pushPolyline(segments, points, colorA, colorB, width, alpha, kind = 0) {
  const lastIndex = points.length - 1;

  for (let index = 0; index < lastIndex; index += 1) {
    const startMix = lastIndex === 0 ? 0 : index / lastIndex;
    const endMix = lastIndex === 0 ? 1 : (index + 1) / lastIndex;

    pushSegment(
      segments,
      points[index],
      points[index + 1],
      mixColor(colorA, colorB, startMix),
      mixColor(colorA, colorB, endMix),
      width,
      alpha,
      kind
    );
  }
}

function pushClosedPolyline(segments, points, colorA, colorB, width, alpha, kind = 0) {
  if (points.length < 2) {
    return;
  }

  pushPolyline(segments, points, colorA, colorB, width, alpha, kind);
  pushSegment(
    segments,
    points[points.length - 1],
    points[0],
    colorB,
    colorA,
    width,
    alpha,
    kind
  );
}

function ellipsePoint(center, radiusX, radiusY, rotation, angle) {
  const rotated = rotateVector(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY, rotation);
  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y
  };
}

function buildBridgeCurve(pointA, pointB, pulse, seed) {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 6) {
    return [pointA, pointB];
  }

  const normalX = -dy / distance;
  const normalY = dx / distance;
  const bend =
    clamp(distance * 0.08, 12, 58) * (0.76 + 0.24 * Math.sin(pulse * 0.0014 + seed));
  const steps = 10;
  const curve = [];

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const arc = 4 * t * (1 - t);

    curve.push({
      x: pointA.x + dx * t + normalX * bend * arc,
      y: pointA.y + dy * t + normalY * bend * arc
    });
  }

  return curve;
}

function polygonArea(points) {
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const nextIndex = (index + 1) % points.length;
    area += points[index].x * points[nextIndex].y - points[nextIndex].x * points[index].y;
  }

  return Math.abs(area * 0.5);
}

function remapClamped(value, inputMin, inputMax) {
  if (inputMin === inputMax) {
    return 0;
  }

  return clamp((value - inputMin) / (inputMax - inputMin), 0, 1);
}

function distanceBetween(pointA, pointB) {
  return Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);
}

function normalizeVector(x, y) {
  const length = Math.hypot(x, y) || 1;
  return {
    x: x / length,
    y: y / length
  };
}

function dotVector(vectorA, vectorB) {
  return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
}

function scalePolygon(points, scale) {
  const center = averagePoints(points);
  return points.map((point) => ({
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale
  }));
}

function crossProduct(origin, pointA, pointB) {
  return (pointA.x - origin.x) * (pointB.y - origin.y) - (pointA.y - origin.y) * (pointB.x - origin.x);
}

function buildConvexHull(points) {
  if (points.length <= 3) {
    return points;
  }

  const sortedPoints = [...points].sort((pointA, pointB) =>
    pointA.x === pointB.x ? pointA.y - pointB.y : pointA.x - pointB.x
  );
  const lower = [];
  const upper = [];

  sortedPoints.forEach((point) => {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }

    lower.push(point);
  });

  for (let index = sortedPoints.length - 1; index >= 0; index -= 1) {
    const point = sortedPoints[index];

    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }

    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function getFingerStraightness(hand, mcpIndex, pipIndex, dipIndex, tipIndex) {
  const baseDirection = normalizeVector(
    hand[pipIndex].x - hand[mcpIndex].x,
    hand[pipIndex].y - hand[mcpIndex].y
  );
  const tipDirection = normalizeVector(
    hand[tipIndex].x - hand[dipIndex].x,
    hand[tipIndex].y - hand[dipIndex].y
  );

  return remapClamped(dotVector(baseDirection, tipDirection), 0.2, 0.98);
}

function getFingerOpenness(hand, mcpIndex, pipIndex, dipIndex, tipIndex) {
  const wrist = hand[0];
  const tip = hand[tipIndex];
  const pip = hand[pipIndex];
  const mcp = hand[mcpIndex];
  const wristReach = distanceBetween(tip, wrist) / Math.max(distanceBetween(pip, wrist), 1);
  const fingerReach = distanceBetween(tip, mcp) / Math.max(distanceBetween(pip, mcp), 1);
  const straightness = getFingerStraightness(hand, mcpIndex, pipIndex, dipIndex, tipIndex);

  return clamp(
    remapClamped(wristReach, 1.02, 1.42) * 0.48 +
      remapClamped(fingerReach, 1.12, 1.92) * 0.24 +
      straightness * 0.28,
    0,
    1
  );
}

function getThumbOpenness(hand) {
  const tip = hand[4];
  const ip = hand[3];
  const mcp = hand[2];
  const wrist = hand[0];
  const indexMcp = hand[5];
  const span = distanceBetween(tip, indexMcp) / Math.max(distanceBetween(ip, indexMcp), 1);
  const wristReach = distanceBetween(tip, wrist) / Math.max(distanceBetween(mcp, wrist), 1);
  const straightness = getFingerStraightness(hand, 1, 2, 3, 4);

  return clamp(
    remapClamped(span, 1.04, 1.58) * 0.42 +
      remapClamped(wristReach, 1.02, 1.44) * 0.3 +
      straightness * 0.28,
    0,
    1
  );
}

function getHandPoseScores(hand) {
  const thumb = getThumbOpenness(hand);
  const index = getFingerOpenness(hand, 5, 6, 7, 8);
  const middle = getFingerOpenness(hand, 9, 10, 11, 12);
  const ring = getFingerOpenness(hand, 13, 14, 15, 16);
  const pinky = getFingerOpenness(hand, 17, 18, 19, 20);
  const thumbIndexSpread = remapClamped(
    distanceBetween(hand[4], hand[8]) / Math.max(distanceBetween(hand[5], hand[17]), 1),
    0.28,
    0.9
  );
  const indexMiddleSpread = remapClamped(
    distanceBetween(hand[8], hand[12]) / Math.max(distanceBetween(hand[5], hand[9]), 1),
    0.4,
    1.25
  );

  return {
    thumb,
    index,
    middle,
    ring,
    pinky,
    lScore: clamp(
      thumb * 0.28 +
        index * 0.28 +
        thumbIndexSpread * 0.16 +
        (1 - middle) * 0.1 +
        (1 - ring) * 0.09 +
        (1 - pinky) * 0.09,
      0,
      1
    ),
    invertedYScore: clamp(
      thumb * 0.18 +
        index * 0.24 +
        middle * 0.24 +
        indexMiddleSpread * 0.16 +
        (1 - ring) * 0.09 +
        (1 - pinky) * 0.09,
      0,
      1
    )
  };
}

function detectSharedGesture(projectedHands) {
  if (projectedHands.length !== 2) {
    return null;
  }

  const leftHandScores = getHandPoseScores(projectedHands[0]);
  const rightHandScores = getHandPoseScores(projectedHands[1]);
  const lConfidence = Math.min(leftHandScores.lScore, rightHandScores.lScore);
  const invertedYConfidence = Math.min(
    leftHandScores.invertedYScore,
    rightHandScores.invertedYScore
  );

  if (lConfidence < 0.68 && invertedYConfidence < 0.68) {
    return null;
  }

  if (lConfidence >= invertedYConfidence) {
    return {
      gesture: GESTURE_L,
      confidence: lConfidence
    };
  }

  return {
    gesture: GESTURE_INVERTED_Y,
    confidence: invertedYConfidence
  };
}

function buildGestureWindow(gesture, leftHand, rightHand) {
  const rawPoints =
    gesture === GESTURE_L
      ? [leftHand[4], leftHand[8], rightHand[8], rightHand[4]]
      : [leftHand[4], leftHand[8], leftHand[12], rightHand[12], rightHand[8], rightHand[4]];
  const hull = buildConvexHull(rawPoints.filter(Boolean));

  if (hull.length < 3) {
    return null;
  }

  const expandedHull = scalePolygon(hull, gesture === GESTURE_L ? 1.14 : 1.18);

  if (polygonArea(expandedHull) < 2200) {
    return null;
  }

  return {
    points: expandedHull,
    style: gesture === GESTURE_L ? FILTER_STYLE_MONO : FILTER_STYLE_PIXEL
  };
}

function buildThreadRenderData(projectedHands, intensity, pulse) {
  const segments = [];
  const points = [];
  const time = pulse * 0.001;
  const bridgeWidth = 5.8 + intensity * 6.8;
  const starWidth = 4.4 + intensity * 5.4;
  const pointSize = 14 + intensity * 11;

  projectedHands.forEach((hand, handIndex) => {
    STAR_TIP_CONNECTIONS.forEach(([startLandmark, endLandmark, startColorIndex, endColorIndex]) => {
      const colorA = FINGER_RGB_COLORS[startColorIndex];
      const colorB = FINGER_RGB_COLORS[endColorIndex];

      pushSegment(
        segments,
        hand[startLandmark],
        hand[endLandmark],
        colorA,
        colorB,
        starWidth * 2.8,
        0.1 + intensity * 0.05,
        2
      );
      pushSegment(
        segments,
        hand[startLandmark],
        hand[endLandmark],
        colorA,
        colorB,
        starWidth,
        0.76 + intensity * 0.14,
        2
      );
    });

    HAND_TIP_INDICES.forEach((landmarkIndex, pointIndex) => {
      const color = FINGER_RGB_COLORS[pointIndex];
      const fingertip = hand[landmarkIndex];
      const pulseScale = 1 + Math.sin(time * 5.2 + pointIndex * 1.4 + handIndex) * 0.12;

      points.push({
        x: fingertip.x,
        y: fingertip.y,
        color,
        size: pointSize * 2.5 * pulseScale,
        alpha: 0.12 + intensity * 0.04,
        kind: 0.25
      });

      points.push({
        x: fingertip.x,
        y: fingertip.y,
        color,
        size: pointSize * pulseScale,
        alpha: 0.96
      });
    });
  });

  if (crossHandThreadsControl.checked && projectedHands.length === 2) {
    HAND_TIP_INDICES.forEach((landmarkIndex, fingerIndex) => {
      const leftPoint = projectedHands[0][landmarkIndex];
      const rightPoint = projectedHands[1][landmarkIndex];
      const color = FINGER_RGB_COLORS[fingerIndex];
      const bridge = buildBridgeCurve(leftPoint, rightPoint, pulse, fingerIndex * 1.71);
      const reverseBridge = buildBridgeCurve(
        leftPoint,
        rightPoint,
        pulse + 1250,
        fingerIndex * 1.71 + Math.PI
      );

      pushPolyline(
        segments,
        bridge,
        color,
        color,
        bridgeWidth * 3.2,
        0.11 + intensity * 0.05,
        2
      );
      pushPolyline(
        segments,
        bridge,
        mixColor(color, [1, 1, 1], 0.14),
        color,
        bridgeWidth,
        0.86 + intensity * 0.1,
        2
      );
      pushPolyline(
        segments,
        reverseBridge,
        color,
        mixColor(color, [0.32, 0.84, 1], 0.32),
        bridgeWidth * 0.48,
        0.58 + intensity * 0.12,
        3
      );

      for (let particleIndex = 0; particleIndex < 3; particleIndex += 1) {
        const travel = (time * (0.28 + fingerIndex * 0.018) + particleIndex / 3) % 1;
        const curveIndex = Math.min(
          bridge.length - 1,
          Math.floor(travel * (bridge.length - 1))
        );
        const particle = bridge[curveIndex];

        points.push({
          x: particle.x,
          y: particle.y,
          color: mixColor(color, [1, 1, 1], 0.52),
          size: 5 + intensity * 4,
          alpha: 0.7
        });
      }
    });
  }

  return { segments, points };
}

function buildSolarRenderData(projectedHands, intensity, pulse) {
  if (projectedHands.length < 2) {
    return { segments: [], points: [] };
  }

  const leftCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[0][index]));
  const rightCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[1][index]));
  const center = {
    x: (leftCenter.x + rightCenter.x) * 0.5,
    y: (leftCenter.y + rightCenter.y) * 0.5
  };
  const dx = rightCenter.x - leftCenter.x;
  const dy = rightCenter.y - leftCenter.y;
  const handDistance = Math.hypot(dx, dy);
  const rotation = Math.atan2(dy, dx);
  const availableRadius = Math.max(
    80,
    Math.min(center.x, viewport.width - center.x, center.y, viewport.height - center.y)
  );
  const orbitScale = clamp(handDistance * 0.72, 90, availableRadius * 0.92);
  const time = pulse * 0.001;
  const segments = [];
  const points = [];
  const sunColor = mixColor(hexToRgb("#ffd166"), hexToRgb("#ff6b6b"), 0.35 + Math.sin(time * 0.9) * 0.08);
  const sunSize = clamp(handDistance * (0.16 + intensity * 0.025), 34, 96);

  points.push({
    x: center.x,
    y: center.y,
    color: [1, 0.28, 0.03],
    size: sunSize * 2.7,
    alpha: 0.1 + intensity * 0.04,
    kind: 0.25
  });

  SOLAR_PLANETS.forEach((planet, index) => {
    const baseColor = SOLAR_PLANET_COLORS[index];
    const orbitRadiusX = orbitScale * planet.orbit;
    const orbitRadiusY = orbitRadiusX * planet.eccentricity;
    const orbitWidth = 1.8 + intensity * 2.2;
    const planetAngle = time * planet.speed + planet.phase;
    const orbitSteps = 44;
    const orbitPoints = [];

    for (let step = 0; step <= orbitSteps; step += 1) {
      orbitPoints.push(
        ellipsePoint(center, orbitRadiusX, orbitRadiusY, rotation, (step / orbitSteps) * Math.PI * 2)
      );
    }

    pushPolyline(
      segments,
      orbitPoints,
      mixColor(baseColor, [1, 1, 1], 0.12),
      mixColor(baseColor, [1, 1, 1], 0.22),
      orbitWidth,
      0.18 + intensity * 0.1,
      3
    );

    const planetPosition = ellipsePoint(center, orbitRadiusX, orbitRadiusY, rotation, planetAngle);
    const trailSteps = 10;
    const trailPoints = [];

    for (let step = trailSteps; step >= 0; step -= 1) {
      trailPoints.push(
        ellipsePoint(
          center,
          orbitRadiusX,
          orbitRadiusY,
          rotation,
          planetAngle - step * 0.12
        )
      );
    }

    pushPolyline(
      segments,
      trailPoints,
      mixColor(baseColor, [1, 1, 1], 0.28),
      baseColor,
      3.2 + intensity * 2.8,
      0.34 + intensity * 0.18,
      3
    );

    points.push({
      x: planetPosition.x,
      y: planetPosition.y,
      color: mixColor(baseColor, [1, 1, 1], 0.14 + Math.sin(time * 1.4 + index) * 0.08),
      size: 11 + planet.size * 24 + intensity * 7,
      alpha: 0.96,
      kind: 4 + index * 0.012
    });

    if (index === SOLAR_PLANETS.length - 1) {
      const ringPoints = [];

      for (let step = 0; step <= 28; step += 1) {
        ringPoints.push(
          ellipsePoint(
            planetPosition,
            15 + intensity * 4,
            4.2 + intensity,
            rotation - 0.3,
            (step / 28) * Math.PI * 2
          )
        );
      }

      pushPolyline(
        segments,
        ringPoints,
        mixColor(baseColor, [1, 0.86, 0.58], 0.5),
        [0.72, 0.46, 1],
        2.2 + intensity,
        0.68,
        1
      );
    }
  });

  for (let particleIndex = 0; particleIndex < 28; particleIndex += 1) {
    const seed = particleIndex * 2.399963;
    const radius = orbitScale * (0.58 + 0.055 * Math.sin(particleIndex * 4.7));
    const angle = seed + time * (0.15 + (particleIndex % 5) * 0.012);
    const asteroid = ellipsePoint(center, radius, radius * 0.74, rotation, angle);

    points.push({
      x: asteroid.x,
      y: asteroid.y,
      color: mixColor([0.72, 0.58, 0.46], [1, 0.8, 0.42], (particleIndex % 4) / 4),
      size: 2.2 + (particleIndex % 3) * 0.8 + intensity,
      alpha: 0.42 + (particleIndex % 4) * 0.08
    });
  }

  for (let flareIndex = 0; flareIndex < 3; flareIndex += 1) {
    const flareAngle = time * (0.42 + flareIndex * 0.07) + flareIndex * 2.1;
    const flarePoints = [];

    for (let step = 0; step <= 10; step += 1) {
      const t = step / 10;
      const radius = sunSize * (0.42 + Math.sin(t * Math.PI) * (0.72 + intensity * 0.12));
      flarePoints.push({
        x: center.x + Math.cos(flareAngle + t * 0.72) * radius,
        y: center.y + Math.sin(flareAngle + t * 0.72) * radius
      });
    }

    pushPolyline(
      segments,
      flarePoints,
      [1, 0.28, 0.03],
      [1, 0.92, 0.38],
      2.4 + intensity * 1.4,
      0.52,
      1
    );
  }

  points.push({
    x: center.x,
    y: center.y,
    color: sunColor,
    size: sunSize,
    alpha: 1,
    kind: 3
  });

  return { segments, points };
}

function buildPlanetRenderData(projectedHands, intensity, pulse) {
  if (projectedHands.length < 2) {
    return { segments: [], points: [] };
  }

  const segments = [];
  const points = [];
  const time = pulse * 0.001;
  const leftPalmCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[0][index]));
  const rightPalmCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[1][index]));
  const palmDistance = Math.hypot(
    rightPalmCenter.x - leftPalmCenter.x,
    rightPalmCenter.y - leftPalmCenter.y
  );
  const center = {
    x: (leftPalmCenter.x + rightPalmCenter.x) * 0.5,
    y: (leftPalmCenter.y + rightPalmCenter.y) * 0.5 + Math.sin(time * 2.2) * (palmDistance * 0.03)
  };
  const earthSize = clamp(palmDistance * (0.34 + intensity * 0.08), 54, 190);
  const haloSize = earthSize * 1.42;
  const rotation = Math.atan2(
    rightPalmCenter.y - leftPalmCenter.y,
    rightPalmCenter.x - leftPalmCenter.x
  );

  for (let starIndex = 0; starIndex < 24; starIndex += 1) {
    const angle = starIndex * 2.399963 + time * (0.025 + (starIndex % 3) * 0.006);
    const radius = earthSize * (0.84 + (starIndex % 7) * 0.11);
    const star = ellipsePoint(center, radius, radius * 0.78, rotation * 0.25, angle);

    points.push({
      x: star.x,
      y: star.y,
      color: starIndex % 4 === 0 ? [0.45, 0.78, 1] : [0.9, 0.96, 1],
      size: 2 + (starIndex % 3) * 0.8,
      alpha: 0.28 + (starIndex % 5) * 0.09
    });
  }

  points.push({
    x: center.x,
    y: center.y,
    color: [0.18, 0.54, 1],
    size: haloSize,
    alpha: 0.08 + intensity * 0.06,
    kind: 0.25
  });

  const orbitRadiusX = earthSize * 0.82;
  const orbitRadiusY = earthSize * 0.3;
  const orbitPoints = [];

  for (let step = 0; step <= 48; step += 1) {
    orbitPoints.push(
      ellipsePoint(center, orbitRadiusX, orbitRadiusY, rotation - 0.22, (step / 48) * Math.PI * 2)
    );
  }

  pushPolyline(
    segments,
    orbitPoints,
    [0.2, 0.68, 1],
    [0.7, 0.94, 1],
    2.2 + intensity * 1.4,
    0.42 + intensity * 0.08,
    3
  );

  const moonAngle = time * 0.62;
  const moonPosition = ellipsePoint(center, orbitRadiusX, orbitRadiusY, rotation - 0.22, moonAngle);

  points.push({
    x: moonPosition.x,
    y: moonPosition.y,
    color: [0.72, 0.78, 0.88],
    size: earthSize * 0.16,
    alpha: 0.98,
    kind: 5
  });

  for (let ribbonIndex = 0; ribbonIndex < 2; ribbonIndex += 1) {
    const ribbon = [];

    for (let step = 0; step <= 24; step += 1) {
      const angle = -1.24 + (step / 24) * 2.48;
      ribbon.push(
        ellipsePoint(
          center,
          earthSize * (0.47 + ribbonIndex * 0.035),
          earthSize * (0.17 + ribbonIndex * 0.025),
          rotation + 0.86,
          angle + Math.sin(time * 1.2 + ribbonIndex) * 0.08
        )
      );
    }

    pushPolyline(
      segments,
      ribbon,
      ribbonIndex === 0 ? [0.08, 1, 0.56] : [0.2, 0.66, 1],
      ribbonIndex === 0 ? [0.28, 0.78, 1] : [0.68, 0.34, 1],
      2.4 + intensity * 1.8,
      0.34 + intensity * 0.08,
      3
    );
  }

  points.push({
    x: center.x,
    y: center.y,
    color: [0.16, 0.62, 1],
    size: earthSize,
    alpha: 0.98,
    kind: 1.1
  });

  return { segments, points };
}

function getBlackHoleMetrics(projectedHands, intensity, pulse) {
  if (projectedHands.length < 2) {
    return null;
  }

  const time = pulse * 0.001;
  const leftPalmCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[0][index]));
  const rightPalmCenter = averagePoints(PALM_SUPPORT_INDICES.map((index) => projectedHands[1][index]));
  const spanX = rightPalmCenter.x - leftPalmCenter.x;
  const spanY = rightPalmCenter.y - leftPalmCenter.y;
  const palmDistance = Math.hypot(spanX, spanY);
  const rotation = Math.atan2(spanY, spanX);
  const center = {
    x: (leftPalmCenter.x + rightPalmCenter.x) * 0.5,
    y:
      (leftPalmCenter.y + rightPalmCenter.y) * 0.5 +
      Math.sin(time * 2.4) * clamp(palmDistance * 0.045, 6, 24)
  };
  const eventHorizonSize = clamp(palmDistance * (0.22 + intensity * 0.06), 48, 150);
  const lensSize = eventHorizonSize * 1.72;
  const diskRadius = eventHorizonSize * 1.44;

  return {
    time,
    intensity,
    center,
    palmDistance,
    rotation,
    eventHorizonSize,
    lensSize,
    diskRadius
  };
}

function distortPointAroundBlackHole(point, metrics, amount = 1) {
  const dx = point.x - metrics.center.x;
  const dy = point.y - metrics.center.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 0.001) {
    return { ...point };
  }

  const influenceRadius = metrics.lensSize * 1.9;

  if (distance >= influenceRadius) {
    return { ...point };
  }

  const influence = 1 - distance / influenceRadius;
  const falloff = influence * influence;
  const radialX = dx / distance;
  const radialY = dy / distance;
  const tangentX = -radialY;
  const tangentY = radialX;
  const ringBand = Math.exp(
    -Math.pow((distance - metrics.diskRadius * 0.76) / Math.max(metrics.eventHorizonSize * 0.62, 1), 2)
  );
  const radialPull = -metrics.eventHorizonSize * 0.07 * falloff * amount;
  const ringLift = metrics.eventHorizonSize * 0.11 * ringBand * amount;
  const swirl =
    metrics.eventHorizonSize *
    (0.1 + metrics.intensity * 0.05) *
    falloff *
    Math.sin(metrics.time * 2.1 + distance * 0.018) *
    amount;

  return {
    x: point.x + radialX * (radialPull + ringLift) + tangentX * swirl,
    y: point.y + radialY * (radialPull + ringLift) + tangentY * swirl,
    z: point.z ?? 0
  };
}

function distortPolylineAroundBlackHole(points, metrics, amount = 1) {
  return points.map((point) => distortPointAroundBlackHole(point, metrics, amount));
}

function createBlackHoleSpaceWarp(metrics) {
  const normalizedRadius = metrics.lensSize / Math.max(Math.min(viewport.width, viewport.height), 1);

  return {
    center: {
      x: metrics.center.x / viewport.width,
      y: metrics.center.y / viewport.height
    },
    radius: normalizedRadius * 1.08,
    strength: 0.78 + metrics.intensity * 0.46,
    spin: 0.38 + metrics.intensity * 0.24
  };
}

function buildBlackHoleRenderData(projectedHands, intensity, pulse) {
  const metrics = getBlackHoleMetrics(projectedHands, intensity, pulse);

  if (!metrics) {
    return { segments: [], points: [], spaceWarp: null };
  }

  const segments = [];
  const points = [];

  points.push({
    x: metrics.center.x,
    y: metrics.center.y,
    color: [0.03, 0.05, 0.11],
    size: metrics.lensSize * 2.46,
    alpha: 0.12 + intensity * 0.07,
    kind: 0.25
  });

  points.push({
    x: metrics.center.x,
    y: metrics.center.y,
    color: [0, 0, 0],
    size: metrics.lensSize * 2.22,
    alpha: 0.72 + intensity * 0.16,
    kind: -1
  });

  points.push({
    x: metrics.center.x,
    y: metrics.center.y,
    color: [0.88, 0.48, 0.12],
    size: metrics.diskRadius * 2.36,
    alpha: 0.98,
    kind: 2
  });

  const orbitBands = [
    { radius: 0.98, eccentricity: 0.36, width: 3.8, alpha: 0.7, speed: 1.5, phase: 0.2, colorA: 0, colorB: 1 },
    { radius: 1.22, eccentricity: 0.48, width: 3.2, alpha: 0.56, speed: -1.1, phase: 1.4, colorA: 1, colorB: 2 },
    { radius: 1.44, eccentricity: 0.58, width: 2.4, alpha: 0.44, speed: 0.86, phase: 2.6, colorA: 2, colorB: 3 }
  ];

  orbitBands.forEach((band, bandIndex) => {
    const bandPoints = [];
    const steps = 42;
    const orbitRotation = metrics.rotation + metrics.time * 0.12 * (bandIndex % 2 === 0 ? 1 : -1);

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const angle = band.phase + metrics.time * band.speed + t * Math.PI * 2.0;
      const inwardPull = 1 - Math.sin(t * Math.PI) * 0.17;
      const radiusX = metrics.diskRadius * band.radius * inwardPull;
      const radiusY = radiusX * band.eccentricity;
      const wobble = 1 + Math.sin(metrics.time * 3.1 + t * 10.0 + bandIndex) * 0.04;

      bandPoints.push(
        ellipsePoint(metrics.center, radiusX * wobble, radiusY * wobble, orbitRotation, angle)
      );
    }

    const warpedBandPoints = distortPolylineAroundBlackHole(bandPoints, metrics, 0.8);

    pushPolyline(
      segments,
      warpedBandPoints,
      BLACK_HOLE_RING_COLORS[band.colorA],
      BLACK_HOLE_RING_COLORS[band.colorB],
      band.width + intensity * 2.2,
      band.alpha + intensity * 0.12
    );

    for (let debrisIndex = 0; debrisIndex < 7; debrisIndex += 1) {
      const debrisAngle =
        band.phase + metrics.time * (band.speed * 1.22) + debrisIndex * 0.74 + bandIndex * 0.4;
      const debrisRadius =
        metrics.diskRadius * (band.radius + 0.04 * Math.sin(metrics.time * 2.1 + debrisIndex));
      const debrisPoint = distortPointAroundBlackHole(
        ellipsePoint(
          metrics.center,
          debrisRadius,
          debrisRadius * band.eccentricity,
          orbitRotation,
          debrisAngle
        ),
        metrics,
        1.05
      );
      const debrisColor = mixColor(
        BLACK_HOLE_RING_COLORS[band.colorA],
        BLACK_HOLE_RING_COLORS[band.colorB],
        (debrisIndex + 1) / 7
      );

      points.push({
        x: debrisPoint.x,
        y: debrisPoint.y,
        color: debrisColor,
        size: 5.5 + intensity * 5 + bandIndex * 1.4,
        alpha: 0.38 + band.alpha * 0.42
      });
    }
  });

  const jetLength = metrics.diskRadius * 1.75;
  const jetDirection = rotateVector(0, 1, metrics.rotation + Math.PI * 0.5);
  const jetBaseColor = hexToRgb("#8ce9ff");
  const jetTipColor = hexToRgb("#5a6bff");

  [
    { direction: 1, seed: 0 },
    { direction: -1, seed: Math.PI }
  ].forEach(({ direction, seed }) => {
    const jetPath = [
      {
        x: metrics.center.x + jetDirection.x * metrics.eventHorizonSize * 0.14 * direction,
        y: metrics.center.y + jetDirection.y * metrics.eventHorizonSize * 0.14 * direction
      },
      {
        x:
          metrics.center.x +
          jetDirection.x * jetLength * 0.56 * direction +
          Math.sin(metrics.time * 4.2 + seed) * metrics.eventHorizonSize * 0.14,
        y:
          metrics.center.y +
          jetDirection.y * jetLength * 0.56 * direction +
          Math.cos(metrics.time * 3.6 + seed) * metrics.eventHorizonSize * 0.1
      },
      {
        x:
          metrics.center.x +
          jetDirection.x * jetLength * direction +
          Math.sin(metrics.time * 5.1 + seed) * metrics.eventHorizonSize * 0.22,
        y:
          metrics.center.y +
          jetDirection.y * jetLength * direction +
          Math.cos(metrics.time * 4.8 + seed) * metrics.eventHorizonSize * 0.18
      }
    ];

    const warpedJetPath = distortPolylineAroundBlackHole(jetPath, metrics, 0.55);

    pushPolyline(
      segments,
      warpedJetPath,
      jetBaseColor,
      jetTipColor,
      4.2 + intensity * 2.8,
      0.3 + intensity * 0.16
    );
  });

  return {
    segments,
    points,
    spaceWarp: createBlackHoleSpaceWarp(metrics)
  };
}

function buildFilterOverlayData(projectedHands, intensity, pulse) {
  if (!filterWindowsEnabled) {
    return { filterWindows: [], segments: [], points: [] };
  }

  const sharedGesture = detectSharedGesture(projectedHands);

  if (!sharedGesture) {
    return { filterWindows: [], segments: [], points: [] };
  }

  const window = buildGestureWindow(sharedGesture.gesture, projectedHands[0], projectedHands[1]);

  if (!window) {
    return { filterWindows: [], segments: [], points: [] };
  }

  const time = pulse * 0.001;
  const segments = [];
  const points = [];
  const shimmer = 0.5 + 0.5 * Math.sin(time * 3.8 + sharedGesture.confidence * 2.4);
  const edgeColorA =
    window.style === FILTER_STYLE_MONO
      ? mixColor(FILTER_OUTLINE_A, FILTER_OUTLINE_B, 0.28 + shimmer * 0.32)
      : mixColor(FILTER_PIXEL_A, FILTER_PIXEL_B, 0.2 + shimmer * 0.42);
  const edgeColorB =
    window.style === FILTER_STYLE_MONO
      ? mixColor(FILTER_OUTLINE_B, FILTER_OUTLINE_A, 0.18 + (1 - shimmer) * 0.28)
      : mixColor(FILTER_PIXEL_B, FILTER_PIXEL_A, 0.24 + (1 - shimmer) * 0.34);
  const edgeWidth = 4.2 + intensity * 2.6;
  const edgeAlpha = 0.78 + sharedGesture.confidence * 0.18;
  const center = averagePoints(window.points);

  pushClosedPolyline(
    segments,
    scalePolygon(window.points, 1.035),
    mixColor(edgeColorA, [0.2, 0.58, 1], 0.38),
    mixColor(edgeColorB, [0.82, 0.42, 1], 0.34),
    edgeWidth * 2.8,
    0.14 + sharedGesture.confidence * 0.06,
    2
  );
  pushClosedPolyline(
    segments,
    window.points,
    edgeColorA,
    edgeColorB,
    edgeWidth,
    edgeAlpha,
    2
  );

  points.push({
    x: center.x,
    y: center.y,
    color: window.style === FILTER_STYLE_MONO ? FILTER_GLOW : FILTER_PIXEL_A,
    size: 14 + intensity * 10,
    alpha: 0.16,
    kind: 0.25
  });

  window.points.forEach((point) => {
    points.push({
      x: point.x,
      y: point.y,
      color: mixColor(edgeColorA, [1, 1, 1], 0.22),
      size: 7 + intensity * 4,
      alpha: 0.48
    });
  });

  for (let particleIndex = 0; particleIndex < 12; particleIndex += 1) {
    const edgeIndex = particleIndex % window.points.length;
    const nextIndex = (edgeIndex + 1) % window.points.length;
    const edgeStart = window.points[edgeIndex];
    const edgeEnd = window.points[nextIndex];
    const travel = (time * 0.24 + particleIndex * 0.173) % 1;

    points.push({
      x: edgeStart.x + (edgeEnd.x - edgeStart.x) * travel,
      y: edgeStart.y + (edgeEnd.y - edgeStart.y) * travel,
      color: mixColor(edgeColorA, edgeColorB, travel),
      size: 3.5 + intensity * 2,
      alpha: 0.58
    });
  }

  return {
    filterWindows: [
      {
        points: window.points,
        alpha: 0.96,
        style: window.style
      }
    ],
    segments,
    points
  };
}

function buildRenderData(projectedHands, intensity, pulse) {
  const filterOverlayData = buildFilterOverlayData(projectedHands, intensity, pulse);

  if (filterWindowsEnabled) {
    return filterOverlayData;
  }

  let baseRenderData;

  if (currentMode === MODE_SOLAR) {
    baseRenderData = buildSolarRenderData(projectedHands, intensity, pulse);
  } else if (currentMode === MODE_BLACK_HOLE) {
    baseRenderData = buildBlackHoleRenderData(projectedHands, intensity, pulse);
  } else if (currentMode === MODE_PLANET) {
    baseRenderData = buildPlanetRenderData(projectedHands, intensity, pulse);
  } else {
    baseRenderData = buildThreadRenderData(projectedHands, intensity, pulse);
  }

  return {
    segments: [...baseRenderData.segments, ...filterOverlayData.segments],
    points: [...baseRenderData.points, ...filterOverlayData.points],
    filterWindows: filterOverlayData.filterWindows,
    spaceWarp: baseRenderData.spaceWarp ?? null
  };
}

function setMode(nextMode) {
  currentMode = nextMode;
  filterWindowsEnabled = false;
  syncModeControls();
  if (!isStarting && !isSwitching) setStatus(getReadyStatus());
}

function setFilterWindowsEnabled(nextState) {
  filterWindowsEnabled = nextState;
  syncModeControls();

  if (!isStarting && !isSwitching) setStatus(getReadyStatus());
}

function renderScene(handResults, now) {
  const metrics = getCoverMetrics();

  if (!metrics || !sceneRenderer) {
    return;
  }

  const videoOpacity = Number.parseInt(videoOpacityControl.value, 10) / 100;
  const intensity = Number.parseInt(intensityControl.value, 10) / 100;
  const detectedHands = handResults?.landmarks?.map((hand) => hand.map((point) => ({ ...point }))) ?? [];
  const count = detectedHands.length;
  const countText = count ? `${count} ${count === 1 ? "mano detectada" : "manos detectadas"}` : "Muestra tus manos";
  if (handCount.textContent !== countText) handCount.textContent = countText;
  const orderedHands = detectedHands
    .map((hand) => [...hand])
    .sort((handA, handB) => handA[0].x - handB[0].x);
  const smoothedProjectedHands = projectHands(smoothHands(orderedHands), metrics);
  const { segments, points, filterWindows, spaceWarp } = buildRenderData(
    smoothedProjectedHands,
    intensity,
    now
  );

  sceneRenderer.renderFrame({
    video,
    videoOpacity,
    mirror: mirrorViewControl.checked,
    cropOffset: [-metrics.offsetX / metrics.drawWidth, -metrics.offsetY / metrics.drawHeight],
    cropScale: [viewport.width / metrics.drawWidth, viewport.height / metrics.drawHeight],
    time: now,
    segments,
    points,
    filterWindows,
    spaceWarp
  });
}

function cancelDetectionLoop() {
  window.cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;

  if (SUPPORTS_VIDEO_FRAME_CALLBACK && videoFrameCallbackId) {
    video.cancelVideoFrameCallback(videoFrameCallbackId);
    videoFrameCallbackId = 0;
  }
}

function scheduleNextDetection() {
  if (SUPPORTS_VIDEO_FRAME_CALLBACK) {
    videoFrameCallbackId = video.requestVideoFrameCallback(detectHands);
    return;
  }

  animationFrameId = window.requestAnimationFrame(detectHands);
}

function detectHands() {
  if (!handLandmarker || !isRunning || document.hidden) {
    return;
  }

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.currentTime !== lastVideoTime) {
    const now = performance.now();
    let handResults = null;

    try {
      handResults = handLandmarker.detectForVideo(video, now);
    } catch (error) {
      console.error("Fallo la deteccion de manos.", error);
      stopExperience("Se interrumpió la detección. Puedes activar la cámara para intentarlo de nuevo.");
      return;
    }

    renderScene(handResults, now);
    lastVideoTime = video.currentTime;
  }

  scheduleNextDetection();
}

async function updateCameraChoices(selectedDeviceId = "") {
  const cameras = (await navigator.mediaDevices.enumerateDevices()).filter(
    (device) => device.kind === "videoinput"
  );

  if (!cameraSession.stream) return;
  cameraSelect.replaceChildren();

  if (!cameras.length) {
    const option = new Option("No se detectaron cámaras", "");
    cameraSelect.add(option);
    cameraSelect.disabled = true;
    return;
  }

  cameras.forEach((camera, index) => {
    const label = camera.label || `Cámara ${index + 1}`;
    cameraSelect.add(new Option(label, camera.deviceId));
  });

  const cameraWasFound = cameras.some((camera) => camera.deviceId === selectedDeviceId);
  cameraSelect.value = cameraWasFound ? selectedDeviceId : cameras[0].deviceId;
  cameraSelect.disabled = false;
}

async function setupCamera(deviceId = "") {
  if (!await cameraSession.start(deviceId)) return false;
  activeCameraDeviceId = cameraSession.deviceId;
  try {
    await updateCameraChoices(activeCameraDeviceId);
  } catch (error) {
    console.warn("No se pudo actualizar la lista de cámaras.", error);
    cameraSelect.disabled = true;
  }
  cameraSession.stream?.getVideoTracks()[0]?.addEventListener("ended", () => {
    if (isRunning && cameraSession.stream?.getVideoTracks()[0]?.readyState === "ended") {
      stopExperience("La cámara se desconectó. Conéctala y vuelve a intentarlo.");
    }
  }, { once: true });
  resizeScene();
  return true;
}

function createGpuProcessingCanvas() {
  if (typeof OffscreenCanvas !== "undefined") {
    const offscreenCanvas = new OffscreenCanvas(1, 1);
    const offscreenContext = offscreenCanvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: false
    });

    if (offscreenContext) {
      return offscreenCanvas;
    }
  }

  const gpuCanvas = document.createElement("canvas");
  gpuCanvas.width = 1;
  gpuCanvas.height = 1;

  const gpuContext = gpuCanvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: false
  });

  return gpuContext ? gpuCanvas : null;
}

function getVisionFileset() {
  visionFilesetPromise ??= FilesetResolver.forVisionTasks(WASM_ASSET_URL);
  return visionFilesetPromise;
}

async function createHandLandmarker(delegate) {
  const vision = await getVisionFileset();
  const taskCanvas = delegate === GPU_DELEGATE ? createGpuProcessingCanvas() : undefined;

  if (delegate === GPU_DELEGATE && !taskCanvas) {
    throw new Error("WebGL2 no esta disponible para MediaPipe GPU.");
  }

  return HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_URL,
      delegate
    },
    canvas: taskCanvas,
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.55,
    minHandPresenceConfidence: 0.55,
    minTrackingConfidence: 0.5
  });
}

async function setupHandLandmarker(operation) {
  let landmarker;
  try {
    setStatus("Preparando los efectos. La primera carga puede tardar unos segundos...");
    landmarker = await createHandLandmarker(GPU_DELEGATE);
    activeDelegate = GPU_DELEGATE;
  } catch (error) {
    if (operation !== operationId) return;
    console.warn("Fallo la inicializacion GPU. Se usa CPU.", error);
    landmarker = await createHandLandmarker(CPU_DELEGATE);
    activeDelegate = CPU_DELEGATE;
  }
  if (operation !== operationId) {
    landmarker.close();
    return;
  }
  handLandmarker = landmarker;
}

function describeStartError(error) {
  const messages = {
    NotAllowedError: "No se autorizó la cámara. Permite su uso en la configuración de este sitio y vuelve a intentarlo.",
    NotFoundError: "No encontramos una cámara. Conecta una y vuelve a intentarlo.",
    NotReadableError: "No se pudo abrir la cámara. Comprueba que otra aplicación no la esté usando.",
    OverconstrainedError: "La cámara seleccionada no está disponible. Elige otra cámara."
  };
  if (messages[error?.name]) return messages[error.name];
  if (String(error?.message).includes("WebGL2")) return "Tu navegador no tiene gráficos WebGL2 disponibles. Prueba con un navegador actualizado y aceleración gráfica activada.";
  return "No se pudo iniciar la experiencia. Comprueba tu conexión y vuelve a intentarlo.";
}

function stopExperience(message = "Cámara apagada. Puedes volver a activarla cuando quieras.") {
  ++operationId;
  isRunning = false;
  isStarting = false;
  isSwitching = false;
  cancelDetectionLoop();
  cameraSession.stop();
  handLandmarker?.close();
  handLandmarker = null;
  smoothedHands = [];
  lastVideoTime = -1;
  activeCameraDeviceId = "";
  document.body.dataset.camera = "off";
  welcome.hidden = false;
  startCameraButton.disabled = false;
  startCameraButton.textContent = "Activar cámara ↗";
  stopCameraButton.disabled = true;
  cameraSelect.replaceChildren(new Option("Activa la cámara primero", ""));
  cameraSelect.disabled = true;
  handCount.textContent = "Cámara apagada";
  startMessage.textContent = message;
  setStatus(message);
}

async function bootstrap() {
  if (isStarting || isRunning) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    startMessage.textContent = "Abre esta página mediante HTTPS para usar la cámara.";
    return;
  }
  const operation = ++operationId;
  isStarting = true;
  startCameraButton.disabled = true;
  startCameraButton.textContent = "Activando…";
  startMessage.textContent = "Permite el acceso a la cámara cuando lo solicite tu navegador.";
  stopCameraButton.disabled = false;
  try {
    sceneRenderer ??= new WebGLThreadRenderer(canvas);
    resizeScene();
    setStatus("Esperando permiso para usar la cámara...");
    if (!await setupCamera() || operation !== operationId) return;
    await setupHandLandmarker(operation);
    if (operation !== operationId) return;
    isRunning = true;
    isStarting = false;
    document.body.dataset.camera = "running";
    welcome.hidden = true;
    startMessage.textContent = "";
    resizeScene();
    setStatus(getReadyStatus());
    detectHands();
  } catch (error) {
    if (operation !== operationId) return;
    visionFilesetPromise = undefined;
    stopExperience(describeStartError(error));
    console.error(error);
  }
}

syncModeControls();

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.mode === MODE_SOLAR) {
      setMode(MODE_SOLAR);
      return;
    }

    if (button.dataset.mode === MODE_BLACK_HOLE) {
      setMode(MODE_BLACK_HOLE);
      return;
    }

    if (button.dataset.mode === MODE_PLANET) {
      setMode(MODE_PLANET);
      return;
    }

    setMode(MODE_THREADS);
  });
});

filterWindowsButton?.addEventListener("click", () => {
  setFilterWindowsEnabled(!filterWindowsEnabled);
});

cameraSelect?.addEventListener("change", async () => {
  const deviceId = cameraSelect.value;

  if (!isRunning || isSwitching || !deviceId || deviceId === activeCameraDeviceId) {
    return;
  }

  const operation = operationId;
  isSwitching = true;
  cancelDetectionLoop();
  cameraSelect.disabled = true;
  setStatus("Cambiando de cámara...");

  try {
    if (!await setupCamera(deviceId) || operation !== operationId) return;
    lastVideoTime = -1;
    setStatus(getReadyStatus());
  } catch (error) {
    if (operation !== operationId) return;
    setStatus("No se pudo cambiar de cámara. Seguimos usando la anterior.");
    console.error("No se pudo cambiar la cámara.", error);
    cameraSelect.value = activeCameraDeviceId;
    cameraSelect.disabled = false;
  } finally {
    if (operation === operationId) {
      isSwitching = false;
      smoothedHands = [];
      lastVideoTime = -1;
      if (isRunning && !document.hidden) scheduleNextDetection();
    }
  }
});

window.addEventListener("resize", resizeScene);
startCameraButton.addEventListener("click", bootstrap);
stopCameraButton.addEventListener("click", () => stopExperience());
window.addEventListener("pagehide", () => stopExperience());
document.addEventListener("visibilitychange", () => {
  cancelDetectionLoop();
  if (isRunning && !document.hidden) {
    lastVideoTime = -1;
    scheduleNextDetection();
  }
});
new ResizeObserver(resizeScene).observe(canvas);
