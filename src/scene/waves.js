// Gerstner wave set shared by the ocean shader and the CPU side (camera bobbing),
// so anything floating follows exactly the surface that is rendered.
// Each wave: [dirX, dirZ, steepness, wavelength]. A calm, sunny sea: long low swells.
export const WAVES = [
  [1.0, 0.35, 0.09, 42],
  [0.6, 1.0, 0.07, 23],
  [-0.5, 1.0, 0.06, 14],
  [0.9, -0.5, 0.05, 8],
];

const GRAVITY = 9.8;

/** Swell multiplier at full wind; the shader applies the same factor. */
export const WIND_SWELL = 0.9;

/** Vertical displacement of the ocean surface at (x, z) and time t, for a wind level from 0 to 1. */
export function waveHeight(x, z, t, wind = 0) {
  let y = 0;
  for (const [dx, dz, steepness, wavelength] of WAVES) {
    const len = Math.hypot(dx, dz);
    const k = (2 * Math.PI) / wavelength;
    const c = Math.sqrt(GRAVITY / k);
    y += (steepness / k) * Math.sin(k * ((dx / len) * x + (dz / len) * z - c * t));
  }
  return y * (1 + wind * WIND_SWELL);
}

/** GLSL declaration of the same waves, injected into the ocean shader. */
export const WAVES_GLSL = `
const int WAVE_COUNT = ${WAVES.length};
const float WIND_SWELL = ${WIND_SWELL.toFixed(2)};
const vec4 WAVES[WAVE_COUNT] = vec4[](
  ${WAVES.map((w) => `vec4(${w.map((n) => n.toFixed(4)).join(', ')})`).join(',\n  ')}
);
`;
