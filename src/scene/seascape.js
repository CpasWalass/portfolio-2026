import {
  Color,
  DirectionalLight,
  HemisphereLight,
  MathUtils,
  NoToneMapping,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { createSky, createSkyUniforms, mixPalette } from './sky.js';
import { createOcean, OCEAN_SIZE } from './ocean.js';
import { createGulls } from './gulls.js';
import { createMotes } from './motes.js';
import { createRain } from './rain.js';
import { createSunny } from './sunny.js';
import { createShipBoard } from './shipboard.js';
import { waveHeight } from './waves.js';
import { WEATHER_IDS } from '../weather.js';

const CAMERA_HEIGHT = 2.6;
const LOOK_DISTANCE = 60;
// Over the whole page the camera sails this far forward and turns this much,
// so each section is framed against a different part of the sky.
const TRAVEL = 520;
const TURN = MathUtils.degToRad(38);
// Seconds for a full transition of each weather layer.
const TRANSITION = { night: 1.6, wind: 2.5, rain: 2.2 };
// Where the ship sails relative to the viewer: ahead, and to the right of the text column.
// yaw: the bow turns towards the viewer and slightly towards the text, a three-quarter view.
const SHIP = { scale: 2, landscape: { side: 13, ahead: 36 }, portrait: { side: 12, ahead: 66 }, yaw: -0.5 };
const DAY_LIGHT = new Color('#fff4e0');
const NIGHT_LIGHT = new Color('#9fb4e6');

function weatherTargets(level) {
  const index = WEATHER_IDS.indexOf(level);
  return { night: index >= 1 ? 1 : 0, wind: index >= 2 ? 1 : 0, rain: index >= 3 ? 1 : 0 };
}

/**
 * Seascape filling the viewport behind the whole page; scrolling sails through it.
 * When `board` is given, reaching `board.section` flies the camera to the ship.
 * With `board.element`, that content is shown on a board hung on the mast (large screens);
 * without it, the camera simply comes alongside the ship and the page content stays on top (phones).
 * @param {HTMLCanvasElement} canvas Fixed, full-viewport canvas.
 * @param {{ reducedMotion: boolean, weather?: string, board?: { element: HTMLElement | null, section: HTMLElement } }} options
 */
export function createSeascape(canvas, { reducedMotion, weather = 'day', board = null }) {
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  // Painted daylight colours are authored directly: no filmic curve to dull them.
  renderer.toneMapping = NoToneMapping;

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.1, 2000);
  const skyUniforms = createSkyUniforms();
  const sky = createSky(skyUniforms);
  const ocean = createOcean(skyUniforms, { segments: small ? 150 : 230 });
  const gulls = createGulls(small ? 4 : 6);
  const motes = createMotes(small ? 50 : 90);
  const rain = createRain(small ? 800 : 1600);
  const sunny = createSunny();
  sunny.group.scale.setScalar(SHIP.scale);
  scene.add(sky.mesh, ocean.mesh, gulls.group, motes.points, rain.lines, sunny.group);
  const shipBoard = board?.element ? createShipBoard({ element: board.element, ship: sunny.group, shipScale: SHIP.scale, scene }) : null;

  // The ship is cel-shaded: a key light from behind the viewer keeps its colours readable.
  const hemisphere = new HemisphereLight('#ffffff', '#2f6f9f', 1.4);
  const keyLight = new DirectionalLight('#fff4e0', 2.2);
  keyLight.position.set(-30, 45, 40);
  scene.add(hemisphere, keyLight);
  motes.uniforms.uPixelRatio.value = renderer.getPixelRatio();

  const oceanStep = OCEAN_SIZE / (small ? 150 : 230);
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  const forward = new Vector3();
  const right = new Vector3();
  const target = new Vector3();
  const shipPosition = new Vector3();
  const voyage = { target: 0, current: 0 };
  // 0 while sailing, 1 once the camera is aboard, facing the contact board.
  const boarding = { target: 0, current: 0 };
  const sailPosition = new Vector3();
  const sailTarget = new Vector3();
  const boardPosition = new Vector3();
  const boardTarget = new Vector3();
  // Each layer eases towards its target, so night falls, wind rises and rain sets in progressively.
  const goal = weatherTargets(weather);
  const state = { ...goal };
  let elapsed = 0;
  let drift = 0;
  let last = 0;

  function applyWeather() {
    const night = MathUtils.smoothstep(state.night, 0, 1);
    const wind = MathUtils.smoothstep(state.wind, 0, 1);
    const rainLevel = MathUtils.smoothstep(state.rain, 0, 1);
    mixPalette(night);
    skyUniforms.uNight.value = night;
    skyUniforms.uWind.value = wind;
    skyUniforms.uRain.value = rainLevel;
    rain.uniforms.uRain.value = rainLevel;
    rain.uniforms.uWind.value = wind;
    rain.uniforms.uNight.value = night;
    rain.lines.visible = rainLevel > 0.001;
    const dim = 1 - night * 0.55 - rainLevel * 0.2;
    keyLight.color.lerpColors(DAY_LIGHT, NIGHT_LIGHT, night);
    keyLight.intensity = 2.2 * dim;
    hemisphere.intensity = 1.4 * dim;
    motes.uniforms.uFade.value = 1 - rainLevel;
    gulls.setPresence(1 - rainLevel);
  }

  function easeWeather(delta) {
    let changed = false;
    for (const key of Object.keys(state)) {
      if (state[key] === goal[key]) continue;
      const step = reducedMotion ? 1 : delta / TRANSITION[key];
      state[key] = MathUtils.clamp(state[key] + Math.sign(goal[key] - state[key]) * step, 0, 1);
      if (Math.abs(goal[key] - state[key]) < 0.001) state[key] = goal[key];
      changed = true;
    }
    if (changed) applyWeather();
  }

  /** Keeps the ship sailing beside the viewer, riding and tilting with the actual swell. */
  function placeShip(heading, wind) {
    const frame = camera.aspect < 1 ? SHIP.portrait : SHIP.landscape;
    right.set(Math.cos(heading), 0, Math.sin(heading));
    shipPosition.copy(camera.position).addScaledVector(forward, frame.ahead).addScaledVector(right, frame.side);
    const { x, z } = shipPosition;
    const t = elapsed;
    const span = 2.2 * SHIP.scale;
    const center = waveHeight(x, z, t, wind);
    const bow = waveHeight(x - forward.x * span, z - forward.z * span, t, wind);
    const stern = waveHeight(x + forward.x * span, z + forward.z * span, t, wind);
    const port = waveHeight(x - right.x * span * 0.6, z - right.z * span * 0.6, t, wind);
    const starboard = waveHeight(x + right.x * span * 0.6, z + right.z * span * 0.6, t, wind);
    sunny.group.position.set(x, center + 0.1, z);
    sunny.group.rotation.set(
      Math.atan2(stern - bow, span * 2) * 1.2,
      -heading + SHIP.yaw + Math.sin(t * 0.3) * 0.05,
      Math.atan2(port - starboard, span * 1.2) * 1.2,
      'YXZ',
    );
  }

  /** Close view of the ship from its bow quarter, used when no board is hung on it. */
  function frameShip(outPosition, outTarget) {
    const yaw = sunny.group.rotation.y;
    outTarget.copy(sunny.group.position);
    outTarget.y += 4 * SHIP.scale;
    outPosition.set(Math.sin(yaw - 0.35), 0, Math.cos(yaw - 0.35)).multiplyScalar(13 * SHIP.scale).add(outTarget);
    outPosition.y = outTarget.y - 1.5;
  }

  function readScroll() {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    voyage.target = range > 0 ? MathUtils.clamp(window.scrollY / range, 0, 1) : 0;
    if (board) {
      // Boarding starts as the contact section enters and completes when it nearly fills the screen.
      const top = board.section.getBoundingClientRect().top;
      boarding.target = MathUtils.clamp((window.innerHeight - top) / (window.innerHeight * 0.85), 0, 1);
    }
  }

  function frame(now) {
    const delta = last ? Math.min((now - last) / 1000, 0.1) : 0;
    last = now;
    elapsed += reducedMotion ? delta * 0.3 : delta;
    easeWeather(delta);
    const wind = skyUniforms.uWind.value;

    const follow = 1 - Math.exp(-delta * 2.5);
    pointer.smoothX += (pointer.x - pointer.smoothX) * follow;
    pointer.smoothY += (pointer.y - pointer.smoothY) * follow;
    // Inertia on the voyage so scrolling feels like the ship gliding, not jumping.
    voyage.current += (voyage.target - voyage.current) * (reducedMotion ? 1 : 1 - Math.exp(-delta * 1.8));
    boarding.current += (boarding.target - boarding.current) * (1 - Math.exp(-delta * 2.2));
    const aboard = MathUtils.smootherstep(boarding.current, 0, 1);

    // Wind speed is integrated, not multiplied by time, so gusts never make things jump.
    drift += delta * (0.6 + wind * 9);
    sky.uniforms.uCloudOffset.value.x += delta * (0.006 + wind * 0.045);
    sky.uniforms.uCloudOffset.value.y += delta * (0.002 + wind * 0.01);

    const heading = voyage.current * TURN;
    forward.set(Math.sin(heading), 0, -Math.cos(heading));
    const bob = reducedMotion ? 0 : waveHeight(camera.position.x, camera.position.z, elapsed, wind) * 0.35;
    camera.position.copy(forward).multiplyScalar(voyage.current * TRAVEL);
    camera.position.x += pointer.smoothX * 1.2;
    camera.position.y = CAMERA_HEIGHT + wind * 0.8 + bob;
    target.copy(forward).multiplyScalar(LOOK_DISTANCE).add(camera.position);
    target.x += pointer.smoothX * 3;
    target.y = 3.8 + wind * 0.8 - pointer.smoothY * 1.5;
    // The ship is placed from the sailing viewpoint, then the camera may fly to it.
    placeShip(heading, wind);
    if (board && aboard > 0) {
      sailPosition.copy(camera.position);
      sailTarget.copy(target);
      if (shipBoard) shipBoard.frame(camera, boardPosition, boardTarget);
      else frameShip(boardPosition, boardTarget);
      camera.position.lerpVectors(sailPosition, boardPosition, aboard);
      // A gentle arc upwards on the way, like a gull gliding onto the deck.
      camera.position.y += Math.sin(Math.PI * aboard) * 3;
      target.lerpVectors(sailTarget, boardTarget, aboard);
    }
    camera.lookAt(target);
    if (!reducedMotion) camera.rotation.z += Math.sin(elapsed * 0.6) * 0.004 * (1 + wind * 4) * (1 - aboard);
    shipBoard?.setReveal(MathUtils.smoothstep(aboard, 0.6, 0.95));

    sky.mesh.position.copy(camera.position);
    ocean.mesh.position.x = Math.round(camera.position.x / oceanStep) * oceanStep;
    ocean.mesh.position.z = Math.round(camera.position.z / oceanStep) * oceanStep;

    // Gulls, light specks and rain travel with the viewer, always ahead of the camera.
    for (const object of [gulls.group, motes.points, rain.lines]) {
      object.position.set(camera.position.x, 0, camera.position.z);
      object.rotation.y = -heading;
    }

    ocean.uniforms.uTime.value = elapsed;
    sky.uniforms.uTime.value = elapsed;
    motes.uniforms.uTime.value = elapsed;
    motes.uniforms.uDrift.value = drift;
    rain.uniforms.uTime.value = elapsed;
    gulls.update(elapsed);
    sunny.update(elapsed, { night: skyUniforms.uNight.value, wind });

    renderer.render(scene, camera);
    shipBoard?.render(scene, camera);
  }

  function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Portrait screens get a wider lens so the horizon and the sun stay in frame.
    camera.fov = camera.aspect < 1 ? 64 : 48;
    camera.updateProjectionMatrix();
    shipBoard?.resize(width, height);
    readScroll();
  }

  function syncLoop() {
    last = 0;
    renderer.setAnimationLoop(document.hidden ? null : frame);
  }

  if (!reducedMotion) {
    window.addEventListener('pointermove', (event) => {
      pointer.x = event.clientX / window.innerWidth - 0.5;
      pointer.y = event.clientY / window.innerHeight - 0.5;
    });
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', resize);
  // Page height changes as images load or sections expand.
  new ResizeObserver(readScroll).observe(document.body);
  // The board grows when its photo loads: measure it again.
  if (shipBoard) new ResizeObserver(() => shipBoard.resize(window.innerWidth, window.innerHeight)).observe(board.element);
  document.addEventListener('visibilitychange', syncLoop);

  resize();
  voyage.current = voyage.target;
  boarding.current = boarding.target;
  applyWeather();
  syncLoop();

  return {
    setWeather(level) {
      Object.assign(goal, weatherTargets(level));
    },
  };
}
