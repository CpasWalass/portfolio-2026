import { BufferAttribute, BufferGeometry, LineSegments, ShaderMaterial } from 'three';

const BOX = { width: 70, height: 28, depth: 60 };

/**
 * Rain streaks in a box around the viewer, falling in the vertex shader.
 * Each drop is one segment; `uRain` fades them in, `uWind` slants them.
 */
export function createRain(count = 1600) {
  const positions = new Float32Array(count * 6);
  const ends = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * BOX.width;
    const y = Math.random() * BOX.height;
    const z = -2 - Math.random() * BOX.depth;
    const seed = Math.random();
    positions.set([x, y, z, x, y, z], i * 6);
    ends.set([0, 1], i * 2);
    seeds.set([seed, seed], i * 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('end', new BufferAttribute(ends, 1));
  geometry.setAttribute('seed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uRain: { value: 0 }, uWind: { value: 0 }, uNight: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float end;
      attribute float seed;
      uniform float uTime;
      uniform float uWind;
      varying float vEnd;
      varying float vSeed;
      void main() {
        vec3 p = position;
        float speed = 24.0 + seed * 10.0;
        p.y = mod(p.y - uTime * speed, ${BOX.height.toFixed(1)}) - 2.0;
        // The wind pushes the drops sideways and tilts the streaks.
        vec2 slant = normalize(vec2(uWind * 0.55, -1.0));
        p.x = mod(p.x + uTime * uWind * 9.0 + ${(BOX.width / 2).toFixed(1)}, ${BOX.width.toFixed(1)}) - ${(BOX.width / 2).toFixed(1)};
        p.xy += slant * end * (0.7 + seed * 0.5);
        vEnd = end;
        vSeed = seed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRain;
      uniform float uNight;
      varying float vEnd;
      varying float vSeed;
      void main() {
        float alpha = uRain * (0.22 + vSeed * 0.25) * (1.0 - vEnd * 0.6);
        vec3 color = mix(vec3(0.85, 0.9, 0.96), vec3(0.6, 0.68, 0.8), uNight);
        gl_FragColor = vec4(color, alpha);
        #include <colorspace_fragment>
      }
    `,
  });

  const lines = new LineSegments(geometry, material);
  lines.frustumCulled = false;
  return { lines, uniforms: material.uniforms };
}
