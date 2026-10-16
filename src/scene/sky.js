import { BackSide, Color, MathUtils, Mesh, ShaderMaterial, SphereGeometry, Vector2, Vector3 } from 'three';

// Day: deep blue zenith, luminous cyan, warm golden horizon around the sun.
const DAY = {
  zenith: '#1b74c9',
  mid: '#62bcec',
  horizon: '#fff0c4',
  sun: '#fff3c4',
  mountainFar: '#8dbfd9',
  mountainNear: '#4f9488',
  oceanDeep: '#08488f',
  oceanFar: '#2f9ad4',
};

// Night: moonlit indigo sky, the sun becomes a pale moon.
const NIGHT = {
  zenith: '#040b1f',
  mid: '#0d1d3b',
  horizon: '#294468',
  sun: '#dbe5ff',
  mountainFar: '#1a2c47',
  mountainNear: '#0e1c2f',
  oceanDeep: '#020d1d',
  oceanFar: '#0b2645',
};

const toColors = (palette) => Object.fromEntries(Object.entries(palette).map(([key, hex]) => [key, new Color(hex)]));
const DAY_COLORS = toColors(DAY);
const NIGHT_COLORS = toColors(NIGHT);

/** Live colours read by the shaders; `mixPalette` blends them between day and night. */
export const PALETTE = toColors(DAY);

export function mixPalette(night) {
  for (const key of Object.keys(PALETTE)) PALETTE[key].lerpColors(DAY_COLORS[key], NIGHT_COLORS[key], night);
}

const SUN_ELEVATION = 5;
const SUN_AZIMUTH = 10;

export const SUN_DIRECTION = new Vector3(
  Math.cos(MathUtils.degToRad(SUN_ELEVATION)) * Math.sin(MathUtils.degToRad(SUN_AZIMUTH)),
  Math.sin(MathUtils.degToRad(SUN_ELEVATION)),
  -Math.cos(MathUtils.degToRad(SUN_ELEVATION)) * Math.cos(MathUtils.degToRad(SUN_AZIMUTH)),
);

/** Sky gradient without clouds: shared with the ocean for reflections and the horizon haze. */
export const SKY_GRADIENT_GLSL = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
uniform float uRain;

vec3 skyGradient(vec3 dir) {
  float h = dir.y;
  vec3 color = mix(uHorizon, uMid, smoothstep(-0.02, 0.24, h));
  color = mix(color, uZenith, smoothstep(0.2, 0.85, h));
  float sun = max(dot(dir, uSunDirection), 0.0);
  // Overcast when it rains: the glow is swallowed and the whole sky greys out.
  color += uSunColor * (pow(sun, 10.0) * 0.22 + pow(sun, 90.0) * 0.5) * (1.0 - uRain * 0.85);
  return mix(color, vec3(dot(color, vec3(0.3, 0.45, 0.25))) * 0.55, uRain * 0.75);
}
`;

export const NOISE_GLSL = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x), mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * valueNoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    amplitude *= 0.5;
  }
  return value;
}
`;

export function createSkyUniforms() {
  return {
    uZenith: { value: PALETTE.zenith },
    uMid: { value: PALETTE.mid },
    uHorizon: { value: PALETTE.horizon },
    uSunColor: { value: PALETTE.sun },
    uSunDirection: { value: SUN_DIRECTION },
    uNight: { value: 0 },
    uWind: { value: 0 },
    uRain: { value: 0 },
  };
}

export function createSky(skyUniforms) {
  const uniforms = {
    ...skyUniforms,
    uTime: { value: 0 },
    uMountainFar: { value: PALETTE.mountainFar },
    uMountainNear: { value: PALETTE.mountainNear },
    uSunAzimuth: { value: Math.atan2(SUN_DIRECTION.x, -SUN_DIRECTION.z) },
    // Accumulated on the CPU so a change of wind speed never makes the clouds jump.
    uCloudOffset: { value: new Vector2() },
  };

  const material = new ShaderMaterial({
    uniforms,
    side: BackSide,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vDirection;
      void main() {
        vDirection = position;
        vec4 pos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = pos.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      ${SKY_GRADIENT_GLSL}
      ${NOISE_GLSL}
      uniform float uTime;
      uniform float uNight;
      uniform vec2 uCloudOffset;
      uniform vec3 uMountainFar;
      uniform vec3 uMountainNear;
      uniform float uSunAzimuth;
      varying vec3 vDirection;

      // Mountain ridge height above the horizon for a given azimuth, kept low around the sun.
      float ridge(float azimuth, float scale, float seed, float base, float amplitude) {
        float clearing = smoothstep(0.12, 0.6, abs(azimuth - uSunAzimuth));
        float n = fbm(vec2(azimuth * scale + seed, seed));
        return (base + amplitude * n * n * 2.2) * clearing;
      }

      void main() {
        vec3 dir = normalize(vDirection);
        vec3 color = skyGradient(dir);
        float sunDot = dot(dir, uSunDirection);
        color += uSunColor * smoothstep(0.9993, 0.99975, sunDot) * 1.4 * (1.0 - uRain * 0.9);

        // Soft cumulus drifting slowly, crisp enough at the edges to read as painted clouds.
        if (dir.y > 0.0) {
          vec2 uv = dir.xz / (dir.y + 0.1) * 1.25 + uCloudOffset;
          float shape = fbm(uv * 1.2);
          float detail = fbm(uv * 4.2 + 3.7);
          // Rain thickens the cover until it closes the sky.
          float cover = shape + detail * 0.16 - 0.04 + uRain * 0.32;
          float density = smoothstep(0.56, 0.68, cover) * smoothstep(0.02, 0.14, dir.y * (1.0 + uRain * 4.0));
          float shade = smoothstep(0.5, 0.85, shape + detail * 0.12);
          vec3 cloud = mix(vec3(0.72, 0.82, 0.93), vec3(1.0), shade);
          cloud = mix(cloud, uSunColor * 1.04, pow(max(sunDot, 0.0), 3.0) * 0.55);
          // At night clouds turn into dark, moon-rimmed shapes.
          cloud = mix(cloud, vec3(0.1, 0.14, 0.24) + uSunColor * pow(max(sunDot, 0.0), 6.0) * 0.4, uNight * 0.85);
          // Under rain the clouds melt into an even overcast close to the sky colour.
          cloud = mix(cloud, color * 0.82, uRain * 0.85);
          color = mix(color, cloud, density * (0.95 - uNight * 0.35 + uRain * 0.35));

          vec3 starCell = floor(dir * 300.0);
          float star = step(0.9965, hash12(starCell.xy + starCell.z * 17.0));
          float starShape = smoothstep(0.25, 0.0, length(fract(dir * 300.0) - 0.5));
          float twinkle = 0.55 + 0.45 * sin(uTime * 2.0 + hash12(starCell.zy) * 40.0);
          color += vec3(star * starShape * twinkle * uNight * (1.0 - uRain) * (1.0 - density) * smoothstep(0.03, 0.2, dir.y));
        }

        // Two layers of distant islands, hazier at their base.
        float azimuth = atan(dir.x, -dir.z);
        float far = ridge(azimuth, 2.0, 3.1, 0.01, 0.09);
        float near = ridge(azimuth, 3.4, 11.7, 0.004, 0.075);
        float aa = 0.0012;
        float farMask = smoothstep(far + aa, far - aa, dir.y) * step(-0.03, dir.y);
        float nearMask = smoothstep(near + aa, near - aa, dir.y) * step(-0.03, dir.y);
        vec3 farColor = mix(uMountainFar, uHorizon, 0.35 * (1.0 - clamp(dir.y / max(far, 0.001), 0.0, 1.0)));
        vec3 nearColor = mix(uMountainNear, uMountainFar, 0.4 * (1.0 - clamp(dir.y / max(near, 0.001), 0.0, 1.0)));
        color = mix(color, farColor, farMask);
        color = mix(color, nearColor, nearMask);

        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });

  const sky = new Mesh(new SphereGeometry(900, 48, 24), material);
  sky.frustumCulled = false;
  sky.renderOrder = -1;
  return { mesh: sky, uniforms };
}
