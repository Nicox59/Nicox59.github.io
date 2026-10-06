const VIDEO_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aUv;

out vec2 vUv;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = aUv;
}
`;

const VIDEO_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;

uniform sampler2D uVideo;
uniform vec2 uCropOffset;
uniform vec2 uCropScale;
uniform vec2 uResolution;
uniform float uVideoOpacity;
uniform float uMirror;
uniform float uTime;
uniform vec2 uWarpCenter;
uniform float uWarpRadius;
uniform float uWarpStrength;
uniform float uWarpSpin;
uniform float uWarpEnabled;

out vec4 outColor;

vec2 applyWarp(vec2 screenUv, out float influence, out vec2 radialDir, out float ring) {
  influence = 0.0;
  radialDir = vec2(0.0, 0.0);
  ring = 0.0;

  if (uWarpEnabled < 0.5) {
    return screenUv;
  }

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 centered = screenUv - uWarpCenter;
  vec2 scaled = vec2(centered.x * aspect, centered.y);
  float distanceToCenter = length(scaled);

  if (distanceToCenter < 0.0001) {
    return screenUv;
  }

  float angle = atan(scaled.y, scaled.x);
  float fieldRadius = uWarpRadius * 2.35;
  influence = 1.0 - smoothstep(uWarpRadius * 0.08, fieldRadius, distanceToCenter);
  float deepCore = 1.0 - smoothstep(uWarpRadius * 0.06, uWarpRadius * 0.92, distanceToCenter);
  ring = exp(-pow((distanceToCenter - uWarpRadius * 0.82) / max(uWarpRadius * 0.3, 0.0001), 2.0));
  radialDir = scaled / distanceToCenter;
  vec2 tangent = vec2(-radialDir.y, radialDir.x);
  float pinch = uWarpStrength * (0.18 * influence + 0.12 * deepCore + 0.08 * ring);
  float suction = uWarpStrength * 0.06 * influence * sin(uTime * 2.3 + angle * 5.0 + distanceToCenter * 16.0);
  float swirl =
    uWarpSpin *
    uWarpStrength *
    influence *
    (0.065 + ring * 0.04) *
    (1.0 + 0.35 * sin(uTime * 1.9 + distanceToCenter * 24.0));
  float noodle =
    uWarpStrength *
    influence *
    (0.028 + ring * 0.05) *
    sin(angle * 7.0 - uTime * 3.4 + distanceToCenter * 42.0);
  vec2 warped =
    scaled -
    radialDir * pinch +
    radialDir * suction +
    tangent * swirl +
    tangent * noodle;

  return uWarpCenter + vec2(warped.x / aspect, warped.y);
}

vec2 toVideoUv(vec2 screenUv) {
  float sampleX = mix(screenUv.x, 1.0 - screenUv.x, uMirror);
  return uCropOffset + vec2(sampleX, 1.0 - screenUv.y) * uCropScale;
}

void main() {
  float influence;
  vec2 radialDir;
  float ring;
  vec2 screenUv = vec2(vUv.x, 1.0 - vUv.y);
  vec2 warpedScreenUv = applyWarp(screenUv, influence, radialDir, ring);
  vec2 radialScreenDir = vec2(
    radialDir.x / max(uResolution.x / max(uResolution.y, 1.0), 0.0001),
    radialDir.y
  );
  vec2 dragOffset = radialScreenDir * uWarpRadius * (0.1 * influence + 0.12 * ring);
  vec2 curlOffset = vec2(-radialScreenDir.y, radialScreenDir.x) * uWarpRadius * 0.045 * influence;
  vec3 sampleA = texture(uVideo, toVideoUv(warpedScreenUv - dragOffset - curlOffset)).rgb;
  vec3 sampleB = texture(uVideo, toVideoUv(warpedScreenUv)).rgb;
  vec3 sampleC = texture(uVideo, toVideoUv(warpedScreenUv + dragOffset * 0.4 + curlOffset * 0.6)).rgb;
  vec3 videoColor = mix(sampleB, (sampleA * 0.34 + sampleB * 0.4 + sampleC * 0.26), clamp(influence * 1.1, 0.0, 1.0));
  videoColor *= uVideoOpacity;
  outColor = vec4(videoColor, 1.0);
}
`;

const FILTER_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec2 aScreenUv;
in float aAlpha;
in float aStyle;

out vec2 vScreenUv;
out float vAlpha;
out float vStyle;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vScreenUv = aScreenUv;
  vAlpha = aAlpha;
  vStyle = aStyle;
}
`;

const FILTER_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 vScreenUv;
in float vAlpha;
in float vStyle;

uniform sampler2D uVideo;
uniform vec2 uCropOffset;
uniform vec2 uCropScale;
uniform vec2 uResolution;
uniform float uMirror;
uniform float uTime;
uniform vec2 uWarpCenter;
uniform float uWarpRadius;
uniform float uWarpStrength;
uniform float uWarpSpin;
uniform float uWarpEnabled;

out vec4 outColor;

vec2 applyWarp(vec2 screenUv, out float influence, out vec2 radialDir, out float ring) {
  influence = 0.0;
  radialDir = vec2(0.0, 0.0);
  ring = 0.0;

  if (uWarpEnabled < 0.5) {
    return screenUv;
  }

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 centered = screenUv - uWarpCenter;
  vec2 scaled = vec2(centered.x * aspect, centered.y);
  float distanceToCenter = length(scaled);

  if (distanceToCenter < 0.0001) {
    return screenUv;
  }

  float angle = atan(scaled.y, scaled.x);
  float fieldRadius = uWarpRadius * 2.35;
  influence = 1.0 - smoothstep(uWarpRadius * 0.08, fieldRadius, distanceToCenter);
  float deepCore = 1.0 - smoothstep(uWarpRadius * 0.06, uWarpRadius * 0.92, distanceToCenter);
  ring = exp(-pow((distanceToCenter - uWarpRadius * 0.82) / max(uWarpRadius * 0.3, 0.0001), 2.0));
  radialDir = scaled / distanceToCenter;
  vec2 tangent = vec2(-radialDir.y, radialDir.x);
  float pinch = uWarpStrength * (0.18 * influence + 0.12 * deepCore + 0.08 * ring);
  float suction = uWarpStrength * 0.06 * influence * sin(uTime * 2.3 + angle * 5.0 + distanceToCenter * 16.0);
  float swirl =
    uWarpSpin *
    uWarpStrength *
    influence *
    (0.065 + ring * 0.04) *
    (1.0 + 0.35 * sin(uTime * 1.9 + distanceToCenter * 24.0));
  float noodle =
    uWarpStrength *
    influence *
    (0.028 + ring * 0.05) *
    sin(angle * 7.0 - uTime * 3.4 + distanceToCenter * 42.0);
  vec2 warped =
    scaled -
    radialDir * pinch +
    radialDir * suction +
    tangent * swirl +
    tangent * noodle;

  return uWarpCenter + vec2(warped.x / aspect, warped.y);
}

vec2 sampleVideoUv(vec2 screenUv) {
  float influence;
  vec2 radialDir;
  float ring;
  vec2 warpedScreenUv = applyWarp(screenUv, influence, radialDir, ring);
  float sampleX = mix(warpedScreenUv.x, 1.0 - warpedScreenUv.x, uMirror);
  float sampleY = 1.0 - warpedScreenUv.y;
  return uCropOffset + vec2(sampleX, sampleY) * uCropScale;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 saturateColor(vec3 color, float amount) {
  float gray = luma(color);
  return mix(vec3(gray), color, amount);
}

vec3 posterizeColor(vec3 color, vec3 levels) {
  return floor(color * (levels - 1.0) + 0.5) / (levels - 1.0);
}

void main() {
  vec3 color;

  if (vStyle < 0.5) {
    float ripple = sin(vScreenUv.y * uResolution.y * 0.08 + uTime * 3.6) * 2.4;
    vec2 rippleOffset = vec2(ripple / uResolution.x, 0.0);
    vec2 sampleUv = sampleVideoUv(vScreenUv + rippleOffset);
    vec3 sampled = texture(uVideo, sampleUv).rgb;
    vec2 texel = vec2(2.0 / uResolution.x, 2.0 / uResolution.y);
    float gray = luma(sampled);
    float leftGray = luma(texture(uVideo, sampleVideoUv(vScreenUv - vec2(texel.x, 0.0))).rgb);
    float rightGray = luma(texture(uVideo, sampleVideoUv(vScreenUv + vec2(texel.x, 0.0))).rgb);
    float upGray = luma(texture(uVideo, sampleVideoUv(vScreenUv - vec2(0.0, texel.y))).rgb);
    float downGray = luma(texture(uVideo, sampleVideoUv(vScreenUv + vec2(0.0, texel.y))).rgb);
    float edge = smoothstep(0.12, 0.42, abs(rightGray - leftGray) + abs(downGray - upGray));
    float noir = smoothstep(0.14, 0.86, gray);
    float grain = hash(floor(vScreenUv * uResolution * 0.5) + floor(uTime * 12.0)) - 0.5;
    float scanline = 0.94 + 0.06 * sin(vScreenUv.y * uResolution.y * 0.38);
    noir = clamp((noir - 0.5) * 1.34 + 0.5 + grain * 0.07, 0.0, 1.0);
    color = vec3(noir * scanline);
    color = mix(color, vec3(0.82, 0.94, 1.0), edge * 0.42);
  } else {
    float pixelSize = 7.0;
    vec2 grid = floor(vScreenUv * uResolution / pixelSize);
    vec2 pixelUv = ((grid * pixelSize) + pixelSize * 0.5) / uResolution;
    vec2 sampleUv = sampleVideoUv(pixelUv);
    vec3 sampled = texture(uVideo, sampleUv).rgb;
    vec2 edgeOffset = vec2(pixelSize / uResolution.x, pixelSize / uResolution.y);
    vec3 sampledLeft = texture(uVideo, sampleVideoUv(pixelUv - vec2(edgeOffset.x, 0.0))).rgb;
    vec3 sampledRight = texture(uVideo, sampleVideoUv(pixelUv + vec2(edgeOffset.x, 0.0))).rgb;
    vec3 sampledUp = texture(uVideo, sampleVideoUv(pixelUv - vec2(0.0, edgeOffset.y))).rgb;
    vec3 sampledDown = texture(uVideo, sampleVideoUv(pixelUv + vec2(0.0, edgeOffset.y))).rgb;

    vec3 boosted = pow(sampled, vec3(0.92));
    boosted = clamp((boosted - 0.5) * 1.18 + 0.5, 0.0, 1.0);
    boosted = saturateColor(boosted, 1.08);

    float centerLuma = luma(boosted);
    float leftLuma = luma(sampledLeft);
    float rightLuma = luma(sampledRight);
    float upLuma = luma(sampledUp);
    float downLuma = luma(sampledDown);
    vec3 spriteBase = boosted;
    float orderedDither = fract(grid.x * 0.5 + grid.y * 0.25) - 0.375;
    spriteBase += orderedDither / 48.0;
    spriteBase = clamp(spriteBase, 0.0, 1.0);
    vec3 rgb565 = posterizeColor(spriteBase, vec3(8.0, 8.0, 8.0));

    float edgeMetric =
      abs(centerLuma - leftLuma) +
      abs(centerLuma - rightLuma) +
      abs(centerLuma - upLuma) +
      abs(centerLuma - downLuma);
    float edge = smoothstep(0.18, 0.38, edgeMetric);
    float scanline = 0.97 + 0.03 * sin(vScreenUv.y * uResolution.y * 0.24);

    color = rgb565;
    color = mix(color, color * 0.22, edge);
    color *= scanline;
  }

  outColor = vec4(color, vAlpha);
}
`;

const SEGMENT_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec3 aColor;
in vec2 aUv;
in float aAlpha;
in float aKind;

out vec3 vColor;
out vec2 vUv;
out float vAlpha;
out float vKind;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vColor = aColor;
  vUv = aUv;
  vAlpha = aAlpha;
  vKind = aKind;
}
`;

const SEGMENT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vColor;
in vec2 vUv;
in float vAlpha;
in float vKind;

uniform float uTime;

out vec4 outColor;

vec3 rgbCycle(float phase) {
  vec3 wave = 0.5 + 0.5 * sin(phase + vec3(0.0, 2.09439510239, 4.18879020479));
  vec3 darkRgb = mix(vec3(0.1, 0.08, 0.12), vec3(0.72, 0.68, 0.78), pow(wave, vec3(1.35)));
  return darkRgb;
}

void main() {
  float edge = 1.0 - smoothstep(0.08, 1.0, abs(vUv.y));
  float halo = 1.0 - smoothstep(0.0, 0.86, abs(vUv.y));
  float innerGlow = 1.0 - smoothstep(0.0, 0.42, abs(vUv.y));
  float core = 1.0 - smoothstep(0.0, 0.12, abs(vUv.y));

  if (vKind > 2.5) {
    float travelingPulse = pow(
      max(0.0, 0.5 + 0.5 * sin(vUv.x * 24.0 - uTime * 6.4)),
      7.0
    );
    vec3 spectral = mix(vColor, vec3(0.72, 0.94, 1.0), innerGlow * 0.42 + travelingPulse * 0.48);
    float alpha = edge * vAlpha * (0.72 + travelingPulse * 0.5);
    vec3 emission = spectral * (0.58 + halo * 0.48 + innerGlow * 0.82 + core * 0.76);

    outColor = vec4(emission * alpha, alpha);
    return;
  }

  if (vKind > 1.5) {
    float spark = pow(max(0.0, sin(vUv.x * 18.0 - uTime * 8.2)), 10.0);
    vec3 electric = mix(vColor, vec3(0.42, 0.9, 1.0), 0.38 + spark * 0.48);
    vec3 color = mix(electric, vec3(1.0), core * 0.84);
    float pulse = 0.88 + 0.12 * sin(uTime * 7.2 + vUv.x * 15.0);
    float alpha = edge * pulse * vAlpha * (1.16 + spark * 0.3);
    vec3 emission = color * (0.62 + halo * 0.72 + innerGlow * 1.22 + core * 0.9);

    outColor = vec4(emission * alpha, alpha);
    return;
  }

  if (vKind > 0.5) {
    vec3 goldA = vec3(1.0, 0.82, 0.22);
    vec3 goldB = vec3(1.0, 0.62, 0.12);
    float shimmer = 0.5 + 0.5 * sin(uTime * 4.8 + vUv.x * 16.0 + abs(vUv.y) * 3.0);
    vec3 gold = mix(goldA, goldB, shimmer);
    vec3 color = mix(gold, vec3(1.0, 0.97, 0.84), core * 0.78);
    float pulse = 0.94 + 0.06 * sin(uTime * 6.4 + vUv.x * 18.0);
    float alpha = edge * pulse * vAlpha * 1.22;
    vec3 emission = color * (0.82 + halo * 0.72 + innerGlow * 1.04 + core * 0.84);

    outColor = vec4(emission * alpha, alpha);
    return;
  }

  float seed = dot(vColor, vec3(1.7, 2.3, 3.1));
  vec3 gamerRgb = rgbCycle(uTime * 3.1 + vUv.x * 8.0 + abs(vUv.y) * 1.2 + seed * 4.0);
  vec3 color = mix(gamerRgb, vec3(1.0), core * 0.72);
  float pulse = 0.92 + 0.08 * sin(uTime * 5.8 + vUv.x * 14.0);
  float alpha = edge * pulse * vAlpha * 1.28;
  vec3 emission = color * (0.68 + halo * 0.82 + innerGlow * 1.08 + core * 0.74);

  outColor = vec4(emission * alpha, alpha);
}
`;

const POINT_VERTEX_SHADER = `#version 300 es
precision highp float;

in vec2 aPosition;
in vec3 aColor;
in float aSize;
in float aAlpha;
in float aKind;

uniform float uDpr;

out vec3 vColor;
out float vAlpha;
out float vKind;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  gl_PointSize = aSize * uDpr;
  vColor = aColor;
  vAlpha = aAlpha;
  vKind = aKind;
}
`;

const POINT_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec3 vColor;
in float vAlpha;
in float vKind;

uniform float uTime;

out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

vec3 rgbCycle(float phase) {
  vec3 wave = 0.5 + 0.5 * sin(phase + vec3(0.0, 2.09439510239, 4.18879020479));
  return pow(wave, vec3(1.15));
}

void main() {
  vec2 centered = gl_PointCoord * 2.0 - 1.0;
  float distanceToCenter = dot(centered, centered);

  if (distanceToCenter > 1.0) {
    discard;
  }

  if (vKind < 0.0) {
    float shadow = 1.0 - smoothstep(0.0, 1.0, distanceToCenter);
    float alpha = pow(shadow, 1.6) * vAlpha;
    outColor = vec4(vec3(0.0), alpha);
    return;
  }

  if (vKind >= 1.0) {
    if (vKind >= 4.9) {
      float radius = length(centered);
      float z = sqrt(max(0.0, 1.0 - distanceToCenter));
      vec3 normal = normalize(vec3(centered, z));
      vec2 craterUv = centered * 4.8 + vec2(0.4, -0.2);
      float craterField = noise(craterUv) * 0.58 + noise(craterUv * 2.7) * 0.42;
      float craters = smoothstep(0.6, 0.78, craterField);
      float diffuse = clamp(dot(normal, normalize(vec3(-0.58, -0.12, 0.8))), 0.0, 1.0);
      vec3 stone = mix(vec3(0.2, 0.23, 0.3), vec3(0.75, 0.79, 0.84), diffuse);
      stone *= 0.78 + craterField * 0.28 - craters * 0.24;
      float rim = pow(1.0 - normal.z, 2.4);
      stone += vec3(0.22, 0.32, 0.5) * rim * 0.18;
      float alpha = (1.0 - smoothstep(0.92, 1.0, radius)) * vAlpha;

      outColor = vec4(stone, alpha);
      return;
    }

    if (vKind >= 3.9) {
      float radius = length(centered);
      float z = sqrt(max(0.0, 1.0 - distanceToCenter));
      vec3 normal = normalize(vec3(centered, z));
      float rotation = uTime * (0.12 + fract(vKind) * 0.7) + vKind * 2.3;
      vec2 planetUv = vec2(
        atan(normal.z, normal.x) / 6.28318530718 + 0.5 + rotation,
        asin(clamp(normal.y, -1.0, 1.0)) / 3.14159265359 + 0.5
      );
      float terrain = noise(planetUv * vec2(7.0, 4.2)) * 0.62 +
        noise(planetUv * vec2(15.0, 9.0)) * 0.38;
      float bands = 0.5 + 0.5 * sin(planetUv.y * 34.0 + terrain * 3.2);
      vec3 darkBase = vColor * vec3(0.18, 0.22, 0.28);
      vec3 lightBase = mix(vColor, vec3(1.0), 0.28 + bands * 0.12);
      vec3 surface = mix(darkBase, lightBase, 0.34 + terrain * 0.66);
      float diffuse = clamp(dot(normal, normalize(vec3(-0.48, 0.24, 0.84))), 0.0, 1.0);
      float specular = pow(max(0.0, dot(reflect(normalize(vec3(0.48, -0.24, -0.84)), normal), vec3(0.0, 0.0, 1.0))), 18.0);
      float rim = pow(1.0 - normal.z, 2.8);
      vec3 color = surface * (0.16 + diffuse * 0.96);
      color += vec3(0.52, 0.74, 1.0) * rim * 0.18 + vec3(1.0) * specular * 0.22;
      float alpha = (1.0 - smoothstep(0.93, 1.0, radius)) * vAlpha;

      outColor = vec4(color, alpha);
      return;
    }

    if (vKind >= 2.9) {
      float radius = length(centered);
      float angle = atan(centered.y, centered.x);
      float surface = noise(centered * 5.6 + vec2(uTime * 0.22, -uTime * 0.16));
      float cells = noise(centered * 12.0 - vec2(uTime * 0.3, uTime * 0.18));
      float limb = pow(max(0.0, 1.0 - radius), 0.28);
      float corona = (1.0 - smoothstep(0.78, 1.0, radius)) *
        (0.82 + 0.18 * sin(angle * 11.0 + uTime * 3.1));
      float flare = pow(max(0.0, sin(angle * 7.0 - uTime * 2.0)), 9.0) *
        smoothstep(0.62, 0.98, radius);
      vec3 ember = mix(vec3(1.0, 0.16, 0.015), vec3(1.0, 0.72, 0.08), surface);
      vec3 color = mix(ember, vec3(1.0, 0.94, 0.58), cells * 0.42 + limb * 0.34);
      color += vec3(1.0, 0.46, 0.05) * flare * 0.7;
      float alpha = (1.0 - smoothstep(0.92, 1.0, radius)) * corona * vAlpha;

      outColor = vec4(color * (0.92 + limb * 0.48), alpha);
      return;
    }

    if (vKind >= 1.9) {
      float radius = length(centered);
      float rotation = uTime * 0.72;
      vec2 swirlUv = vec2(
        atan(centered.y, centered.x) / 6.28318530718 + 0.5 + rotation,
        radius
      );
      float horizon = 1.0 - smoothstep(0.16, 0.32, radius);
      float lens = smoothstep(0.22, 0.56, radius) * (1.0 - smoothstep(0.66, 0.94, radius));
      float photonRing = smoothstep(0.44, 0.58, radius) * (1.0 - smoothstep(0.58, 0.72, radius));
      float outerGlow = smoothstep(0.42, 0.96, radius) * (1.0 - smoothstep(0.96, 1.08, radius));
      float swirl = noise(vec2(swirlUv.x * 10.0 - uTime * 0.75, swirlUv.y * 11.5 + uTime * 1.4));
      float turbulence = noise(vec2(swirlUv.x * 17.0 + uTime * 1.2, swirlUv.y * 24.0 - uTime * 0.9));
      float doppler = clamp(0.45 + 0.55 * sin(atan(centered.y, centered.x) + uTime * 2.4), 0.0, 1.0);
      vec3 ember = mix(vec3(1.0, 0.54, 0.08), vec3(1.0, 0.83, 0.44), doppler);
      vec3 plasma = mix(vec3(0.36, 0.22, 0.95), vec3(0.14, 0.76, 1.0), turbulence);
      vec3 ringColor = mix(plasma, ember, clamp(swirl * 0.72 + doppler * 0.5, 0.0, 1.0));
      ringColor += vec3(1.0, 0.94, 0.88) * photonRing * 0.68;
      vec3 color = ringColor * (lens * (0.72 + swirl * 0.65) + photonRing * 1.9 + outerGlow * 0.18);
      color = mix(color, vec3(0.0), horizon);
      float alpha = max(lens * 0.92, photonRing * 1.18);
      alpha += outerGlow * 0.12;
      alpha = clamp(alpha, 0.0, 1.0) * vAlpha;
      alpha *= 1.0 - horizon * 0.96;

      outColor = vec4(color, alpha);
      return;
    }

    float radius = length(centered);
    float z = sqrt(max(0.0, 1.0 - distanceToCenter));
    vec3 normal = normalize(vec3(centered, z));
    float rotation = uTime * 0.16 + vKind * 3.7;
    vec2 globeUv = vec2(
      atan(normal.z, normal.x) / 6.28318530718 + 0.5 + rotation,
      asin(clamp(normal.y, -1.0, 1.0)) / 3.14159265359 + 0.5
    );
    float continent = noise(globeUv * vec2(5.4, 3.2)) * 0.62 + noise(globeUv * vec2(10.2, 6.5)) * 0.38;
    float ridge = noise(globeUv * vec2(18.0, 11.0));
    float landMask = smoothstep(0.54, 0.68, continent + normal.y * 0.08);
    vec3 ocean = mix(vec3(0.01, 0.07, 0.24), vec3(0.03, 0.28, 0.64), normal.z * 0.62 + 0.22);
    vec3 land = mix(vec3(0.07, 0.28, 0.12), vec3(0.31, 0.62, 0.22), continent);
    land += vec3(0.08, 0.06, 0.02) * smoothstep(0.72, 0.9, ridge) * landMask;
    vec2 cloudUv = globeUv + vec2(uTime * 0.025, 0.0);
    float cloudMask = smoothstep(
      0.76,
      0.9,
      noise(cloudUv * vec2(14.0, 8.0)) * 0.68 + noise(cloudUv * vec2(27.0, 15.0)) * 0.32
    );
    vec3 cloud = vec3(0.92, 0.97, 1.0) * cloudMask;
    vec3 base = mix(ocean, land, landMask);
    float diffuse = clamp(dot(normal, normalize(vec3(-0.38, 0.28, 0.88))), 0.0, 1.0);
    float night = smoothstep(-0.18, 0.22, diffuse);
    float rim = pow(1.0 - normal.z, 3.1);
    vec3 color = base * (0.2 + diffuse * 0.92);
    color = mix(color * 0.28, color, night);
    float citySeed = noise(globeUv * vec2(42.0, 24.0));
    float cities = smoothstep(0.84, 0.94, citySeed) * landMask * (1.0 - night);
    color += vec3(1.0, 0.58, 0.12) * cities * 1.6;
    color += cloud * (0.12 + diffuse * 0.2);
    color += vec3(0.08, 0.34, 0.92) * rim * 0.62;
    color += vec3(0.18, 0.95, 0.5) *
      smoothstep(0.82, 0.98, abs(normal.y)) *
      (0.5 + 0.5 * sin(globeUv.x * 46.0 + uTime * 1.7)) *
      rim * 0.28;
    float alpha = (1.0 - smoothstep(0.94, 1.0, radius)) * vAlpha;

    outColor = vec4(color, alpha);
    return;
  }

  float glow = 1.0 - smoothstep(0.0, 1.0, distanceToCenter);
  float core = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
  float seed = dot(vColor, vec3(1.7, 2.3, 3.1));
  vec3 gamerRgb = rgbCycle(uTime * 3.1 + seed * 4.0);
  vec3 color = mix(gamerRgb, vec3(1.0), core * 0.55);
  float alpha = glow * vAlpha;

  outColor = vec4(color * alpha, alpha);
}
`;

const VIDEO_VERTICES = new Float32Array([
  -1, -1, 0, 0,
  1, -1, 1, 0,
  -1, 1, 0, 1,
  -1, 1, 0, 1,
  1, -1, 1, 0,
  1, 1, 1, 1
]);

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("No se pudo crear el shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "Error de compilacion de shader.";
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    throw new Error("No se pudo crear el programa WebGL.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? "Error de enlace de programa WebGL.";
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

function toClipX(x, width) {
  return (x / width) * 2 - 1;
}

function toClipY(y, height) {
  return 1 - (y / height) * 2;
}

export class WebGLThreadRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl =
      canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance"
      });

    if (!this.gl) {
      throw new Error("WebGL2 no esta disponible para el renderer de escena.");
    }

    this.viewport = { width: 0, height: 0, dpr: 1 };
    this.videoTexture = null;
    this.videoProgram = null;
    this.filterProgram = null;
    this.segmentProgram = null;
    this.pointProgram = null;
    this.videoBuffer = null;
    this.filterBuffer = null;
    this.segmentBuffer = null;
    this.pointBuffer = null;
    this.videoVao = null;
    this.filterVao = null;
    this.segmentVao = null;
    this.pointVao = null;

    this.setupPrograms();
    this.setupState();
  }

  setupPrograms() {
    const gl = this.gl;

    this.videoProgram = createProgram(gl, VIDEO_VERTEX_SHADER, VIDEO_FRAGMENT_SHADER);
    this.filterProgram = createProgram(gl, FILTER_VERTEX_SHADER, FILTER_FRAGMENT_SHADER);
    this.segmentProgram = createProgram(gl, SEGMENT_VERTEX_SHADER, SEGMENT_FRAGMENT_SHADER);
    this.pointProgram = createProgram(gl, POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);

    this.videoVao = gl.createVertexArray();
    this.videoBuffer = gl.createBuffer();
    gl.bindVertexArray(this.videoVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.videoBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, VIDEO_VERTICES, gl.STATIC_DRAW);

    const videoPositionLocation = gl.getAttribLocation(this.videoProgram, "aPosition");
    const videoUvLocation = gl.getAttribLocation(this.videoProgram, "aUv");
    gl.enableVertexAttribArray(videoPositionLocation);
    gl.vertexAttribPointer(videoPositionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(videoUvLocation);
    gl.vertexAttribPointer(videoUvLocation, 2, gl.FLOAT, false, 16, 8);

    this.filterVao = gl.createVertexArray();
    this.filterBuffer = gl.createBuffer();
    gl.bindVertexArray(this.filterVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.filterBuffer);

    const filterStride = 24;
    const filterPositionLocation = gl.getAttribLocation(this.filterProgram, "aPosition");
    const filterScreenUvLocation = gl.getAttribLocation(this.filterProgram, "aScreenUv");
    const filterAlphaLocation = gl.getAttribLocation(this.filterProgram, "aAlpha");
    const filterStyleLocation = gl.getAttribLocation(this.filterProgram, "aStyle");
    gl.enableVertexAttribArray(filterPositionLocation);
    gl.vertexAttribPointer(filterPositionLocation, 2, gl.FLOAT, false, filterStride, 0);
    gl.enableVertexAttribArray(filterScreenUvLocation);
    gl.vertexAttribPointer(filterScreenUvLocation, 2, gl.FLOAT, false, filterStride, 8);
    gl.enableVertexAttribArray(filterAlphaLocation);
    gl.vertexAttribPointer(filterAlphaLocation, 1, gl.FLOAT, false, filterStride, 16);
    gl.enableVertexAttribArray(filterStyleLocation);
    gl.vertexAttribPointer(filterStyleLocation, 1, gl.FLOAT, false, filterStride, 20);

    this.segmentVao = gl.createVertexArray();
    this.segmentBuffer = gl.createBuffer();
    gl.bindVertexArray(this.segmentVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.segmentBuffer);

    const segmentStride = 36;
    const segmentPositionLocation = gl.getAttribLocation(this.segmentProgram, "aPosition");
    const segmentColorLocation = gl.getAttribLocation(this.segmentProgram, "aColor");
    const segmentUvLocation = gl.getAttribLocation(this.segmentProgram, "aUv");
    const segmentAlphaLocation = gl.getAttribLocation(this.segmentProgram, "aAlpha");
    const segmentKindLocation = gl.getAttribLocation(this.segmentProgram, "aKind");

    gl.enableVertexAttribArray(segmentPositionLocation);
    gl.vertexAttribPointer(segmentPositionLocation, 2, gl.FLOAT, false, segmentStride, 0);
    gl.enableVertexAttribArray(segmentColorLocation);
    gl.vertexAttribPointer(segmentColorLocation, 3, gl.FLOAT, false, segmentStride, 8);
    gl.enableVertexAttribArray(segmentUvLocation);
    gl.vertexAttribPointer(segmentUvLocation, 2, gl.FLOAT, false, segmentStride, 20);
    gl.enableVertexAttribArray(segmentAlphaLocation);
    gl.vertexAttribPointer(segmentAlphaLocation, 1, gl.FLOAT, false, segmentStride, 28);
    gl.enableVertexAttribArray(segmentKindLocation);
    gl.vertexAttribPointer(segmentKindLocation, 1, gl.FLOAT, false, segmentStride, 32);

    this.pointVao = gl.createVertexArray();
    this.pointBuffer = gl.createBuffer();
    gl.bindVertexArray(this.pointVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);

    const pointStride = 32;
    const pointPositionLocation = gl.getAttribLocation(this.pointProgram, "aPosition");
    const pointColorLocation = gl.getAttribLocation(this.pointProgram, "aColor");
    const pointSizeLocation = gl.getAttribLocation(this.pointProgram, "aSize");
    const pointAlphaLocation = gl.getAttribLocation(this.pointProgram, "aAlpha");
    const pointKindLocation = gl.getAttribLocation(this.pointProgram, "aKind");

    gl.enableVertexAttribArray(pointPositionLocation);
    gl.vertexAttribPointer(pointPositionLocation, 2, gl.FLOAT, false, pointStride, 0);
    gl.enableVertexAttribArray(pointColorLocation);
    gl.vertexAttribPointer(pointColorLocation, 3, gl.FLOAT, false, pointStride, 8);
    gl.enableVertexAttribArray(pointSizeLocation);
    gl.vertexAttribPointer(pointSizeLocation, 1, gl.FLOAT, false, pointStride, 20);
    gl.enableVertexAttribArray(pointAlphaLocation);
    gl.vertexAttribPointer(pointAlphaLocation, 1, gl.FLOAT, false, pointStride, 24);
    gl.enableVertexAttribArray(pointKindLocation);
    gl.vertexAttribPointer(pointKindLocation, 1, gl.FLOAT, false, pointStride, 28);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setupState() {
    const gl = this.gl;

    this.videoTexture = gl.createTexture();

    if (!this.videoTexture) {
      throw new Error("No se pudo crear la textura del video.");
    }

    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
  }

  resize(viewport) {
    const gl = this.gl;
    const width = Math.round(viewport.width * viewport.dpr);
    const height = Math.round(viewport.height * viewport.dpr);

    this.viewport = { ...viewport };

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
  }

  renderFrame({
    video,
    videoOpacity,
    mirror,
    cropOffset,
    cropScale,
    time,
    segments,
    points,
    filterWindows,
    spaceWarp
  }) {
    const gl = this.gl;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.019, 0.03, 0.086, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    this.updateVideoTexture(video);
    this.drawVideo(videoOpacity, mirror, cropOffset, cropScale, spaceWarp);
    this.drawFilteredWindows(filterWindows, time, mirror, cropOffset, cropScale, spaceWarp);
    this.drawSegments(segments, time);
    this.drawPoints(points, time);
  }

  updateVideoTexture(video) {
    const gl = this.gl;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
  }

  applySpaceWarpUniforms(program, spaceWarp) {
    const gl = this.gl;
    const warpEnabled = Number(Boolean(spaceWarp));

    gl.uniform1f(gl.getUniformLocation(program, "uWarpEnabled"), warpEnabled);

    if (!warpEnabled) {
      return;
    }

    gl.uniform2f(
      gl.getUniformLocation(program, "uWarpCenter"),
      spaceWarp.center.x,
      spaceWarp.center.y
    );
    gl.uniform1f(gl.getUniformLocation(program, "uWarpRadius"), spaceWarp.radius);
    gl.uniform1f(gl.getUniformLocation(program, "uWarpStrength"), spaceWarp.strength);
    gl.uniform1f(gl.getUniformLocation(program, "uWarpSpin"), spaceWarp.spin);
  }

  drawVideo(videoOpacity, mirror, cropOffset, cropScale, spaceWarp) {
    const gl = this.gl;

    gl.useProgram(this.videoProgram);
    gl.bindVertexArray(this.videoVao);
    gl.disable(gl.BLEND);

    gl.uniform1i(gl.getUniformLocation(this.videoProgram, "uVideo"), 0);
    gl.uniform2f(
      gl.getUniformLocation(this.videoProgram, "uCropOffset"),
      cropOffset[0],
      cropOffset[1]
    );
    gl.uniform2f(
      gl.getUniformLocation(this.videoProgram, "uCropScale"),
      cropScale[0],
      cropScale[1]
    );
    gl.uniform2f(
      gl.getUniformLocation(this.videoProgram, "uResolution"),
      this.viewport.width,
      this.viewport.height
    );
    gl.uniform1f(gl.getUniformLocation(this.videoProgram, "uVideoOpacity"), videoOpacity);
    gl.uniform1f(gl.getUniformLocation(this.videoProgram, "uMirror"), mirror ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(this.videoProgram, "uTime"), performance.now() * 0.001);
    this.applySpaceWarpUniforms(this.videoProgram, spaceWarp);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  drawFilteredWindows(filterWindows, time, mirror, cropOffset, cropScale, spaceWarp) {
    const gl = this.gl;

    if (!filterWindows.length) {
      return;
    }

    const data = this.buildFilterWindowVertexData(filterWindows);

    if (!data.length) {
      return;
    }

    gl.useProgram(this.filterProgram);
    gl.bindVertexArray(this.filterVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.filterBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform1i(gl.getUniformLocation(this.filterProgram, "uVideo"), 0);
    gl.uniform2f(
      gl.getUniformLocation(this.filterProgram, "uCropOffset"),
      cropOffset[0],
      cropOffset[1]
    );
    gl.uniform2f(
      gl.getUniformLocation(this.filterProgram, "uCropScale"),
      cropScale[0],
      cropScale[1]
    );
    gl.uniform2f(
      gl.getUniformLocation(this.filterProgram, "uResolution"),
      this.viewport.width,
      this.viewport.height
    );
    gl.uniform1f(gl.getUniformLocation(this.filterProgram, "uMirror"), mirror ? 1 : 0);
    gl.uniform1f(gl.getUniformLocation(this.filterProgram, "uTime"), time * 0.001);
    this.applySpaceWarpUniforms(this.filterProgram, spaceWarp);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 6);
    gl.bindVertexArray(null);
  }

  drawSegments(segments, time) {
    const gl = this.gl;

    if (!segments.length) {
      return;
    }

    const data = this.buildSegmentVertexData(segments);

    gl.useProgram(this.segmentProgram);
    gl.bindVertexArray(this.segmentVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.segmentBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform1f(gl.getUniformLocation(this.segmentProgram, "uTime"), time * 0.001);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 9);
    gl.bindVertexArray(null);
  }

  drawPoints(points, time) {
    const gl = this.gl;

    if (!points.length) {
      return;
    }

    const additivePoints = [];
    const alphaPoints = [];

    for (const point of points) {
      if ((point.kind ?? 0) > 0 && (point.kind ?? 0) < 1) {
        additivePoints.push(point);
      } else {
        alphaPoints.push(point);
      }
    }

    if (additivePoints.length) {
      const glowData = this.buildPointVertexData(additivePoints);

      gl.useProgram(this.pointProgram);
      gl.bindVertexArray(this.pointVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, glowData, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, "uDpr"), this.viewport.dpr);
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, "uTime"), time * 0.001);
      gl.drawArrays(gl.POINTS, 0, glowData.length / 8);
    }

    if (alphaPoints.length) {
      const solidData = this.buildPointVertexData(alphaPoints);

      gl.useProgram(this.pointProgram);
      gl.bindVertexArray(this.pointVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, solidData, gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, "uDpr"), this.viewport.dpr);
      gl.uniform1f(gl.getUniformLocation(this.pointProgram, "uTime"), time * 0.001);
      gl.drawArrays(gl.POINTS, 0, solidData.length / 8);
    }

    gl.bindVertexArray(null);
  }

  buildFilterWindowVertexData(filterWindows) {
    const { width, height } = this.viewport;
    const values = [];

    for (const window of filterWindows) {
      const vertices = window.points;

      if (!vertices || vertices.length < 3) {
        continue;
      }

      for (let index = 1; index < vertices.length - 1; index += 1) {
        const triangle = [vertices[0], vertices[index], vertices[index + 1]];

        for (const vertex of triangle) {
          values.push(
            toClipX(vertex.x, width),
            toClipY(vertex.y, height),
            vertex.x / width,
            vertex.y / height,
            window.alpha ?? 0.9,
            window.style ?? 0
          );
        }
      }
    }

    return new Float32Array(values);
  }

  buildSegmentVertexData(segments) {
    const { width, height } = this.viewport;
    const values = [];

    for (const segment of segments) {
      const dx = segment.b.x - segment.a.x;
      const dy = segment.b.y - segment.a.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 0.001) {
        continue;
      }

      const normalX = (-dy / distance) * segment.width * 0.5;
      const normalY = (dx / distance) * segment.width * 0.5;

      const vertices = [
        {
          x: segment.a.x + normalX,
          y: segment.a.y + normalY,
          color: segment.colorA,
          uv: [0, 1]
        },
        {
          x: segment.a.x - normalX,
          y: segment.a.y - normalY,
          color: segment.colorA,
          uv: [0, -1]
        },
        {
          x: segment.b.x + normalX,
          y: segment.b.y + normalY,
          color: segment.colorB,
          uv: [1, 1]
        },
        {
          x: segment.a.x - normalX,
          y: segment.a.y - normalY,
          color: segment.colorA,
          uv: [0, -1]
        },
        {
          x: segment.b.x + normalX,
          y: segment.b.y + normalY,
          color: segment.colorB,
          uv: [1, 1]
        },
        {
          x: segment.b.x - normalX,
          y: segment.b.y - normalY,
          color: segment.colorB,
          uv: [1, -1]
        }
      ];

      for (const vertex of vertices) {
        values.push(
          toClipX(vertex.x, width),
          toClipY(vertex.y, height),
          vertex.color[0],
          vertex.color[1],
          vertex.color[2],
          vertex.uv[0],
          vertex.uv[1],
          segment.alpha,
          segment.kind ?? 0
        );
      }
    }

    return new Float32Array(values);
  }

  buildPointVertexData(points) {
    const { width, height } = this.viewport;
    const values = [];

    for (const point of points) {
      values.push(
        toClipX(point.x, width),
        toClipY(point.y, height),
        point.color[0],
        point.color[1],
        point.color[2],
        point.size,
        point.alpha,
        point.kind ?? 0
      );
    }

    return new Float32Array(values);
  }
}
