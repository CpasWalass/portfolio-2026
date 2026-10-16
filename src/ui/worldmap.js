import { el } from './dom.js';

// Parchment world map in the spirit of One Piece, set in a card like the rest of the site: the Red Line runs north-south,
// the Grand Line east-west, they cross at Reverse Mountain, and the four Blues fill the quarters.
const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 1040;
const H = 770;
// Margin kept clear along the parchment edge for the decorative islets.
const FRAME = 34;
const CENTER = { x: W / 2, y: 405 };
const GRAND_LINE = { top: 368, bottom: 442 };
const CALM_BELT = { top: 352, bottom: 458 };
const RED_LINE_HALF = 34;
const COMPASS = { x: 420, y: 672 };

function svg(tag, attributes = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  for (const child of children) node.append(child);
  return node;
}

function text(content, attributes) {
  const node = svg('text', attributes);
  node.textContent = content;
  return node;
}

function seeded(seed) {
  let s = seed || 1;
  return () => ((s = Math.imul(s, 48271) % 2147483647) & 0xffff) / 0xffff;
}

function hashString(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

const fmt = (n) => n.toFixed(1);

/** Smooth irregular island outline around (cx, cy). */
function islandPath(cx, cy, radius, seed, stretch = 1.15) {
  const random = seeded(seed);
  const points = Array.from({ length: 11 }, (_, i) => {
    const angle = (i / 11) * Math.PI * 2;
    const r = radius * (0.7 + random() * 0.5);
    return [cx + Math.cos(angle) * r * stretch, cy + Math.sin(angle) * r];
  });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mid(points.at(-1), points[0]).map(fmt).join(' ')}`;
  points.forEach((p, i) => {
    d += ` Q ${p.map(fmt).join(' ')} ${mid(p, points[(i + 1) % points.length]).map(fmt).join(' ')}`;
  });
  return `${d} Z`;
}

/** One half of the Red Line: a ragged continent band between two heights. */
function redLinePath(fromY, toY, seed) {
  const random = seeded(seed);
  const steps = Math.round(Math.abs(toY - fromY) / 18);
  const edge = (side) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const y = fromY + ((toY - fromY) * i) / steps;
      const x = CENTER.x + side * (RED_LINE_HALF + (random() - 0.5) * 26 + Math.sin(y * 0.04 + seed) * 8);
      return [x, y];
    });
  const left = edge(-1);
  const right = edge(1).reverse();
  return `M ${[...left, ...right].map((p) => p.map(fmt).join(' ')).join(' L ')} Z`;
}

function defs() {
  return svg('defs', {}, [
    svg('radialGradient', { id: 'map-parchment', cx: '50%', cy: '48%', r: '70%' }, [
      svg('stop', { offset: '0%', 'stop-color': '#fbe6bd' }),
      svg('stop', { offset: '70%', 'stop-color': '#f6d29c' }),
      svg('stop', { offset: '100%', 'stop-color': '#eba86c' }),
    ]),
    // Small arcs repeated in a staggered grid: the classic engraved sea.
    svg('pattern', { id: 'map-waves', width: 34, height: 22, patternUnits: 'userSpaceOnUse' }, [
      svg('path', { d: 'M 2 8 q 4 -5 8 0 q 4 -5 8 0', class: 'map-wave' }),
      svg('path', { d: 'M 19 19 q 4 -5 8 0 q 4 -5 8 0', class: 'map-wave' }),
    ]),
    svg('pattern', { id: 'map-sand', width: 12, height: 6, patternUnits: 'userSpaceOnUse' }, [
      svg('path', { d: 'M 0 3 q 3 -2 6 0 q 3 2 6 0', class: 'map-sand-line' }),
    ]),
    svg('filter', { id: 'map-glow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, [
      svg('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 3, result: 'grown' }),
      svg('feGaussianBlur', { in: 'grown', stdDeviation: 5, result: 'blur' }),
      svg('feFlood', { 'flood-color': '#e8834a', 'flood-opacity': 0.85 }),
      svg('feComposite', { in2: 'blur', operator: 'in', result: 'glow' }),
      svg('feMerge', {}, [svg('feMergeNode', { in: 'glow' }), svg('feMergeNode', { in: 'SourceGraphic' })]),
    ]),
  ]);
}

function compass() {
  const group = svg('g', { class: 'map-compass', transform: `translate(${COMPASS.x} ${COMPASS.y})` });
  group.append(svg('circle', { r: 30, class: 'map-compass-ring' }));
  for (let i = 0; i < 8; i++) {
    const long = i % 2 === 0;
    const length = long ? 46 : 26;
    group.append(
      svg('path', {
        d: `M 0 ${-length} L ${long ? 7 : 5} 0 L 0 ${length * 0.15} L ${long ? -7 : -5} 0 Z`,
        transform: `rotate(${i * 45})`,
        class: long ? 'map-compass-star' : 'map-compass-star map-compass-star-minor',
      }),
    );
  }
  group.append(text('N', { y: -52, class: 'map-compass-letter' }));
  return group;
}

function scenery(projects, seas) {
  const group = svg('g');
  // Calm Belts frame the Grand Line, whose sea is a band of rippled sand.
  group.append(svg('rect', { x: 0, y: GRAND_LINE.top, width: W, height: GRAND_LINE.bottom - GRAND_LINE.top, class: 'map-grand-line' }));
  group.append(svg('rect', { x: 0, y: GRAND_LINE.top, width: W, height: GRAND_LINE.bottom - GRAND_LINE.top, fill: 'url(#map-sand)' }));
  for (const y of [CALM_BELT.top, CALM_BELT.bottom]) {
    group.append(svg('line', { x1: 0, y1: y, x2: W, y2: y, class: 'map-calm-belt' }));
    group.append(text('Calm Belt', { x: 70, y: y + (y < CENTER.y ? -6 : 14), class: 'map-small-label' }));
    group.append(text('Calm Belt', { x: 960, y: y + (y < CENTER.y ? -6 : 14), class: 'map-small-label', 'text-anchor': 'end' }));
  }

  // Decorative islets so the seas do not look empty; kept away from the project islands.
  const random = seeded(7);
  let placed = 0;
  for (let attempt = 0; attempt < 400 && placed < 26; attempt++) {
    const x = FRAME + 30 + random() * (W - FRAME * 2 - 60);
    const y = FRAME + 30 + random() * (H - FRAME * 2 - 60);
    const nearRedLine = Math.abs(x - CENTER.x) < RED_LINE_HALF + 40;
    const inBelts = y > CALM_BELT.top - 30 && y < CALM_BELT.bottom + 30;
    // Keep clear of islands, their names below them, and the sea names.
    const nearProject = projects.some((p) => Math.hypot(p.x - x, p.y - y) < 70 || Math.hypot(p.x - x, p.y + 38 - y) < 70);
    const nearSeaName = seas.some((sea) => Math.abs(sea.label.x - x) < 170 && Math.abs(sea.label.y - y) < 45);
    const nearCompass = Math.hypot(COMPASS.x - x, COMPASS.y - y) < 70;
    if (nearRedLine || inBelts || nearProject || nearSeaName || nearCompass) continue;
    group.append(svg('path', { d: islandPath(x, y, 5 + random() * 9, Math.floor(random() * 1e6)), class: 'map-islet' }));
    placed++;
  }

  const redLine = svg('g', { class: 'map-red-line', filter: 'url(#map-glow)' });
  redLine.append(svg('path', { d: redLinePath(-10, CALM_BELT.top + 6, 3) }));
  redLine.append(svg('path', { d: redLinePath(CALM_BELT.bottom - 6, H + 10, 11) }));
  redLine.append(svg('circle', { cx: CENTER.x, cy: CENTER.y, r: 36 }));
  group.append(redLine);

  // Reverse Mountain: four channels climbing from the four Blues to the summit.
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    group.append(svg('line', { x1: CENTER.x, y1: CENTER.y, x2: CENTER.x + dx * 30, y2: CENTER.y + dy * 30, class: 'map-channel' }));
  }
  group.append(text('Reverse Mountain', { x: CENTER.x, y: CENTER.y + 58, class: 'map-small-label', 'text-anchor': 'middle' }));
  group.append(text('Grand Line · New World', { x: 58, y: GRAND_LINE.top + 21, class: 'map-band-label' }));
  group.append(text('Grand Line · Paradise', { x: 572, y: GRAND_LINE.top + 21, class: 'map-band-label' }));
  group.append(compass());
  return group;
}

/**
 * Renders the world map into `root`. Islands are real buttons layered over the SVG.
 * @returns {{ setActive(index: number): void, setDimmed(isDimmed: (project) => boolean): void }}
 */
export function createWorldMap({ root, projects, seas, onPick }) {
  const seaById = new Map(seas.map((sea) => [sea.id, sea]));
  const drawing = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'map-svg', 'aria-hidden': 'true' });
  // The frame is the site's own card (see .world-map); the parchment fills the whole drawing.
  drawing.append(defs());
  drawing.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#map-parchment)' }));
  drawing.append(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#map-waves)' }));
  // The Grand Line is named along its band; each quarter is labelled with its domain only.
  const blues = seas.filter((sea) => sea.id !== 'grand-line');
  drawing.append(scenery(projects, blues));

  for (const sea of blues) {
    drawing.append(text(sea.theme, { x: sea.label.x, y: sea.label.y + 8, class: 'map-sea-name', 'text-anchor': 'middle' }));
  }

  const islands = projects.map((project) => {
    const group = svg('g', { class: 'map-island' });
    group.append(svg('circle', { cx: project.x, cy: project.y, r: 30, class: 'map-island-pulse' }));
    group.append(svg('path', { d: islandPath(project.x, project.y, 17, hashString(project.id)), class: 'map-island-land', filter: 'url(#map-glow)' }));
    group.append(text(project.mapLabel ?? project.title, { x: project.x, y: project.y + 36, class: 'map-island-label', 'text-anchor': 'middle' }));
    drawing.append(group);
    return group;
  });

  const buttons = projects.map((project, index) =>
    el('button', {
      type: 'button',
      class: 'map-hit',
      style: `left:${(project.x / W) * 100}%;top:${(project.y / H) * 100}%`,
      'aria-label': `${project.title}, ${seaById.get(project.sea).theme}`,
      onclick: () => onPick(index),
    }),
  );
  root.replaceChildren(el('div', { class: 'map-canvas' }, [drawing, ...buttons]));

  return {
    setActive(index) {
      islands.forEach((island, i) => island.classList.toggle('is-active', i === index));
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    },
    setDimmed(isDimmed) {
      projects.forEach((project, i) => islands[i].classList.toggle('is-dimmed', isDimmed(project)));
    },
  };
}
