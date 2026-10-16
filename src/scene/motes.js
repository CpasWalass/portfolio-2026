import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, ShaderMaterial } from 'three';

// Specks of light drifting in the warm air, as in a sunlit painting.
export function createMotes(count = 90) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = 0.5 + Math.random() * 12;
    positions[i * 3 + 2] = -4 - Math.random() * 46;
    seeds[i] = Math.random();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new BufferAttribute(seeds, 1));

  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    // uDrift is accumulated on the CPU so gusts push the specks without jumps; uFade hides them in the rain.
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uDrift: { value: 0 }, uFade: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime;
      uniform float uPixelRatio;
      uniform float uDrift;
      uniform float uFade;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.25 + seed * 40.0) * 2.0 + uDrift * (0.6 + seed * 0.8);
        p.x = mod(p.x + 30.0, 60.0) - 30.0;
        p.y += sin(uTime * 0.4 + seed * 17.0) * 0.8;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vAlpha = uFade * (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + seed * 2.0) + seed * 30.0))) * smoothstep(60.0, 8.0, -mv.z);
        gl_PointSize = (6.0 + seed * 10.0) * uPixelRatio * (12.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float glow = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(1.0, 0.95, 0.75) * glow * vAlpha * 0.55, 1.0);
      }
    `,
  });

  return { points: new Points(geometry, material), uniforms: material.uniforms };
}
