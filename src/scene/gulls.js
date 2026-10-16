import { BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial } from 'three';

// Distant seagulls: an "M" silhouette (inner and outer wing) with darker tips,
// gliding across the sky and flapping now and then.
function wing(side) {
  const s = side;
  const positions = new Float32Array([
    // inner wing
    0, 0, -0.12, 0, 0, 0.12, 0.55 * s, 0.16, 0.02,
    // outer wing
    0.55 * s, 0.16, 0.02, 0.5 * s, 0.14, -0.08, 1.15 * s, -0.04, -0.02,
  ]);
  const colors = new Float32Array([0.97, 0.97, 0.97, 0.97, 0.97, 0.97, 0.94, 0.95, 0.96, 0.94, 0.95, 0.96, 0.9, 0.91, 0.93, 0.35, 0.37, 0.4]);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  return geometry;
}

export function createGulls(count = 6) {
  const group = new Group();
  const material = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, transparent: true });
  const leftWing = wing(-1);
  const rightWing = wing(1);
  const gulls = [];

  for (let i = 0; i < count; i++) {
    const bird = new Group();
    const left = new Mesh(leftWing, material);
    const right = new Mesh(rightWing, material);
    bird.add(left, right);
    bird.scale.setScalar(1.6 + (i % 3) * 0.35);
    group.add(bird);
    gulls.push({
      bird,
      left,
      right,
      lane: -70 - i * 18,
      height: 13 + ((i * 7) % 11),
      speed: 2.2 + (i % 4) * 0.5,
      offset: i * 37,
      phase: i * 1.3,
    });
  }

  const span = 260;
  return {
    group,
    /** 1 = visible; the birds fade away when the rain comes. */
    setPresence(value) {
      material.opacity = value;
      group.visible = value > 0.01;
    },
    update(time) {
      for (const g of gulls) {
        const x = ((time * g.speed + g.offset) % span) - span / 2;
        g.bird.position.set(x, g.height + Math.sin(time * 0.4 + g.phase) * 1.2, g.lane);
        // Glide most of the time, with short bursts of flapping.
        const flapping = Math.max(0, Math.sin(time * 0.35 + g.phase)) > 0.82;
        const angle = flapping ? Math.sin(time * 9 + g.phase) * 0.5 : 0.08 + Math.sin(time * 0.8 + g.phase) * 0.05;
        g.left.rotation.z = -angle;
        g.right.rotation.z = angle;
        g.bird.rotation.y = -Math.PI / 2;
      }
    },
  };
}
