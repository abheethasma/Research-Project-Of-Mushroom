// src/services/api.js

import { Platform } from "react-native";

// Change this IP if your PC IP changes
export const BACKEND_URL = "http://192.168.8.137:8000";

export function getBackendUrl() {
  return BACKEND_URL;
}

export function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${p}`;
}

/**
 * GET /ping
 */
export async function pingBackend() {
  const response = await fetch(buildUrl("/ping"));
  if (!response.ok) {
    throw new Error("Bad response from /ping");
  }
  return response.json();
}

/**
 * POST /api/v1/type/predict (Mushroom Type Classification)
 * Upload image using multipart/form-data
 */
export async function predictMushroomType(imageUri) {
  const url = buildUrl("/api/v1/type/predict");

  // WEB: need real File/Blob
  if (Platform.OS === "web") {
    const imgRes = await fetch(imageUri);
    const blob = await imgRes.blob();

    const formData = new FormData();
    formData.append("file", blob, "mushroom.jpg");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const msg =
        data?.detail || `Bad response from /api/v1/type/predict (${response.status})`;
      throw new Error(msg);
    }
    return data;
  }

  // MOBILE (Expo Go / Android / iOS)
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "mushroom.jpg",
    type: "image/jpeg",
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      // Do NOT set 'Content-Type' here; RN will set correct multipart boundary
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data?.detail || `Bad response from /api/v1/type/predict (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

/**
 * POST /api/v1/disease/predict (Disease Detection)
 * Upload image using multipart/form-data
 */
export async function predictDiseaseFromImage(imageUri, bagId) {
  const url = buildUrl("/api/v1/disease/predict");

  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    name: "mushroom.jpg",
    type: "image/jpeg",
  });
  formData.append("bag_id", bagId || "default_bag"); // Add bag_id here

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      // Do NOT set 'Content-Type' here; RN will set correct multipart boundary
    },
    body: formData,
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data?.detail ||
      `Bad response from /api/v1/disease/predict (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

/**
 * GET /api/v1/disease/history/{bag_id} (Get disease history for a specific bag)
 */
export async function getDiseaseHistory(bagId) {
  if (!bagId) {
    return [];
  }

  const res = await fetch(
    `${BACKEND_URL}/api/v1/disease/history/${encodeURIComponent(bagId)}`
  );

  if (!res.ok) {
    throw new Error("History request failed");
  }

  return await res.json();
}