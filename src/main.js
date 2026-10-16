import './styles/main.css';
import { arsenal, journey, offstage, profile, projects, seas } from './data/content.js';
import { prefersReducedMotion } from './ui/dom.js';
import { createProjectExplorer } from './ui/projects.js';
import { createWorldMap } from './ui/worldmap.js';
import { renderArsenal, renderContact, renderDossier, renderJournal, renderOffstage } from './ui/sections.js';
import { setupNavigation, setupReveal } from './ui/navigation.js';
import { createAmbience } from './audio/ambience.js';
import { WEATHER, WEATHER_IDS } from './weather.js';

const $ = (selector) => document.querySelector(selector);
const hero = $('#accueil');

renderDossier($('[data-dossier]'), profile);

// The explorer is created first; the map calls back into it, so it is wired once both exist.
let worldMap = null;
const explorer = createProjectExplorer({
  detailRoot: $('[data-logbook]'),
  ledeRoot: $('[data-map-lede]'),
  projects,
  seas,
  onSelect: (index) => worldMap?.setActive(index),
  onFilter: (isDimmed) => worldMap?.setDimmed(isDimmed),
});
worldMap = createWorldMap({ root: $('[data-world-map]'), projects, seas, onPick: (index) => explorer.select(index) });
worldMap.setActive(0);

renderArsenal($('[data-arsenal]'), {
  arsenal,
  projects,
  onToolSelect(tool) {
    explorer.filterByTool(tool);
    $('#projets').scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  },
});

renderJournal($('[data-journal]'), journey);
renderOffstage($('[data-offstage]'), offstage);
renderContact(
  {
    emailLink: $('[data-email-link]'),
    copyButton: $('[data-copy-email]'),
    feedback: $('[data-copy-feedback]'),
    linksRoot: $('[data-contact-links]'),
    yearRoot: $('[data-year]'),
  },
  profile,
);

setupReveal(document.querySelectorAll('.section-head, .profile > *, .explorer, .hold, .journal-entry, .crew, .contact, .contact-photo'));
setupNavigation({
  sections: [...document.querySelectorAll('[data-section]')],
  menu: $('#menu'),
  toggle: $('.menu-toggle'),
  topbar: $('[data-topbar]'),
  hero,
});

const ambience = createAmbience();

// Weather: the state (day, night, wind, rain) advances on its own every 30 seconds,
// and each double-click on the logo moves to the next one right away.
// A state chosen by hand is remembered on this device.
const WEATHER_KEY = 'walass-weather';
const WEATHER_CYCLE_MS = 30000;
const weatherToast = $('[data-weather-toast]');
let weatherIndex = Math.max(0, WEATHER_IDS.indexOf(document.documentElement.dataset.weather ?? 'day'));
let seascape = null;
let toastTimer = 0;
let cycleTimer = 0;

function applyWeather(index, { announce = true, persist = true } = {}) {
  weatherIndex = index;
  const { id, label } = WEATHER[index];
  document.documentElement.dataset.weather = id;
  if (index > 0) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  seascape?.setWeather(id);
  ambience.setWeather({ wind: index >= 2 ? 1 : 0, rain: index >= 3 ? 1 : 0 });
  if (!announce) return;
  weatherToast.textContent = label;
  weatherToast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => weatherToast.classList.remove('is-visible'), 2200);
  if (!persist) return;
  try {
    localStorage.setItem(WEATHER_KEY, id);
  } catch (error) {
    console.warn('Weather preference not saved:', error);
  }
}

const nextWeather = () => (weatherIndex + 1) % WEATHER.length;

/** (Re)starts the 30-second countdown; paused while the tab is hidden. */
function scheduleWeatherCycle() {
  window.clearInterval(cycleTimer);
  if (document.hidden) return;
  cycleTimer = window.setInterval(() => applyWeather(nextWeather(), { persist: false }), WEATHER_CYCLE_MS);
}

$('[data-brand]').addEventListener('dblclick', (event) => {
  event.preventDefault();
  applyWeather(nextWeather());
  // A manual choice gets a full 30 seconds before the cycle moves on.
  scheduleWeatherCycle();
});
document.addEventListener('visibilitychange', scheduleWeatherCycle);
scheduleWeatherCycle();

// Sea sound: off by default, started by the visitor.
const soundToggle = $('[data-sound-toggle]');
soundToggle.addEventListener('click', async () => {
  try {
    const on = await ambience.toggle();
    soundToggle.setAttribute('aria-pressed', String(on));
    $('[data-sound-label]').textContent = on ? 'Couper le son' : 'Activer le son de la mer';
  } catch (error) {
    console.warn('Audio unavailable:', error);
    soundToggle.hidden = true;
  }
});

// The veil over the sea deepens once the visitor leaves the hero, to keep text readable.
const updateDepth = () =>
  document.documentElement.style.setProperty('--depth', String(Math.min(window.scrollY / window.innerHeight, 1)));
window.addEventListener('scroll', updateDepth, { passive: true });
updateDepth();

applyWeather(weatherIndex, { announce: false });

// The seascape is an enhancement: without WebGL the page keeps a painted gradient.
/**
 * Moves the contact block and photo onto a board that the 3D scene hangs on the ship.
 * The same nodes are moved, not copied, so without WebGL the section stays as it is.
 */
function buildShipBoard() {
  const section = $('#contact');
  const element = document.createElement('div');
  element.className = 'ship-board';
  element.setAttribute('role', 'region');
  element.setAttribute('aria-label', 'Contact');
  const nodes = [section.querySelector('.contact-photo'), section.querySelector('.contact')];
  const footer = section.querySelector('.footer');
  for (const node of nodes) {
    node.classList.remove('reveal');
    element.append(node);
  }
  // The copyright line rides along, at the foot of the board.
  element.append(footer);
  // Keyboard users tabbing into the board are brought to the contact section, where it is visible.
  element.addEventListener('focusin', () => {
    if (section.getBoundingClientRect().top > window.innerHeight * 0.3) section.scrollIntoView();
  });
  document.documentElement.classList.add('has-ship-board');
  return {
    element,
    section,
    /** Puts the contact back in the page if the 3D scene cannot start. */
    restore() {
      section.append(nodes[1], nodes[0], footer);
      document.documentElement.classList.remove('has-ship-board');
    },
  };
}

import('./scene/seascape.js')
  .then(({ createSeascape }) => {
    const reducedMotion = prefersReducedMotion();
    // The flight to the ship is a large camera move: skipped when reduced motion is requested.
    // The 3D board needs room to be readable: on phones and narrow windows the contact stays a page card.
    const roomy = window.innerWidth >= 900 && window.innerWidth > window.innerHeight;
    let board = null;
    if (!reducedMotion) board = roomy ? buildShipBoard() : { element: null, section: $('#contact') };
    try {
      seascape = createSeascape($('[data-seascape]'), { reducedMotion, weather: WEATHER[weatherIndex].id, board });
    } catch (error) {
      board?.restore?.();
      throw error;
    }
    document.documentElement.classList.add('has-seascape');
  })
  .catch((error) => {
    console.warn('Seascape disabled:', error);
    document.documentElement.classList.add('no-seascape');
  });
