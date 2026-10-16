import { Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { WAVES_GLSL } from './waves.js';
import { NOISE_GLSL, PALETTE, SKY_GRADIENT_GLSL } from './sky.js';

export const OCEAN_SIZE = 1400;

export function createOcean(skyUniforms, { segments = 220 } = {}) {
  const geometry = new PlaneGeometry(OCEAN_SIZE, OCEAN_SIZE, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const uniforms = {
    ...skyUniforms,
    uTime: { value: 0 },
    uDeep: { value: PALETTE.oceanDeep },
    uFar: { value: PALETTE.oceanFar },
    uFogNear: { value: 120 },
    uFogFar: { value: 640 },
  };

  const material = new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      ${WAVES_GLSL}
      uniform float uTime;
      uniform float uWind;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vHeight;

      vec3 gerstner(vec4 wave, vec3 p, float amplitude, inout vec3 tangent, inout vec3 binormal) {
        float steepness = wave.z * amplitude;
        float k = 6.28318 / wave.w;
        float c = sqrt(9.8 / k);
        vec2 d = normalize(wave.xy);
        float f = k * (dot(d, p.xz) - c * uTime);
        float a = steepness / k;
        float s = sin(f);
        float co = cos(f);
        tangent += vec3(-d.x * d.x * steepness * s, d.x * steepness * co, -d.x * d.y * steepness * s);
        binormal += vec3(-d.x * d.y * steepness * s, d.y * steepness * co, -d.y * d.y * steepness * s);
        return vec3(d.x * a * co, a * s, d.y * a * co);
      }

      void main() {
        vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
        // Waves fade with distance so the far field stays calm and alias-free.
        float amplitude = (1.0 - smoothstep(140.0, 420.0, length(world.xz - cameraPosition.xz))) * (1.0 + uWind * WIND_SWELL);
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 binormal = vec3(0.0, 0.0, 1.0);
        vec3 displaced = world;
        for (int i = 0; i < WAVE_COUNT; i++) {
          displaced += gerstner(WAVES[i], world, amplitude, tangent, binormal);
        }
        vNormal = normalize(cross(binormal, tangent));
        vHeight = displaced.y;
        vWorldPosition = displaced;
        gl_Position = projectionMatrix * viewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${SKY_GRADIENT_GLSL}
      ${NOISE_GLSL}
      uniform float uTime;
      uniform float uWind;
      uniform float uNight;
      uniform vec3 uDeep;
      uniform vec3 uFar;
      uniform float uFogNear;
      uniform float uFogFar;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying float vHeight;

      // Two octaves are enough for the ripples and keep the per-pixel cost low on phones.
      float ripple(vec2 q) {
        return valueNoise(q) + 0.5 * valueNoise(q * 2.13 + 5.2);
      }

      void main() {
        vec3 toCamera = cameraPosition - vWorldPosition;
        float dist = length(toCamera);
        vec3 v = toCamera / dist;
        float near = 1.0 - smoothstep(20.0, 260.0, dist);

        // Fine ripples on top of the swell, faded out in the distance.
        vec2 p = vWorldPosition.xz;
        vec2 q = p * (0.9 + uWind * 0.5) + vec2(uTime * (0.35 + uWind * 1.2), uTime * 0.22);
        float e = 0.15;
        float base = ripple(q);
        vec2 slope = vec2(ripple(q + vec2(e, 0.0)) - base, ripple(q + vec2(0.0, e)) - base) / e;
        vec3 n = normalize(normalize(vNormal) + vec3(slope.x, 0.0, slope.y) * (0.18 + uWind * 0.22 + uRain * 0.12) * near);

        float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 body = mix(uDeep, uFar, smoothstep(8.0, 220.0, dist));
        body += vec3(0.03, 0.1, 0.12) * smoothstep(-0.3, 0.7, vHeight);
        vec3 color = mix(body, skyGradient(reflect(-v, n)), fresnel * 0.9);

        // Sun path: a broad specular sheen plus twinkling glints.
        vec3 halfway = normalize(uSunDirection + v);
        color += uSunColor * pow(max(dot(n, halfway), 0.0), 420.0) * 3.2;
        float path = pow(max(dot(reflect(-v, vec3(0.0, 1.0, 0.0)), uSunDirection), 0.0), 18.0);
        vec2 grid = p * 1.6;
        vec2 cell = floor(grid);
        float seed = hash12(cell);
        vec2 spot = vec2(hash12(cell + 3.1), hash12(cell + 9.7)) * 0.7 + 0.15;
        float dotShape = smoothstep(0.07, 0.0, length(fract(grid) - spot));
        float twinkle = smoothstep(0.85, 1.0, sin(seed * 6.2831 + uTime * (2.0 + seed * 3.0)));
        float glint = step(0.6, hash12(cell + 7.3)) * dotShape * twinkle * path;
        color += vec3(1.0, 0.98, 0.9) * glint * 2.2;

        // Whitecaps on the crests when the wind rises.
        float crest = smoothstep(0.7, 1.4, vHeight) * smoothstep(0.75, 0.95, base * 0.6 + 0.4);
        color = mix(color, vec3(0.9, 0.93, 0.96) * (1.0 - uNight * 0.5), crest * uWind * 0.55 * near);

        // Raindrops pock the surface with short-lived bright points.
        vec2 dropGrid = p * 3.0;
        vec2 dropCell = floor(dropGrid);
        float dropPhase = fract(uTime * 1.7 + hash12(dropCell) * 10.0);
        float drop = smoothstep(0.12, 0.0, length(fract(dropGrid) - 0.5)) * (1.0 - dropPhase) * step(0.75, hash12(dropCell + 4.4));
        color += vec3(0.7, 0.75, 0.8) * drop * uRain * 0.35 * near;
        color *= 1.0 - uRain * 0.25;

        float fog = smoothstep(uFogNear * (1.0 - uRain * 0.6), uFogFar * (1.0 - uRain * 0.45), dist);
        color = mix(color, skyGradient(normalize(vec3(-v.x, 0.0, -v.z))), fog);

        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}
