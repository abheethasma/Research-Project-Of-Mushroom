// src/services/growthApi.js
import { Platform } from 'react-native';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1/growth';

export async function predictGrowthStage(imageAsset, bagId) {
  if (!imageAsset?.uri) {
    throw new Error('Image is required');
  }

  if (!bagId?.trim()) {
    throw new Error('Bag ID is required');
  }

  const formData = new FormData();
  formData.append('bag_id', bagId.trim());

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(imageAsset.uri);
    const blob = await imageResponse.blob();

    formData.append(
      'image',
      blob,
      imageAsset.fileName || imageAsset.name || 'growth_stage.jpg'
    );
  } else {
    formData.append('image', {
      uri: imageAsset.uri,
      name: imageAsset.fileName || imageAsset.name || 'growth_stage.jpg',
      type: imageAsset.mimeType || 'image/jpeg',
    });
  }

  const response = await fetch(`${API_BASE_URL}/predict-growth-stage`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to predict growth stage');
  }

  return data;
}

export async function fetchGrowthHistory(bagId) {
  if (!bagId?.trim()) {
    throw new Error('Bag ID is required');
  }

  const response = await fetch(
    `${API_BASE_URL}/history/${encodeURIComponent(bagId.trim())}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load growth history');
  }

  return data;
}