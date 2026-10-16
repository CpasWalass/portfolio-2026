// Weather cycle driven by double-clicking the logo: each level adds one layer to the previous one.
export const WEATHER = [
  { id: 'day', label: 'Jour' },
  { id: 'night', label: 'Nuit' },
  { id: 'wind', label: 'Nuit · le vent se lève' },
  { id: 'rain', label: 'Nuit · pluie' },
];

export const WEATHER_IDS = WEATHER.map((weather) => weather.id);
