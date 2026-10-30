import {
  BackSide,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  PlaneGeometry,
  RedFormat,
  RingGeometry,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three';


const INK = '#1d1410';
const COLORS = {
  hull: '#c8352b',
  dots: '#f3c64a',
  gold: '#e7b23a',
  rail: '#f6efe0',
  lawn: '#6ba83c',
  wood: '#8a5a2e',
  lionFace: '#f8d25a',
  lionSnout: '#fbe8a8',
  mane: '#f08a24',
  bone: '#fbf6ea',
  canvas: '#f4ebd8',
};

// Hull: the lower part of an ellipsoid, opened at the top for the deck.
const HULL_SCALE = new Vector3(1.5, 1.5, 1.9);
const HULL_TOP = Math.PI * 0.32;
const HULL_OFFSET = 0.55;
const RIM_Y = Math.cos(HULL_TOP) + HULL_OFFSET;
const RIM_RADIUS = Math.sin(HULL_TOP);

function toonGradient() {
  const texture = new DataTexture(new Uint8Array([95, 175, 255]), 3, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return texture;
}

const gradientMap = toonGradient();
const toon = (color, extra = {}) => new MeshToonMaterial({ color: new Color(color), gradientMap, ...extra });

/** Inverted-hull outline: the back faces, pushed out along the normals, drawn in ink. */
const outlineMaterials = new Map();
function outlineMaterial(width) {
  if (!outlineMaterials.has(width)) {
    const material = new MeshBasicMaterial({ color: INK, side: BackSide });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `vec3 transformed = position + normalize(normal) * ${width.toFixed(4)};`,
      );
    };
    outlineMaterials.set(width, material);
  }
  return outlineMaterials.get(width);
}

function inked(mesh, width = 0.03) {
  mesh.add(new Mesh(mesh.geometry, outlineMaterial(width)));
  return mesh;
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function polkaDots() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = COLORS.hull;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COLORS.dots;
    const step = 86;
    for (let row = 0; row * step < h; row++) {
      for (let col = 0; col * step < w + step; col++) {
        const x = col * step + (row % 2) * (step / 2);
        ctx.beginPath();
        ctx.ellipse(x, row * step + 30, 15, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

/** Crossed bones behind a large "W", the portfolio's own emblem. */
function drawEmblem(ctx, cx, cy, size) {
  const bone = (angle) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = COLORS.bone;
    ctx.strokeStyle = INK;
    ctx.lineWidth = size * 0.035;
    const length = size * 0.95;
    const radius = size * 0.07;
    ctx.beginPath();
    ctx.roundRect(-length / 2, -radius * 0.7, length, radius * 1.4, radius);
    for (const end of [-1, 1]) {
      for (const side of [-1, 1]) {
        ctx.moveTo(end * length / 2 + radius, side * radius);
        ctx.arc(end * length / 2, side * radius, radius, 0, Math.PI * 2);
      }
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };
  bone(Math.PI / 4);
  bone(-Math.PI / 4);

  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.bone;
  ctx.fill();
  ctx.lineWidth = size * 0.035;
  ctx.strokeStyle = INK;
  ctx.stroke();

  const w = size * 0.22;
  ctx.beginPath();
  ctx.moveTo(cx - w, cy - w * 0.62);
  ctx.lineTo(cx - w * 0.52, cy + w * 0.68);
  ctx.lineTo(cx, cy - w * 0.12);
  ctx.lineTo(cx + w * 0.52, cy + w * 0.68);
  ctx.lineTo(cx + w, cy - w * 0.62);
  ctx.lineJoin = 'miter';
  ctx.lineWidth = size * 0.07;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + w * 1.12, cy + w * 0.62, size * 0.045, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.hull;
  ctx.fill();
}

/** Sewn canvas: vertical cloths with stitched seams, a reinforced hem and the W emblem. */
function sailTexture() {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const cloth = 64;
    for (let x = 0; x < w; x += cloth) {
      ctx.fillStyle = (x / cloth) % 2 ? '#f1e6cf' : COLORS.canvas;
      ctx.fillRect(x, 0, cloth, h);
      ctx.strokeStyle = 'rgba(110, 80, 50, 0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(110, 80, 50, 0.25)';
      ctx.setLineDash([10, 9]);
      ctx.beginPath();
      ctx.moveTo(x + 7, 0);
      ctx.lineTo(x + 7, h);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Hem along the edges; the ink outline itself is a tube around the sail.
    ctx.fillStyle = 'rgba(150, 115, 70, 0.28)';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillRect(0, h - 30, w, 30);
    drawEmblem(ctx, w / 2, h * 0.5, 640);
  });
}

function flagTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#17110d';
    ctx.fillRect(0, 0, w, h);
    drawEmblem(ctx, w / 2, h / 2, 260);
  });
}

/** Point and outward normal on the hull surface, for polar angle theta and azimuth phi (0 = bow). */
function hullPoint(theta, phi) {
  const local = new Vector3(Math.sin(theta) * Math.sin(phi), Math.cos(theta), Math.sin(theta) * Math.cos(phi));
  const point = local.clone().multiply(HULL_SCALE);
  point.y += HULL_OFFSET;
  const normal = local.clone().divide(HULL_SCALE).normalize();
  return { point, normal };
}

function buildHull(group) {
  const hull = new Mesh(
    new SphereGeometry(1, 72, 40, 0, Math.PI * 2, HULL_TOP, Math.PI - HULL_TOP),
    toon('#ffffff', { map: polkaDots(), side: DoubleSide }),
  );
  hull.scale.copy(HULL_SCALE);
  hull.position.y = HULL_OFFSET;
  group.add(inked(hull, 0.025));

  const deck = new Mesh(new CircleGeometry(1, 64), toon(COLORS.lawn));
  deck.rotation.x = -Math.PI / 2;
  deck.scale.set(HULL_SCALE.x * RIM_RADIUS * 0.98, HULL_SCALE.z * RIM_RADIUS * 0.98, 1);
  deck.position.y = RIM_Y - 0.06;
  group.add(deck);

  const rail = new Mesh(new TorusGeometry(1, 0.06, 14, 120), toon(COLORS.rail));
  rail.rotation.x = Math.PI / 2;
  rail.scale.set(HULL_SCALE.x * RIM_RADIUS, HULL_SCALE.z * RIM_RADIUS, 1.4);
  rail.position.y = RIM_Y;
  group.add(inked(rail, 0.02));

  const band = new Mesh(new TorusGeometry(1, 0.05, 12, 120), toon(COLORS.gold));
  band.rotation.x = Math.PI / 2;
  band.scale.set(HULL_SCALE.x * 0.88, HULL_SCALE.z * 0.88, 1.3);
  band.position.y = RIM_Y - 0.2;
  group.add(inked(band, 0.018));

  // Portholes: gold rings with dark glass that lights up at night.
  const glass = toon('#1f2a33', { emissive: new Color('#ffb648'), emissiveIntensity: 0 });
  for (const phi of [-2.1, -1.65, -1.2, 1.2, 1.65, 2.1]) {
    const { point, normal } = hullPoint(Math.PI * 0.47, phi);
    const ring = inked(new Mesh(new TorusGeometry(0.13, 0.035, 10, 32), toon(COLORS.gold)), 0.015);
    const pane = new Mesh(new CircleGeometry(0.12, 24), glass);
    for (const part of [ring, pane]) {
      part.position.copy(point).addScaledVector(normal, 0.01);
      part.lookAt(point.clone().add(normal));
      group.add(part);
    }
  }
  return glass;
}

function buildFigurehead(group) {
  const { point } = hullPoint(Math.PI * 0.4, 0);
  const head = new Group();
  head.position.set(0, point.y + 0.42, point.z + 0.12);
  group.add(head);

  // Gold medallion with crossed bones behind the lion.
  const medallion = inked(new Mesh(new TorusGeometry(0.78, 0.09, 14, 64), toon(COLORS.gold)), 0.02);
  medallion.position.z = -0.22;
  head.add(medallion);
  const back = new Mesh(new CircleGeometry(0.72, 48), toon('#6b2a1c'));
  back.position.z = -0.26;
  head.add(back);
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const bone = new Group();
    bone.rotation.z = angle;
    bone.position.z = -0.3;
    const shaft = inked(new Mesh(new CylinderGeometry(0.075, 0.075, 2.1, 16), toon(COLORS.bone)), 0.02);
    bone.add(shaft);
    for (const end of [-1, 1]) {
      for (const side of [-1, 1]) {
        const knob = inked(new Mesh(new SphereGeometry(0.12, 18, 12), toon(COLORS.bone)), 0.02);
        knob.position.set(side * 0.08, end * 1.05, 0);
        bone.add(knob);
      }
    }
    head.add(bone);
  }

  // Sun-like mane: broad petals radiating behind the face.
  const petal = new SphereGeometry(1, 24, 16);
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.PI / 10;
    const leaf = inked(new Mesh(petal, toon(COLORS.mane)), 0.04);
    leaf.scale.set(0.2, 0.36, 0.06);
    leaf.position.set(Math.sin(angle) * 0.56, Math.cos(angle) * 0.56, -0.08);
    leaf.rotation.z = -angle;
    head.add(leaf);
  }

  const face = inked(new Mesh(new SphereGeometry(0.43, 40, 28), toon(COLORS.lionFace)), 0.025);
  face.scale.set(1, 0.95, 0.8);
  head.add(face);
  const snout = inked(new Mesh(new SphereGeometry(0.19, 28, 20), toon(COLORS.lionSnout)), 0.02);
  snout.scale.set(1.15, 0.8, 0.9);
  snout.position.set(0, -0.1, 0.3);
  head.add(snout);
  const dark = toon('#3a2216');
  const nose = new Mesh(new SphereGeometry(0.06, 16, 12), dark);
  nose.scale.set(1.3, 0.8, 1);
  nose.position.set(0, -0.02, 0.47);
  head.add(nose);
  for (const side of [-1, 1]) {
    const eye = new Mesh(new SphereGeometry(0.045, 14, 10), dark);
    eye.scale.set(0.8, 1.3, 0.6);
    eye.position.set(side * 0.16, 0.12, 0.33);
    head.add(eye);
  }
}

/**
 * Square sail puffed out like a cushion, as drawn in the series: the free bottom edge sags
 * in the middle, its corners lift, and the sides wrap backwards as the wind fills the cloth.
 */
function buildSail(width, height) {
  const columns = 32;
  const rows = 26;
  const geometry = new PlaneGeometry(width, height, columns, rows);
  const position = geometry.attributes.position;
  const shape = (u, v) => {
    // Clamp: sin(π) is a tiny negative number, and a fractional power of it is NaN.
    const across = Math.max(0, Math.sin(Math.PI * u));
    const down = Math.max(0, Math.sin(Math.PI * MathUtils.lerp(0.1, 1, v)));
    const belly = Math.pow(across, 0.65) * Math.pow(down, 0.7);
    const free = Math.pow(1 - v, 3);
    return new Vector3(
      (u - 0.5) * width * (1 - 0.14 * belly) * MathUtils.lerp(1.07, 1, v),
      (v - 0.5) * height - 0.38 * across * free + 0.32 * (1 - across) * free,
      1.9 * belly,
    );
  };
  for (let i = 0; i < position.count; i++) {
    const u = position.getX(i) / width + 0.5;
    const v = position.getY(i) / height + 0.5;
    position.setXYZ(i, ...shape(u, v).toArray());
  }
  geometry.computeVertexNormals();
  const sail = new Mesh(geometry, toon('#ffffff', { map: sailTexture(), side: DoubleSide }));

  // Ink outline: a thin tube following the sail's border, since a double-sided cloth has no back faces to push out.
  const border = [];
  const steps = 40;
  for (let i = 0; i < steps; i++) border.push(shape(i / steps, 1));
  for (let i = 0; i < steps; i++) border.push(shape(1, 1 - i / steps));
  for (let i = 0; i < steps; i++) border.push(shape(1 - i / steps, 0));
  for (let i = 0; i < steps; i++) border.push(shape(0, i / steps));
  const outline = new Mesh(
    new TubeGeometry(new CatmullRomCurve3(border, true), 320, 0.045, 6, true),
    new MeshBasicMaterial({ color: INK }),
  );
  sail.add(outline);
  return sail;
}

function buildRig(group) {
  const wood = toon(COLORS.wood);
  const mastTop = 7.4;
  const mast = inked(new Mesh(new CylinderGeometry(0.09, 0.12, mastTop - RIM_Y, 16), wood), 0.02);
  mast.position.set(0, (mastTop + RIM_Y) / 2, -0.15);
  group.add(mast);

  const yardY = 6.7;
  const yard = inked(new Mesh(new CylinderGeometry(0.08, 0.08, 5.6, 12), wood), 0.018);
  yard.rotation.z = Math.PI / 2;
  yard.position.set(0, yardY, 0.05);
  group.add(yard);

  const sail = buildSail(5.4, 4.7);
  sail.position.set(0, yardY - 4.7 / 2 - 0.02, 0.12);
  group.add(sail);

  const flagGeometry = new PlaneGeometry(1.2, 0.75, 12, 4);
  flagGeometry.translate(0.6, 0, 0);
  const flag = new Mesh(flagGeometry, new MeshBasicMaterial({ map: flagTexture(), side: DoubleSide }));
  flag.position.set(0.02, mastTop - 0.35, -0.15);
  group.add(flag);
  return { flag, rest: flagGeometry.attributes.position.array.slice() };
}

/** White water around the hull where it meets the sea. */
function buildSplash(group) {
  const material = new MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false });
  const ring = new Mesh(new RingGeometry(0.85, 1.12, 64), material);
  ring.rotation.x = -Math.PI / 2;
  ring.scale.set(HULL_SCALE.x * 1.02, HULL_SCALE.z * 1.02, 1);
  ring.position.y = 0.04;
  group.add(ring);
  return material;
}

export function createSunny() {
  const group = new Group();
  const glass = buildHull(group);
  buildFigurehead(group);
  const { flag, rest } = buildRig(group);
  const splash = buildSplash(group);

  return {
    group,
    update(time, { night, wind }) {
      const position = flag.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const x = rest[i * 3];
        const y = rest[i * 3 + 1];
        position.setZ(i, Math.sin(x * 4 - time * (5 + wind * 6) + y) * (0.1 + wind * 0.1) * x);
      }
      position.needsUpdate = true;
      glass.emissiveIntensity = night * 2.2;
      splash.opacity = 0.4 + 0.25 * Math.sin(time * 2.2) * 0.5 + wind * 0.25;
    },
  };
}
