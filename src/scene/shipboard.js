import { Group, MathUtils, Vector3 } from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// Contact board hung on the mast, in front of the sail. It is real HTML placed in 3D (CSS3D),
// so text stays crisp, links stay clickable and the content stays accessible.
const LAYOUT = {
  // Board width in world units and in CSS pixels, per screen orientation.
  landscape: { world: 8.6, px: 700, screenHeight: 0.76, screenWidth: 0.82 },
  portrait: { world: 5.4, px: 360, screenHeight: 0.8, screenWidth: 0.92 },
};
// Local position on the ship (before the ship's own scale): just above the rail, in front of the sail.
const RAIL_Y = 1.5;
const FRONT_Z = 2.6;
// Share of the ship's roll and pitch the board follows: enough to feel aboard, little enough to read.
const SWAY = 0.2;

/**
 * @param {{ element: HTMLElement, ship: import('three').Object3D, shipScale: number, scene: import('three').Scene }} options
 */
export function createShipBoard({ element, ship, shipScale, scene }) {
  const renderer = new CSS3DRenderer();
  renderer.domElement.className = 'ship-board-layer';
  document.body.append(renderer.domElement);

  // The board hangs from a holder that follows the ship's position and heading, but only part of its sway.
  const holder = new Group();
  holder.rotation.order = 'YXZ';
  holder.scale.setScalar(shipScale);
  scene.add(holder);
  const object = new CSS3DObject(element);
  holder.add(object);

  const size = { width: 1, height: 1 };
  const center = new Vector3();
  const normal = new Vector3();
  let layout = LAYOUT.landscape;

  /** Sizes the board for the current orientation; the element must be laid out (not display: none). */
  function resize(width, height) {
    layout = width < height ? LAYOUT.portrait : LAYOUT.landscape;
    element.style.width = `${layout.px}px`;
    element.classList.toggle('is-portrait', layout === LAYOUT.portrait);
    // The renderer only inserts the element on its first render; it must be in the DOM to be measured.
    if (!element.isConnected) renderer.domElement.firstChild.firstChild.append(element);
    renderer.setSize(width, height);
    const scale = layout.world / layout.px;
    size.width = layout.world;
    size.height = element.offsetHeight * scale;
    object.scale.setScalar(scale / shipScale);
    object.position.set(0, RAIL_Y + size.height / shipScale / 2, FRONT_Z);
  }

  /**
   * Camera pose facing the board, far enough for it to fill the planned share of the screen.
   * Writes into `outPosition` / `outTarget`.
   */
  function frame(camera, outPosition, outTarget) {
    holder.position.copy(ship.position);
    holder.rotation.set(ship.rotation.x * SWAY, ship.rotation.y, ship.rotation.z * SWAY);
    holder.updateMatrixWorld();
    object.getWorldPosition(center);
    // Face the board along the ship's heading only, so pitch and roll do not shake the view.
    normal.set(Math.sin(ship.rotation.y), 0, Math.cos(ship.rotation.y));
    const tanHalf = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const byHeight = size.height / 2 / (tanHalf * layout.screenHeight);
    const byWidth = size.width / 2 / (tanHalf * camera.aspect * layout.screenWidth);
    const distance = Math.max(byHeight, byWidth);
    // Aim a little above the board so the top of the sail and its W peek out behind it.
    outTarget.copy(center);
    outTarget.y += size.height * 0.06;
    outPosition.copy(outTarget).addScaledVector(normal, distance);
  }

  /** 0 = hidden while sailing, 1 = fully shown once aboard. */
  function setReveal(value) {
    element.style.opacity = value.toFixed(3);
    element.style.visibility = value > 0.001 ? 'visible' : 'hidden';
    element.style.pointerEvents = value > 0.6 ? 'auto' : 'none';
  }

  return {
    resize,
    frame,
    setReveal,
    render(scene, camera) {
      renderer.render(scene, camera);
    },
  };
}
