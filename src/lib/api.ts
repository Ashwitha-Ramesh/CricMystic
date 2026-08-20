/**
 * CricMystic - Unified Data & API Layer
 * Transparently handles Netlify static hosting, same-origin API routes,
 * and client-side ML engine fallback for zero-downtime offline analytics.
 */

import { predictWinProbability, MatchStateInput, PredictionResult, initMlEngine } from './mlEngine';

export const API_BASE_URL = '';

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return cleanEndpoint;
}

// In-memory cache for static JSON files
const dataCache: Map<string, any> = new Map();

/**
 * Fetch static or dynamic datasets with fallback
 */
export async function fetchDataset<T = any>(filename: string): Promise<T> {
  const cacheKey = filename.replace(/^\/+/, '');
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  // Try API route first if available, else static data folder
  const staticPath = `/data/${cacheKey}`;
  const apiPath = `/api/${cacheKey.replace(/\.json$/, '')}`;

  try {
    const res = await fetch(staticPath);
    if (res.ok) {
      const data = await res.json();
      dataCache.set(cacheKey, data);
      return data;
    }
  } catch (e) {
    // try API endpoint
  }

  try {
    const res = await fetch(apiPath);
    if (res.ok) {
      const data = await res.json();
      dataCache.set(cacheKey, data);
      return data;
    }
  } catch (err) {
    console.warn(`[!] Failed to load dataset ${filename}:`, err);
  }

  throw new Error(`Dataset ${filename} could not be loaded.`);
}

/**
 * Executes Win-Probability Prediction via server or client-side fallback
 */
export async function executePrediction(params: MatchStateInput): Promise<PredictionResult> {
  try {
    const res = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Silent fallback to local ML engine
  }

  // Fast client-side fallback using calibrated model
  await initMlEngine();
  return predictWinProbability(params);
}
