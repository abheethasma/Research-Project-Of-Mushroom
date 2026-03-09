import { BACKEND_URL } from './api';

export async function fetchEnvironmentStatus() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/status`);
  if (!res.ok) throw new Error('Failed to fetch environment status');
  return res.json(); // now returns { reading, profile, optimal_range, alerts }
}


export async function fetchEnvironmentOptions() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/options`);
  if (!res.ok) throw new Error('Failed to fetch environment options');
  return res.json();
}

export async function fetchEnvironmentProfile() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/profile`);
  if (!res.ok) throw new Error('Failed to fetch environment profile');
  return res.json();
}

export async function updateEnvironmentProfile(profile) {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update environment profile');
  return res.json();
}

export async function fetchOptimalRange(mushroom_type, stage) {
  const url = `${BACKEND_URL}/api/v1/environment/optimal-range?mushroom_type=${encodeURIComponent(
    mushroom_type
  )}&stage=${encodeURIComponent(stage)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch optimal range');
  return res.json();
}

export async function fetchEnvironmentHistory(range, date) {
  let url = `${BACKEND_URL}/api/v1/environment/history?range=${encodeURIComponent(range)}`;
  if (range === 'date' && date) url += `&date=${encodeURIComponent(date)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch environment history');
  return res.json();
}

export async function fetchEnvironmentAvailableDates() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/available-dates`);
  if (!res.ok) throw new Error('Failed to fetch available dates');
  return res.json();
}

export async function fetchEnvironmentRecommendation(source, date) {
  let url = `${BACKEND_URL}/api/v1/environment/recommendation?source=${encodeURIComponent(source)}`;
  if (source === 'date' && date) url += `&date=${encodeURIComponent(date)}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch recommendation');
  return res.json();
}

export async function fetchEnvironmentHealth() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/health`);
  if (!res.ok) throw new Error('Failed to fetch environment health');
  return res.json();
}

export async function fetchEnvironmentSolutionRecommendation(lang = 'en') {
  const res = await fetch(
    `${BACKEND_URL}/api/v1/environment/solution-recommendation?lang=${encodeURIComponent(lang)}`
  );
  if (!res.ok) throw new Error('Failed to fetch solution recommendation');
  return res.json();
}

export async function fetchEnvironmentForecast60m() {
  const res = await fetch(`${BACKEND_URL}/api/v1/environment/forecast-60m`);
  if (!res.ok) throw new Error('Failed to fetch 60-minute forecast');
  return res.json();
}