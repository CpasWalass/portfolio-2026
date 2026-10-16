// Seaside ambience: surf, wind and rain synthesised from filtered noise, plus seagull calls taken
// from a CC0 recording (xeno-canto XC707075, European Herring Gull, via Wikimedia Commons).
// Audio only starts after an explicit click, as browsers require.

const GULL_URL = '/audio/gull-herring.mp3';
// Loud passages of the recording, in seconds, found by analysing its envelope.
const GULL_SLICES = [
  [1.0, 3.6],
  [3.4, 6.2],
  [5.6, 8.4],
  [7.4, 10.2],
];
const MASTER_VOLUME = 0.8;
const WEATHER_FADE = 2.5;
const WIND_LEVEL = 0.55;
const RAIN_LEVEL = 0.35;

function brownNoise(context, seconds) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

function whiteNoise(context, seconds) {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Looping noise through a filter into a gain node that starts silent; returns that gain. */
function noiseLayer(context, destination, noise, { type, frequency, q = 0.7 }) {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = context.createGain();
  gain.gain.value = 0;
  source.connect(filter).connect(gain).connect(destination);
  source.start();
  return { gain, filter };
}

/** One layer of surf: looping noise through a filter, its level swelling like breaking waves. */
function surfLayer(context, destination, noise, { type, frequency, q = 0.7, level, swell, period }) {
  const source = context.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = context.createGain();
  gain.gain.value = level;
  const lfo = context.createOscillator();
  lfo.frequency.value = 1 / period;
  const depth = context.createGain();
  depth.gain.value = swell;
  lfo.connect(depth).connect(gain.gain);
  source.connect(filter).connect(gain).connect(destination);
  source.start();
  lfo.start();
}

export function createAmbience() {
  let context = null;
  let master = null;
  let gullBuffer = null;
  let gullTimer = 0;
  let enabled = false;
  let weather = { wind: 0, rain: 0 };
  let windLayer = null;
  let rainLayer = null;

  function setup() {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    const noise = brownNoise(context, 6);
    surfLayer(context, master, noise, { type: 'lowpass', frequency: 420, level: 0.45, swell: 0.25, period: 9 });
    surfLayer(context, master, noise, { type: 'bandpass', frequency: 1300, q: 0.5, level: 0.12, swell: 0.1, period: 6.5 });

    // Wind: a resonant band whose pitch wanders slowly, like gusts whistling past.
    windLayer = noiseLayer(context, master, noise, { type: 'bandpass', frequency: 600, q: 1.4 });
    const gust = context.createOscillator();
    gust.frequency.value = 0.13;
    const gustDepth = context.createGain();
    gustDepth.gain.value = 320;
    gust.connect(gustDepth).connect(windLayer.filter.frequency);
    gust.start();

    // Rain: bright hiss of countless drops.
    rainLayer = noiseLayer(context, master, whiteNoise(context, 4), { type: 'highpass', frequency: 1800, q: 0.4 });
    applyWeather(0);

    fetch(GULL_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        gullBuffer = buffer;
      })
      .catch((error) => console.warn('Seagull calls unavailable, surf only:', error));
  }

  function applyWeather(seconds) {
    if (!context) return;
    const now = context.currentTime;
    for (const [layer, level] of [
      [windLayer, weather.wind * WIND_LEVEL],
      [rainLayer, weather.rain * RAIN_LEVEL],
    ]) {
      layer.gain.gain.cancelScheduledValues(now);
      layer.gain.gain.setValueAtTime(layer.gain.gain.value, now);
      layer.gain.gain.linearRampToValueAtTime(level, now + seconds);
    }
  }

  function playGull() {
    // Gulls take shelter when it rains.
    if (!enabled || !gullBuffer || weather.rain > 0) return;
    const [start, end] = GULL_SLICES[Math.floor(Math.random() * GULL_SLICES.length)];
    const duration = end - start;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = gullBuffer;
    const gain = context.createGain();
    const peak = 0.5 + Math.random() * 0.3;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.25);
    gain.gain.setValueAtTime(peak, now + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    const pan = context.createStereoPanner();
    pan.pan.value = Math.random() * 1.4 - 0.7;
    source.connect(gain).connect(pan).connect(master);
    source.start(now, start, duration);
  }

  function scheduleGulls() {
    window.clearTimeout(gullTimer);
    if (!enabled) return;
    gullTimer = window.setTimeout(() => {
      playGull();
      scheduleGulls();
    }, 5000 + Math.random() * 9000);
  }

  function applyVolume(seconds) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(enabled ? MASTER_VOLUME : 0, now + seconds);
  }

  return {
    get enabled() {
      return enabled;
    },
    async toggle() {
      if (!context) setup();
      enabled = !enabled;
      if (enabled) {
        await context.resume();
        window.setTimeout(playGull, 1200);
        scheduleGulls();
      } else {
        window.clearTimeout(gullTimer);
      }
      applyVolume(enabled ? 1.5 : 0.6);
      return enabled;
    },
    /** Wind and rain levels from 0 to 1, faded in over a few seconds. */
    setWeather(next) {
      weather = next;
      applyWeather(WEATHER_FADE);
    },
  };
}
